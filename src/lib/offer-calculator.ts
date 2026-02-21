import type { TieredComparable, PropertyInput, OfferStrategy, MarketContext } from "@/types";
import { MIN_TIER1_COMPS, SQM_TO_SQFT } from "./constants";
import { calculateRemainingLease } from "./adjustments";

// ---------------------------------------------------------------------------
// Stats helpers
// ---------------------------------------------------------------------------

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return percentile(sorted, 0.5);
}

function roundToNearest(value: number, nearest: number): number {
  return Math.round(value / nearest) * nearest;
}

// ---------------------------------------------------------------------------
// Rationale builders
// ---------------------------------------------------------------------------

function buildLowRationale(
  benchmarkLabel: string,
  benchmarkCount: number,
  psfValue: number,
  streetMedianPsf: number,
): string {
  const pctBelow = ((streetMedianPsf - psfValue) / streetMedianPsf * 100).toFixed(1);
  return (
    `Opening bid at $${psfValue.toFixed(0)} psf — ${pctBelow}% below the ${benchmarkLabel} median ($${streetMedianPsf.toFixed(0)} psf) ` +
    `based on ${benchmarkCount} comparable transactions. ` +
    `A credible, data-backed anchor that gives you negotiation room while showing the seller you've done your homework.`
  );
}

function buildMidRationale(
  benchmarkLabel: string,
  benchmarkCount: number,
  psfValue: number,
): string {
  return (
    `Target price at $${psfValue.toFixed(0)} psf — the median of ${benchmarkCount} ${benchmarkLabel} transactions. ` +
    `This is what the typical buyer paid for a comparable unit. ` +
    `A fair market value price — you're matching the market, not overpaying.`
  );
}

function buildMaxRationale(
  benchmarkLabel: string,
  benchmarkCount: number,
  psfValue: number,
  streetMedianPsf: number,
  avgCov: number,
): string {
  const covNote = avgCov > 0
    ? ` Average premium over market value on this street: $${avgCov.toFixed(0)} psf.`
    : "";
  return (
    `Hard ceiling at $${psfValue.toFixed(0)} psf — median ($${streetMedianPsf.toFixed(0)} psf) plus the average COV (Cash Over Valuation) ` +
    `from ${benchmarkCount} ${benchmarkLabel} transactions.${covNote} ` +
    `This is what above-average buyers paid. Walk away above this price.`
  );
}

function generateWalkAwayTriggers(
  input: PropertyInput,
  tier1: TieredComparable[],
  marketContext: MarketContext,
): string[] {
  const triggers: string[] = [];

  triggers.push("Asking price exceeds your calculated max offer");

  const remainingLease = calculateRemainingLease(input.leaseCommenceDate);
  if (remainingLease < 60) {
    triggers.push(
      `Remaining lease is only ~${Math.round(remainingLease)} years — limited CPF usage and loan eligibility`,
    );
  }
  if (remainingLease < 50) {
    triggers.push(
      `CRITICAL: Remaining lease below 50 years — very restricted financing and difficult resale`,
    );
  }

  if (tier1.length < 2) {
    triggers.push("Very few comparable transactions on this street — pricing is uncertain");
  }

  if (marketContext.trendDirection === "down" && marketContext.trendPercentage < -3) {
    triggers.push(
      `Prices in ${input.town} are trending down (${marketContext.trendPercentage.toFixed(1)}% YoY) — consider waiting`,
    );
  }

  triggers.push("Structural defects found during inspection");
  triggers.push("Seller unwilling to negotiate on material issues found during viewing");

  return triggers;
}

// ---------------------------------------------------------------------------
// Block proximity helper
// ---------------------------------------------------------------------------

