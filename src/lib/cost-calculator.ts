import type { CostBreakdown } from "@/types";
import {
  BSD_BRACKETS,
  LEGAL_FEES,
  RENOVATION_ESTIMATES,
  AGENT_COMMISSION_RATE,
} from "./constants";

/**
 * Calculate Buyer's Stamp Duty (BSD) for a given purchase price.
 * Uses progressive brackets from 15 Feb 2023.
 *
 * Example: $500,000 flat
 *   1% × $180,000 = $1,800
 *   2% × $180,000 = $3,600
 *   3% × $140,000 = $4,200
 *   Total = $9,600
 */
export function calculateBsd(price: number): number {
  let remaining = price;
  let bsd = 0;

  for (const bracket of BSD_BRACKETS) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, bracket.threshold);
    bsd += taxable * bracket.rate;
    remaining -= taxable;
  }

  return Math.floor(bsd);
}

/**
 * Calculate full cost breakdown at a given purchase price.
 */
export function calculateCostBreakdown(
  price: number,
  flatType: string,
  includeAgentCommission: boolean = false,
): CostBreakdown {
  const bsd = calculateBsd(price);
  const legal = LEGAL_FEES;
  const reno = RENOVATION_ESTIMATES[flatType] ?? { low: 30_000, high: 60_000 };
  const agent = includeAgentCommission
    ? Math.round(price * AGENT_COMMISSION_RATE)
    : 0;

  return {
    purchasePrice: price,
    bsd,
    legalFees: legal,
    renovationEstimate: reno,
    agentCommission: agent,
    totalLow: price + bsd + legal.low + reno.low + agent,
    totalHigh: price + bsd + legal.high + reno.high + agent,
  };
}
