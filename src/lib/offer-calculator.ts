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
  primaryComps: TieredComparable[],
  psfValue: number,
  input: PropertyInput,
): string {
  const count = primaryComps.length;
  const tierLabel = primaryComps[0]?.tier === 1 ? "direct street" : "area";
  return (
    `Opening bid at $${psfValue.toFixed(0)} psf (15th percentile of ${count} ${tierLabel} comparables). ` +
    `A credible, data-backed anchor that gives you real negotiation room. ` +
    `15% of recent buyers paid this or less — it's the lower end, not the bottom.`
  );
}

function buildMidRationale(
  primaryComps: TieredComparable[],
  psfValue: number,
  input: PropertyInput,
): string {
  const count = primaryComps.length;
  const tierLabel = primaryComps[0]?.tier === 1 ? "direct street" : "area";
  return (
    `Target price at $${psfValue.toFixed(0)} psf (40th percentile of ${count} ${tierLabel} comparables). ` +
    `Slightly below the median — you're paying less than what most recent buyers paid. ` +
    `A fair price without pushing the market higher.`
  );
}

function buildMaxRationale(
  primaryComps: TieredComparable[],
  psfValue: number,
  input: PropertyInput,
): string {
  const count = primaryComps.length;
  return (
    `Hard ceiling at $${psfValue.toFixed(0)} psf (55th percentile of ${count} comparables). ` +
    `Just above the median — you're matching the typical buyer but never in the top half. ` +
    `Walk away above this price.`
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

  // Determine primary comp set
  const primaryComps =
    tier1.length >= MIN_TIER1_COMPS ? tier1 : [...tier1, ...tier2];

  // Fallback to tier3 if still not enough
  const compsToUse = primaryComps.length >= 3 ? primaryComps : [...primaryComps, ...tier3];

  const adjustedPsf = compsToUse
    .map((c) => c.adjustedPricePsf)
    .sort((a, b) => a - b);

  if (adjustedPsf.length === 0) {
    // No data at all — return zero with explanation
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

  // Balanced buyer-first percentiles (V3):
  //   LOW  = P15  — credible anchor with real negotiation room
  //   MID  = P40  — just below median, you beat most buyers
  //   MAX  = P55  — slightly above median, never in top half
  //
  // See: research/offer-formula.md for full rationale.
  const p10 = percentile(adjustedPsf, 0.10);
  const p15 = percentile(adjustedPsf, 0.15);
  const p35 = percentile(adjustedPsf, 0.35);
  const p40 = percentile(adjustedPsf, 0.40);
  const p55 = percentile(adjustedPsf, 0.55);
  const p60 = percentile(adjustedPsf, 0.60);

  // Small sample fallback: widen when < 5 comps
  let lowPsf = compsToUse.length < 5 ? p10 : p15;
  let midPsf = compsToUse.length < 5 ? p35 : p40;
  let maxPsf = compsToUse.length < 5 ? p60 : p55;

  // Guard: LOW must be at least 5% below MID to leave real negotiation room
  if (lowPsf > midPsf * 0.95) {
    lowPsf = midPsf * 0.93; // force 7% gap
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
    lowRationale: buildLowRationale(compsToUse, lowPsf, input),
    midRationale: buildMidRationale(compsToUse, midPsf, input),
    maxRationale: buildMaxRationale(compsToUse, maxPsf, input),
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
