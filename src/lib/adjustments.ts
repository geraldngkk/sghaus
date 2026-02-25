import type { TieredComparable, PropertyInput, MrtProximityResult, SchoolProximityResult } from "@/types";
import {
  STOREY_RANGES,
  STOREY_PREMIUM_PER_LEVEL_LOW_RISE,
  STOREY_PREMIUM_PER_LEVEL_HIGH_RISE,
  STOREY_LOW_RISE_CUTOFF,
  STOREY_TOP_TIER_BONUS_LOW_RISE,
  STOREY_TOP_TIER_BONUS_HIGH_RISE,
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

/** Extract the midpoint level from a storey range string like "04 TO 06" → 5 */
function getStoreyMidpoint(range: string): number {
  const match = range.match(/(\d+)\s*TO\s*(\d+)/i);
  if (!match) return 2; // fallback to low floor
  return (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
}

/** Extract the upper bound from a storey range string like "04 TO 06" → 6 */
function getStoreyUpper(range: string): number {
  const match = range.match(/(\d+)\s*TO\s*(\d+)/i);
  if (!match) return 3;
  return parseInt(match[2], 10);
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
 * Storey adjustment: absolute dollar amount to adjust a comp's price when
 * comparing to the subject's storey range.
 *
 * Returns a dollar amount (positive = subject is higher, comp worth more
 * at subject's floor).
 *
 * Rate: $5k/level for buildings ≤15 storeys, $4k/level for ≥16 storeys.
 * Top-tier bonus: extra $5k/$4k if subject is on the top floor band.
 *
 * @param maxStoreyRange - highest storey range in the building (for top-tier detection)
 */
export function calculateStoreyAdjustmentDollar(
  compStoreyRange: string,
  subjectStoreyRange: string,
  maxStoreyRange?: string,
): number {
  const compMid = getStoreyMidpoint(compStoreyRange);
  const subjectMid = getStoreyMidpoint(subjectStoreyRange);
  const levelDiff = subjectMid - compMid;

  // Determine building height from the highest storey range we know about
  const buildingTopLevel = maxStoreyRange
    ? getStoreyUpper(maxStoreyRange)
    : Math.max(getStoreyUpper(compStoreyRange), getStoreyUpper(subjectStoreyRange));

  const isHighRise = buildingTopLevel > STOREY_LOW_RISE_CUTOFF;
  const ratePerLevel = isHighRise
    ? STOREY_PREMIUM_PER_LEVEL_HIGH_RISE
    : STOREY_PREMIUM_PER_LEVEL_LOW_RISE;

  let adjustment = levelDiff * ratePerLevel;

  // Top-tier bonus: if the subject is in the highest storey band of the building
  if (maxStoreyRange && subjectStoreyRange === maxStoreyRange) {
    const bonus = isHighRise
      ? STOREY_TOP_TIER_BONUS_HIGH_RISE
      : STOREY_TOP_TIER_BONUS_LOW_RISE;
    adjustment += bonus;
  }

  return adjustment;
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

/**
 * MRT proximity adjustment: accounts for the difference in MRT proximity
 * between subject and comparable. If subject is closer to MRT, comp's PSF
 * should be adjusted upward (subject commands a premium the comp didn't capture).
 *
 * Returns a percentage adjustment (e.g., +0.065 means comp PSF goes up 6.5%).
 */
export function calculateMrtAdjustment(
  subjectMrt: MrtProximityResult | null,
  compMrt: MrtProximityResult | null,
): number {
  if (!subjectMrt || !compMrt) return 0;
  return subjectMrt.premiumPercent - compMrt.premiumPercent;
}

/**
 * School proximity adjustment: accounts for the difference in school proximity
 * premium between subject and comparable. Uses the midpoint of the min/max
 * premium range for each side.
 *
 * Returns a percentage adjustment (e.g., +0.04 means comp PSF goes up 4%).
 */
export function calculateSchoolAdjustment(
  subjectSchoolPremium: { min: number; max: number } | null,
  compSchoolPremium: { min: number; max: number } | null,
): number {
  const subjectMid = subjectSchoolPremium
    ? (subjectSchoolPremium.min + subjectSchoolPremium.max) / 2
    : 0;
  const compMid = compSchoolPremium
    ? (compSchoolPremium.min + compSchoolPremium.max) / 2
    : 0;
  return subjectMid - compMid;
}

// ---------------------------------------------------------------------------
// Combined adjustment
// ---------------------------------------------------------------------------

/**
 * Adjust a comparable's PSF to make it directly comparable to the subject.
 * Returns the adjusted PSF value.
 *
 * Storey adjustment is applied as an absolute dollar offset (converted to PSF),
 * while lease and size adjustments remain percentage-based multipliers.
 *
 * @param maxStoreyRange - highest storey range available in the building (for top-tier bonus)
 */
export function adjustComparablePsf(
  comp: TieredComparable,
  input: PropertyInput,
  maxStoreyRange?: string,
  mrtAdjustment?: number,
  schoolAdjustment?: number,
): number {
  const subjectLeaseYears = calculateRemainingLease(input.leaseCommenceDate);
  const subjectSqft = input.floorAreaSqm * SQM_TO_SQFT;

  // Storey: absolute dollar adjustment, converted to PSF offset
  const storeyDollar = calculateStoreyAdjustmentDollar(
    comp.storeyRange,
    input.storeyRange,
    maxStoreyRange,
  );
  const storeyPsfOffset = subjectSqft > 0 ? storeyDollar / subjectSqft : 0;

  // Lease & size: percentage-based multipliers (unchanged)
  const leaseAdj = calculateLeaseAdjustment(comp.remainingLeaseYears, subjectLeaseYears);
  const sizeAdj = calculateSizeAdjustment(comp.floorAreaSqm, input.floorAreaSqm);

  const percentMultiplier = 1 + leaseAdj + sizeAdj + (mrtAdjustment ?? 0) + (schoolAdjustment ?? 0);
  return comp.pricePsf * percentMultiplier + storeyPsfOffset;
}

/**
 * Apply adjustments to an array of tiered comparables in-place and return them.
 *
 * @param maxStoreyRange - highest storey range in the subject building (for top-tier bonus)
 */
export function applyAdjustments(
  comps: TieredComparable[],
  input: PropertyInput,
  maxStoreyRange?: string,
  subjectMrt?: MrtProximityResult | null,
  compMrtMap?: Map<string, MrtProximityResult | null>,
  subjectSchoolPremium?: { min: number; max: number } | null,
  compSchoolPremiumMap?: Map<string, { min: number; max: number } | null>,
): TieredComparable[] {
  return comps.map((c) => {
    const compMrt = compMrtMap?.get(`${c.block}|${c.streetName}`) ?? null;
    const mrtAdj = calculateMrtAdjustment(subjectMrt ?? null, compMrt);
    const compSchoolPremium = compSchoolPremiumMap?.get(`${c.block}|${c.streetName}`) ?? null;
    const schoolAdj = calculateSchoolAdjustment(subjectSchoolPremium ?? null, compSchoolPremium);
    return {
      ...c,
      adjustedPricePsf: adjustComparablePsf(c, input, maxStoreyRange, mrtAdj, schoolAdj),
    };
  });
}
