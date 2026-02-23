import { unstable_cache } from "next/cache";
import type { DataGovResponse, HdbResaleRecord, ParsedTransaction } from "@/types";
import { DATA_GOV_SG, SQM_TO_SQFT } from "./constants";

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Parse "61 years 04 months" -> 61.33 */
function parseRemainingLease(raw: string): number {
  const match = raw.match(/(\d+)\s*years?(?:\s+(\d+)\s*months?)?/);
  if (!match) return 0;
  const years = parseInt(match[1], 10);
  const months = match[2] ? parseInt(match[2], 10) : 0;
  return years + months / 12;
}

/** Parse "04 TO 06" -> midpoint 5 */
function parseStoreyMidpoint(range: string): number {
  const match = range.match(/(\d+)\s*TO\s*(\d+)/);
  if (!match) return 1;
  return (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
}

/** Convert a raw API record into a typed, numeric ParsedTransaction */
function parseRecord(raw: HdbResaleRecord): ParsedTransaction {
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

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Return "YYYY-MM" for N months before the given date */
function getMonthCutoff(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// ---------------------------------------------------------------------------
// API fetcher (with pagination + rate-limit delay)
// ---------------------------------------------------------------------------

const DELAY_MS = 500; // delay between paginated requests
const MAX_RETRIES = 3;

/** Fetch a single page with exponential backoff on 429/5xx */
async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url);

    if (res.ok) return res;

    // Retry on rate limit or server errors
    if (res.status === 429 || res.status >= 500) {
      const backoff = DELAY_MS * Math.pow(2, attempt); // 3s, 6s, 12s
      console.log(`[hdb-api] ${res.status} on attempt ${attempt + 1}, retrying in ${backoff}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      continue;
    }

    // Non-retryable error
    throw new Error(`data.gov.sg API error: ${res.status} ${res.statusText}`);
  }

  throw new Error(`data.gov.sg API failed after ${MAX_RETRIES} retries`);
}

async function fetchResaleDataUncached(
  town: string,
  flatType: string,
  monthsCutoff: number = 24,
): Promise<ParsedTransaction[]> {
  const cutoffMonth = getMonthCutoff(monthsCutoff);
  const allRecords: ParsedTransaction[] = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const filters = JSON.stringify({ town, flat_type: flatType });
    const url = new URL(DATA_GOV_SG.baseUrl);
    url.searchParams.set("resource_id", DATA_GOV_SG.resourceId);
    url.searchParams.set("filters", filters);
    url.searchParams.set("sort", "month desc");
    url.searchParams.set("limit", String(DATA_GOV_SG.maxLimit));
    url.searchParams.set("offset", String(offset));

    const res = await fetchWithRetry(url.toString());

    const json = (await res.json()) as DataGovResponse;
    if (!json.success) {
      throw new Error("data.gov.sg returned success=false");
    }

    total = json.result.total;
    const records = json.result.records;

    // Parse records and stop if we've gone past the cutoff month
    let hitCutoff = false;
    for (const raw of records) {
      if (raw.month < cutoffMonth) {
        hitCutoff = true;
        break;
      }
      allRecords.push(parseRecord(raw));
    }

    if (hitCutoff || records.length < DATA_GOV_SG.maxLimit) {
      break;
    }

    offset += DATA_GOV_SG.maxLimit;

    // Rate limit protection — wait between pages
    if (offset < total) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  return allRecords;
}

// ---------------------------------------------------------------------------
// Cached public API
// ---------------------------------------------------------------------------

/**
 * Fetch HDB resale transactions for a given town and flat type.
 * Results are cached for 24 hours via Next.js unstable_cache.
 */
export const fetchResaleData = unstable_cache(
  async (town: string, flatType: string): Promise<ParsedTransaction[]> => {
    return fetchResaleDataUncached(town, flatType, 24);
  },
  ["hdb-resale-data"],
  { revalidate: DATA_GOV_SG.cacheTtlSeconds, tags: ["hdb-data"] },
);

/**
 * Fetch ALL-TIME HDB resale transactions for a given town and flat type.
 * Used for building attributes (storey ranges, lease year, floor area) that
 * don't change over time. 24-month window is too narrow for block-level lookups
 * where a specific storey range may not have had a recent sale.
 */
export const fetchResaleDataAllTime = unstable_cache(
  async (town: string, flatType: string): Promise<ParsedTransaction[]> => {
    return fetchResaleDataUncached(town, flatType, 999);
  },
  ["hdb-resale-data-alltime"],
  { revalidate: DATA_GOV_SG.cacheTtlSeconds, tags: ["hdb-data"] },
);

/**
 * Get the unique street names for a town+flatType combo (for street dropdown).
 * Reuses fetchResaleDataAllTime to share the cache and avoid duplicate API calls.
 */
export async function fetchStreetNames(town: string, flatType: string): Promise<string[]> {
  const transactions = await fetchResaleDataAllTime(town, flatType);
  const streets = new Set(transactions.map((t) => t.streetName));
  return Array.from(streets).sort();
}
