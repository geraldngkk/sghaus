"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult } from "@/types";
import PropertyForm from "@/components/property-form";
import OfferStrategyDisplay from "@/components/offer-strategy";
import CostBreakdownDisplay from "@/components/cost-breakdown";
import RiskFlagsDisplay from "@/components/risk-flags";
import DecisionChecklist from "@/components/decision-checklist";
import MarketContextDisplay from "@/components/market-context";
import SavedReports from "@/components/saved-reports";
import PropertyComparison from "@/components/property-comparison";
import ShareReport from "@/components/share-report";
import AnalysisSkeleton from "@/components/analysis-skeleton";
import NegotiationPanel from "@/components/negotiation-panel";
import EmailCapture from "@/components/email-capture";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { saveAnalysis, getAnalysis, type SavedAnalysis } from "@/lib/storage";

type View = "home" | "results" | "comparison";

export default function BuyPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveRefreshKey, setSaveRefreshKey] = useState(0);
  const [view, setView] = useState<View>("home");
  const [comparisonAnalyses, setComparisonAnalyses] = useState<SavedAnalysis[]>([]);

  function handleResult(data: AnalysisResult) {
    setResult(data);
    setError(null);
    setSaved(false);
    setIsAnalyzing(false);
    setView("results");
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  function handleError(message: string) {
    setError(message);
    setResult(null);
    setIsAnalyzing(false);
  }

  function handleAnalyzing() {
    setIsAnalyzing(true);
    setError(null);
  }

  function handleSave() {
    if (!result) return;
    saveAnalysis(result);
    setSaved(true);
    setSaveRefreshKey((k) => k + 1);
  }

  function handleLoadReport(data: AnalysisResult) {
    setResult(data);
    setError(null);
    setSaved(true);
    setView("results");
    setTimeout(() => {
      document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  const handleCompare = useCallback((ids: string[]) => {
    const analyses = ids
      .map((id) => getAnalysis(id))
      .filter((a): a is SavedAnalysis => a !== undefined);
    if (analyses.length >= 2) {
      setComparisonAnalyses(analyses);
      setView("comparison");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  function handleCloseComparison() {
    setComparisonAnalyses([]);
    setView("home");
  }

  function handleBackToSearch() {
    setView("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-fog">
      {/* Header */}
      <Header activeNav="buy" />

      <main className="flex-1">
        {/* Comparison View */}
        {view === "comparison" && comparisonAnalyses.length >= 2 && (
          <section className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10">
            <PropertyComparison
              analyses={comparisonAnalyses}
              onClose={handleCloseComparison}
            />
          </section>
        )}

        {/* Hero + Form (show in home or results view) */}
        {view !== "comparison" && (
          <>
            {/* Hero section with background image */}
            <section className="hero-bg relative border-b border-border">
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/75 via-[#1A1A2E]/65 to-[#2D6A4F]/70" />

              <div className="relative mx-auto max-w-[1200px] px-5 py-16 sm:px-10 sm:py-20 lg:py-24">
                <div className="max-w-2xl">
                  <h1
                    className="font-display text-3xl text-white sm:text-4xl lg:text-[3.25rem]"
                    style={{ lineHeight: 1.1 }}
                  >
                    This is probably the biggest purchase of your life.{" "}
                    <span className="text-mist">Don&apos;t wing it.</span>
                  </h1>
                  <p
                    className="mt-5 text-base text-white/70 leading-relaxed sm:text-lg"
                    style={{ maxWidth: "38em" }}
                  >
                    Real HDB transaction data. Your opening bid, your target price,
                    and the number you should never go past.
                  </p>
                </div>

                <div className="mt-10 max-w-xl rounded-2xl border border-white/10 bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
                  <h2 className="font-display text-xl text-charcoal sm:text-2xl">
                    Property details
                  </h2>
                  <p className="mt-1 text-sm text-slate">
                    Enter the listing details to get your personalised offer range.
                  </p>
                  <div className="mt-6">
                    <PropertyForm
                      onResult={handleResult}
                      onError={handleError}
                      onAnalyzing={handleAnalyzing}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 max-w-xl rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4">
                    <p className="text-sm text-white">{error}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Saved Reports */}
            <section className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10">
              <SavedReports
                onLoad={handleLoadReport}
                onCompare={handleCompare}
                refreshKey={saveRefreshKey}
              />
            </section>
          </>
        )}

        {/* Loading Skeleton */}
        {isAnalyzing && !result && <AnalysisSkeleton />}

        {/* Results */}
        {result && view === "results" && (
          <section id="results">
            {/* Email capture popup — triggers on scroll to analysis or 8s timer */}
            <EmailCapture delayMs={12000} result={result} />

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

            {/* Offer Range */}
            <div className="bg-white border-b border-border">
              <div className="mx-auto max-w-[1200px] px-5 py-10 sm:px-10 sm:py-14">
                <OfferStrategyDisplay
                  offer={result.offerWithReno ?? result.offer}
                  compCount={
                    result.comps.tier1.length +
                    result.comps.tier2.length +
                    result.comps.tier3.length
                  }
                  town={result.input.town}
                />

                {/* Renovation adjustment note */}
                {result.offerWithReno && result.renovation && (
                  <div className="mt-4 rounded-xl border border-amber/30 bg-amber-light/20 p-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Renovation Adjusted
                      </span>
                      <span className="text-xs text-slate">
                        Condition: {result.renovation.condition} &middot;{" "}
                        {result.renovation.priceAdjustmentPercent > 0 ? "+" : ""}
                        {(result.renovation.priceAdjustmentPercent * 100).toFixed(1)}% &middot;{" "}
                        Est. renovation cost: ${result.renovation.estimatedCost.low.toLocaleString("en-SG")} &ndash; ${result.renovation.estimatedCost.high.toLocaleString("en-SG")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate">
                      Offers above are adjusted for the flat&apos;s condition. Without renovation adjustment: Low ${result.offer.low.toLocaleString("en-SG")} / Target ${result.offer.mid.toLocaleString("en-SG")} / Ceiling ${result.offer.max.toLocaleString("en-SG")}
                    </p>
                  </div>
                )}

                {/* Save / Share / Analyse Another */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {saved ? (
                    <div className="flex items-center gap-2 rounded-[10px] border-2 border-meadow/30 bg-mist/30 px-5 py-2.5">
                      <span className="text-sm text-forest">&#10003;</span>
                      <span className="text-sm font-medium text-forest">
                        Saved to your reports
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleSave}
                      className="rounded-[10px] border-2 border-forest px-5 py-2.5 text-sm font-semibold text-forest transition-all hover:bg-forest hover:text-white"
                    >
                      Save This Report
                    </button>
                  )}
                  <ShareReport result={result} />
                  <button
                    onClick={handleBackToSearch}
                    className="rounded-[10px] border border-border px-5 py-2.5 text-sm text-slate transition-colors hover:border-charcoal hover:text-charcoal"
                  >
                    Analyse Another
                  </button>
                </div>

                {/* Negotiation Scripts — collapsed by default */}
                <NegotiationPanel result={result} />
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
                <MarketContextDisplay
                  context={result.marketContext}
                  town={result.input.town}
                  flatType={result.input.flatType}
                />
                <CostBreakdownDisplay
                  atLow={result.costs.atLow}
                  atMid={result.costs.atMid}
                  atMax={result.costs.atMax}
                />
                <RiskFlagsDisplay risks={result.risks} />
                <DecisionChecklist checklist={result.checklist} />

                <div className="rounded-xl border border-border bg-white p-5">
                  <p className="text-xs text-slate leading-relaxed">
                    <strong className="text-charcoal">Disclaimer:</strong> This
                    tool provides estimates based on official HDB resale
                    transaction records. It is not financial advice.
                    Actual prices depend on many factors not captured here,
                    including unit condition, renovation, facing, view, and
                    negotiation dynamics. Always conduct your own due diligence and
                    consider consulting a licensed property agent.
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
