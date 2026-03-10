// scripts/lib/fetch-data.mts
// Shared data fetching module for CLI content generation scripts.
// Cannot import from ../src/lib/hdb-api.ts (uses Next.js unstable_cache).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DATA_GOV_SG_URL = "https://data.gov.sg/api/action/datastore_search";
export const RESOURCE_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
export const SQM_TO_SQFT = 10.764;

export const HDB_TOWNS = [
  "ANG MO KIO", "BEDOK", "BISHAN", "BUKIT BATOK", "BUKIT MERAH", "BUKIT PANJANG",
  "BUKIT TIMAH", "CENTRAL AREA", "CHOA CHU KANG", "CLEMENTI", "GEYLANG", "HOUGANG",
  "JURONG EAST", "JURONG WEST", "KALLANG/WHAMPOA", "MARINE PARADE", "PASIR RIS",
  "PUNGGOL", "QUEENSTOWN", "SEMBAWANG", "SENGKANG", "SERANGOON", "TAMPINES",
  "TENGAH", "TOA PAYOH", "WOODLANDS", "YISHUN",
] as const;

export const FLAT_TYPES = ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE"] as const;

/** Typical floor area in sqm by flat type (for price estimation) */
export const TYPICAL_SQM: Record<string, number> = {
  "2 ROOM": 45,
  "3 ROOM": 67,
  "4 ROOM": 93,
  "5 ROOM": 110,
  "EXECUTIVE": 140,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RawRecord {
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  resale_price: string;
  lease_commence_date: string;
  remaining_lease: string;
}

export interface Transaction {
  month: string;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  floorAreaSqm: number;
  floorAreaSqft: number;
  resalePrice: number;
  pricePsf: number;
  leaseCommenceDate: number;
  remainingLease: string;
}

// ---------------------------------------------------------------------------
// API key (optional, avoids rate limits)
// ---------------------------------------------------------------------------

const __scriptDir = dirname(fileURLToPath(import.meta.url));

function loadEnvKey(key: string): string {
  try {
    const envPath = resolve(__scriptDir, "..", "..", ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

const API_KEY = process.env.DATA_GOV_SG_API_KEY ?? loadEnvKey("DATA_GOV_SG_API_KEY");

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const DELAY_MS = API_KEY ? 600 : 5000; // 0.6s with key, 5s without
const MAX_RETRIES = 5;

function apiHeaders(): HeadersInit {
  const headers: HeadersInit = {};
  if (API_KEY) headers["x-api-key"] = API_KEY;
  return headers;
}

async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers: apiHeaders() });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      const backoff = DELAY_MS * Math.pow(2, attempt);
      console.error(`  [fetch] ${res.status} on attempt ${attempt + 1}, retrying in ${backoff}ms...`);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  throw new Error(`API failed after ${MAX_RETRIES} retries`);
}

function parseRecord(raw: RawRecord): Transaction {
  const floorAreaSqm = parseFloat(raw.floor_area_sqm);
  const floorAreaSqft = floorAreaSqm * SQM_TO_SQFT;
  const resalePrice = parseInt(raw.resale_price, 10);
  return {
    month: raw.month,
    town: raw.town.toUpperCase(),
    flatType: raw.flat_type.toUpperCase(),
    block: raw.block,
    streetName: raw.street_name.toUpperCase(),
    storeyRange: raw.storey_range,
    floorAreaSqm,
    floorAreaSqft,
    resalePrice,
    pricePsf: floorAreaSqft > 0 ? resalePrice / floorAreaSqft : 0,
    leaseCommenceDate: parseInt(raw.lease_commence_date, 10),
    remainingLease: raw.remaining_lease,
  };
}

/**
 * Fetch HDB resale transactions for a given town and flat type.
 * @param town - HDB town name (uppercase)
 * @param flatType - Flat type (e.g. "4 ROOM")
 * @param monthsCutoff - How many months back to fetch (default 24)
 */
export async function fetchTransactions(
  town: string,
  flatType: string,
  monthsCutoff = 24,
): Promise<Transaction[]> {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsCutoff);
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;

  const all: Transaction[] = [];
  let offset = 0;

  while (true) {
    const url = new URL(DATA_GOV_SG_URL);
    url.searchParams.set("resource_id", RESOURCE_ID);
    url.searchParams.set("filters", JSON.stringify({ town, flat_type: flatType }));
    url.searchParams.set("sort", "month desc");
    url.searchParams.set("limit", "1000");
    url.searchParams.set("offset", String(offset));

    const res = await fetchWithRetry(url.toString());
    const json = await res.json();
    if (!json.success) throw new Error("API returned success=false");

    let hitCutoff = false;
    for (const r of json.result.records as RawRecord[]) {
      if (r.month < cutoffStr) {
        hitCutoff = true;
        break;
      }
      all.push(parseRecord(r));
    }

    if (hitCutoff || json.result.records.length < 1000) break;
    offset += 1000;
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  return all;
}

/**
 * Fetch transactions for ALL flat types in a town.
 */
export async function fetchAllFlatTypes(
  town: string,
  monthsCutoff = 24,
): Promise<Transaction[]> {
  const results: Transaction[] = [];
  for (const ft of FLAT_TYPES) {
    const txns = await fetchTransactions(town, ft, monthsCutoff);
    results.push(...txns);
  }
  return results;
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Median of a numeric array. Returns 0 for empty arrays. */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Percentile (0-100) of a numeric array. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

/** Title case: "ANG MO KIO" -> "Ang Mo Kio" */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|\/)\w/g, (c) => c.toUpperCase());
}

/** Format price: 650000 -> "$650,000" */
export function formatPrice(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Format PSF: 608.123 -> "$608" */
export function formatPsf(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Current month string: "2026-03" */
export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Display month: "2026-03" -> "March 2026" */
export function displayMonth(ym: string): string {
  const [year, month] = ym.split("-");
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

// ---------------------------------------------------------------------------
// Arg parsing helper
// ---------------------------------------------------------------------------

/**
 * Parse CLI args like --town TAMPINES --flat "4 ROOM" into a Record.
 * Returns { town: "TAMPINES", flat: "4 ROOM", ... }
 */
export function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : "true";
      args[key] = val;
      if (val !== "true") i++;
    }
  }
  return args;
}

/**
 * Ensure output directory exists and write a file.
 */
export async function writeOutput(filePath: string, content: string): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content, "utf-8");
}
