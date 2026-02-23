import { NextResponse } from "next/server";
import type { PropertyInput } from "@/types";
import { fetchResaleData } from "@/lib/hdb-api";
import { tierComparables } from "@/lib/comparables";
import { applyAdjustments } from "@/lib/adjustments";
import { calculateOffers, calculateMarketContext } from "@/lib/offer-calculator";
import { calculateCostBreakdown } from "@/lib/cost-calculator";
import { assessRisks, generateChecklist } from "@/lib/risk-assessment";
import { SQM_TO_SQFT } from "@/lib/constants";
import { assessRenovation, RENOVATION_QUESTIONS, type RenovationAnswer, type RenovationAssessment } from "@/lib/renovation";
import { getBlockDetails } from "@/actions/block-info";
import { geocodeBlock } from "@/lib/onemap";

// ---------------------------------------------------------------------------
// Shared pipeline logic
// ---------------------------------------------------------------------------

function parseInput(params: URLSearchParams): {
  input: PropertyInput;
  askingPrice: number | null;
} | { error: string; params: Record<string, unknown> } {
  const town = params.get("town")?.toUpperCase();
  const flatType = params.get("flatType")?.toUpperCase();
  const street = params.get("street")?.toUpperCase();
  const block = params.get("block") || "";
  const storey = params.get("storey");
  const area = params.get("area");
  const lease = params.get("lease");
  const askingPrice = params.get("askingPrice")
    ? parseInt(params.get("askingPrice")!, 10)
    : null;

  if (!town || !flatType || !street || !block || !storey || !area) {
    return {
      error: "Missing required params",
      params: { town, flatType, street, block, storey, area, lease },
    };
  }

  return {
    input: {
      town,
      flatType,
      streetName: street,
      block,
      storeyRange: storey,
      floorAreaSqm: parseFloat(area),
      leaseCommenceDate: lease ? parseInt(lease, 10) : 0,
    },
    askingPrice,
  };
}

function buildRenovationFromPreset(
  preset: string,
  flatType: string,
): RenovationAssessment | null {
  const presetScores: Record<string, number> = {
    excellent: 100,
    good: 75,
    needs_work: 40,
    gut_job: 10,
  };
  const score = presetScores[preset];
  if (score === undefined) return null;

  const presetAnswers: RenovationAnswer[] = RENOVATION_QUESTIONS.map((q) => {
    const option = q.options.reduce((best, opt) =>
      Math.abs(opt.score - score) < Math.abs(best.score - score) ? opt : best
    );
    return {
      questionId: q.id,
      selectedScore: option.score,
      selectedCostLow: option.costImpact.low,
      selectedCostHigh: option.costImpact.high,
    };
  });

  return assessRenovation(presetAnswers, flatType);
}

function buildRenovationFromAnswers(
  answers: { questionId: string; optionIndex: number }[],
  flatType: string,
): RenovationAssessment | null {
  const renoAnswers: RenovationAnswer[] = [];

  for (const a of answers) {
    const question = RENOVATION_QUESTIONS.find((q) => q.id === a.questionId);
    if (!question) continue;
    const option = question.options[a.optionIndex];
    if (!option) continue;
    renoAnswers.push({
      questionId: a.questionId,
      selectedScore: option.score,
      selectedCostLow: option.costImpact.low,
      selectedCostHigh: option.costImpact.high,
    });
  }

  if (renoAnswers.length === 0) return null;
  return assessRenovation(renoAnswers, flatType);
}

