import type { CostBreakdown } from "@/types";

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
      low: formatRange(atLow.legalFees.low, atLow.legalFees.high),
      mid: formatRange(atMid.legalFees.low, atMid.legalFees.high),
      max: formatRange(atMax.legalFees.low, atMax.legalFees.high),
    },
  ];

  const transactionTotalLow = atLow.purchasePrice + atLow.bsd + atLow.legalFees.low;
  const transactionTotalMid = atMid.purchasePrice + atMid.bsd + atMid.legalFees.low;
  const transactionTotalMax = atMax.purchasePrice + atMax.bsd + atMax.legalFees.low;

  const transactionTotalHighLow = atLow.purchasePrice + atLow.bsd + atLow.legalFees.high;
  const transactionTotalHighMid = atMid.purchasePrice + atMid.bsd + atMid.legalFees.high;
  const transactionTotalHighMax = atMax.purchasePrice + atMax.bsd + atMax.legalFees.high;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Cost Breakdown</h3>
      <p className="mt-1 text-sm text-slate">
        Transaction costs at each offer level (excluding agent commission)
      </p>

      <div className="mt-5 overflow-x-auto">
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
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-amber">
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
                {formatRange(transactionTotalLow, transactionTotalHighLow)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-charcoal">
                {formatRange(transactionTotalMid, transactionTotalHighMid)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-charcoal">
                {formatRange(transactionTotalMax, transactionTotalHighMax)}
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
              {formatRange(atMid.totalLow, atMid.totalHigh)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
