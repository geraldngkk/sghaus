import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  slugToTown,
  titleCase,
  getAllTownSlugs,
  getTownSummary,
  townToSlug,
} from "@/lib/town-data";

export const revalidate = 86400; // 24h ISR

export function generateStaticParams() {
  return getAllTownSlugs().map((town) => ({ town }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town: slug } = await params;
  const townName = titleCase(slugToTown(slug));
  return {
    title: `${townName} Resale Prices - SGHaus`,
    description: `Latest resale flat prices, trends, and transaction data for ${townName}. See median prices by flat type and make data-backed property decisions.`,
  };
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatTrend(pct: number): { label: string; color: string } {
  if (pct > 0) return { label: `+${pct.toFixed(1)}%`, color: "text-emerald-600" };
  if (pct < 0) return { label: `${pct.toFixed(1)}%`, color: "text-red-600" };
  return { label: "0.0%", color: "text-slate" };
}

function formatFlatType(ft: string): string {
  return ft
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

export default async function TownPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town: slug } = await params;
  const townUpper = slugToTown(slug);
  const townDisplay = titleCase(townUpper);

  const summary = await getTownSummary(townUpper);
  const trend = formatTrend(summary.overallTrendPercent);

  const generatedDate = new Date(summary.generatedAt).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 sm:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate">
          <Link href="/towns" className="hover:text-forest transition-colors">
            All Towns
          </Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal">{townDisplay}</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
            {townDisplay} Resale Prices
          </h1>
          <p className="mt-2 text-sm text-slate">
            Updated {generatedDate} &middot; {summary.totalTransactions12m.toLocaleString()} transactions in the last 12 months
          </p>
        </div>

        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Median PSF</p>
            <p className="mt-1 font-display text-2xl text-charcoal">${summary.overallMedianPsf}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">12m Trend</p>
            <p className={`mt-1 font-display text-2xl ${trend.color}`}>{trend.label}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Transactions</p>
            <p className="mt-1 font-display text-2xl text-charcoal">{summary.totalTransactions12m.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Most Active Street</p>
            <p className="mt-1 text-sm font-medium text-charcoal leading-tight">{summary.mostActiveStreet || "N/A"}</p>
          </div>
        </div>

        {/* Flat Type Table */}
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
            <h2 className="font-display text-lg text-charcoal">Prices by Flat Type</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-4 py-3 sm:px-6">Type</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Median Price</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Median PSF</th>
                  <th className="px-4 py-3 sm:px-6 text-right">12m Trend</th>
                  <th className="px-4 py-3 sm:px-6 text-right">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {summary.flatTypes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate sm:px-6">
                      No recent transactions found for this town.
                    </td>
                  </tr>
                )}
                {summary.flatTypes.map((ft) => {
                  const ftTrend = formatTrend(ft.trendPercent);
                  return (
                    <tr key={ft.flatType} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-charcoal sm:px-6">
                        {formatFlatType(ft.flatType)}
                      </td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">
                        {formatPrice(ft.medianPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">
                        ${ft.medianPsf}
                      </td>
                      <td className={`px-4 py-3 text-right sm:px-6 ${ftTrend.color}`}>
                        {ftTrend.label}
                      </td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">
                        {ft.transactionCount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Highlights */}
        {(summary.highestSale || summary.lowestSale) && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {summary.highestSale && (
              <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Highest Sale (12m)</p>
                <p className="mt-2 font-display text-xl text-charcoal">
                  {formatPrice(summary.highestSale.price)}
                </p>
                <p className="mt-1 text-sm text-slate">
                  Blk {summary.highestSale.block} {titleCase(summary.highestSale.street)} - {formatFlatType(summary.highestSale.flatType)} - {formatMonth(summary.highestSale.month)}
                </p>
              </div>
            )}
            {summary.lowestSale && (
              <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Lowest Sale (12m)</p>
                <p className="mt-2 font-display text-xl text-charcoal">
                  {formatPrice(summary.lowestSale.price)}
                </p>
                <p className="mt-1 text-sm text-slate">
                  Blk {summary.lowestSale.block} {titleCase(summary.lowestSale.street)} - {formatFlatType(summary.lowestSale.flatType)} - {formatMonth(summary.lowestSale.month)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-border bg-white p-6 text-center sm:p-8">
          <h2 className="font-display text-xl text-charcoal sm:text-2xl">
            Looking at a flat in {townDisplay}?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate">
            Get a personalised offer strategy with data-backed low, mid, and max prices for any resale flat.
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