async function runPipeline(rawInput: PropertyInput, askingPrice: number | null, renovation: RenovationAssessment | null) {
  // Resolve lease year from HDB data if not provided
  let input = rawInput;
  if (!rawInput.leaseCommenceDate) {
    const details = await getBlockDetails(
      rawInput.town,
      rawInput.flatType,
      rawInput.streetName,
      rawInput.block,
    );
    if (!details.leaseCommenceDate) {
      throw new Error("Could not determine lease commence year from HDB data");
    }
    input = { ...rawInput, leaseCommenceDate: details.leaseCommenceDate };
  }

  const transactions = await fetchResaleData(input.town, input.flatType);
  const { tier1, tier2, tier3 } = tierComparables(transactions, input);

  const adjTier1 = applyAdjustments(tier1.map((t) => ({ ...t, tier: 1 as const })), input);
  const adjTier2 = applyAdjustments(tier2.map((t) => ({ ...t, tier: 2 as const })), input);
  const adjTier3 = applyAdjustments(tier3.map((t) => ({ ...t, tier: 3 as const })), input);

  const marketContext = calculateMarketContext(transactions, input);
  const offer = calculateOffers(adjTier1, adjTier2, adjTier3, input, marketContext, askingPrice);
  const costs = {
    atLow: calculateCostBreakdown(offer.low, input.flatType),
    atMid: calculateCostBreakdown(offer.mid, input.flatType),
    atMax: calculateCostBreakdown(offer.max, input.flatType),
  };

  // Geocode user's block for distance-based BTO proximity detection
  const geocoded = await geocodeBlock(input.block, input.streetName);
  const userCoords = geocoded ? { lat: geocoded.lat, lng: geocoded.lng } : null;

  const comps = { tier1: adjTier1, tier2: adjTier2, tier3: adjTier3 };
  const risks = assessRisks(input, comps, marketContext, userCoords);
  const checklist = generateChecklist(input, risks, marketContext, userCoords);

  // Asking price comparison
  let askingPriceAnalysis = null;
  if (askingPrice) {
    const askingPsf = askingPrice / (input.floorAreaSqm * SQM_TO_SQFT);
    const vsLow = ((askingPrice - offer.low) / offer.low * 100).toFixed(1);
    const vsMid = ((askingPrice - offer.mid) / offer.mid * 100).toFixed(1);
    const vsMax = ((askingPrice - offer.max) / offer.max * 100).toFixed(1);
    const vsMedian = ((askingPsf - marketContext.medianPsf) / marketContext.medianPsf * 100).toFixed(1);

    askingPriceAnalysis = {
      askingPrice,
      askingPsf: Math.round(askingPsf),
      vsOfferLow: `${vsLow}%`,
      vsOfferMid: `${vsMid}%`,
      vsOfferMax: `${vsMax}%`,
      vsMarketMedianPsf: `${vsMedian}%`,
      verdict:
        askingPrice <= offer.low
          ? "BELOW your opening bid — excellent deal if genuine"
          : askingPrice <= offer.mid
            ? "Between your opening bid and target — negotiate down from here"
            : askingPrice <= offer.max
              ? "Between your target and ceiling — acceptable but push for concessions"
              : "ABOVE your hard ceiling — walk away or negotiate significantly",
    };
  }

  // Renovation-adjusted offers
  let offerWithReno = null;
  if (renovation) {
    const adj = renovation.priceAdjustmentPercent;
    offerWithReno = {
      low: Math.round((offer.low * (1 + adj)) / 1000) * 1000,
      mid: Math.round((offer.mid * (1 + adj)) / 1000) * 1000,
      max: Math.round((offer.max * (1 + adj)) / 1000) * 1000,
      lowPsf: Math.round(offer.lowPsf * (1 + adj)),
      midPsf: Math.round(offer.midPsf * (1 + adj)),
      maxPsf: Math.round(offer.maxPsf * (1 + adj)),
      lowRationale: `${offer.lowRationale} Adjusted ${adj > 0 ? "+" : ""}${(adj * 100).toFixed(1)}% for ${renovation.condition} condition.`,
      midRationale: `${offer.midRationale} Adjusted ${adj > 0 ? "+" : ""}${(adj * 100).toFixed(1)}% for ${renovation.condition} condition.`,
      maxRationale: `${offer.maxRationale} Adjusted ${adj > 0 ? "+" : ""}${(adj * 100).toFixed(1)}% for ${renovation.condition} condition.`,
      walkAwayTriggers: offer.walkAwayTriggers,
    };
  }

  return {
    input,
    askingPriceAnalysis,
    compCounts: {
      tier1: adjTier1.length,
      tier2: adjTier2.length,
      tier3: adjTier3.length,
      total: transactions.length,
    },
    marketContext,
    offer: {
      low: offer.low,
      mid: offer.mid,
      max: offer.max,
      lowPsf: Math.round(offer.lowPsf),
      midPsf: Math.round(offer.midPsf),
      maxPsf: Math.round(offer.maxPsf),
      lowRationale: offer.lowRationale,
      midRationale: offer.midRationale,
      maxRationale: offer.maxRationale,
      walkAwayTriggers: offer.walkAwayTriggers,
    },
    ...(offerWithReno && { offerWithReno }),
    ...(renovation && { renovation }),
    costs,
    risks,
    checklist,
  };
}

// ---------------------------------------------------------------------------
// GET — query params + optional preset
// ---------------------------------------------------------------------------

/**
 * GET /api/analyze?town=SENGKANG&flatType=4 ROOM&street=MONTREAL LINK&block=590B&storey=16 TO 18&area=93&lease=2014
 *
 * Optional: askingPrice, reno (preset: excellent|good|needs_work|gut_job)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  try {
    const parsed = parseInput(url.searchParams);
    if ("error" in parsed) {
      return NextResponse.json({
        error: parsed.error,
        usage: "/api/analyze?town=SENGKANG&flatType=4 ROOM&street=MONTREAL LINK&block=590B&storey=16 TO 18&area=93&lease=2014&askingPrice=650000",
        params: parsed.params,
      }, { status: 400 });
    }

    const { input, askingPrice } = parsed;

    // Renovation from preset
    const renoPreset = url.searchParams.get("reno");
    const renovation = renoPreset
      ? buildRenovationFromPreset(renoPreset, input.flatType)
      : null;

    const result = await runPipeline(input, askingPrice, renovation);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — query params for property + JSON body for renovation answers
// ---------------------------------------------------------------------------

/**
 * POST /api/analyze?town=SENGKANG&flatType=4 ROOM&street=MONTREAL LINK&storey=16 TO 18&area=93&lease=2014
 *
 * Body: { "answers": [{ "questionId": "kitchen", "optionIndex": 1 }, ...] }
 *
 * optionIndex is 0-based: 0=first option (best), last=worst.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  try {
    const parsed = parseInput(url.searchParams);
    if ("error" in parsed) {
      return NextResponse.json({
        error: parsed.error,
        usage: "POST /api/analyze?town=...&flatType=...&street=...&storey=...&area=...&lease=... with body { answers: [{ questionId, optionIndex }] }",
        params: parsed.params,
      }, { status: 400 });
    }

    const { input, askingPrice } = parsed;

    // Parse renovation answers from body
    const body = await request.json().catch(() => ({}));
    const answers = Array.isArray(body?.answers) ? body.answers : [];

    const renovation = answers.length > 0
      ? buildRenovationFromAnswers(answers, input.flatType)
      : null;

    const result = await runPipeline(input, askingPrice, renovation);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
