"use client";

import type { AnalysisResult } from "@/types";
import type { SavedAnalysis } from "@/lib/storage";
import { SQM_TO_SQFT } from "@/lib/constants";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

function formatPsf(value: number): string {
  return `$${value.toFixed(0)}`;
}

interface ComparisonProps {
  analyses: SavedAnalysis[];
  onClose: () => void;
}

type CellHighlight = "best" | "worst" | "neutral";

function highlight(values: number[], index: number, lowerIsBetter: boolean): CellHighlight {
  if (values.length < 2) return "neutral";
  const sorted = [...values].sort((a, b) => a - b);
  const val = values[index];
  if (lowerIsBetter) {
    if (val === sorted[0]) return "best";
    if (val === sorted[sorted.length - 1]) return "worst";
  } else {
    if (val === sorted[sorted.length - 1]) return "best";
    if (val === sorted[0]) return "worst";
  }
  return "neutral";
}

function highlightClass(h: CellHighlight): string {
  if (h === "best") return "text-forest font-semibold";
  if (h === "worst") return "text-[#EF4444]/80";
  return "text-charcoal";
}

function CompRow({
  label,
  values,
  highlights,
  sublabel,
}: {
  label: string;
  values: string[];
  highlights?: CellHighlight[];
  sublabel?: string;
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="px-3 py-3 text-sm text-charcoal">
        {label}
        {sublabel && <span className="block text-[10px] text-slate">{sublabel}</span>}
      </td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`px-3 py-3 text-right text-sm ${
            highlights ? highlightClass(highlights[i]) : "text-charcoal"
          }`}
        >
          {v}
        </td>
      ))}
    </tr>
  );
}

function SectionHeader({ title, colCount }: { title: string; colCount: number }) {
  return (
    <tr className="bg-fog/60">
      <td
        colSpan={colCount + 1}
        className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-forest"
      >
        {title}
      </td>
    </tr>
  );
}

