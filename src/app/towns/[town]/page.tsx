import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import {
  slugToTown,
  titleCase,
  getAllTownSlugs,
  getTownSummary,
  townToSlug,
  flatTypeToSlug,
  MIN_FLAT_TX,
} from "@/lib/town-data";

export const revalidate = 86400; // 24h ISR

const SITE = "https://sghaus.com";

// Stable content dates for structured data. Kept as constants (not a moving
// "now") so crawlers trust the published/modified signals. Bump on meaningful
// content changes, matching the sitemap's LAST_UPDATED convention.
const CONTENT_PUBLISHED = "2026-03-10";
const CONTENT_MODIFIED = "2026-07-03";

// De-duplicate the summary fetch across generateMetadata and the page render
// within a single request (React cache), so per-town data drives both without
// double-fetching.
const getSummary = cache(getTownSummary);

export function generateStaticParams() {
  return getAllTownSlugs().map((town) => ({ town }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town: slug } = await params;
  const townUpper = slugToTown(slug);
  const townName = titleCase(townUpper);
  const summary = await getSummary(townUpper);

  const canonical = `/towns/${slug}`;
  const title = `${townName} Resale Prices & Trends - SGHaus`;
  const description =
    summary.totalTransactions12m > 0
      ? `${townName} resale flat prices: median $${summary.overallMedianPsf} psf across ${summary.totalTransactions12m.toLocaleString()} recent sales in the last 12 months. Compare prices by flat type, see 12-month trends, and get a data-backed offer range.`
      : `Resale flat prices and 12-month trends for ${townName}. Compare median prices by flat type and get a data-backed offer range before you buy or sell.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE}${canonical}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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

  const summary = await getSummary(townUpper);
  const trend = formatTrend(summary.overallTrendPercent);

  const generatedDate = new Date(summary.generatedAt).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // -------------------------------------------------------------------------
  // FAQ entries, answered only from figures already computed for this page.
  // -------------------------------------------------------------------------
  const topFlatType = [...summary.flatTypes].sort(
    (a, b) => b.transactionCount - a.transactionCount,
  )[0];

  const trendPct = summary.overallTrendPercent;
  const trendAnswer =
    trendPct > 0
      ? `Resale prices in ${townDisplay} have risen about ${trendPct.toFixed(1)}% per square foot over the last 12 months compared with the year before.`
      : trendPct < 0
        ? `Resale prices in ${townDisplay} have eased about ${Math.abs(trendPct).toFixed(1)}% per square foot over the last 12 months compared with the year before.`
        : `Resale prices in ${townDisplay} have held broadly steady over the last 12 months compared with the year before.`;

  const faqEntries: { question: string; answer: string }[] = [];

  if (summary.totalTransactions12m > 0) {
    faqEntries.push({
      question: `How many resale flats were sold in ${townDisplay} in the last 12 months?`,
      answer: `${summary.totalTransactions12m.toLocaleString()} resale flats changed hands in ${townDisplay} over the last 12 months, based on recent resale transactions.`,
    });
  }

  if (summary.overallMedianPsf > 0) {
    faqEntries.push({
      question: `What is the median resale price per square foot in ${townDisplay}?`,
      answer: `The median resale flat in ${townDisplay} sold for about $${summary.overallMedianPsf} per square foot over the last 12 months.`,
    });
  }

  if (topFlatType) {
    faqEntries.push({
      question: `What is the median resale price of a ${formatFlatType(topFlatType.flatType)} flat in ${townDisplay}?`,
      answer: `A ${formatFlatType(topFlatType.flatType)} flat in ${townDisplay} has a median resale price of around ${formatPrice(topFlatType.medianPrice)}, drawn from ${topFlatType.transactionCount.toLocaleString()} recent sales in the last 12 months.`,
    });
  }

  faqEntries.push({
    question: `Are resale prices in ${townDisplay} rising or falling?`,
    answer: trendAnswer,
  });

  // -------------------------------------------------------------------------
  // Structured data (inline JSON-LD)
  // -------------------------------------------------------------------------
  const townUrl = `${SITE}/towns/${slug}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Towns", item: `${SITE}/towns` },
      { "@type": "ListItem", position: 3, name: townDisplay, item: townUrl },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqEntries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    })),
  };

  const articleDescription =
    summary.totalTransactions12m > 0
      ? `Median resale prices, 12-month trends, and recent sales for ${townDisplay}, drawn from ${summary.totalTransactions12m.toLocaleString()} recent resale transactions.`
      : `Median resale prices, 12-month trends, and recent sales for ${townDisplay}, drawn from recent resale transactions.`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${townDisplay} HDB resale prices`,
    description: articleDescription,
    datePublished: CONTENT_PUBLISHED,
    dateModified: CONTENT_MODIFIED,
    url: townUrl,
    mainEntityOfPage: townUrl,
    image: `${SITE}/logo-square.svg`,
    author: { "@type": "Organization", name: "SGHaus", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "SGHaus",
      logo: { "@type": "ImageObject", url: `${SITE}/logo-square.svg` },
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
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
                        {ft.transactionCount >= MIN_FLAT_TX ? (
                          <Link
                            href={`/towns/${slug}/${flatTypeToSlug(ft.flatType)}`}
                            className="text-forest hover:underline"
                          >
                            {formatFlatType(ft.flatType)}
                          </Link>
                        ) : (
                          formatFlatType(ft.flatType)
                        )}
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

        {/* Cheapest & priciest blocks */}
        {(summary.cheapestBlocks.length > 0 || summary.priciestBlocks.length > 0) && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {summary.cheapestBlocks.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
                  <h2 className="font-display text-lg text-charcoal">Most affordable blocks</h2>
                </div>
                <ul className="divide-y divide-border">
                  {summary.cheapestBlocks.map((b) => (
                    <li key={`c-${b.block}-${b.street}`} className="flex items-center justify-between px-4 py-3 text-sm sm:px-6">
                      <span className="text-charcoal">Blk {b.block} {b.street}</span>
                      <span className="font-medium text-charcoal">{formatPrice(b.medianPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {summary.priciestBlocks.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
                  <h2 className="font-display text-lg text-charcoal">Priciest blocks</h2>
                </div>
                <ul className="divide-y divide-border">
                  {summary.priciestBlocks.map((b) => (
                    <li key={`p-${b.block}-${b.street}`} className="flex items-center justify-between px-4 py-3 text-sm sm:px-6">
                      <span className="text-charcoal">Blk {b.block} {b.street}</span>
                      <span className="font-medium text-charcoal">{formatPrice(b.medianPrice)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* FAQ */}
        {faqEntries.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
              <h2 className="font-display text-lg text-charcoal">
                Common questions about {townDisplay}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {faqEntries.map((faq) => (
                <div key={faq.question} className="px-4 py-4 sm:px-6">
                  <h3 className="text-sm font-medium text-charcoal">{faq.question}</h3>
                  <p className="mt-1.5 text-sm text-slate">{faq.answer}</p>
                </div>
              ))}
            </div>
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
          <p className="mt-4 text-xs text-slate">
            New to the resale process? Read our{" "}
            <Link href="/guides" className="font-medium text-forest hover:underline">
              buyer and seller guides
            </Link>{" "}
            or{" "}
            <Link href="/buy" className="font-medium text-forest hover:underline">
              get your offer range
            </Link>{" "}
            in minutes.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
