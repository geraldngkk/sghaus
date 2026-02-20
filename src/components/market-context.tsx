import type { MarketContext } from "@/types";

interface MarketContextDisplayProps {
  context: MarketContext;
  town: string;
  flatType: string;
}

export default function MarketContextDisplay({
  context,
  town,
  flatType,
}: MarketContextDisplayProps) {
  const trendColor =
    context.trendDirection === "up"
      ? "text-forest"
      : context.trendDirection === "down"
        ? "text-[#EF4444]"
        : "text-slate";

  const trendArrow =
    context.trendDirection === "up"
      ? "\u2191"
      : context.trendDirection === "down"
        ? "\u2193"
        : "\u2192";

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Market Context</h3>
      <p className="mt-1 text-sm text-slate">
        {flatType} flats in {town} — last 12 months
      </p>

      <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Median Price</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            ${context.medianPrice.toLocaleString("en-SG")}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Median PSF</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            ${context.medianPsf.toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Transactions</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            {context.transactionCount12m.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">YoY Trend</div>
          <div className={`mt-1 price-display text-xl ${trendColor}`}>
            {trendArrow} {Math.abs(context.trendPercentage).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
