/**
 * Fallback data loader — serves pre-generated data when data.gov.sg is unavailable.
 *
 * Uses fs.readFile to load JSON files at runtime (server-side only).
 * This avoids webpack dynamic import issues and works whether or not the files
 * exist at build time.
 */

import fs from "node:fs/promises";
import path from "node:path";
import type { TownIndex, TownPricing, FallbackMeta, DataSourceInfo } from "@/types/fallback";
import type { ParsedTransaction } from "@/types";

// ---------------------------------------------------------------------------
// Paths — resolved relative to project root at runtime
// ---------------------------------------------------------------------------

const FALLBACK_DIR = path.join(process.cwd(), "src", "data", "fallback");
const INDEX_DIR = path.join(FALLBACK_DIR, "index");
const PRICING_DIR = path.join(FALLBACK_DIR, "pricing");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(town: string): string {
  return town.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API — mirrors the shapes returned by live hdb-api functions
// ---------------------------------------------------------------------------

/** Get fallback metadata (generation timestamp etc.) */
export async function getFallbackMeta(): Promise<FallbackMeta | null> {
  return readJson<FallbackMeta>(path.join(FALLBACK_DIR, "meta.json"));
}

/** Build a DataSourceInfo from the fallback metadata */
export async function getFallbackDataSource(): Promise<DataSourceInfo | null> {
  const meta = await getFallbackMeta();
  if (!meta) return null;
  return { type: "fallback", asOf: meta.generatedAt };
}

/**
 * Get street names from fallback index — mirrors fetchStreetNames().
 */
export async function getFallbackStreetNames(
  town: string,
  flatType: string,
): Promise<string[]> {
  const slug = slugify(town);
  const index = await readJson<TownIndex>(path.join(INDEX_DIR, `${slug}.json`));
  if (!index) return [];

  const ftData = index[flatType.toUpperCase()];
  if (!ftData?.streets) return [];

  return Object.keys(ftData.streets).sort();
}

/**
 * Get blocks for a street from fallback index — mirrors getBlocks().
 */
export async function getFallbackBlocks(
  town: string,
  flatType: string,
  streetName: string,
): Promise<string[]> {
  const slug = slugify(town);
  const index = await readJson<TownIndex>(path.join(INDEX_DIR, `${slug}.json`));
  if (!index) return [];

  const ftData = index[flatType.toUpperCase()];
  if (!ftData?.streets) return [];

  const streetData = ftData.streets[streetName.toUpperCase()];
  if (!streetData?.blocks) return [];

  return Object.keys(streetData.blocks).sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
}

/**
 * Get block details from fallback index — mirrors getBlockDetails().
 */
export async function getFallbackBlockDetails(
  town: string,
  flatType: string,
  streetName: string,
  block?: string,
): Promise<{
  storeyRanges: string[];
  leaseCommenceDate: number | null;
  floorAreaSqm: number | null;
}> {
  const empty = { storeyRanges: [] as string[], leaseCommenceDate: null, floorAreaSqm: null };

  const slug = slugify(town);
  const index = await readJson<TownIndex>(path.join(INDEX_DIR, `${slug}.json`));
  if (!index) return empty;

  const ftData = index[flatType.toUpperCase()];
  if (!ftData?.streets) return empty;

  const streetData = ftData.streets[streetName.toUpperCase()];
  if (!streetData?.blocks) return empty;

  if (block) {
    const b = streetData.blocks[block];
    if (!b) return empty;
    return {
      storeyRanges: b.storeyRanges,
      leaseCommenceDate: b.lease || null,
      floorAreaSqm: b.area || null,
    };
  }

  // Street-level: merge all blocks
  const allStoreys = new Set<string>();
  const leases: number[] = [];
  const areas: number[] = [];

  for (const b of Object.values(streetData.blocks)) {
    for (const s of b.storeyRanges) allStoreys.add(s);
    if (b.lease) leases.push(b.lease);
    if (b.area) areas.push(b.area);
  }

  return {
    storeyRanges: Array.from(allStoreys).sort(),
    leaseCommenceDate: leases.length > 0 ? leases[0] : null,
    floorAreaSqm: areas.length > 0 ? areas[0] : null,
  };
}

/**
 * Get pricing data from fallback — mirrors fetchResaleData().
 */
export async function getFallbackPricing(
  town: string,
  flatType: string,
): Promise<ParsedTransaction[]> {
  const slug = slugify(town);
  const pricing = await readJson<TownPricing>(path.join(PRICING_DIR, `${slug}.json`));
  if (!pricing) return [];

  return pricing[flatType.toUpperCase()] ?? [];
}