function parseBlockNumber(block: string): number | null {
  const match = block.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ---------------------------------------------------------------------------
// Main offer calculation
// ---------------------------------------------------------------------------

export function calculateOffers(
  tier1: TieredComparable[],
  tier2: TieredComparable[],
  tier3: TieredComparable[],
  input: PropertyInput,
  marketContext: MarketContext,
): OfferStrategy {
  const subjectSqft = input.floorAreaSqm * SQM_TO_SQFT;
  const subjectBlockNum = parseBlockNumber(input.block);

  // =====================================================================
  // V5 — COV-Based Offer Strategy
  //
  //   LOW = street median - negotiation discount (~5-7% below)
  //   MID = street-level median PSF (= market value)
  //   MAX = street median + average COV (avg premium above-market buyers paid)
  //
  // COV = Cash Over Valuation. For each transaction above the street
  // median, COV = transaction PSF - median PSF. The average of these
  // positive COVs represents the typical premium. MAX = median + avg COV.
  // =====================================================================

  // --- Step 1: Build comp hierarchy (street > block/area > town) ---
  // Street-level comps: same street, last 12 months (best proxy for market value)
  const streetComps = tier1.filter((c) => c.streetName === input.streetName);

  // Block-level comps: same block or adjacent (±2) on the same street
  const blockComps = streetComps.filter((c) => {
    if (c.block === input.block) return true;
    const cBlockNum = parseBlockNumber(c.block);
    return (
      subjectBlockNum !== null &&
      cBlockNum !== null &&
      Math.abs(cBlockNum - subjectBlockNum) <= 2
    );
  });

  // Determine the benchmark set (best available, most local first)
  // Priority: block-level (≥3) > street-level (≥3) > tier1+tier2 > all tiers
  let benchmarkComps: TieredComparable[];
  let benchmarkLabel: string;

  if (blockComps.length >= 3) {
    benchmarkComps = blockComps;
    benchmarkLabel = "same-block/project";
  } else if (streetComps.length >= 3) {
    benchmarkComps = streetComps;
    benchmarkLabel = "same-street";
  } else if (tier1.length >= MIN_TIER1_COMPS) {
    benchmarkComps = tier1;
    benchmarkLabel = "nearby street";
  } else {
    const combined = [...tier1, ...tier2];
    benchmarkComps = combined.length >= 3 ? combined : [...combined, ...tier3];
    benchmarkLabel = "area-wide";
  }

  if (benchmarkComps.length === 0) {
    return {
      low: 0,
      mid: 0,
      max: 0,
      lowPsf: 0,
      midPsf: 0,
      maxPsf: 0,
      lowRationale: "Insufficient comparable data to calculate an opening bid.",
      midRationale: "Insufficient comparable data to calculate a target price.",
      maxRationale: "Insufficient comparable data to calculate a ceiling price.",
      walkAwayTriggers: ["Insufficient data — conduct manual research before making an offer"],
    };
  }

  // --- Step 2: Compute street-level median (= market value) ---
  const benchmarkPsfs = benchmarkComps.map((c) => c.adjustedPricePsf);
  const streetMedianPsf = median(benchmarkPsfs);

  // Also consider the raw (unadjusted) PSF and market-wide median as floors
  const rawMedianPsf = median(benchmarkComps.map((c) => c.pricePsf));
  // MID = highest of adjusted median, raw median, market median
  let midPsf = Math.max(streetMedianPsf, rawMedianPsf, marketContext.medianPsf);

  // --- Step 3: Compute average COV (Cash Over Valuation) ---
  // COV = how much above-median buyers paid over the median
  const aboveMedian = benchmarkPsfs.filter((p) => p > streetMedianPsf);
  const avgCov =
    aboveMedian.length > 0
      ? aboveMedian.reduce((sum, p) => sum + (p - streetMedianPsf), 0) / aboveMedian.length
      : streetMedianPsf * 0.05; // fallback: 5% premium if no above-median data

  // --- Step 4: Set MAX = median + average COV ---
  let maxPsf = midPsf + avgCov;

  // Floor: MAX must be at least the market-wide median
  maxPsf = Math.max(maxPsf, marketContext.medianPsf);

  // --- Step 5: Set LOW = negotiation anchor below median ---
  // ~5-7% below MID, giving credible negotiation room
  let lowPsf = midPsf * 0.94; // 6% below median

  // If we have enough data, use P25 as an alternative and pick the higher one
  // (so LOW isn't insultingly low in tight markets)
  if (benchmarkPsfs.length >= 5) {
    const sorted = [...benchmarkPsfs].sort((a, b) => a - b);
    const p25 = percentile(sorted, 0.25);
    lowPsf = Math.max(lowPsf, p25);
  }

  // --- Step 6: Last-sold floor for LOW ---
  // Opening bid cannot be more than 15% below the last sold equivalent property.
  // Find the most recent comparable transaction (by month) and use its PSF as anchor.
  const sortedByDate = [...benchmarkComps].sort((a, b) => b.month.localeCompare(a.month));
  const lastSoldPsf = sortedByDate.length > 0 ? sortedByDate[0].adjustedPricePsf : 0;
  const lastSoldFloor = lastSoldPsf * 0.85; // 15% below last sold

  if (lastSoldPsf > 0 && lowPsf < lastSoldFloor) {
    lowPsf = lastSoldFloor;
  }

  // --- Step 7: Guardrails ---
  // Ensure proper spacing between tiers
  // MID must be at least 3% below MAX
  if (midPsf >= maxPsf * 0.97) {
    midPsf = maxPsf * 0.97;
  }

  // LOW must be between 5-15% below MID (not too close, not too far)
  if (lowPsf > midPsf * 0.95) {
    lowPsf = midPsf * 0.93;
  }
  // Also floor: LOW cannot be more than 15% below MID
  if (lowPsf < midPsf * 0.85) {
    lowPsf = midPsf * 0.85;
  }

  const low = roundToNearest(lowPsf * subjectSqft, 1000);
  const mid = roundToNearest(midPsf * subjectSqft, 1000);
  const max = roundToNearest(maxPsf * subjectSqft, 1000);

  return {
    low,
    mid,
    max,
    lowPsf,
    midPsf,
    maxPsf,
    lowRationale: buildLowRationale(benchmarkLabel, benchmarkComps.length, lowPsf, midPsf),
    midRationale: buildMidRationale(benchmarkLabel, benchmarkComps.length, midPsf),
    maxRationale: buildMaxRationale(benchmarkLabel, benchmarkComps.length, maxPsf, midPsf, avgCov),
    walkAwayTriggers: generateWalkAwayTriggers(input, tier1, marketContext),
  };
}

// ---------------------------------------------------------------------------
// Market context calculation
// ---------------------------------------------------------------------------

function getMonthCutoff(monthsAgo: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function calculateMarketContext(
  transactions: import("@/types").ParsedTransaction[],
  input: PropertyInput,
): MarketContext {
  const cutoff12m = getMonthCutoff(12);
  const cutoff24m = getMonthCutoff(24);

  const recent = transactions.filter((t) => t.month >= cutoff12m);
  const previous = transactions.filter(
    (t) => t.month >= cutoff24m && t.month < cutoff12m,
  );

  const recentMedianPsf = median(recent.map((t) => t.pricePsf));
  const previousMedianPsf = median(previous.map((t) => t.pricePsf));
  const recentMedianPrice = median(recent.map((t) => t.resalePrice));

  const trendPercentage =
    previousMedianPsf > 0
      ? ((recentMedianPsf - previousMedianPsf) / previousMedianPsf) * 100
      : 0;

  const trendDirection: "up" | "flat" | "down" =
    trendPercentage > 1 ? "up" : trendPercentage < -1 ? "down" : "flat";

  return {
    medianPsf: recentMedianPsf,
    medianPrice: recentMedianPrice,
    transactionCount12m: recent.length,
    trendDirection,
    trendPercentage,
  };
}
