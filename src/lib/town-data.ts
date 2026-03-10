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