export default function PropertyComparison({ analyses, onClose }: ComparisonProps) {
  const count = analyses.length;
  const results = analyses.map((a) => a.result);
  const colCount = count;

  // Extract values for highlighting
  const midPrices = results.map((r) => r.offer.mid);
  const midPsfs = results.map((r) => r.offer.midPsf);
  const leaseYears = results.map((r) => {
    const currentYear = new Date().getFullYear();
    return 99 - (currentYear - r.input.leaseCommenceDate);
  });
  const riskCounts = results.map((r) => r.risks.length);
  const totalCosts = results.map((r) => r.costs.atMid.totalLow);
  const trendPcts = results.map((r) => r.marketContext.trendPercentage);

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-forest">
            Property Comparison
          </p>
          <h2 className="mt-1 font-display text-2xl text-charcoal">
            Side-by-side analysis
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-[10px] border-2 border-border px-4 py-2 text-sm font-semibold text-slate transition-colors hover:border-charcoal hover:text-charcoal"
        >
          Close Comparison
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">
                Criteria
              </th>
              {analyses.map((a, i) => (
                <th key={a.id} className="px-3 py-3 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                    Property {String.fromCharCode(65 + i)}
                  </div>
                  <div className="mt-0.5 text-[10px] font-normal text-slate truncate max-w-[160px] ml-auto">
                    {a.result.input.streetName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Property Details */}
            <SectionHeader title="Property Details" colCount={colCount} />
            <CompRow
              label="Town"
              values={results.map((r) => r.input.town)}
            />
            <CompRow
              label="Flat Type"
              values={results.map((r) => r.input.flatType)}
            />
            <CompRow
              label="Floor"
              values={results.map((r) => r.input.storeyRange)}
            />
            <CompRow
              label="Area"
              values={results.map((r) => `${Math.round(r.input.floorAreaSqm * SQM_TO_SQFT)} sq ft`)}
            />
            <CompRow
              label="Remaining Lease"
              sublabel="More years = better"
              values={leaseYears.map((y) => `~${y} years`)}
              highlights={leaseYears.map((_, i) => highlight(leaseYears, i, false))}
            />

            {/* Offer Strategy */}
            <SectionHeader title="Offer Strategy" colCount={colCount} />
            <CompRow
              label="Opening Bid"
              sublabel="Low"
              values={results.map((r) => formatPrice(r.offer.low))}
              highlights={results.map((_, i) =>
                highlight(
                  results.map((r) => r.offer.low),
                  i,
                  true
                )
              )}
            />
            <CompRow
              label="Target Price"
              sublabel="Recommended"
              values={results.map((r) => formatPrice(r.offer.mid))}
              highlights={midPrices.map((_, i) => highlight(midPrices, i, true))}
            />
            <CompRow
              label="Hard Ceiling"
              sublabel="Max"
              values={results.map((r) => formatPrice(r.offer.max))}
              highlights={results.map((_, i) =>
                highlight(
                  results.map((r) => r.offer.max),
                  i,
                  true
                )
              )}
            />
            <CompRow
              label="Target PSF"
              sublabel="Lower = better value"
              values={results.map((r) => `${formatPsf(r.offer.midPsf)} psf`)}
              highlights={midPsfs.map((_, i) => highlight(midPsfs, i, true))}
            />

            {/* Costs */}
            <SectionHeader title="Total Costs (at Target)" colCount={colCount} />
            <CompRow
              label="Purchase + BSD"
              values={results.map(
                (r) =>
                  formatPrice(r.costs.atMid.purchasePrice + r.costs.atMid.bsd)
              )}
            />
            <CompRow
              label="Renovation Est."
              values={results.map(
                (r) =>
                  `${formatPrice(r.costs.atMid.renovationEstimate.low)} – ${formatPrice(
                    r.costs.atMid.renovationEstimate.high
                  )}`
              )}
            />
            <CompRow
              label="All-In Total"
              sublabel="Lower = less outlay"
              values={totalCosts.map(formatPrice)}
              highlights={totalCosts.map((_, i) => highlight(totalCosts, i, true))}
            />

            {/* Market */}
            <SectionHeader title="Market" colCount={colCount} />
            <CompRow
              label="Median PSF (Town)"
              values={results.map((r) => `${formatPsf(r.marketContext.medianPsf)} psf`)}
            />
            <CompRow
              label="Transactions (12m)"
              sublabel="More = higher liquidity"
              values={results.map((r) =>
                r.marketContext.transactionCount12m.toLocaleString()
              )}
              highlights={results.map((_, i) =>
                highlight(
                  results.map((r) => r.marketContext.transactionCount12m),
                  i,
                  false
                )
              )}
            />
            <CompRow
              label="YoY Trend"
              sublabel="Up = appreciating"
              values={trendPcts.map(
                (p) => `${p >= 0 ? "+" : ""}${p.toFixed(1)}%`
              )}
              highlights={trendPcts.map((_, i) => highlight(trendPcts, i, false))}
            />

            {/* Risk */}
            <SectionHeader title="Risk Assessment" colCount={colCount} />
            <CompRow
              label="Total Risk Flags"
              sublabel="Fewer = safer"
              values={riskCounts.map((c) => `${c} flag${c !== 1 ? "s" : ""}`)}
              highlights={riskCounts.map((_, i) => highlight(riskCounts, i, true))}
            />
            <CompRow
              label="Top Risk"
              values={results.map((r) =>
                r.risks.length > 0
                  ? `${r.risks[0].severity.toUpperCase()}: ${r.risks[0].title}`
                  : "None"
              )}
            />

            {/* Checklist Summary */}
            <SectionHeader title="Decision Summary" colCount={colCount} />
            <CompRow
              label="Positive Signals"
              sublabel="More = better"
              values={results.map((r) => {
                const pos = r.checklist.filter((c) => c.assessment === "positive").length;
                return `${pos} of ${r.checklist.length}`;
              })}
              highlights={results.map((_, i) =>
                highlight(
                  results.map(
                    (r) => r.checklist.filter((c) => c.assessment === "positive").length
                  ),
                  i,
                  false
                )
              )}
            />
            <CompRow
              label="Negative Signals"
              sublabel="Fewer = safer"
              values={results.map((r) => {
                const neg = r.checklist.filter((c) => c.assessment === "negative").length;
                return `${neg} of ${r.checklist.length}`;
              })}
              highlights={results.map((_, i) =>
                highlight(
                  results.map(
                    (r) => r.checklist.filter((c) => c.assessment === "negative").length
                  ),
                  i,
                  true
                )
              )}
            />
          </tbody>
        </table>
      </div>

      {/* Walk-away triggers */}
      <div className="mt-6">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate">
          Walk-Away Triggers
        </h4>
        <div className={`mt-3 grid grid-cols-1 gap-4 sm:grid-cols-${count}`}>
          {analyses.map((a, i) => (
            <div key={a.id} className="rounded-xl border border-border p-3">
              <p className="text-xs font-semibold text-charcoal">
                Property {String.fromCharCode(65 + i)}
              </p>
              {a.result.offer.walkAwayTriggers.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {a.result.offer.walkAwayTriggers.map((t, j) => (
                    <li key={j} className="text-xs text-[#EF4444]/80">
                      &bull; {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-forest">No walk-away triggers</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
