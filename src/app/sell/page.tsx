"use client";

import { useState, useEffect, useRef } from "react";
import type { AnalysisResult } from "@/types";
import PropertyForm from "@/components/property-form";
import MarketContextDisplay from "@/components/market-context";
import RiskFlagsDisplay from "@/components/risk-flags";
import AnalysisSkeleton from "@/components/analysis-skeleton";
import EmailCapture from "@/components/email-capture";
import ShareReport from "@/components/share-report";
import TierPreview from "@/components/tier-preview";
import CountUp from "@/components/count-up";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { captureUtmParams, type UtmParams } from "@/lib/utm";

// ---------------------------------------------------------------------------
// Seller pricing derived from buyer analysis
// ---------------------------------------------------------------------------

interface SellerPricing {
  floorPrice: number;
  targetPrice: number;
  openingAsk: number;
  floorPsf: number;
  targetPsf: number;
  openingAskPsf: number;
  floorRationale: string;
  targetRationale: string;
  openingAskRationale: string;
  sellerCosts: {
    agentCommission: number;
    legalFees: number;
    total: number;
  };
  netProceeds: {
    atFloor: number;
    atTarget: number;
    atOpeningAsk: number;
  };
}

function deriveSellerPricing(result: AnalysisResult): SellerPricing {
  const offer = result.offerWithReno ?? result.offer;
  const compCount =
    result.comps.tier1.length +
    result.comps.tier2.length +
    result.comps.tier3.length;

  const agentCommission = Math.round(offer.mid * 0.02);
  const legalFees = 1000;
  const totalSellerCosts = agentCommission + legalFees;

  return {
    floorPrice: offer.low,
    targetPrice: offer.mid,
    openingAsk: offer.max,
    floorPsf: offer.lowPsf,
    targetPsf: offer.midPsf,
    openingAskPsf: offer.maxPsf,

    floorRationale: `Floor price at $${offer.lowPsf.toFixed(0)} psf. This is where data-savvy buyers will anchor their opening bid. Don\u2019t accept offers at or below this level unless you need a quick sale.`,
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
  };
}

// ---------------------------------------------------------------------------
// Helper formatters
// ---------------------------------------------------------------------------

function fmt(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

function fmtPsf(value: number): string {
  return `$${value.toFixed(0)} psf`;
}

// ---------------------------------------------------------------------------
// Seller pricing cards
// ---------------------------------------------------------------------------

interface SellerCardProps {
  label: string;
  sublabel: string;
  price: number;
  psf: number;
  rationale: string;
  variant: "floor" | "target" | "ask";
}

function SellerCard({ label, sublabel, price, psf, rationale, variant }: SellerCardProps) {
  const styles = {
    floor: {
      card: "border-border bg-white",
      price: "text-charcoal",
      tag: "bg-mist text-forest",
      accent: "bg-border",
    },
    target: {
      card: "border-forest/30 bg-forest/[0.03] ring-1 ring-forest/10",
      price: "text-forest",
      tag: "bg-forest text-white",
      accent: "bg-forest",
    },
    ask: {
      card: "border-amber/40 bg-amber-light/20",
      price: "text-charcoal",
      tag: "bg-amber text-forest-deep",
      accent: "bg-amber",
    },
  };
  const s = styles[variant];
  const isTarget = variant === "target";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 ${s.card} p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-sm)] sm:p-7 ${
        isTarget ? "sm:scale-[1.02] sm:shadow-[var(--shadow-sm)]" : ""
      }`}
    >
      {/* Accent bar */}
      <div className={`absolute left-0 top-0 h-1 w-full ${s.accent}`} />

      <div className="flex items-center gap-2">
        <span
          className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${s.tag}`}
        >
          {label}
        </span>
        {isTarget && (
          <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
            Fair Value
          </span>
        )}
      </div>

      <div className="mt-4">
        <div
          className={`price-display leading-none ${s.price} ${
            isTarget
              ? "text-[2.75rem] font-bold sm:text-[3.5rem]"
              : "text-[2.25rem] sm:text-[2.75rem]"
          }`}
        >
          {price > 0 ? <CountUp value={price} prefix="$" /> : "--"}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate tabular-nums">
          <span className="font-medium">{fmtPsf(psf)}</span>
          <span className="text-border">&middot;</span>
          <span>{sublabel}</span>
        </div>
      </div>

      <div className="mt-4 border-t border-border/60 pt-4">
        <p className="text-sm text-slate leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Net proceeds table
