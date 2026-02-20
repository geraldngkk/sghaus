import type {
  PropertyInput,
  TieredComparable,
  MarketContext,
  RiskFlag,
  ChecklistItem,
} from "@/types";
import {
  LEASE_FULL_ELIGIBILITY_YEARS,
  LEASE_WARNING_YEARS,
  LEASE_CRITICAL_YEARS,
  BTO_HEAVY_TOWNS,
} from "./constants";
import { calculateRemainingLease } from "./adjustments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Risk assessment
// ---------------------------------------------------------------------------

export function assessRisks(
  input: PropertyInput,
  comps: {
    tier1: TieredComparable[];
    tier2: TieredComparable[];
    tier3: TieredComparable[];
  },
  marketContext: MarketContext,
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const remainingLease = calculateRemainingLease(input.leaseCommenceDate);

  // 1. Remaining lease risk
  if (remainingLease < LEASE_CRITICAL_YEARS) {
    flags.push({
      id: "lease-critical",
      title: "Very Short Remaining Lease",
      severity: "critical",
      description: `Only ~${Math.round(remainingLease)} years remaining on a 99-year lease.`,
      detail:
        "CPF usage will be severely restricted. HDB loan LTV will be significantly pro-rated. " +
        "Banks may refuse loans if the lease ends before the borrower turns 95. " +
        "Resale will be very difficult — your buyer pool shrinks drastically.",
    });
  } else if (remainingLease < LEASE_WARNING_YEARS) {
    flags.push({
      id: "lease-high",
      title: "Short Remaining Lease",
      severity: "high",
      description: `~${Math.round(remainingLease)} years remaining — below the 70-year full eligibility threshold.`,
      detail:
        "CPF usage and HDB loan quantum are pro-rated based on remaining lease vs. buyer's age. " +
        "Your future buyers will face the same restrictions, affecting resale value. " +
        "Factor in faster depreciation when considering holding period.",
    });
  } else if (remainingLease < LEASE_FULL_ELIGIBILITY_YEARS) {
    flags.push({
      id: "lease-medium",
      title: "Lease Approaching Threshold",
      severity: "medium",
      description: `~${Math.round(remainingLease)} years remaining.`,
      detail:
        "Currently eligible for full CPF usage and HDB loans, but approaching the 70-year threshold. " +
        "If you hold for 10+ years, your future buyers will face pro-rated financing. " +
        "Consider your planned holding period carefully.",
    });
  }

  // 2. Price trend risk
  if (
    marketContext.trendDirection === "down" &&
    marketContext.trendPercentage < -2
  ) {
    flags.push({
      id: "price-declining",
      title: "Declining Price Trend",
      severity: "medium",
      description: `Prices in ${input.town} are down ${Math.abs(marketContext.trendPercentage).toFixed(1)}% year-on-year.`,
      detail:
        "The market in this area is softening. You may be able to negotiate harder or wait for better pricing. " +
        "However, timing the market is inherently risky — if you need to buy now, negotiate accordingly.",
    });
  }

  // 3. BTO supply pressure
  if (BTO_HEAVY_TOWNS.includes(input.town)) {
    flags.push({
      id: "bto-supply",
      title: "BTO Supply Pressure",
      severity: "medium",
      description: `${input.town} has significant upcoming BTO supply (2025–2027).`,
      detail:
        "Over 55,000 BTO flats are launching 2025–2027 across Singapore. " +
        "Towns with heavy BTO supply may see resale price pressure as new flats reach MOP in 4–5 years. " +
        "This could limit your appreciation potential.",
    });
  }

  // 4. Comp scarcity
  if (comps.tier1.length < 3 && comps.tier2.length < 5) {
    flags.push({
      id: "comp-scarcity",
      title: "Limited Comparable Data",
      severity: "medium",
      description: `Only ${comps.tier1.length} direct comps and ${comps.tier2.length} area comps found.`,
      detail:
        "With few comparable transactions, the offer calculation has wider uncertainty. " +
        "Consider broadening your search, viewing more units, or consulting a property agent for local insight.",
    });
  }

  // 5. Above town median
  const compPsf =
    comps.tier1.length > 0
      ? median(comps.tier1.map((c) => c.adjustedPricePsf))
      : comps.tier2.length > 0
        ? median(comps.tier2.map((c) => c.adjustedPricePsf))
        : 0;

  if (compPsf > 0 && marketContext.medianPsf > 0 && compPsf > marketContext.medianPsf * 1.15) {
    flags.push({
      id: "above-median",
      title: "Above Town Median",
      severity: "low",
      description: `Estimated PSF is ${((compPsf / marketContext.medianPsf - 1) * 100).toFixed(0)}% above the ${input.town} median.`,
      detail:
        "This premium may be justified by floor level, remaining lease, flat model, or micro-location. " +
        "Verify the premium is warranted by checking the comparable details.",
    });
  }

  return flags;
}

