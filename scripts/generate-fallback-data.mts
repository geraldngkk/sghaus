/**
 * Generate fallback data files for when data.gov.sg is unavailable.
 *
 * Produces:
 *   src/data/fallback/meta.json           — generation timestamp
 *   src/data/fallback/index/{slug}.json   — per-town street/block/storey/lease/area lookup
 *   src/data/fallback/pricing/{slug}.json — per-town 24-month ParsedTransaction[]
 *
 * Run with: npx tsx scripts/generate-fallback-data.mts
 * Resume support: skips towns whose output files already exist.
 *
 * Strategy: Fetch by town only (not town+flatType) to minimize API requests.
 * Each town fetch gets ALL flat types in one paginated request, then we split locally.
 * This reduces API calls from ~135 to ~27 town fetches.
 */

import fs from "node:fs";
import path from "node:path";

// Load API key from .env.local (no dotenv dependency needed)
function loadEnvKey(key: string): string {
  try {
    const envPath = path.resolve(import.meta.dirname, "..", ".env.local");
    const content = fs.readFileSync(envPath, "utf-8");
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match?.[1]?.trim() ?? "";
  } catch {
    return "";
  }
}

const API_KEY = process.env.DATA_GOV_SG_API_KEY ?? loadEnvKey("DATA_GOV_SG_API_KEY");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HDB_TOWNS = [
  "ANG MO KIO", "BEDOK", "BISHAN", "BUKIT BATOK", "BUKIT MERAH",
  "BUKIT PANJANG", "BUKIT TIMAH", "CENTRAL AREA", "CHOA CHU KANG",
  "CLEMENTI", "GEYLANG", "HOUGANG", "JURONG EAST", "JURONG WEST",
  "KALLANG/WHAMPOA", "MARINE PARADE", "PASIR RIS", "PUNGGOL",
  "QUEENSTOWN", "SEMBAWANG", "SENGKANG", "SERANGOON", "TAMPINES",
  "TENGAH", "TOA PAYOH", "WOODLANDS", "YISHUN",
] as const;

const BASE_URL = "https://data.gov.sg/api/action/datastore_search";
const RESOURCE_ID = "d_8b84c4ee58e3cfc0ece0d773c8ca6abc";
const PAGE_SIZE = 1000;
const PAGE_DELAY_MS = API_KEY ? 600 : 5000; // 0.6s with key (20 req/10s), 5s without
const TOWN_DELAY_MS = API_KEY ? 2000 : 10000; // 2s with key, 10s without
const MAX_RETRIES = 6;
const SQM_TO_SQFT = 10.764;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, "..", "src", "data", "fallback");
const INDEX_DIR = path.join(ROOT, "index");
const PRICING_DIR = path.join(ROOT, "pricing");

// ---------------------------------------------------------------------------
// Types (inline — script runs outside Next.js, can't use @/ aliases)
// ---------------------------------------------------------------------------

interface RawRecord {
  _id: number;
  month: string;
  town: string;
  flat_type: string;
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: string;
}

interface DataGovResponse {
  success: boolean;
  result: {
    resource_id: string;
    records: RawRecord[];
    total: number;
    limit: number;
  };
}

interface ParsedTransaction {
  id: number;
  month: string;
  town: string;
  flatType: string;
  block: string;
  streetName: string;
  storeyRange: string;
  storeyMidpoint: number;
  floorAreaSqm: number;
  floorAreaSqft: number;
  flatModel: string;
  leaseCommenceDate: number;
  remainingLeaseYears: number;
  resalePrice: number;
  pricePsf: number;
}

interface BlockAttributes {
  storeyRanges: string[];
  lease: number;
  area: number;
}

interface TownIndex {
  [flatType: string]: {
    streets: {
      [street: string]: {
        blocks: {
          [block: string]: BlockAttributes;
        };
      };
    };
  };
}