// ---------------------------------------------------------------------------

function NetProceedsTable({ pricing }: { pricing: SellerPricing }) {
  const rows = [
    {
      label: "Sale Price",
      floor: pricing.floorPrice,
      target: pricing.targetPrice,
      ask: pricing.openingAsk,
      bold: false,
      negative: false,
    },
    {
      label: "Agent Commission (2%)",
      floor: pricing.sellerCosts.agentCommission,
      target: pricing.sellerCosts.agentCommission,
      ask: Math.round(pricing.openingAsk * 0.02),
      bold: false,
      negative: true,
    },
    {
      label: "Legal Fees",
      floor: pricing.sellerCosts.legalFees,
      target: pricing.sellerCosts.legalFees,
      ask: pricing.sellerCosts.legalFees,
      bold: false,
      negative: true,
    },
  ];

  // Recalculate net proceeds per column accurately
  const askAgentFee = Math.round(pricing.openingAsk * 0.02);
  const netFloor = pricing.floorPrice - pricing.sellerCosts.agentCommission - pricing.sellerCosts.legalFees;
  const netTarget = pricing.targetPrice - pricing.sellerCosts.agentCommission - pricing.sellerCosts.legalFees;
  const netAsk = pricing.openingAsk - askAgentFee - pricing.sellerCosts.legalFees;

  return (
    <div className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h3 className="font-display text-xl text-charcoal">Net Proceeds</h3>
      <p className="mt-1 text-sm text-slate">
        What you take home after seller costs
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-3 pr-4 text-left text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">
                &nbsp;
              </th>
              <th className="pb-3 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-slate">
                Floor
              </th>
              <th className="pb-3 px-4 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-forest">
                Target
              </th>
              <th className="pb-3 pl-4 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-amber-ink">
                Opening Ask
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border/50">
                <td className="py-3 pr-4 text-slate">{row.label}</td>
                <td className="py-3 px-4 text-right tabular-nums text-charcoal">
                  {row.negative ? `\u2212${fmt(row.floor)}` : fmt(row.floor)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-charcoal">
                  {row.negative ? `\u2212${fmt(row.target)}` : fmt(row.target)}
                </td>
                <td className="py-3 pl-4 text-right tabular-nums text-charcoal">
                  {row.negative ? `\u2212${fmt(row.ask)}` : fmt(row.ask)}
                </td>
              </tr>
            ))}
            {/* Net proceeds row */}
            <tr>
              <td className="pt-3 pr-4 font-semibold text-charcoal">
                Net Proceeds
              </td>
              <td className="pt-3 px-4 text-right font-semibold tabular-nums text-charcoal">
                <CountUp value={netFloor} prefix="$" />
              </td>
              <td className="pt-3 px-4 text-right font-semibold tabular-nums text-forest">
                <CountUp value={netTarget} prefix="$" />
              </td>
              <td className="pt-3 pl-4 text-right font-semibold tabular-nums text-amber-ink">
                <CountUp value={netAsk} prefix="$" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate/70 leading-relaxed">
        Agent commission is estimated at 2% of sale price. Actual fees may vary.
        Legal fees are estimated at $1,000 for a standard HDB resale transaction.
        CPF refund, outstanding mortgage, and other obligations are not included.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function SellPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [pricing, setPricing] = useState<SellerPricing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<"home" | "results">("home");
  const utmRef = useRef<UtmParams>({});
  useEffect(() => { utmRef.current = captureUtmParams(); }, []);

  function handleResult(data: AnalysisResult) {
    setResult(data);
    setPricing(deriveSellerPricing(data));
    setError(null);
    setIsAnalyzing(false);
    setView("results");
    setTimeout(() => {
      document.getElementById("seller-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleError(message: string) {
    setError(message);
    setResult(null);
    setPricing(null);
    setIsAnalyzing(false);
  }

  function handleAnalyzing() {
    setIsAnalyzing(true);
    setError(null);
  }

  function handleBackToSearch() {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-fog">
      <Header activeNav="sell" />

      <main className="flex-1">
        {/* Hero + Form */}
        <>
          {/* Hero band:warm drench, with the three-number promise */}
          <section className="hero-drench-warm relative overflow-hidden">
            <div className="hero-grid absolute inset-0" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1200px] px-5 pb-24 pt-14 sm:px-10 sm:pb-28 sm:pt-20">
              <div className="max-w-2xl">
                <h1
                  className="rise text-balance font-display text-white"
                  style={{
                    fontSize: "clamp(2.25rem, 1.5rem + 2.6vw, 3.5rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Selling?{" "}
                  <span className="text-amber">Price it right the first time.</span>
                </h1>
                <p
                  className="rise mt-5 max-w-xl text-lg leading-relaxed text-mist/85"
                  style={{ "--rise-delay": "80ms" } as React.CSSProperties}
                >
                  Price too high and it sits. Too low and you leave money on the
                  table. Find the number that actually sells.
                </p>
              </div>

              <div
                className="rise mt-9"
                style={{ "--rise-delay": "140ms" } as React.CSSProperties}
              >
                <TierPreview
                  tiers={[
                    { label: "Floor price", desc: "Don't accept less than this", tone: "muted" },
                    { label: "Target price", desc: "Fair value, what similar flats fetch", tone: "primary" },
                    { label: "Opening ask", desc: "List here, then negotiate down", tone: "warm" },
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Form card:lifted out of the hero band */}
          <section className="relative z-10 mx-auto max-w-[1200px] px-5 sm:px-10">
            <div
              className="rise -mt-16 max-w-3xl rounded-3xl border border-border bg-white p-6 shadow-[var(--shadow-lg)] sm:-mt-20 sm:p-8"
              style={{ "--rise-delay": "220ms" } as React.CSSProperties}
            >
              <h2 className="font-display text-2xl text-charcoal">
                Your flat details
              </h2>
              <p className="mt-1 text-sm text-slate">
                Enter your property details to get your personalised pricing range.
              </p>
              <div className="mt-6">
                <PropertyForm
                  onResult={handleResult}
                  onError={handleError}
                  onAnalyzing={handleAnalyzing}
                  mode="sell"
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-error/30 bg-error/5 p-4">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}
            </div>
          </section>
        </>

        {/* Loading Skeleton */}
        {isAnalyzing && !result && <AnalysisSkeleton />}

        {/* Results */}
        {result && pricing && view === "results" && (
          <section id="seller-results">
            {/* Email capture popup:same logic as buyer page */}
            <EmailCapture delayMs={12000} result={result} mode="sell" utm={utmRef.current} />

            {/* Fallback data banner */}
            {result.dataSource?.type === "fallback" && (
              <div className="border-b border-amber-200 bg-amber-50">
                <div className="mx-auto max-w-[1200px] px-5 py-3 sm:px-10">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">Using cached data</span>
                    {" "}from{" "}
                    {new Date(result.dataSource.asOf).toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    . Live data was temporarily unavailable.
                    Results may not reflect the very latest transactions.
                  </p>
                </div>
              </div>
            )}

            {/* Seller Pricing Cards */}
            <div className="bg-white border-b border-border">
              <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10 sm:py-14">
                <div className="flex items-end justify-between">
                  <h2 className="font-display text-2xl text-charcoal sm:text-[2rem]">
                    Here&apos;s how to price your flat
                  </h2>
                  <p className="hidden text-sm text-slate sm:block">
                    Based on{" "}
                    <span className="font-medium text-charcoal">
                      {result.comps.tier1.length +
                        result.comps.tier2.length +
                        result.comps.tier3.length}
                    </span>{" "}
                    comparable sales in{" "}
                    <span className="font-medium text-charcoal">
                      {result.input.town}
                    </span>
                  </p>
                </div>
                <p className="mt-1 text-sm text-slate sm:hidden">
                  Based on{" "}
                  {result.comps.tier1.length +
                    result.comps.tier2.length +
                    result.comps.tier3.length}{" "}
                  comparable sales in {result.input.town}
                </p>

                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <SellerCard
                    label="Floor Price"
                    sublabel="Don't go below"
                    price={pricing.floorPrice}
                    psf={pricing.floorPsf}
                    rationale={pricing.floorRationale}
                    variant="floor"
                  />
                  <SellerCard
                    label="Target Price"
                    sublabel="Fair market value"
                    price={pricing.targetPrice}
                    psf={pricing.targetPsf}
                    rationale={pricing.targetRationale}
                    variant="target"
                  />
                  <SellerCard
                    label="Opening Ask"
                    sublabel="List here"
                    price={pricing.openingAsk}
                    psf={pricing.openingAskPsf}
                    rationale={pricing.openingAskRationale}
                    variant="ask"
                  />
                </div>

                {/* Renovation adjustment note */}
                {result.offerWithReno && result.renovation && (
                  <div className="mt-4 rounded-xl border border-amber/30 bg-amber-light/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-deep">
                        Renovation Adjusted
                      </span>
                      <span className="text-xs text-slate">
                        Condition: {result.renovation.condition} &middot;{" "}
                        {result.renovation.priceAdjustmentPercent > 0 ? "+" : ""}
                        {(result.renovation.priceAdjustmentPercent * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate">
                      Pricing above is adjusted for your flat&apos;s condition.
                      A well-maintained flat commands a premium; one needing work will sell for less.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <ShareReport result={result} mode="sell" />
                  <button
                    onClick={handleBackToSearch}
                    className="rounded-[10px] border border-border px-5 py-2.5 text-sm text-slate transition-colors hover:border-charcoal hover:text-charcoal"
                  >
                    Analyse Another
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis sections */}
            <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10">
              <h2 className="font-display text-2xl text-charcoal sm:text-3xl">
                Analysis
              </h2>
              <p className="mt-1 text-sm text-slate">
                Detailed breakdown for {result.input.flatType} at{" "}
                {result.input.streetName}, {result.input.town}
              </p>

              <div className="mt-8 space-y-8">
                {/* Net Proceeds */}
                <NetProceedsTable pricing={pricing} />

                {/* Market Context */}
                <MarketContextDisplay
                  context={result.marketContext}
                  town={result.input.town}
                  flatType={result.input.flatType}
                  nearbyTransactions={result.nearbyTransactions}
                />

                {/* Risk Flags */}
                <RiskFlagsDisplay risks={result.risks} />

                {/* Disclaimer */}
                <div className="rounded-xl border border-border bg-white p-5">
                  <p className="text-xs text-slate leading-relaxed">
                    <strong className="text-charcoal">Disclaimer:</strong> This
                    tool provides estimates based on official HDB resale
                    transaction records. It is not financial advice.
                    Actual prices depend on many factors not captured here,
                    including unit condition, renovation, facing, view, and
                    negotiation dynamics. Agent commission is estimated at 2% and
                    may vary. Always conduct your own due diligence and consider
                    consulting a licensed property agent.
                  </p>
                </div>

                <p className="text-center text-xs text-slate/60">
                  Generated{" "}
                  {new Date(result.generatedAt).toLocaleString("en-SG")}
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