// ---------------------------------------------------------------------------
// Buy/Don't-Buy checklist
// ---------------------------------------------------------------------------

export function generateChecklist(
  input: PropertyInput,
  risks: RiskFlag[],
  marketContext: MarketContext,
): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const remainingLease = calculateRemainingLease(input.leaseCommenceDate);

  // Lease assessment
  if (remainingLease >= LEASE_FULL_ELIGIBILITY_YEARS) {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "positive",
      detail: `~${Math.round(remainingLease)} years remaining — full CPF usage and HDB loan eligibility.`,
    });
  } else if (remainingLease >= LEASE_WARNING_YEARS) {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "neutral",
      detail: `~${Math.round(remainingLease)} years remaining — CPF and loan may be pro-rated. Check with CPF Board.`,
    });
  } else {
    items.push({
      category: "Financing",
      question: "Is the remaining lease sufficient for full CPF and loan eligibility?",
      assessment: "negative",
      detail: `~${Math.round(remainingLease)} years remaining — significant financing restrictions. May require more cash.`,
    });
  }

  // Price trend
  if (marketContext.trendDirection === "up") {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "positive",
      detail: `Prices up ${marketContext.trendPercentage.toFixed(1)}% YoY — market momentum is positive.`,
    });
  } else if (marketContext.trendDirection === "flat") {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "neutral",
      detail: "Prices relatively flat YoY — stable market, no strong momentum either way.",
    });
  } else {
    items.push({
      category: "Market",
      question: "Is the price trend in this town favourable?",
      assessment: "negative",
      detail: `Prices down ${Math.abs(marketContext.trendPercentage).toFixed(1)}% YoY — negotiate harder or consider waiting.`,
    });
  }

  // Transaction volume
  if (marketContext.transactionCount12m >= 20) {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "positive",
      detail: `${marketContext.transactionCount12m} transactions in the last 12 months — good liquidity.`,
    });
  } else if (marketContext.transactionCount12m >= 5) {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "neutral",
      detail: `${marketContext.transactionCount12m} transactions in the last 12 months — moderate liquidity.`,
    });
  } else {
    items.push({
      category: "Liquidity",
      question: "Is there sufficient transaction volume for reliable pricing?",
      assessment: "negative",
      detail: `Only ${marketContext.transactionCount12m} transactions in the last 12 months — low liquidity, pricing uncertain.`,
    });
  }

  // BTO pressure
  if (BTO_HEAVY_TOWNS.includes(input.town)) {
    items.push({
      category: "Supply",
      question: "Is there upcoming BTO supply that could affect prices?",
      assessment: "negative",
      detail: `${input.town} has significant BTO launches planned for 2025–2027. Future supply may cap appreciation.`,
    });
  } else {
    items.push({
      category: "Supply",
      question: "Is there upcoming BTO supply that could affect prices?",
      assessment: "positive",
      detail: `No major BTO supply pressure in ${input.town} — limited new supply supports resale values.`,
    });
  }

  // Risk summary
  const criticalRisks = risks.filter((r) => r.severity === "critical").length;
  const highRisks = risks.filter((r) => r.severity === "high").length;

  if (criticalRisks > 0) {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "negative",
      detail: `${criticalRisks} critical risk(s) identified — review carefully before proceeding.`,
    });
  } else if (highRisks > 0) {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "neutral",
      detail: `${highRisks} high-severity risk(s) — manageable but factor into your decision.`,
    });
  } else {
    items.push({
      category: "Risk",
      question: "Are there any critical risk flags?",
      assessment: "positive",
      detail: "No critical or high-severity risks identified.",
    });
  }

  return items;
}
