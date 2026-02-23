"use server";

import type { AnalysisResult, PropertyInput } from "@/types";
import { fetchResaleDataWithFallback } from "@/lib/hdb-api";
import { tierComparables } from "@/lib/comparables";
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

  // 4. Apply price adjustments (with max storey range for top-tier bonus)
  const adjustedTier1 = applyAdjustments(
    tier1.map((t) => ({ ...t, tier: 1 as const })),
    input,
    maxStoreyRange,
  );
  const adjustedTier2 = applyAdjustments(
    tier2.map((t) => ({ ...t, tier: 2 as const })),
    input,
    maxStoreyRange,
  );
  const adjustedTier3 = applyAdjustments(
    tier3.map((t) => ({ ...t, tier: 3 as const })),
    input,
    maxStoreyRange,
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

  // 7. Calculate costs at each offer level
  const costs = {
    atLow: calculateCostBreakdown(offer.low, input.flatType),
    atMid: calculateCostBreakdown(offer.mid, input.flatType),
    atMax: calculateCostBreakdown(offer.max, input.flatType),
  };

  // 8. Geocode user's block for distance-based BTO proximity detection
  // Gracefully returns null if OneMap credentials are not configured
  const geocoded = await geocodeBlock(input.block, input.streetName);
  const userCoords = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : null;

  // 9. Assess risks (with distance-based BTO proximity if geocoded)
  const comps = {
    tier1: adjustedTier1,
    tier2: adjustedTier2,
    tier3: adjustedTier3,
  };
  const risks = assessRisks(input, comps, marketContext, userCoords);

  // 10. Generate checklist
  const checklist = generateChecklist(input, risks, marketContext, userCoords);

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
  };

  // Fire-and-forget: log to Google Sheets (never blocks the response)
  logAnalysis(analysisResult).catch(() => {});

  return analysisResult;
}
