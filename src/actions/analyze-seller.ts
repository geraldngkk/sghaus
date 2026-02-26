"use server";

import { analyzeProperty } from "./analyze";
import type { PropertyInput, AnalysisResult } from "@/types";
import type { RenovationAnswer } from "@/lib/renovation";

export interface SellerPricingResult {
  input: PropertyInput;
  generatedAt: string;

  // Seller's 3-tier pricing
  floorPrice: number; // Don't accept below this (= buyer's low)
  targetPrice: number; // Fair market value (= buyer's mid)
  openingAsk: number; // List at this price (= buyer's max)
  floorPsf: number;
  targetPsf: number;
  openingAskPsf: number;

  floorRationale: string;
  targetRationale: string;
  openingAskRationale: string;

  // Seller costs (deducted from sale price)
  sellerCosts: {
    agentCommission: number; // 2% of target price
    legalFees: number; // ~$1,000
    total: number;
  };

  // Net proceeds at each tier
  netProceeds: {
    atFloor: number;
    atTarget: number;
    atOpeningAsk: number;
  };

  // Reused from buyer analysis
  comps: AnalysisResult["comps"];
  marketContext: AnalysisResult["marketContext"];
  risks: AnalysisResult["risks"];
  dataSource?: AnalysisResult["dataSource"];
}

export async function analyzeForSeller(
  input: PropertyInput,
  renovationAnswers?: RenovationAnswer[],
): Promise<SellerPricingResult> {
  // Call the existing buyer analysis engine
  const result = await analyzeProperty(input, renovationAnswers);

  // Use renovation-adjusted offers if available, otherwise base offers
  const offer = result.offerWithReno ?? result.offer;

  const compCount =
    result.comps.tier1.length +
    result.comps.tier2.length +
    result.comps.tier3.length;

  const agentCommission = Math.round(offer.mid * 0.02);
  const legalFees = 1000;
  const totalSellerCosts = agentCommission + legalFees;

  return {
    input: result.input,
    generatedAt: result.generatedAt,

    floorPrice: offer.low,
    targetPrice: offer.mid,
    openingAsk: offer.max,
    floorPsf: offer.lowPsf,
    targetPsf: offer.midPsf,
    openingAskPsf: offer.maxPsf,

    floorRationale: `Floor price at $${offer.lowPsf.toFixed(0)} psf. This is where data-savvy buyers will anchor their opening bid. Don't accept offers at or below this level unless you need a quick sale.`,
    targetRationale: `Target price at $${offer.midPsf.toFixed(0)} psf. The median of ${compCount} comparable transactions. This is fair market value: what most similar flats actually sold for.`,
    openingAskRationale: `Opening ask at $${offer.maxPsf.toFixed(0)} psf. This is what above-average sellers achieved. List here and expect to negotiate down toward target.`,

    sellerCosts: {
      agentCommission,
      legalFees,
      total: totalSellerCosts,
    },

    netProceeds: {
      atFloor: offer.low - totalSellerCosts,
      atTarget: offer.mid - totalSellerCosts,
      atOpeningAsk: offer.max - totalSellerCosts,
    },

    comps: result.comps,
    marketContext: result.marketContext,
    risks: result.risks,
    dataSource: result.dataSource,
  };
}
