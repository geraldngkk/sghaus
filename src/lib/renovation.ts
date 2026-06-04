/**
 * Renovation Condition Assessment (V2)
 *
 * A series of questions the buyer answers after viewing a unit.
 * Each answer maps to a condition score and estimated renovation cost.
 * Costs are scaled by flat type (bigger flat = proportionally more work).
 *
 * The combined assessment produces a cost-based price adjustment:
 * if the unit needs MORE renovation than baseline expectation → lower offer;
 * if it needs LESS → higher offer (asymmetric: market doesn't fully reward).
 *
 * Changes from V1:
 * - Replaced "Overall Impression" (double-counted) with Aircon + Carpentry
 * - Costs calibrated to 2025-2026 market data
 * - Flat-type cost scaling (costs defined for 4-room, scaled for others)
 * - Cost-based price adjustment instead of arbitrary score→percentage
 * - Bathroom costs scale by number of bathrooms (1 for 2/3-room, 2 for 4+)
 */

import { RENOVATION_ESTIMATES } from "./constants";

export interface RenovationQuestion {
  id: string;
  category: string;
  question: string;
  options: RenovationOption[];
  /** If true, costs scale by bathroom count rather than general flat-type factor */
  scaleByBathrooms?: boolean;
}

export interface RenovationOption {
  label: string;
  description: string;
  score: number; // 0 = needs full replacement, 100 = perfect condition
  costImpact: { low: number; high: number }; // SGD estimated cost (for a 4-room flat)
}

export interface RenovationAnswer {
  questionId: string;
  selectedScore: number;
  selectedCostLow: number;
  selectedCostHigh: number;
}

export interface RenovationAssessment {
  overallScore: number; // 0-100
  condition: "move-in ready" | "light refresh" | "partial renovation" | "full renovation";
  estimatedCost: { low: number; high: number };
  estimatedCostBeforeScaling: { low: number; high: number };
  flatTypeUsed: string;
  costScaleFactor: number;
  priceAdjustmentPercent: number; // negative = discount, positive = premium
  priceAdjustmentDollar: number; // the dollar amount behind the percentage
  breakdown: {
    category: string;
    score: number;
    costLow: number;
    costHigh: number;
  }[];
}

// ---------------------------------------------------------------------------
// Flat-type cost scaling
//
// All question costs are defined for a standard 4-ROOM HDB (~93 sqm, 2 bath).
// Other flat types scale proportionally based on size and bathroom count.
// ---------------------------------------------------------------------------

/** General cost scale factor by flat type (relative to 4-room = 1.0) */
const FLAT_TYPE_COST_SCALE: Record<string, number> = {
  "2 ROOM": 0.55,
  "3 ROOM": 0.70,
  "4 ROOM": 1.00,
  "5 ROOM": 1.25,
  EXECUTIVE: 1.40,
};

/** Bathroom count by flat type (for bathroom-specific scaling) */
const BATHROOM_COUNT: Record<string, number> = {
  "2 ROOM": 1,
  "3 ROOM": 1,
  "4 ROOM": 2,
  "5 ROOM": 2,
  EXECUTIVE: 2,
};

/**
 * Approximate median resale price by flat type (2025-2026).
 * Used only to convert dollar adjustment → percentage. Doesn't need to be exact.
 */
const REFERENCE_PRICE: Record<string, number> = {
  "2 ROOM": 300_000,
  "3 ROOM": 400_000,
  "4 ROOM": 550_000,
  "5 ROOM": 650_000,
  EXECUTIVE: 750_000,
};

// ---------------------------------------------------------------------------
// Questions (8 categories, costs for a standard 4-room HDB)
//
// Sources calibrated against:
// - renovationcontractorsingapore.com 2026 cost guide
// - renomoji.com 2025-2026 resale guide
// - MoneySmart 2026 HDB renovation guide
// ---------------------------------------------------------------------------

