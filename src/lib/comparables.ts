import type { ParsedTransaction, PropertyInput, CompTier, TieredComparable, NearbyTransaction } from "@/types";
import {
  STOREY_RANGES,
  STOREY_BAND_PROXIMITY,
  SIZE_TOLERANCE_PERCENT,
  TIER_1_2_MONTHS,
  TIER_3_MONTHS,
  NEARBY_BLOCK_RANGE,
  NEARBY_SIZE_TOLERANCE_SQFT,
  NEARBY_MONTHS,
  SQM_TO_SQFT,
} from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the 0-based index of a storey range in the standard list */
function getStoreyBandIndex(range: string): number {
  const idx = STOREY_RANGES.indexOf(range as (typeof STOREY_RANGES)[number]);
  return idx >= 0 ? idx : 0;
}

/** Return "YYYY-MM" for N months before now */
function getMonthCutoff(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

/** Extract numeric portion of a block string ("890B" -> 890) */
function parseBlockNumber(block: string): number | null {
  const match = block.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Tiering logic
// ---------------------------------------------------------------------------

export interface TieredResult {
  tier1: TieredComparable[];
  tier2: TieredComparable[];
  tier3: TieredComparable[];
}

/**
 * Assign each transaction to Tier 1, 2, or 3 based on similarity to the
 * subject property. All transactions are assumed to be the same town + flat type.
 */
export function tierComparables(
  transactions: ParsedTransaction[],
  input: PropertyInput,
): TieredResult {
  const cutoff12m = getMonthCutoff(TIER_1_2_MONTHS);
  const cutoff24m = getMonthCutoff(TIER_3_MONTHS);
  const subjectBandIdx = getStoreyBandIndex(input.storeyRange);
  const subjectBlockNum = input.block ? parseBlockNumber(input.block) : null;

  const tier1: TieredComparable[] = [];
  const tier2: TieredComparable[] = [];
  const tier3: TieredComparable[] = [];

  for (const txn of transactions) {
    // Must be within 24 months for any tier
    if (txn.month < cutoff24m) continue;

    const isRecent = txn.month >= cutoff12m;
    const isSameStreet = txn.streetName === input.streetName;

    // Adjacent block check (if user provided a block)
    const txnBlockNum = parseBlockNumber(txn.block);
    const isAdjacentBlock =
      subjectBlockNum !== null &&
      txnBlockNum !== null &&
      Math.abs(txnBlockNum - subjectBlockNum) <= 2;

    // Tier 1: same street (or adjacent block), last 12 months
    if (isRecent && (isSameStreet || isAdjacentBlock)) {
      tier1.push({ ...txn, tier: 1 as CompTier, adjustedPricePsf: txn.pricePsf });
      continue;
    }

    // Tier 2: same town, similar storey + size, last 12 months
    if (isRecent) {
      const txnBandIdx = getStoreyBandIndex(txn.storeyRange);
      const storeyClose = Math.abs(txnBandIdx - subjectBandIdx) <= STOREY_BAND_PROXIMITY;

      const sizeRatio = Math.abs(txn.floorAreaSqm - input.floorAreaSqm) / input.floorAreaSqm;
      const sizeClose = sizeRatio <= SIZE_TOLERANCE_PERCENT;

      if (storeyClose && sizeClose) {
        tier2.push({ ...txn, tier: 2 as CompTier, adjustedPricePsf: txn.pricePsf });
        continue;
      }
    }

    // Tier 3: everything else within 24 months
    tier3.push({ ...txn, tier: 3 as CompTier, adjustedPricePsf: txn.pricePsf });
  }

  return { tier1, tier2, tier3 };
}

/**
 * Filter transactions to nearby blocks built in the same era,
 * within ±200 sqft and ±7 block numbers, last 36 months.
 * Returns results tagged with isSameBlock for display grouping.
 */
export function filterNearbyTransactions(
  transactions: ParsedTransaction[],
  input: PropertyInput,
): NearbyTransaction[] {
  const cutoff = getMonthCutoff(NEARBY_MONTHS);
  const subjectBlockNum = input.block ? parseBlockNumber(input.block) : null;
  const subjectAreaSqft = input.floorAreaSqm * SQM_TO_SQFT;

  const results: NearbyTransaction[] = [];

  for (const txn of transactions) {
    if (txn.month < cutoff) continue;
    if (txn.streetName !== input.streetName) continue;
    if (txn.leaseCommenceDate !== input.leaseCommenceDate) continue;
    if (Math.abs(txn.floorAreaSqft - subjectAreaSqft) > NEARBY_SIZE_TOLERANCE_SQFT) continue;

    const txnBlockNum = parseBlockNumber(txn.block);
    if (subjectBlockNum === null || txnBlockNum === null) continue;
    if (Math.abs(txnBlockNum - subjectBlockNum) > NEARBY_BLOCK_RANGE) continue;

    const isSameBlock = txn.block === input.block;
    results.push({ ...txn, isSameBlock });
  }

  results.sort((a, b) => b.month.localeCompare(a.month));
  return results;
}
