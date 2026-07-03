import { unstable_cache } from "next/cache";
import { fetchResaleDataWithFallback } from "./hdb-api";
import { HDB_TOWNS, FLAT_TYPES, SQM_TO_SQFT } from "./constants";
import type { ParsedTransaction } from "@/types";

// ---------------------------------------------------------------------------
// Slug / name conversion helpers
// ---------------------------------------------------------------------------

/** Convert a URL slug like "ang-mo-kio" to HDB town name "ANG MO KIO" */
export function slugToTown(slug: string): string {
  return slug.replace(/-/g, " ").toUpperCase().replace("KALLANG WHAMPOA", "KALLANG/WHAMPOA");
}

/** Convert a town name like "ANG MO KIO" to URL slug "ang-mo-kio" */
export function townToSlug(town: string): string {
  return town.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-");
}

/** Format a town name in title case: "ANG MO KIO" -> "Ang Mo Kio" */
export function titleCase(town: string): string {
  return town
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace("/w", "/W"); // handle KALLANG/WHAMPOA
}

/** Get all 27 town slugs for static path generation */
export function getAllTownSlugs(): string[] {
  return HDB_TOWNS.map((t) => townToSlug(t));
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface FlatTypeSummary {
  flatType: string;
  medianPsf: number;
  medianPrice: number;
  transactionCount: number;
  trendPercent: number;
  priceRange: { min: number; max: number };
}

export interface TownSummary {
  town: string;
  generatedAt: string;
  flatTypes: FlatTypeSummary[];
  overallMedianPsf: number;
  overallMedianPrice: number;
  overallTrendPercent: number;
  totalTransactions12m: number;
  totalTransactions24m: number;
  mostActiveStreet: string;
  highestSale: { price: number; block: string; street: string; flatType: string; month: string } | null;
  lowestSale: { price: number; block: string; street: string; flatType: string; month: string } | null;
}

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getMonthCutoff(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// ---------------------------------------------------------------------------
// Main data function
// ---------------------------------------------------------------------------

/**
 * Fetch and summarise resale data for all flat types in a given town.
 * Returns medians, trends, highlights, and per-flat-type breakdowns.
 */
export async function getTownSummary(town: string): Promise<TownSummary> {
  const cutoff12m = getMonthCutoff(12);
  const cutoff24m = getMonthCutoff(24);

  // Fetch all flat types in parallel
  const results = await Promise.all(
    FLAT_TYPES.map(async (ft) => {
      const { data } = await fetchResaleDataWithFallback(town, ft);
      return { flatType: ft, transactions: data };
    }),
  );

  const allTransactions: ParsedTransaction[] = [];
  const flatTypeSummaries: FlatTypeSummary[] = [];

  for (const { flatType, transactions } of results) {
    const recent12m = transactions.filter((t) => t.month >= cutoff12m);
    const older12m = transactions.filter(
      (t) => t.month >= cutoff24m && t.month < cutoff12m,
    );

    if (recent12m.length === 0) continue;

    allTransactions.push(...transactions);

    const psfValues = recent12m.map((t) => t.pricePsf);
    const priceValues = recent12m.map((t) => t.resalePrice);
    const medPsf = median(psfValues);
    const medPrice = median(priceValues);

    // Trend: compare median PSF of last 12m vs prior 12m
    let trendPercent = 0;
    if (older12m.length > 0) {
      const olderMedianPsf = median(older12m.map((t) => t.pricePsf));
      if (olderMedianPsf > 0) {
        trendPercent = ((medPsf - olderMedianPsf) / olderMedianPsf) * 100;
      }
    }

    flatTypeSummaries.push({
      flatType,
      medianPsf: Math.round(medPsf),
      medianPrice: Math.round(medPrice),
      transactionCount: recent12m.length,
      trendPercent: Math.round(trendPercent * 10) / 10,
      priceRange: {
        min: Math.min(...priceValues),
        max: Math.max(...priceValues),
      },
    });
  }

  // Overall stats from last 12 months
  const all12m = allTransactions.filter((t) => t.month >= cutoff12m);
  const allOlder12m = allTransactions.filter(
    (t) => t.month >= cutoff24m && t.month < cutoff12m,
  );

  const overallMedianPsf = median(all12m.map((t) => t.pricePsf));
  const overallMedianPrice = median(all12m.map((t) => t.resalePrice));

  let overallTrendPercent = 0;
  if (allOlder12m.length > 0) {
    const olderPsf = median(allOlder12m.map((t) => t.pricePsf));
    if (olderPsf > 0) {
      overallTrendPercent = ((overallMedianPsf - olderPsf) / olderPsf) * 100;
    }
  }

  // Most active street (by transaction count in last 12m)
  const streetCounts = new Map<string, number>();
  for (const t of all12m) {
    streetCounts.set(t.streetName, (streetCounts.get(t.streetName) || 0) + 1);
  }
  let mostActiveStreet = "";
  let maxCount = 0;
  for (const [street, count] of streetCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveStreet = street;
    }
  }

  // Highest and lowest sales in last 12m
  let highestSale: TownSummary["highestSale"] = null;
  let lowestSale: TownSummary["lowestSale"] = null;

  if (all12m.length > 0) {
    const sorted = [...all12m].sort((a, b) => a.resalePrice - b.resalePrice);
    const low = sorted[0];
    const high = sorted[sorted.length - 1];
    highestSale = {
      price: high.resalePrice,
      block: high.block,
      street: high.streetName,
      flatType: high.flatType,
      month: high.month,
    };
    lowestSale = {
      price: low.resalePrice,
      block: low.block,
      street: low.streetName,
      flatType: low.flatType,
      month: low.month,
    };
  }

  return {
    town,
    generatedAt: new Date().toISOString(),
    flatTypes: flatTypeSummaries,
    overallMedianPsf: Math.round(overallMedianPsf),
    overallMedianPrice: Math.round(overallMedianPrice),
    overallTrendPercent: Math.round(overallTrendPercent * 10) / 10,
    totalTransactions12m: all12m.length,
    totalTransactions24m: allTransactions.filter((t) => t.month >= cutoff24m).length,
    mostActiveStreet: titleCase(mostActiveStreet),
    highestSale,
    lowestSale,
  };
}

// ---------------------------------------------------------------------------
// Town x flat-type detail (programmatic /towns/[town]/[flatType] pages)
// ---------------------------------------------------------------------------

/** A page needs at least this many recent sales to be genuinely useful. */
export const MIN_FLAT_TX = 5;

/** "4 ROOM" -> "4-room", "EXECUTIVE" -> "executive" */
export function flatTypeToSlug(ft: string): string {
  return ft.toLowerCase().replace(/\s+/g, "-");
}

/** "4-room" -> "4 ROOM" */
export function slugToFlatType(slug: string): string {
  return slug.replace(/-/g, " ").toUpperCase();
}

/** "4 ROOM" -> "4-Room", "EXECUTIVE" -> "Executive" */
export function flatTypeDisplay(ft: string): string {
  if (ft === "EXECUTIVE") return "Executive";
  return ft.replace(/\s*ROOM$/, "-Room");
}

export interface FlatComp {
  month: string;
  block: string;
  street: string;
  storeyRange: string;
  floorAreaSqft: number;
  remainingLeaseYears: number;
  resalePrice: number;
  pricePsf: number;
}

export interface FlatTypeDetail {
  town: string;
  flatType: string;
  generatedAt: string;
  count12m: number;
  count24m: number;
  medianPrice: number;
  medianPsf: number;
  trendPercent: number;
  p25Price: number;
  p75Price: number;
  minPrice: number;
  maxPrice: number;
  medianSqft: number;
  medianLease: number;
  comps: FlatComp[];
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/** Per-combo resale summary for one town + flat type, from the last 12 months. */
export async function getFlatTypeDetail(
  town: string,
  flatType: string,
): Promise<FlatTypeDetail> {
  const cutoff12m = getMonthCutoff(12);
  const cutoff24m = getMonthCutoff(24);
  const { data } = await fetchResaleDataWithFallback(town, flatType);

  const recent12m = data.filter((t) => t.month >= cutoff12m);
  const older12m = data.filter(
    (t) => t.month >= cutoff24m && t.month < cutoff12m,
  );

  const prices = recent12m.map((t) => t.resalePrice).sort((a, b) => a - b);
  const psfs = recent12m.map((t) => t.pricePsf).sort((a, b) => a - b);
  const sqfts = recent12m.map((t) => t.floorAreaSqft).sort((a, b) => a - b);
  const leases = recent12m
    .map((t) => t.remainingLeaseYears)
    .sort((a, b) => a - b);

  const medPsf = median(psfs);
  let trendPercent = 0;
  if (older12m.length > 0) {
    const olderMedPsf = median(older12m.map((t) => t.pricePsf));
    if (olderMedPsf > 0) trendPercent = ((medPsf - olderMedPsf) / olderMedPsf) * 100;
  }

  const comps: FlatComp[] = [...recent12m]
    .sort((a, b) =>
      a.month < b.month ? 1 : a.month > b.month ? -1 : b.resalePrice - a.resalePrice,
    )
    .slice(0, 12)
    .map((t) => ({
      month: t.month,
      block: t.block,
      street: titleCase(t.streetName),
      storeyRange: t.storeyRange,
      floorAreaSqft: Math.round(t.floorAreaSqft),
      remainingLeaseYears: Math.round(t.remainingLeaseYears),
      resalePrice: t.resalePrice,
      pricePsf: Math.round(t.pricePsf),
    }));

  return {
    town,
    flatType,
    generatedAt: new Date().toISOString(),
    count12m: recent12m.length,
    count24m: data.filter((t) => t.month >= cutoff24m).length,
    medianPrice: Math.round(median(prices)),
    medianPsf: Math.round(medPsf),
    trendPercent: Math.round(trendPercent * 10) / 10,
    p25Price: Math.round(percentile(prices, 25)),
    p75Price: Math.round(percentile(prices, 75)),
    minPrice: prices[0] || 0,
    maxPrice: prices[prices.length - 1] || 0,
    medianSqft: Math.round(median(sqfts)),
    medianLease: Math.round(median(leases)),
    comps,
  };
}

export interface TownFlatCombo {
  townSlug: string;
  flatSlug: string;
  town: string;
  flatType: string;
}

/**
 * Every town x flat-type combination that has at least MIN_FLAT_TX recent sales.
 * Drives both generateStaticParams and the sitemap so they never diverge and no
 * thin page is published.
 */
async function computeValidTownFlatCombos(): Promise<TownFlatCombo[]> {
  const combos: TownFlatCombo[] = [];
  for (const town of HDB_TOWNS) {
    const summary = await getTownSummary(town);
    for (const ft of summary.flatTypes) {
      if (ft.transactionCount >= MIN_FLAT_TX) {
        combos.push({
          townSlug: townToSlug(town),
          flatSlug: flatTypeToSlug(ft.flatType),
          town,
          flatType: ft.flatType,
        });
      }
    }
  }
  return combos;
}

// Cached so the several sitemap/feed routes and generateStaticParams share one
// computation instead of each re-fetching every town's data at build.
export const getValidTownFlatCombos = unstable_cache(
  computeValidTownFlatCombos,
  ["town-flat-combos-v1"],
  { revalidate: 86400 },
);
