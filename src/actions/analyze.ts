"use server";

import type { AnalysisResult, PropertyInput, MrtProximityResult, SchoolProximityResult } from "@/types";
import { fetchResaleDataWithFallback } from "@/lib/hdb-api";
import { tierComparables, filterNearbyTransactions } from "@/lib/comparables";
import { applyAdjustments } from "@/lib/adjustments";
import { calculateOffers, calculateMarketContext } from "@/lib/offer-calculator";
import { calculateCostBreakdown } from "@/lib/cost-calculator";
import { assessRisks, generateChecklist } from "@/lib/risk-assessment";
import { assessRenovation, type RenovationAnswer } from "@/lib/renovation";
import { logAnalysis } from "@/actions/log-analysis";
import { SQM_TO_SQFT } from "@/lib/constants";
import { HDB_TOWNS, FLAT_TYPES, STOREY_RANGES } from "@/lib/constants";
import { getBlockDetails } from "@/actions/block-info";
import { geocodeBlock } from "@/lib/onemap";
import { findNearestMrt, getMrtPremiumPercent } from "@/lib/mrt-stations";
import { findNearbySchools, getSchoolPremiumPercent } from "@/lib/primary-schools";

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

function validateInput(input: PropertyInput): void {
  if (!HDB_TOWNS.includes(input.town as (typeof HDB_TOWNS)[number])) {
    throw new Error(`Invalid town: ${input.town}`);
  }
  if (!FLAT_TYPES.includes(input.flatType as (typeof FLAT_TYPES)[number])) {
    throw new Error(`Invalid flat type: ${input.flatType}`);
  }
  if (!STOREY_RANGES.includes(input.storeyRange as (typeof STOREY_RANGES)[number])) {
    throw new Error(`Invalid storey range: ${input.storeyRange}`);
  }
  if (!input.streetName.trim()) {
    throw new Error("Street name is required");
  }
  if (!input.block?.trim()) {
    throw new Error("Block is required");
  }
  if (input.floorAreaSqm < 20 || input.floorAreaSqm > 300) {
    throw new Error("Floor area must be between 20 and 300 sqm");
  }
  if (input.leaseCommenceDate < 1960 || input.leaseCommenceDate > new Date().getFullYear()) {
    throw new Error("Invalid lease commence date");
  }
}

/**
 * Resolve lease commence date from HDB data.
 * Uses exact block+street match — no street-level fallback.
 */
async function resolveLeaseYear(input: PropertyInput): Promise<number> {
  if (input.leaseCommenceDate) return input.leaseCommenceDate;

  if (!input.block) {
    throw new Error("Block is required to determine lease commence year.");
  }

  const details = await getBlockDetails(
    input.town,
    input.flatType,
    input.streetName,
    input.block,
  );

  if (details.leaseCommenceDate) return details.leaseCommenceDate;

  throw new Error(
    "Could not determine lease commence year from HDB data for block " +
    `${input.block} on ${input.streetName}. Please verify the block number.`,
  );
}

// ---------------------------------------------------------------------------
// Main analysis pipeline
// ---------------------------------------------------------------------------