interface TownPricing {
  [flatType: string]: ParsedTransaction[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(town: string): string {
  return town.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function parseRemainingLease(raw: string): number {
  const match = raw.match(/(\d+)\s*years?(?:\s+(\d+)\s*months?)?/);
  if (!match) return 0;
  return parseInt(match[1], 10) + (match[2] ? parseInt(match[2], 10) / 12 : 0);
}

function parseStoreyMidpoint(range: string): number {
  const match = range.match(/(\d+)\s*TO\s*(\d+)/);
  if (!match) return 1;
  return (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
}

function parseRecord(raw: RawRecord): ParsedTransaction {
  const floorAreaSqm = parseFloat(raw.floor_area_sqm);
  const floorAreaSqft = floorAreaSqm * SQM_TO_SQFT;
  const resalePrice = parseInt(raw.resale_price, 10);
  return {
    id: raw._id,
    month: raw.month,
    town: raw.town.toUpperCase(),
    flatType: raw.flat_type.toUpperCase(),
    block: raw.block,
    streetName: raw.street_name.toUpperCase(),
    storeyRange: raw.storey_range,
    storeyMidpoint: parseStoreyMidpoint(raw.storey_range),
    floorAreaSqm,
    floorAreaSqft,
    flatModel: raw.flat_model,
    leaseCommenceDate: parseInt(raw.lease_commence_date, 10),
    remainingLeaseYears: parseRemainingLease(raw.remaining_lease),
    resalePrice,
    pricePsf: floorAreaSqft > 0 ? resalePrice / floorAreaSqft : 0,
  };
}

function getMonthCutoff(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mode<T>(values: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: T | undefined;
  let bestCount = 0;
  for (const [val, count] of counts) {
    if (count > bestCount) { best = val; bestCount = count; }
  }
  return best;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// API Fetcher — fetch ALL records for a town (all flat types at once)
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string): Promise<Response> {
  const headers: HeadersInit = {};
  if (API_KEY) headers["x-api-key"] = API_KEY;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return res;
    if (res.status === 429 || res.status >= 500) {
      // Exponential backoff: 5s, 10s, 20s, 40s, 80s, 160s
      const backoff = 5000 * Math.pow(2, attempt);
      console.log(`    [retry] ${res.status} attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${(backoff / 1000).toFixed(0)}s...`);
      await sleep(backoff);
      continue;
    }
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  throw new Error(`API failed after ${MAX_RETRIES} retries`);
}

/**
 * Fetch ALL records for a town (all flat types, all-time).
 * Returns raw ParsedTransaction[] — caller splits by flat type and date.
 */
async function fetchTownAllRecords(town: string): Promise<ParsedTransaction[]> {
  const all: ParsedTransaction[] = [];
  let offset = 0;
  let total = Infinity;
  let page = 0;

  while (offset < total) {
    const url = new URL(BASE_URL);
    url.searchParams.set("resource_id", RESOURCE_ID);
    url.searchParams.set("filters", JSON.stringify({ town }));
    url.searchParams.set("sort", "month desc");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));

    const res = await fetchWithRetry(url.toString());
    const json = (await res.json()) as DataGovResponse;
    if (!json.success) throw new Error("API returned success=false");

    total = json.result.total;
    for (const raw of json.result.records) {
      all.push(parseRecord(raw));
    }

    page++;
    process.stdout.write(`\r    Page ${page}, ${all.length}/${total} records...`);

    if (json.result.records.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
    if (offset < total) await sleep(PAGE_DELAY_MS);
  }

  console.log(`\r    Fetched ${all.length} total records (${page} pages)           `);
  return all;
}

// ---------------------------------------------------------------------------
// Index builder: all-time data → compact lookup (per flat type)
// ---------------------------------------------------------------------------

function buildIndexForFlatType(records: ParsedTransaction[]): TownIndex[string] {
  const streets: TownIndex[string]["streets"] = {};

  for (const t of records) {
    if (!streets[t.streetName]) streets[t.streetName] = { blocks: {} };
    const blockMap = streets[t.streetName].blocks;
    if (!blockMap[t.block]) blockMap[t.block] = { storeyRanges: [], lease: 0, area: 0 };
    const b = blockMap[t.block];
    if (!b.storeyRanges.includes(t.storeyRange)) b.storeyRanges.push(t.storeyRange);
  }

  for (const streetName of Object.keys(streets)) {
    for (const blockNum of Object.keys(streets[streetName].blocks)) {
      const matching = records.filter(
        (t) => t.streetName === streetName && t.block === blockNum,
      );
      const b = streets[streetName].blocks[blockNum];
      b.storeyRanges.sort();
      b.lease = mode(matching.map((t) => t.leaseCommenceDate)) ?? 0;
      b.area = mode(matching.map((t) => t.floorAreaSqm)) ?? 0;
    }
  }

  return { streets };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Generating fallback data ===");
  console.log(`API key: ${API_KEY ? "configured (20 req/10s)" : "NOT configured (4 req/10s — will be slow)"}`);
  console.log(`Delays: ${PAGE_DELAY_MS}ms between pages, ${TOWN_DELAY_MS}ms between towns`);
  console.log(`Strategy: Fetch by town (27 requests), split by flat type locally\n`);

  fs.mkdirSync(INDEX_DIR, { recursive: true });
  fs.mkdirSync(PRICING_DIR, { recursive: true });

  const cutoff24m = getMonthCutoff(24);
  let totalRecords = 0;
  let townsProcessed = 0;

  for (const town of HDB_TOWNS) {
    const slug = slugify(town);
    const indexPath = path.join(INDEX_DIR, `${slug}.json`);
    const pricingPath = path.join(PRICING_DIR, `${slug}.json`);

    // Resume support
    if (fs.existsSync(indexPath) && fs.existsSync(pricingPath)) {
      console.log(`[skip] ${town} — files already exist`);
      townsProcessed++;
      continue;
    }

    console.log(`\n[${townsProcessed + 1}/${HDB_TOWNS.length}] ${town}`);

    try {
      // Single fetch: get ALL records for this town (all flat types, all time)
      const allRecords = await fetchTownAllRecords(town);

      // Group by flat type
      const byFlatType = new Map<string, ParsedTransaction[]>();
      for (const r of allRecords) {
        const key = r.flatType;
        if (!byFlatType.has(key)) byFlatType.set(key, []);
        byFlatType.get(key)!.push(r);
      }

      // Build index (all-time) and pricing (24-month) per flat type
      const townIndex: TownIndex = {};
      const townPricing: TownPricing = {};

      for (const [flatType, records] of byFlatType) {
        townIndex[flatType] = buildIndexForFlatType(records);
        const recent = records.filter((t) => t.month >= cutoff24m);
        if (recent.length > 0) {
          townPricing[flatType] = recent;
          totalRecords += recent.length;
        }
        console.log(`    ${flatType}: ${records.length} all-time, ${recent.length} recent`);
      }

      // Write files
      fs.writeFileSync(indexPath, JSON.stringify(townIndex));
      fs.writeFileSync(pricingPath, JSON.stringify(townPricing));

      const indexSize = (fs.statSync(indexPath).size / 1024).toFixed(1);
      const pricingSize = (fs.statSync(pricingPath).size / 1024).toFixed(1);
      console.log(`    Written: index ${indexSize}KB, pricing ${pricingSize}KB`);
    } catch (err) {
      console.error(`    ERROR: ${err instanceof Error ? err.message : err}`);
      console.log(`    Skipping ${town} — will retry on next run`);
    }

    townsProcessed++;

    // Longer delay between towns to avoid rate limits
    if (townsProcessed < HDB_TOWNS.length) {
      console.log(`    Waiting ${TOWN_DELAY_MS / 1000}s before next town...`);
      await sleep(TOWN_DELAY_MS);
    }
  }

  // Write metadata
  const meta = {
    generatedAt: new Date().toISOString(),
    townCount: townsProcessed,
    totalRecords,
  };
  fs.writeFileSync(path.join(ROOT, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`Towns: ${townsProcessed}, Pricing records: ${totalRecords}`);
  console.log(`Output: ${ROOT}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
