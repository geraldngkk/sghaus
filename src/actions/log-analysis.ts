"use server";

import type { AnalysisResult } from "@/types";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

/**
 * Log a completed analysis to Google Sheets (fire-and-forget).
 * Runs server-side after every successful analysis.
 * Never blocks or fails the user-facing response.
 */
export async function logAnalysis(result: AnalysisResult): Promise<void> {
  if (!GOOGLE_SCRIPT_URL) {
    console.log("[log-analysis] GOOGLE_SCRIPT_URL not set, skipping.");
    return;
  }

  try {
    const reno = result.renovation;
    const offer = result.offerWithReno ?? result.offer;
    const mrt = result.mrtProximity;

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "analysis",
        timestamp: result.generatedAt,
        // Property details
        town: result.input.town,
        flatType: result.input.flatType,
        streetName: result.input.streetName,
        block: result.input.block,
        storeyRange: result.input.storeyRange,
        floorAreaSqm: result.input.floorAreaSqm,
        leaseCommenceDate: result.input.leaseCommenceDate,
        // Offer strategy
        offerLow: offer.low,
        offerMid: offer.mid,
        offerMax: offer.max,
        offerLowPsf: Math.round(offer.lowPsf),
        offerMidPsf: Math.round(offer.midPsf),
        offerMaxPsf: Math.round(offer.maxPsf),
        // Comparable data
        tier1Count: result.comps.tier1.length,
        tier2Count: result.comps.tier2.length,
        tier3Count: result.comps.tier3.length,
        totalRecords: result.comps.totalRecordsFetched,
        // Market context
        medianPsf: Math.round(result.marketContext.medianPsf),
        trendDirection: result.marketContext.trendDirection,
        trendPercent: result.marketContext.trendPercentage.toFixed(1),
        transactionCount12m: result.marketContext.transactionCount12m,
        // MRT proximity (if available)
        mrtStation: mrt?.station.name ?? "",
        mrtDistance: mrt?.distanceMeters ?? "",
        mrtPremiumTier: mrt?.premiumTier ?? "",
        // Renovation (if assessed)
        renoCondition: reno?.condition ?? "",
        renoScore: reno?.overallScore ?? "",
        renoCostLow: reno?.estimatedCost.low ?? "",
        renoCostHigh: reno?.estimatedCost.high ?? "",
        renoAdjustPercent: reno
          ? (reno.priceAdjustmentPercent * 100).toFixed(1)
          : "",
        // Risk summary
        riskCount: result.risks.length,
        highRisks: result.risks
          .filter((r) => r.severity === "high" || r.severity === "critical")
          .map((r) => r.title)
          .join("; "),
      }),
    });
  } catch (err) {
    // Never fail the analysis — logging is best-effort
    console.log("[log-analysis] Failed to log:", err);
  }
}
