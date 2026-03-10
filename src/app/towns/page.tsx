import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { HDB_TOWNS } from "@/lib/constants";
import { getTownSummary, townToSlug, titleCase } from "@/lib/town-data";

export const revalidate = 86400; // 24h ISR

export const metadata: Metadata = {
  title: "Resale Prices by Town - SGHaus",
  description:
    "Browse resale flat prices, trends, and transaction data for all 27 HDB towns in Singapore. Compare median prices and find your ideal neighbourhood.",
};

function formatTrend(pct: number): { label: string; color: string } {
  if (pct > 0) return { label: `+${pct.toFixed(1)}%`, color: "text-emerald-600" };
  if (pct < 0) return { label: `${pct.toFixed(1)}%`, color: "text-red-600" };
  return { label: "0.0%", color: "text-slate" };
}

export default async function TownsIndexPage() {
  // Fetch all town summaries in parallel
  const summaries = await Promise.all(
    HDB_TOWNS.map(async (town) => {
      const summary = await getTownSummary(town);
      return summary;
    }),
  );

  // Sort by transaction count descending (most active first)
  const sorted = summaries
    .filter((s) => s.totalTransactions12m > 0)
    .sort((a, b) => b.totalTransactions12m - a.totalTransactions12m);

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 sm:px-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
            Resale Prices by Town
          </h1>
          <p className="mt-2 text-sm text-slate">
            Compare resale flat prices across all {sorted.length} towns. Data based on real transactions from the last 12 months.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((summary) => {
            const slug = townToSlug(summary.town);
            const trend = formatTrend(summary.overallTrendPercent);
            return (
              <Link
                key={summary.town}
                href={`/towns/${slug}`}
                className="group rounded-xl border border-border bg-white p-5 transition-shadow hover:shadow-md"
              >
                <h2 className="font-display text-lg text-charcoal group-hover:text-forest transition-colors">
                  {titleCase(summary.town)}
                </h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate">Median PSF</p>
                    <p className="mt-0.5 font-display text-lg text-charcoal">
                      ${summary.overallMedianPsf}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">12m Trend</p>
                    <p className={`mt-0.5 font-display text-lg ${trend.color}`}>
                      {trend.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">Transactions</p>
                    <p className="mt-0.5 font-display text-lg text-charcoal">
                      {summary.totalTransactions12m.toLocaleString()}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 rounded-xl border border-border bg-white p-6 text-center sm:p-8">
          <h2 className="font-display text-xl text-charcoal sm:text-2xl">
            Found your town?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate">
            Get a personalised offer strategy for any resale flat, with data-backed pricing and risk analysis.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/buy"
              className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Get Buyer Report
            </Link>
            <Link
              href="/sell"
              className="inline-block rounded-lg border border-forest px-6 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
            >
              Get Seller Report
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
