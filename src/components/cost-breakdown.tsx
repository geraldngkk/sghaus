"use client";

import { useState } from "react";
import type { CostBreakdown, LoanType } from "@/types";
import CountUp from "@/components/count-up";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

function formatRange(low: number, high: number): string {
  return `${formatPrice(low)} - ${formatPrice(high)}`;
}

interface CostBreakdownDisplayProps {
  atLow: CostBreakdown;
  atMid: CostBreakdown;
  atMax: CostBreakdown;
}

export default function CostBreakdownDisplay({
  atLow,
  atMid,
  atMax,
}: CostBreakdownDisplayProps) {
  const [loanType, setLoanType] = useState<LoanType>("bankLoan");

  // Old saved reports stored legalFees as { low, high } instead of { hdbLoan, bankLoan }
  const legalFee = (cb: CostBreakdown) => {
    const fees = cb.legalFees as Record<string, number>;
    if (loanType === "hdbLoan") return fees.hdbLoan ?? fees.low ?? 1_000;
    return fees.bankLoan ?? fees.high ?? 2_000;
  };

  const transactionRows = [
    {
      label: "Purchase Price",
      low: formatPrice(atLow.purchasePrice),
      mid: formatPrice(atMid.purchasePrice),
      max: formatPrice(atMax.purchasePrice),
    },
    {
      label: "Buyer's Stamp Duty",
      low: formatPrice(atLow.bsd),
      mid: formatPrice(atMid.bsd),
      max: formatPrice(atMax.bsd),
    },
    {
      label: "Legal & Conveyancing",
      low: formatPrice(legalFee(atLow)),
      mid: formatPrice(legalFee(atMid)),
      max: formatPrice(legalFee(atMax)),
    },
  ];

  const transactionTotalLow = atLow.purchasePrice + atLow.bsd + legalFee(atLow);
  const transactionTotalMid = atMid.purchasePrice + atMid.bsd + legalFee(atMid);
  const transactionTotalMax = atMax.purchasePrice + atMax.bsd + legalFee(atMax);

  const allInLowAtMid = transactionTotalMid + atMid.renovationEstimate.low;
  const allInHighAtMid = transactionTotalMid + atMid.renovationEstimate.high;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-display text-xl text-charcoal">Cost Breakdown</h3>
          <p className="mt-1 text-sm text-slate">
            Transaction costs at each offer level (excluding agent commission)
          </p>
        </div>

        {/* Loan Type Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-fog p-0.5">
          <button
            onClick={() => setLoanType("hdbLoan")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              loanType === "hdbLoan"
                ? "bg-white text-forest shadow-sm"
                : "text-slate hover:text-charcoal"
            }`}
          >
            HDB Loan
          </button>
          <button
            onClick={() => setLoanType("bankLoan")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              loanType === "bankLoan"
                ? "bg-white text-forest shadow-sm"
                : "text-slate hover:text-charcoal"
            }`}
          >
            Bank Loan
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate/70">
        Legal fees:{" "}
        {loanType === "hdbLoan"
          ? "$1,000 (HDB handles conveyancing in-house)"
          : "$2,000 (external solicitor required)"}
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate">
                Cost Item
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate">
                Opening Bid
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-forest">
                Target
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-amber-ink">
                Ceiling
              </th>
            </tr>
          </thead>
          <tbody>
            {transactionRows.map((row) => (
              <tr key={row.label} className="border-b border-border/50">
                <td className="px-3 py-2.5 text-charcoal">{row.label}</td>
                <td className="px-3 py-2.5 text-right text-slate">{row.low}</td>
                <td className="px-3 py-2.5 text-right text-slate">{row.mid}</td>
                <td className="px-3 py-2.5 text-right text-slate">{row.max}</td>
              </tr>
            ))}
            <tr className="border-b border-border bg-fog/50">
              <td className="px-3 py-2.5 font-semibold text-charcoal">Transaction Total</td>
              <td className="px-3 py-2.5 text-right font-semibold text-charcoal">
                {formatPrice(transactionTotalLow)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-charcoal">
                {formatPrice(transactionTotalMid)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-charcoal">
                {formatPrice(transactionTotalMax)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Renovation — standalone section */}
      <div className="mt-6 rounded-xl border border-amber/20 bg-amber-light/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-charcoal">Renovation Estimate</h4>
            <p className="mt-0.5 text-xs text-slate">
              Typical resale renovation cost for this flat type
            </p>
          </div>
          <div className="text-right">
            <div className="price-display text-lg text-charcoal">
              {formatRange(atMid.renovationEstimate.low, atMid.renovationEstimate.high)}
            </div>
          </div>
        </div>
      </div>

      {/* Grand total */}
      <div className="mt-4 rounded-xl border border-forest/20 bg-mist/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-forest">All-In Total (at Target Price)</h4>
            <p className="mt-0.5 text-xs text-slate">
              Transaction costs + renovation estimate
            </p>
          </div>
          <div className="text-right">
            <div className="price-display text-xl text-forest sm:text-2xl">
              <CountUp value={allInLowAtMid} prefix="$" />
              {" - "}
              <CountUp value={allInHighAtMid} prefix="$" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
