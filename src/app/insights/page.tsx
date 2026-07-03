import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { FLAT_TYPES } from "@/lib/constants";
import {
  getAllTownSummaries,
  townToSlug,
  titleCase,
  flatTypeDisplay,
} from "@/lib/town-data";

export const revalidate = 86400; // 24h ISR

const SITE = "https://sghaus.com";
const CONTENT_MODIFIED = "2026-07-03";

export const metadata: Metadata = {
  title: "Singapore Resale Price Index by Town (2026) - SGHaus",
  description:
    "Median resale flat prices and price per square foot for every town in Singapore, ranked, with the cheapest and priciest towns and the cheapest town for each flat type. Updated from recent sales.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Singapore Resale Price Index by Town (2026) - SGHaus",
    description:
      "Median resale prices and psf for every Singapore town, ranked, plus the cheapest and priciest towns and the cheapest town for each flat type.",
    url: `${SITE}/insights`,
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Singapore Resale Price Index by Town (2026)" },
};

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

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export default async function InsightsPage() {
  const summaries = await getAllTownSummaries();
  const towns = summaries
    .filter((s) => s.totalTransactions12m > 0 && s.overallMedianPsf > 0)
    .sort((a, b) => b.overallMedianPsf - a.overallMedianPsf);

  const totalTx = towns.reduce((sum, s) => sum + s.totalTransactions12m, 0);
  const medianTownPsf = median(towns.map((s) => s.overallMedianPsf));
  const priciest = towns[0];
  const cheapest = towns[towns.length - 1];
  const mostActive = [...towns].sort((a, b) => b.totalTransactions12m - a.totalTransactions12m)[0];

  // Cheapest town for each flat type (from town-level medians, 5+ sales)
  type Cheapest = { flatType: string; town: string; medianPrice: number; count: number };
  const flatCheapest: Cheapest[] = [];
  for (const ft of FLAT_TYPES) {
    let best: Cheapest | null = null;
    for (const s of towns) {
      const f = s.flatTypes.find((x) => x.flatType === ft);
      if (f && f.transactionCount >= 5 && (best === null || f.medianPrice < best.medianPrice)) {
        best = { flatType: ft, town: s.town, medianPrice: f.medianPrice, count: f.transactionCount };
      }
    }
    if (best) flatCheapest.push(best);
  }

  const faqEntries = [
    {
      question: "Which is the cheapest town for a resale flat in Singapore?",
      answer: cheapest
        ? `${titleCase(cheapest.town)} has the lowest median price per square foot of any town, at about $${cheapest.overallMedianPsf} psf over the last 12 months.`
        : "",
    },
    {
      question: "Which town has the most expensive resale flats?",
      answer: priciest
        ? `${titleCase(priciest.town)} has the highest median at about $${priciest.overallMedianPsf} per square foot over the last 12 months.`
        : "",
    },
    {
      question: "What is the median resale price per square foot across Singapore towns?",
      answer: `Across the ${towns.length} towns with recent sales, the median town sits around $${medianTownPsf} per square foot, ranging from about $${cheapest?.overallMedianPsf} in ${titleCase(cheapest?.town ?? "")} to $${priciest?.overallMedianPsf} in ${titleCase(priciest?.town ?? "")}.`,
    },
  ].filter((e) => e.answer);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Insights", item: `${SITE}/insights` },
    ],
  };
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Singapore resale price index by town",
    description: `Median resale prices and price per square foot for ${towns.length} Singapore towns, ranked, from ${totalTx.toLocaleString()} recent sales.`,
    datePublished: CONTENT_MODIFIED,
    dateModified: CONTENT_MODIFIED,
    url: `${SITE}/insights`,
    mainEntityOfPage: `${SITE}/insights`,
    image: `${SITE}/logo-square.svg`,
    author: { "@type": "Organization", name: "SGHaus", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "SGHaus",
      logo: { "@type": "ImageObject", url: `${SITE}/logo-square.svg` },
    },
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

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 sm:px-10">
        <nav className="mb-6 text-sm text-slate">
          <Link href="/" className="transition-colors hover:text-forest">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal">Insights</span>
        </nav>

        <div className="mb-8">
          <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
            Singapore Resale Price Index by Town
          </h1>
          <p className="mt-2 text-sm text-slate">
            Updated {new Date(CONTENT_MODIFIED).toLocaleDateString("en-SG", { day: "numeric", month: "long", year: "numeric" })} &middot; {totalTx.toLocaleString()} recent sales
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal">
            Across {towns.length} towns, resale flats sold from about{" "}
            <span className="font-semibold text-forest">${cheapest?.overallMedianPsf} psf</span> in {titleCase(cheapest?.town ?? "")} to{" "}
            <span className="font-semibold text-forest">${priciest?.overallMedianPsf} psf</span> in {titleCase(priciest?.town ?? "")} over the last 12 months, with the median town around ${medianTownPsf} psf.
          </p>
        </div>

        {/* Snapshot */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Cheapest Town</p>
            <p className="mt-1 font-display text-xl text-charcoal">{titleCase(cheapest?.town ?? "")}</p>
            <p className="text-xs text-slate">${cheapest?.overallMedianPsf} psf</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Priciest Town</p>
            <p className="mt-1 font-display text-xl text-charcoal">{titleCase(priciest?.town ?? "")}</p>
            <p className="text-xs text-slate">${priciest?.overallMedianPsf} psf</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Most Active</p>
            <p className="mt-1 font-display text-xl text-charcoal">{titleCase(mostActive?.town ?? "")}</p>
            <p className="text-xs text-slate">{mostActive?.totalTransactions12m.toLocaleString()} sales</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Total Sales (12m)</p>
            <p className="mt-1 font-display text-xl text-charcoal">{totalTx.toLocaleString()}</p>
          </div>
        </div>

        {/* Ranked table */}
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
            <h2 className="font-display text-lg text-charcoal">Median resale price per square foot, by town</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-4 py-3 sm:px-6">#</th>
                  <th className="px-4 py-3 sm:px-6">Town</th>
                  <th className="px-4 py-3 text-right sm:px-6">Median PSF</th>
                  <th className="px-4 py-3 text-right sm:px-6">Median Price</th>
                  <th className="px-4 py-3 text-right sm:px-6">12m Trend</th>
                  <th className="px-4 py-3 text-right sm:px-6">Sales</th>
                </tr>
              </thead>
              <tbody>
                {towns.map((s, i) => {
                  const t = formatTrend(s.overallTrendPercent);
                  return (
                    <tr key={s.town} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-slate sm:px-6">{i + 1}</td>
                      <td className="px-4 py-3 font-medium sm:px-6">
                        <Link href={`/towns/${townToSlug(s.town)}`} className="text-forest hover:underline">
                          {titleCase(s.town)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">${s.overallMedianPsf}</td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">{formatPrice(s.overallMedianPrice)}</td>
                      <td className={`px-4 py-3 text-right sm:px-6 ${t.color}`}>{t.label}</td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">{s.totalTransactions12m.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cheapest town per flat type */}
        {flatCheapest.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
              <h2 className="font-display text-lg text-charcoal">Cheapest town for each flat type</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate">
                    <th className="px-4 py-3 sm:px-6">Flat Type</th>
                    <th className="px-4 py-3 sm:px-6">Cheapest Town</th>
                    <th className="px-4 py-3 text-right sm:px-6">Median Price</th>
                  </tr>
                </thead>
                <tbody>
                  {flatCheapest.map((c) => (
                    <tr key={c.flatType} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium text-charcoal sm:px-6">{flatTypeDisplay(c.flatType)}</td>
                      <td className="px-4 py-3 sm:px-6">
                        <Link href={`/towns/${townToSlug(c.town)}/${c.flatType.toLowerCase().replace(/\s+/g, "-")}`} className="text-forest hover:underline">
                          {titleCase(c.town)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-charcoal sm:px-6">{formatPrice(c.medianPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQ */}
        {faqEntries.length > 0 && (
          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
              <h2 className="font-display text-lg text-charcoal">Common questions</h2>
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
          <h2 className="font-display text-xl text-charcoal sm:text-2xl">Know your number before you offer</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate">
            Averages set the scene. SGHaus turns the exact block, floor, lease, and condition into a
            data-backed opening bid, target price, and hard ceiling.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/buy" className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
              Get your offer range
            </Link>
            <Link href="/towns" className="inline-block rounded-lg border border-forest px-6 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5">
              Browse towns
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