export const RENOVATION_QUESTIONS: RenovationQuestion[] = [
  {
    id: "kitchen",
    category: "Kitchen",
    question: "What condition is the kitchen in?",
    options: [
      {
        label: "Excellent",
        description: "Modern fittings, clean countertops, working appliances, no visible wear",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Good",
        description: "Functional with minor wear,some marks or dated style but fully usable",
        score: 75,
        costImpact: { low: 2_000, high: 5_000 },
      },
      {
        label: "Needs updating",
        description: "Worn cabinets, old appliances, stained countertops,works but looks tired",
        score: 40,
        costImpact: { low: 8_000, high: 15_000 },
      },
      {
        label: "Needs full redo",
        description: "Broken fixtures, water damage, or completely outdated,gut and replace",
        score: 10,
        costImpact: { low: 15_000, high: 25_000 },
      },
    ],
  },
  {
    id: "bathroom",
    category: "Bathroom(s)",
    question: "What condition are the bathrooms in?",
    scaleByBathrooms: true,
    options: [
      {
        label: "Excellent",
        description: "Clean tiles, no leaks, modern fixtures, proper waterproofing",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Good",
        description: "Functional with minor wear,some discolouration or old-style fittings",
        score: 75,
        // Cost per bathroom: $1k-$2.5k × 2 bathrooms for 4-room
        costImpact: { low: 2_000, high: 5_000 },
      },
      {
        label: "Needs updating",
        description: "Stained grout, old fixtures, possible minor leaks,needs retiling and new fittings",
        score: 40,
        // $4k-$8k per bathroom × 2 for 4-room
        costImpact: { low: 8_000, high: 16_000 },
      },
      {
        label: "Needs full redo",
        description: "Cracked tiles, water damage, mould,full hack, waterproof, and retile",
        score: 10,
        // $8k-$14k per bathroom × 2 for 4-room
        costImpact: { low: 16_000, high: 28_000 },
      },
    ],
  },
  {
    id: "flooring",
    category: "Flooring",
    question: "What condition is the flooring throughout the unit?",
    options: [
      {
        label: "Excellent",
        description: "Clean, level, no chips or cracks,vinyl/tile/parquet in great shape",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Good",
        description: "Minor scuffs or wear marks but structurally sound",
        score: 75,
        costImpact: { low: 500, high: 2_000 },
      },
      {
        label: "Needs overlay",
        description: "Visible damage or outdated,can overlay with vinyl without hacking ($4-5/sqft)",
        score: 45,
        // ~1,000 sqft for 4-room at $4-5.50/sqft
        costImpact: { low: 4_000, high: 6_000 },
      },
      {
        label: "Needs hacking & retiling",
        description: "Cracked, uneven, or hollow tiles,must hack and re-tile ($7-10/sqft)",
        score: 10,
        // ~1,000 sqft for 4-room at $7-10/sqft
        costImpact: { low: 7_000, high: 12_000 },
      },
    ],
  },
  {
    id: "walls",
    category: "Walls & Ceiling",
    question: "What condition are the walls and ceiling?",
    options: [
      {
        label: "Excellent",
        description: "Clean paint, no cracks, no water stains, no peeling",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Needs repainting",
        description: "Faded, minor marks, or dated colour,just needs a fresh coat",
        score: 65,
        costImpact: { low: 1_500, high: 3_000 },
      },
      {
        label: "Minor repairs needed",
        description: "Hairline cracks, small water stains,patch, skim coat, and repaint",
        score: 35,
        costImpact: { low: 3_000, high: 6_000 },
      },
      {
        label: "Significant damage",
        description: "Large cracks, widespread water damage, mould, peeling plaster",
        score: 10,
        costImpact: { low: 5_000, high: 12_000 },
      },
    ],
  },
  {
    id: "electrical",
    category: "Electrical & Plumbing",
    question: "Do the electrical and plumbing systems work properly?",
    options: [
      {
        label: "All working",
        description: "Everything functions,no tripping, no flickering, good water pressure, no leaks",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Minor issues",
        description: "A few faulty switches, slow drains, or dated power points,easy fixes",
        score: 65,
        costImpact: { low: 1_000, high: 3_000 },
      },
      {
        label: "Partial rewiring/replumbing",
        description: "Some circuits trip frequently, uneven water pressure,targeted professional work",
        score: 30,
        costImpact: { low: 5_000, high: 10_000 },
      },
      {
        label: "Full rewiring & replumbing",
        description: "Old wiring (pre-2000), frequent tripping, poor pressure throughout,full overhaul",
        score: 10,
        costImpact: { low: 8_000, high: 18_000 },
      },
    ],
  },
  {
    id: "windows_doors",
    category: "Windows & Doors",
    question: "What condition are the windows and doors?",
    options: [
      {
        label: "Excellent",
        description: "Open/close smoothly, no drafts, locks work, good seals, grilles intact",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Minor issues",
        description: "Slightly stiff, minor scratches, some seals worn but functional",
        score: 70,
        costImpact: { low: 500, high: 1_500 },
      },
      {
        label: "Needs replacement",
        description: "Warped frames, broken locks, poor sealing,replace windows and grilles",
        score: 20,
        // Window + grille package for 4-room: $2.5k-$5k
        costImpact: { low: 2_500, high: 5_000 },
      },
    ],
  },
  {
    id: "aircon",
    category: "Air Conditioning",
    question: "What is the aircon situation?",
    options: [
      {
        label: "Working system",
        description: "Existing system (System 3/4) works well, recently serviced, good cooling",
        score: 100,
        costImpact: { low: 0, high: 500 },
      },
      {
        label: "Needs servicing/repair",
        description: "System exists but needs chemical wash, gas top-up, or minor repair",
        score: 65,
        costImpact: { low: 300, high: 1_200 },
      },
      {
        label: "Partial replacement",
        description: "Some units working, others need replacing,1-2 fan coil units",
        score: 35,
        costImpact: { low: 2_000, high: 4_000 },
      },
      {
        label: "No aircon / full replacement",
        description: "No system installed or entire system is old/broken,need new System 3/4",
        score: 5,
        // System 3-4 full install: $4.5k-$8k
        costImpact: { low: 4_500, high: 8_000 },
      },
    ],
  },
  {
    id: "carpentry",
    category: "Carpentry & Built-in",
    question: "What condition are the built-in wardrobes, cabinets, and storage?",
    options: [
      {
        label: "Excellent",
        description: "Good quality wardrobes, ample storage, modern design,keep as-is",
        score: 100,
        costImpact: { low: 0, high: 0 },
      },
      {
        label: "Functional but dated",
        description: "Wardrobes work but look old,cosmetic refresh or handle replacement",
        score: 65,
        costImpact: { low: 1_500, high: 4_000 },
      },
      {
        label: "Needs significant work",
        description: "Missing wardrobes in some rooms, damaged cabinets,need new built-ins",
        score: 30,
        costImpact: { low: 5_000, high: 12_000 },
      },
      {
        label: "No built-in / full replacement",
        description: "No wardrobes, no shoe cabinet, no storage,need full custom carpentry",
        score: 5,
        // Full carpentry for 4-room: $10k-$20k
        costImpact: { low: 10_000, high: 20_000 },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Category weights (sum to 1.0)
// ---------------------------------------------------------------------------

const CATEGORY_WEIGHTS: Record<string, number> = {
  kitchen: 0.18,
  bathroom: 0.18,
  flooring: 0.12,
  walls: 0.07,
  electrical: 0.14,
  windows_doors: 0.05,
  aircon: 0.13,
  carpentry: 0.13,
};

// ---------------------------------------------------------------------------
// Score → condition mapping (unchanged)
// ---------------------------------------------------------------------------

function scoreToCondition(
  score: number,
): RenovationAssessment["condition"] {
  if (score >= 80) return "move-in ready";
  if (score >= 55) return "light refresh";
  if (score >= 30) return "partial renovation";
  return "full renovation";
}

// ---------------------------------------------------------------------------
// Cost-based price adjustment
//
// Instead of mapping score→percentage, we derive the adjustment from
// actual renovation cost relative to baseline expectation.
//
// Logic:
// 1. Calculate estimated reno cost from questionnaire (scaled by flat type)
// 2. Compare to "condition baseline",the condition-driven portion of
//    what a typical buyer expects to spend (≈45% of total reno budget,
//    since the rest is personal preference / upgrade choices)
// 3. Delta > 0 (more reno needed) → reduce offer (55% pass-through)
//    Delta < 0 (less reno needed) → increase offer (35% pass-through)
//    Asymmetric because the market doesn't fully reward good condition.
// 4. Convert dollar adjustment to percentage using reference flat price
// ---------------------------------------------------------------------------

/** Fraction of baseline renovation budget that's condition-driven vs preference-driven */
const CONDITION_BASELINE_FRACTION = 0.45;

/** How much of the cost delta passes through to price adjustment */
const PASS_THROUGH_WORSE = 0.55; // unit needs more work than average
const PASS_THROUGH_BETTER = 0.35; // unit needs less work than average

function calculateCostBasedAdjustment(
  estimatedCostMid: number,
  flatType: string,
): { percent: number; dollar: number } {
  const baseline = RENOVATION_ESTIMATES[flatType] ?? RENOVATION_ESTIMATES["4 ROOM"];
  const baselineMid = (baseline.low + baseline.high) / 2;
  const conditionBaseline = baselineMid * CONDITION_BASELINE_FRACTION;

  const delta = estimatedCostMid - conditionBaseline;
  const passThrough = delta > 0 ? PASS_THROUGH_WORSE : PASS_THROUGH_BETTER;
  const dollarAdjustment = -(delta * passThrough);

  const refPrice = REFERENCE_PRICE[flatType] ?? REFERENCE_PRICE["4 ROOM"];
  const percentAdjustment = dollarAdjustment / refPrice;

  // Clamp to reasonable range: -10% to +4%
  const clamped = Math.max(-0.10, Math.min(0.04, percentAdjustment));

  return {
    percent: clamped,
    dollar: Math.round(clamped * refPrice),
  };
}

// ---------------------------------------------------------------------------
// Get cost scale factor for a flat type
// ---------------------------------------------------------------------------

function getCostScale(flatType: string, questionId: string): number {
  const generalScale = FLAT_TYPE_COST_SCALE[flatType] ?? 1.0;

  // Bathroom costs scale by bathroom count instead of general factor
  if (questionId === "bathroom") {
    const baseBathrooms = BATHROOM_COUNT["4 ROOM"]; // 2
    const flatBathrooms = BATHROOM_COUNT[flatType] ?? 2;
    return flatBathrooms / baseBathrooms;
  }

  return generalScale;
}

// ---------------------------------------------------------------------------
// Assessment calculator
// ---------------------------------------------------------------------------

export function assessRenovation(
  answers: RenovationAnswer[],
  flatType: string = "4 ROOM",
): RenovationAssessment {
  let weightedScore = 0;
  let totalWeight = 0;
  let rawCostLow = 0;
  let rawCostHigh = 0;
  let scaledCostLow = 0;
  let scaledCostHigh = 0;
  const breakdown: RenovationAssessment["breakdown"] = [];

  for (const answer of answers) {
    const weight = CATEGORY_WEIGHTS[answer.questionId] ?? 0.1;
    weightedScore += answer.selectedScore * weight;
    totalWeight += weight;

    const scale = getCostScale(flatType, answer.questionId);
    const costLow = Math.round(answer.selectedCostLow * scale);
    const costHigh = Math.round(answer.selectedCostHigh * scale);

    rawCostLow += answer.selectedCostLow;
    rawCostHigh += answer.selectedCostHigh;
    scaledCostLow += costLow;
    scaledCostHigh += costHigh;

    const question = RENOVATION_QUESTIONS.find((q) => q.id === answer.questionId);
    breakdown.push({
      category: question?.category ?? answer.questionId,
      score: answer.selectedScore,
      costLow,
      costHigh,
    });
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
  const condition = scoreToCondition(overallScore);

  const estimatedCostMid = (scaledCostLow + scaledCostHigh) / 2;
  const { percent, dollar } = calculateCostBasedAdjustment(estimatedCostMid, flatType);

  const costScale = FLAT_TYPE_COST_SCALE[flatType] ?? 1.0;

  return {
    overallScore,
    condition,
    estimatedCost: { low: scaledCostLow, high: scaledCostHigh },
    estimatedCostBeforeScaling: { low: rawCostLow, high: rawCostHigh },
    flatTypeUsed: flatType,
    costScaleFactor: costScale,
    priceAdjustmentPercent: percent,
    priceAdjustmentDollar: dollar,
    breakdown,
  };
}
