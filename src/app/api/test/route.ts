import { NextResponse } from "next/server";
import type { PropertyInput } from "@/types";
import { fetchResaleData } from "@/lib/hdb-api";
import { tierComparables } from "@/lib/comparables";
import { applyAdjustments, calculateRemainingLease } from "@/lib/adjustments";
import { calculateOffers, calculateMarketContext } from "@/lib/offer-calculator";
import { calculateCostBreakdown, calculateBsd } from "@/lib/cost-calculator";
import { assessRisks, generateChecklist } from "@/lib/risk-assessment";

// Sample property: 4-ROOM in TAMPINES
const SAMPLE_INPUT: PropertyInput = {
  town: "TAMPINES",
  flatType: "4 ROOM",
  streetName: "TAMPINES ST 21",
  block: "254",
  storeyRange: "07 TO 09",
  floorAreaSqm: 93,
  leaseCommenceDate: 1988,
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const step = url.searchParams.get("step") || "all";

  try {
    // Step 1: Test BSD calculator
    if (step === "bsd" || step === "all") {
      const bsd500k = calculateBsd(500_000);
      const bsd300k = calculateBsd(300_000);
      const bsd800k = calculateBsd(800_000);
      console.log("\n=== BSD Calculator ===");
      console.log(`$300k → BSD $${bsd300k} (expected: $4,200)`);
      console.log(`$500k → BSD $${bsd500k} (expected: $9,600)`);
      console.log(`$800k → BSD $${bsd800k} (expected: $18,600)`);

      if (step === "bsd") {
        return NextResponse.json({
          test: "BSD Calculator",
          results: {
            "$300k": { bsd: bsd300k, expected: 4200, pass: bsd300k === 4200 },
            "$500k": { bsd: bsd500k, expected: 9600, pass: bsd500k === 9600 },
            "$800k": { bsd: bsd800k, expected: 18600, pass: bsd800k === 18600 },
          },
        });
      }
    }

    // Step 2: Test remaining lease calculation
    if (step === "lease" || step === "all") {
      const lease1988 = calculateRemainingLease(1988);
      const lease2010 = calculateRemainingLease(2010);
      const lease1970 = calculateRemainingLease(1970);
      console.log("\n=== Remaining Lease ===");
      console.log(`1988 start → ~${lease1988.toFixed(1)} years remaining`);
      console.log(`2010 start → ~${lease2010.toFixed(1)} years remaining`);
      console.log(`1970 start → ~${lease1970.toFixed(1)} years remaining`);

      if (step === "lease") {
        return NextResponse.json({
          test: "Remaining Lease",
          results: { lease1988, lease2010, lease1970 },
        });
      }
    }

    // Step 3: Test API fetch
    if (step === "api" || step === "all") {
      console.log("\n=== Fetching data.gov.sg ===");
      console.log(`Fetching ${SAMPLE_INPUT.town} / ${SAMPLE_INPUT.flatType}...`);
      const transactions = await fetchResaleData(SAMPLE_INPUT.town, SAMPLE_INPUT.flatType);
      console.log(`Fetched ${transactions.length} transactions`);

      if (transactions.length > 0) {
        const sample = transactions[0];
        console.log("Sample record:", JSON.stringify(sample, null, 2));
      }

      if (step === "api") {
        return NextResponse.json({
          test: "API Fetch",
          totalTransactions: transactions.length,
          sampleRecord: transactions[0] || null,
          dateRange: {
            earliest: transactions[transactions.length - 1]?.month,
            latest: transactions[0]?.month,
          },
        });
      }
    }

    // Step 4: Test comp tiering
    if (step === "comps" || step === "all") {
      const transactions = await fetchResaleData(SAMPLE_INPUT.town, SAMPLE_INPUT.flatType);
      const { tier1, tier2, tier3 } = tierComparables(transactions, SAMPLE_INPUT);
      console.log("\n=== Comp Tiering ===");
      console.log(`Tier 1 (same street): ${tier1.length}`);
      console.log(`Tier 2 (same area):   ${tier2.length}`);
      console.log(`Tier 3 (town-wide):   ${tier3.length}`);

      if (step === "comps") {
        return NextResponse.json({
          test: "Comp Tiering",
          input: SAMPLE_INPUT,
          tier1Count: tier1.length,
          tier2Count: tier2.length,
          tier3Count: tier3.length,
          tier1Sample: tier1.slice(0, 5),
          tier2Sample: tier2.slice(0, 5),
        });
      }
    }

    // Step 5: Full pipeline
    if (step === "all" || step === "full") {
      const transactions = await fetchResaleData(SAMPLE_INPUT.town, SAMPLE_INPUT.flatType);
      const { tier1, tier2, tier3 } = tierComparables(transactions, SAMPLE_INPUT);

      const adjTier1 = applyAdjustments(tier1.map((t) => ({ ...t, tier: 1 as const })), SAMPLE_INPUT);
      const adjTier2 = applyAdjustments(tier2.map((t) => ({ ...t, tier: 2 as const })), SAMPLE_INPUT);
      const adjTier3 = applyAdjustments(tier3.map((t) => ({ ...t, tier: 3 as const })), SAMPLE_INPUT);

      const marketContext = calculateMarketContext(transactions, SAMPLE_INPUT);
      const offer = calculateOffers(adjTier1, adjTier2, adjTier3, SAMPLE_INPUT, marketContext);
      const costs = {
        atLow: calculateCostBreakdown(offer.low, SAMPLE_INPUT.flatType),
        atMid: calculateCostBreakdown(offer.mid, SAMPLE_INPUT.flatType),
        atMax: calculateCostBreakdown(offer.max, SAMPLE_INPUT.flatType),
      };
      const risks = assessRisks(SAMPLE_INPUT, { tier1: adjTier1, tier2: adjTier2, tier3: adjTier3 }, marketContext);
      const checklist = generateChecklist(SAMPLE_INPUT, risks, marketContext);

      console.log("\n=== Full Pipeline ===");
      console.log(`Market median: $${marketContext.medianPrice.toLocaleString()} ($${marketContext.medianPsf.toFixed(0)} psf)`);
      console.log(`Trend: ${marketContext.trendDirection} ${marketContext.trendPercentage.toFixed(1)}%`);
      console.log(`Offer: LOW $${offer.low.toLocaleString()} | MID $${offer.mid.toLocaleString()} | MAX $${offer.max.toLocaleString()}`);
      console.log(`Risks: ${risks.length} flags`);

      return NextResponse.json({
        test: "Full Pipeline",
        input: SAMPLE_INPUT,
        compCounts: {
          tier1: adjTier1.length,
          tier2: adjTier2.length,
          tier3: adjTier3.length,
          total: transactions.length,
        },
        marketContext,
        offer,
        costs,
        risks,
        checklist,
      });
    }

    return NextResponse.json({ error: "Unknown step. Use: bsd, lease, api, comps, full, or all" });
  } catch (err) {
    console.error("Test error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined },
      { status: 500 },
    );
  }
}