export async function analyzeProperty(
  rawInput: PropertyInput,
  renovationAnswers?: RenovationAnswer[],
): Promise<AnalysisResult> {
  // 1. Resolve lease year from HDB data if not provided, then validate
  const leaseCommenceDate = await resolveLeaseYear(rawInput);
  const input: PropertyInput = { ...rawInput, leaseCommenceDate };
  validateInput(input);

  // 1b. Resolve max storey range for storey premium top-tier bonus
  const blockDetails = await getBlockDetails(
    input.town,
    input.flatType,
    input.streetName,
    input.block,
  );
  const maxStoreyRange =
    blockDetails.storeyRanges.length > 0
      ? blockDetails.storeyRanges[blockDetails.storeyRanges.length - 1]
      : undefined;

  // 2. Fetch transaction data (cached 24h, with fallback)
  const { data: allTransactions, dataSource } = await fetchResaleDataWithFallback(input.town, input.flatType);

  // 3. Tier the comps
  const { tier1, tier2, tier3 } = tierComparables(allTransactions, input);

  // 3a. Filter nearby transactions for market context display
  const nearbyTransactions = filterNearbyTransactions(allTransactions, input);

  // 3b. Batch-geocode subject + all unique comp blocks in parallel
  const allRawComps = [...tier1, ...tier2, ...tier3];
  const uniqueBlocks = new Map<string, { block: string; street: string }>();
  uniqueBlocks.set(
    `${input.block}|${input.streetName}`,
    { block: input.block, street: input.streetName },
  );
  for (const c of allRawComps) {
    const key = `${c.block}|${c.streetName}`;
    if (!uniqueBlocks.has(key)) {
      uniqueBlocks.set(key, { block: c.block, street: c.streetName });
    }
  }

  const geocodeEntries = await Promise.all(
    [...uniqueBlocks.entries()].map(async ([key, { block, street }]) => {
      const result = await geocodeBlock(block, street);
      return [key, result] as const;
    }),
  );
  const geocodeMap = new Map(geocodeEntries);

  const subjectGeo = geocodeMap.get(`${input.block}|${input.streetName}`);
  const userCoords = subjectGeo ? { lat: subjectGeo.lat, lng: subjectGeo.lng } : null;

  // 3c. Compute MRT proximity for subject + all comp blocks
  const subjectMrt = userCoords
    ? findNearestMrt(userCoords.lat, userCoords.lng)
    : null;

  const compMrtMap = new Map<string, MrtProximityResult | null>();
  for (const [key, geo] of geocodeMap) {
    if (geo) {
      compMrtMap.set(key, findNearestMrt(geo.lat, geo.lng));
    } else {
      compMrtMap.set(key, null);
    }
  }

  // 3d. Compute school proximity for subject + all comp blocks
  console.log("[SCHOOL DEBUG] userCoords:", userCoords);
  const subjectSchools = userCoords
    ? findNearbySchools(userCoords.lat, userCoords.lng)
    : [];
  console.log("[SCHOOL DEBUG] subjectSchools count:", subjectSchools.length, subjectSchools.slice(0, 3).map(s => `${s.school.name} (${s.distanceMeters}m)`));
  const subjectSchoolPremium = getSchoolPremiumPercent(subjectSchools);

  const compSchoolPremiumMap = new Map<string, { min: number; max: number } | null>();
  for (const [key, geo] of geocodeMap) {
    if (geo) {
      const schools = findNearbySchools(geo.lat, geo.lng);
      compSchoolPremiumMap.set(key, getSchoolPremiumPercent(schools));
    } else {
      compSchoolPremiumMap.set(key, null);
    }
  }

  // 4. Apply price adjustments (with max storey range for top-tier bonus)
  const adjustedTier1 = applyAdjustments(
    tier1.map((t) => ({ ...t, tier: 1 as const })),
    input,
    maxStoreyRange,
    subjectMrt,
    compMrtMap,
    subjectSchoolPremium,
    compSchoolPremiumMap,
  );
  const adjustedTier2 = applyAdjustments(
    tier2.map((t) => ({ ...t, tier: 2 as const })),
    input,
    maxStoreyRange,
    subjectMrt,
    compMrtMap,
    subjectSchoolPremium,
    compSchoolPremiumMap,
  );
  const adjustedTier3 = applyAdjustments(
    tier3.map((t) => ({ ...t, tier: 3 as const })),
    input,
    maxStoreyRange,
    subjectMrt,
    compMrtMap,
    subjectSchoolPremium,
    compSchoolPremiumMap,
  );

  // 5. Calculate market context (trends)
  const marketContext = calculateMarketContext(allTransactions, input);

  // 6. Calculate offer strategy
  const offer = calculateOffers(
    adjustedTier1,
    adjustedTier2,
    adjustedTier3,
    input,
    marketContext,
  );

  // 6b. Enrich offer rationales with MRT context if adjustment is material
  if (subjectMrt && subjectMrt.premiumPercent > 0) {
    const compMrtDistances = allRawComps
      .map((c) => compMrtMap.get(`${c.block}|${c.streetName}`))
      .filter((m): m is MrtProximityResult => m !== null)
      .map((m) => m.distanceMeters);

    if (compMrtDistances.length > 0) {
      const avgCompMrtDist = Math.round(
        compMrtDistances.reduce((a, b) => a + b, 0) / compMrtDistances.length,
      );
      const avgCompPremium =
        compMrtDistances
          .map((d) => getMrtPremiumPercent(d, "operational").percent)
          .reduce((a, b) => a + b, 0) / compMrtDistances.length;
      const netMrtAdj = subjectMrt.premiumPercent - avgCompPremium;

      if (Math.abs(netMrtAdj) >= 0.01) {
        const mrtNote = ` MRT-adjusted: subject is ${subjectMrt.distanceMeters}m from ${subjectMrt.station.name} MRT vs comp avg ${avgCompMrtDist}m (${netMrtAdj > 0 ? "+" : ""}${(netMrtAdj * 100).toFixed(1)}% location premium).`;
        offer.lowRationale += mrtNote;
        offer.midRationale += mrtNote;
        offer.maxRationale += mrtNote;
      }
    }
  }

  // 6c. Enrich offer rationales with school context if adjustment is material
  if (subjectSchools.length > 0) {
    const desirableSchools = subjectSchools.filter(
      (s) => s.school.tier === "A" || s.school.tier === "B" || s.school.tier === "C",
    );
    const within1km = desirableSchools.filter((s) => s.distanceBand === "within1km");

    if (within1km.length > 0 && subjectSchoolPremium.max >= 0.02) {
      const topSchool = within1km[0];
      const schoolNote = within1km.length === 1
        ? ` School premium: within 1 km of ${topSchool.school.name} (tier ${topSchool.school.tier}, ${topSchool.distanceMeters}m).`
        : ` School premium: ${within1km.length} desirable schools within 1 km (nearest: ${topSchool.school.name}, ${topSchool.distanceMeters}m).`;
      offer.lowRationale += schoolNote;
      offer.midRationale += schoolNote;
      offer.maxRationale += schoolNote;
    }
  }

  // 7. Calculate costs at each offer level
  const costs = {
    atLow: calculateCostBreakdown(offer.low, input.flatType),
    atMid: calculateCostBreakdown(offer.mid, input.flatType),
    atMax: calculateCostBreakdown(offer.max, input.flatType),
  };

  // 8. Assess risks (with distance-based BTO proximity if geocoded)
  const comps = {
    tier1: adjustedTier1,
    tier2: adjustedTier2,
    tier3: adjustedTier3,
  };
  const risks = assessRisks(input, comps, marketContext, userCoords, subjectMrt, subjectSchools);

  // 10. Generate checklist
  const checklist = generateChecklist(input, risks, marketContext, userCoords, subjectMrt, subjectSchools);

  // 10. Optional: Renovation-adjusted offers
  let renovation: AnalysisResult["renovation"];
  let offerWithReno: AnalysisResult["offerWithReno"];

  console.log("[RENO DEBUG] renovationAnswers received:", renovationAnswers ? `${renovationAnswers.length} answers` : "NONE (null/undefined)");

  if (renovationAnswers && renovationAnswers.length > 0) {
    const renoResult = assessRenovation(renovationAnswers, input.flatType);
    renovation = renoResult;

    console.log("[RENO DEBUG] Assessment result:", {
      condition: renoResult.condition,
      overallScore: renoResult.overallScore,
      estimatedCost: renoResult.estimatedCost,
      priceAdjustmentPercent: renoResult.priceAdjustmentPercent,
      priceAdjustmentDollar: renoResult.priceAdjustmentDollar,
    });

    if (renoResult.priceAdjustmentPercent !== 0) {
      const adjustPsf = (psf: number) =>
        Math.round(psf * (1 + renoResult.priceAdjustmentPercent));
      const adjustPrice = (psf: number) =>
        Math.round(psf * (1 + renoResult.priceAdjustmentPercent) * input.floorAreaSqm * SQM_TO_SQFT / 1000) * 1000;

      const renoLow = offer.low + Math.round(offer.low * renoResult.priceAdjustmentPercent / 1000) * 1000;
      const renoMid = offer.mid + Math.round(offer.mid * renoResult.priceAdjustmentPercent / 1000) * 1000;
      const renoMax = offer.max + Math.round(offer.max * renoResult.priceAdjustmentPercent / 1000) * 1000;

      console.log("[RENO DEBUG] Offer adjustment:", {
        baseOffers: { low: offer.low, mid: offer.mid, max: offer.max },
        adjustedOffers: { low: renoLow, mid: renoMid, max: renoMax },
        adjustmentPercent: `${(renoResult.priceAdjustmentPercent * 100).toFixed(2)}%`,
      });

      offerWithReno = {
        low: renoLow,
        mid: renoMid,
        max: renoMax,
        lowPsf: adjustPsf(offer.lowPsf),
        midPsf: adjustPsf(offer.midPsf),
        maxPsf: adjustPsf(offer.maxPsf),
        lowRationale: `${offer.lowRationale} Renovation-adjusted (${renoResult.condition}: ${renoResult.priceAdjustmentPercent > 0 ? "+" : ""}${(renoResult.priceAdjustmentPercent * 100).toFixed(1)}%).`,
        midRationale: `${offer.midRationale} Renovation-adjusted (${renoResult.condition}: ${renoResult.priceAdjustmentPercent > 0 ? "+" : ""}${(renoResult.priceAdjustmentPercent * 100).toFixed(1)}%).`,
        maxRationale: `${offer.maxRationale} Renovation-adjusted (${renoResult.condition}: ${renoResult.priceAdjustmentPercent > 0 ? "+" : ""}${(renoResult.priceAdjustmentPercent * 100).toFixed(1)}%).`,
        walkAwayTriggers: offer.walkAwayTriggers,
      };
    }
  }

  const analysisResult: AnalysisResult = {
    input,
    generatedAt: new Date().toISOString(),
    comps: {
      tier1: adjustedTier1,
      tier2: adjustedTier2,
      tier3: adjustedTier3,
      totalRecordsFetched: allTransactions.length,
    },
    offer,
    offerWithReno,
    renovation,
    costs,
    risks,
    checklist,
    marketContext,
    dataSource,
    mrtProximity: subjectMrt ?? undefined,
    schoolProximity: subjectSchools.length > 0 ? subjectSchools : undefined,
    nearbyTransactions,
  };

  // Fire-and-forget: log to Google Sheets (never blocks the response)
  logAnalysis(analysisResult).catch(() => {});

  return analysisResult;
}
