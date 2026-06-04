import type { MarketContext, NearbyTransaction } from "@/types";
import { SQM_TO_SQFT } from "@/lib/constants";
import CountUp from "@/components/count-up";

interface MarketContextDisplayProps {
  context: MarketContext;
  town: string;
  flatType: string;
  nearbyTransactions?: NearbyTransaction[];
}

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

function TransactionRow({ txn, highlighted }: { txn: NearbyTransaction; highlighted: boolean }) {
  return (
    <tr className={highlighted ? "bg-mist/30" : "hover:bg-fog"}>
      <td className="px-2 py-1.5 text-slate">{txn.month}</td>
      <td className="px-2 py-1.5 text-charcoal">{txn.block}</td>
      <td className="px-2 py-1.5 text-slate">{txn.storeyRange}</td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate">
        {Math.round(txn.floorAreaSqm * SQM_TO_SQFT).toLocaleString()}
      </td>
      <td className="px-2 py-1.5 text-right font-medium tabular-nums text-charcoal">
        {formatPrice(txn.resalePrice)}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-slate">
        ${txn.pricePsf.toFixed(0)}
      </td>
    </tr>
  );
}

export default function MarketContextDisplay({
  context,
  town,
  flatType,
  nearbyTransactions,
}: MarketContextDisplayProps) {
  const trendColor =
    context.trendDirection === "up"
      ? "text-forest"
      : context.trendDirection === "down"
        ? "text-error"
        : "text-slate";

  const trendArrow =
    context.trendDirection === "up"
      ? "\u2191"
      : context.trendDirection === "down"
        ? "\u2193"
        : "\u2192";

  const sameBlock = nearbyTransactions?.filter((t) => t.isSameBlock) ?? [];
  const neighbouring = nearbyTransactions?.filter((t) => !t.isSameBlock) ?? [];
  const hasNearby = sameBlock.length > 0 || neighbouring.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Market Context</h3>
      <p className="mt-1 text-sm text-slate">
        {flatType} flats in {town}, last 12 months
      </p>

      <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Median Price</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            <CountUp value={context.medianPrice} prefix="$" />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Median PSF</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            <CountUp value={context.medianPsf} prefix="$" />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">Transactions</div>
          <div className="mt-1 price-display text-xl text-charcoal">
            <CountUp value={context.transactionCount12m} />
          </div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">YoY Trend</div>
          <div className={`mt-1 price-display text-xl ${trendColor}`}>
            {trendArrow}{" "}
            <CountUp value={Math.abs(context.trendPercentage)} decimals={1} suffix="%" />
          </div>
        </div>
      </div>

      {/* Nearby Transactions */}
      {nearbyTransactions !== undefined && (
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="text-sm font-semibold text-charcoal">
            Nearby Transactions
          </h4>
          <p className="mt-0.5 text-xs text-slate">
            Same era, similar size, last 36 months
          </p>

          {!hasNearby ? (
            <p className="mt-4 text-sm text-slate">
              No comparable transactions found for nearby blocks built in the same period.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-2 text-left font-medium text-slate">Month</th>
                    <th className="px-2 py-2 text-left font-medium text-slate">Block</th>
                    <th className="px-2 py-2 text-left font-medium text-slate">Storey</th>
                    <th className="px-2 py-2 text-right font-medium text-slate">Area (sqft)</th>
                    <th className="px-2 py-2 text-right font-medium text-slate">Price</th>
                    <th className="px-2 py-2 text-right font-medium text-slate">PSF</th>
                  </tr>
                </thead>
                <tbody>
                  {sameBlock.length > 0 && (
                    <>
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-forest"
                        >
                          Same block
                        </td>
                      </tr>
                      {sameBlock.map((txn) => (
                        <TransactionRow key={txn.id} txn={txn} highlighted />
                      ))}
                    </>
                  )}
                  {neighbouring.length > 0 && (
                    <>
                      {sameBlock.length > 0 && (
                        <tr>
                          <td colSpan={6} className="py-1">
                            <div className="border-t border-border" />
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={6}
                          className="px-2 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate"
                        >
                          Neighbouring blocks
                        </td>
                      </tr>
                      {neighbouring.map((txn) => (
                        <TransactionRow key={txn.id} txn={txn} highlighted={false} />
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
