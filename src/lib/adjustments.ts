import type { TieredComparable, PropertyInput } from "@/types";
import {
  STOREY_RANGES,
  STOREY_PREMIUM_PER_BAND,
  LEASE_DISCOUNT_PER_YEAR_BELOW_70,
  LEASE_FULL_ELIGIBILITY_YEARS,
  SQM_TO_SQFT,
} from "./constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStoreyBandIndex(range: string): number {
  const idx = STOREY_RANGES.indexOf(range as (typeof STOREY_RANGES)[number]);
  return idx >= 0 ? idx : 0;
}

/** Calculate remaining lease from lease commence year */
export function calculateRemainingLease(leaseCommenceDate: number): number {
  const now = new Date();
  const elapsed = now.getFullYear() - leaseCommenceDate + (now.getMonth() / 12);
  return Math.max(0, 99 - elapsed);
}

// ---------------------------------------------------------------------------
// Individual adjustment factors
// ---------------------------------------------------------------------------

/**
 * Storey adjustment: how much to adjust a comp's PSF when comparing to the
 * subject's storey range.
 *
 * If the subject is HIGHER than the comp, the comp's effective value at the
 * subject's floor is higher (positive adjustment).
 */
export function calculateStoreyAdjustment(
  compStoreyRange: string,
  subjectStoreyRange: string,
): number {
  const compIdx = getStoreyBandIndex(compStoreyRange);
  const subjectIdx = getStoreyBandIndex(subjectStoreyRange);
  return (subjectIdx - compIdx) * STOREY_PREMIUM_PER_BAND;
}

/**
 * Lease adjustment: discount applied when the subject has fewer remaining
 * lease years than the comp (relative to the 70-year threshold).
 */
export function calculateLeaseAdjustment(
  compLeaseYears: number,
  subjectLeaseYears: number,
): number {
  const compDeficit = Math.max(0, LEASE_FULL_ELIGIBILITY_YEARS - compLeaseYears);
  const subjectDeficit = Math.max(0, LEASE_FULL_ELIGIBILITY_YEARS - subjectLeaseYears);
  // If subject has MORE deficit (shorter lease), this is negative
  return -(subjectDeficit - compDeficit) * LEASE_DISCOUNT_PER_YEAR_BELOW_70;
}

/**
 * Size adjustment: larger units tend to have slightly lower PSF.
 * Dampened by 0.3x to keep the adjustment small.
 */
export function calculateSizeAdjustment(
  compFloorAreaSqm: number,
  subjectFloorAreaSqm: number,
): number {
  if (compFloorAreaSqm === 0) return 0;
  const sizeDiffPercent = (subjectFloorAreaSqm - compFloorAreaSqm) / compFloorAreaSqm;
  return -sizeDiffPercent * 0.3;
}

// ---------------------------------------------------------------------------
// Combined adjustment
// ---------------------------------------------------------------------------

/**
 * Adjust a comparable's PSF to make it directly comparable to the subject.
 * Returns the adjusted PSF value.
 */
export function adjustComparablePsf(
  comp: TieredComparable,
  input: PropertyInput,
): number {
  const subjectLeaseYears = calculateRemainingLease(input.leaseCommenceDate);

  const storeyAdj = calculateStoreyAdjustment(comp.storeyRange, input.storeyRange);
  const leaseAdj = calculateLeaseAdjustment(comp.remainingLeaseYears, subjectLeaseYears);
  const sizeAdj = calculateSizeAdjustment(comp.floorAreaSqm, input.floorAreaSqm);

  const totalMultiplier = 1 + storeyAdj + leaseAdj + sizeAdj;
  return comp.pricePsf * totalMultiplier;
}

/**
 * Apply adjustments to an array of tiered comparables in-place and return them.
 */
export function applyAdjustments(
  comps: TieredComparable[],
  input: PropertyInput,
): TieredComparable[] {
  return comps.map((c) => ({
    ...c,
    adjustedPricePsf: adjustComparablePsf(c, input),
  }));
}
