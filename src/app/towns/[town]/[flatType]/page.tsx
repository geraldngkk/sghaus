import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { FLAT_TYPES } from "@/lib/constants";
import {
  slugToTown,
  titleCase,
  flatTypeDisplay,
  slugToFlatType,
  flatTypeToSlug,
  getFlatTypeDetail,
  getValidTownFlatCombos,
  MIN_FLAT_TX,
} from "@/lib/town-data";

export const revalidate = 86400; // 24h ISR

const SITE = "https://sghaus.com";
const CONTENT_PUBLISHED = "2026-07-03";
const CONTENT_MODIFIED = "2026-07-03";

const getDetail = cache(getFlatTypeDetail);

export async function generateStaticParams() {
  const combos = await getValidTownFlatCombos();
  return combos.map((c) => ({ town: c.townSlug, flatType: c.flatSlug }));
}

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFull(n: number): string {
  return `$${n.toLocaleString()}`;
}

function formatTrend(pct: number): { label: string; color: string } {
  if (pct > 0) return { label: `+${pct.toFixed(1)}%`, color: "text-emerald-600" };
  if (pct < 0) return { label: `${pct.toFixed(1)}%`, color: "text-red-600" };
  return { label: "0.0%", color: "text-slate" };
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string; flatType: string }>;
}): Promise<Metadata> {
  const { town: townSlug, flatType: flatSlug } = await params;
  const townUpper = slugToTown(townSlug);
  const flatUpper = slugToFlatType(flatSlug);
  const townName = titleCase(townUpper);
  const flatName = flatTypeDisplay(flatUpper);

  const canonical = `/towns/${townSlug}/${flatSlug}`;
  const detail = (FLAT_TYPES as readonly string[]).includes(flatUpper)
    ? await getDetail(townUpper, flatUpper)
    : null;

  const title = `${flatName} Resale Prices in ${townName} (2026) - SGHaus`;
  const description =
    detail && detail.count12m >= MIN_FLAT_TX
      ? `The median ${flatName} resale flat in ${townName} sold for ${formatFull(detail.medianPrice)} (about $${detail.medianPsf} psf) over the last 12 months, from ${detail.count12m} recent sales. See the price range, recent sales, and a data-backed offer strategy.`
      : `${flatName} resale flat prices, recent sales, and a data-backed offer strategy for ${townName}, Singapore.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: `${SITE}${canonical}`, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TownFlatPage({
  params,
}: {
  params: Promise<{ town: string; flatType: string }>;
}) {
  const { town: townSlug, flatType: flatSlug } = await params;
  const townUpper = slugToTown(townSlug);
  const flatUpper = slugToFlatType(flatSlug);

  if (!(FLAT_TYPES as readonly string[]).includes(flatUpper)) notFound();

  const townName = titleCase(townUpper);
  const flatName = flatTypeDisplay(flatUpper);
  const detail = await getDetail(townUpper, flatUpper);

  // Thin-content guard: a page needs enough real sales to be genuinely useful.
  if (detail.count12m < MIN_FLAT_TX) notFound();

  const trend = formatTrend(detail.trendPercent);
  const generatedDate = new Date(detail.generatedAt).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canonical = `/towns/${townSlug}/${flatSlug}`;
  const pageUrl = `${SITE}${canonical}`;

  const trendAnswer =
    detail.trendPercent > 0
      ? `${flatName} resale prices in ${townName} have risen about ${detail.trendPercent.toFixed(1)}% per square foot over the last 12 months versus the year before.`
      : detail.trendPercent < 0
        ? `${flatName} resale prices in ${townName} have eased about ${Math.abs(detail.trendPercent).toFixed(1)}% per square foot over the last 12 months versus the year before.`
        : `${flatName} resale prices in ${townName} have held broadly steady over the last 12 months.`;

  const faqEntries: { question: string; answer: string }[] = [
    {
      question: `What is the median resale price of a ${flatName} flat in ${townName}?`,
      answer: `The median ${flatName} resale flat in ${townName} sold for ${formatFull(detail.medianPrice)}, about $${detail.medianPsf} per square foot, based on ${detail.count12m} sales in the last 12 months.`,
    },
    {
      question: `How much should I offer for a ${flatName} flat in ${townName}?`,
      answer: `Recent ${flatName} sales in ${townName} mostly landed between ${formatFull(detail.p25Price)} and ${formatFull(detail.p75Price)}, with a median of ${formatFull(detail.medianPrice)}. A fair opening offer usually sits a little under the median; the exact opening, target, and ceiling depend on the block, floor, remaining lease, and condition. Run the property through the SGHaus offer tool for a personalised range.`,
    },
    {
      question: `Are ${flatName} flats in ${townName} getting more expensive?`,
      answer: trendAnswer,
    },
  ];
  if (detail.medianSqft > 0) {
    faqEntries.push({
      question: `How big is a ${flatName} flat in ${townName}?`,
      answer: `A typical ${flatName} flat in ${townName} is around ${detail.medianSqft.toLocaleString()} square feet, based on recent resale sales. Around ${detail.medianLease} years of lease remain on the median flat.`,
    });
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Towns", item: `${SITE}/towns` },
      { "@type": "ListItem", position: 3, name: townName, item: `${SITE}/towns/${townSlug}` },
      { "@type": "ListItem", position: 4, name: `${flatName} prices`, item: pageUrl },
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
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${flatName} resale prices in ${townName}`,
    description: `Median price, price range, recent sales, and offer guidance for ${flatName} resale flats in ${townName}, from ${detail.count12m} recent sales.`,
    datePublished: CONTENT_PUBLISHED,
    dateModified: CONTENT_MODIFIED,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    image: `${SITE}/logo-square.svg`,
    author: { "@type": "Organization", name: "SGHaus", url: SITE },
    publisher: {
      "@type": "Organization",
      name: "SGHaus",
      logo: { "@type": "ImageObject", url: `${SITE}/logo-square.svg` },
    },
  };

  const otherFlats = FLAT_TYPES.filter((ft) => ft !== flatUpper);

  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Header />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-8 sm:px-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate">
          <Link href="/towns" className="transition-colors hover:text-forest">All Towns</Link>
          <span className="mx-2">/</span>
          <Link href={`/towns/${townSlug}`} className="transition-colors hover:text-forest">{townName}</Link>
          <span className="mx-2">/</span>
          <span className="text-charcoal">{flatName}</span>
        </nav>

        {/* Title + answer-first lead */}
        <div className="mb-8">
          <h1 className="font-display text-3xl text-charcoal sm:text-4xl">
            {flatName} Resale Prices in {townName}
          </h1>
          <p className="mt-2 text-sm text-slate">
            Updated {generatedDate} &middot; {detail.count12m.toLocaleString()} sales in the last 12 months
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-charcoal">
            The median {flatName} resale flat in {townName} sold for{" "}
            <span className="font-semibold text-forest">{formatFull(detail.medianPrice)}</span>{" "}
            (about ${detail.medianPsf} per square foot) over the last 12 months. Most
            recent sales landed between {formatFull(detail.p25Price)} and {formatFull(detail.p75Price)}.
          </p>
        </div>

        {/* Stat cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Median Price</p>
            <p className="mt-1 font-display text-2xl text-charcoal">{formatPrice(detail.medianPrice)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Median PSF</p>
            <p className="mt-1 font-display text-2xl text-charcoal">${detail.medianPsf}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">12m Trend</p>
            <p className={`mt-1 font-display text-2xl ${trend.color}`}>{trend.label}</p>
          </div>
          <div className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Recent Sales</p>
            <p className="mt-1 font-display text-2xl text-charcoal">{detail.count12m.toLocaleString()}</p>
          </div>
        </div>

        {/* Price range */}
        <div className="mb-8 rounded-xl border border-border bg-white p-4 sm:p-6">
          <h2 className="font-display text-lg text-charcoal">What {flatName} flats sell for in {townName}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Over the last 12 months, {flatName} resale flats in {townName} sold from{" "}
            {formatFull(detail.minPrice)} to {formatFull(detail.maxPrice)}. The middle half of sales
            (the 25th to 75th percentile) fell between {formatFull(detail.p25Price)} and{" "}
            {formatFull(detail.p75Price)}, so a price in that band is broadly in line with the market.
            A typical unit is around {detail.medianSqft.toLocaleString()} sq ft with about{" "}
            {detail.medianLease} years of lease left.
          </p>
        </div>

        {/* Recent comparable sales */}
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
            <h2 className="font-display text-lg text-charcoal">Recent {flatName} sales in {townName}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-4 py-3 sm:px-6">Sold</th>
                  <th className="px-4 py-3 sm:px-6">Block &amp; Street</th>
                  <th className="px-4 py-3 text-right sm:px-6">Storey</th>
                  <th className="px-4 py-3 text-right sm:px-6">Sq ft</th>
                  <th className="px-4 py-3 text-right sm:px-6">Lease</th>
                  <th className="px-4 py-3 text-right sm:px-6">Price</th>
                  <th className="px-4 py-3 text-right sm:px-6">PSF</th>
                </tr>
              </thead>
              <tbody>
                {detail.comps.map((c, i) => (
                  <tr key={`${c.block}-${c.month}-${i}`} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-slate sm:px-6">{formatMonth(c.month)}</td>
                    <td className="px-4 py-3 font-medium text-charcoal sm:px-6">Blk {c.block} {c.street}</td>
                    <td className="px-4 py-3 text-right text-slate sm:px-6">{c.storeyRange}</td>
                    <td className="px-4 py-3 text-right text-slate sm:px-6">{c.floorAreaSqft.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate sm:px-6">{c.remainingLeaseYears}y</td>
                    <td className="px-4 py-3 text-right font-medium text-charcoal sm:px-6">{formatFull(c.resalePrice)}</td>
                    <td className="px-4 py-3 text-right text-charcoal sm:px-6">${c.pricePsf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Offer guidance CTA */}
        <div className="mb-8 rounded-xl border border-border bg-white p-6 text-center sm:p-8">
          <h2 className="font-display text-xl text-charcoal sm:text-2xl">
            What should you offer for a {flatName} in {townName}?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate">
            The median is a starting point, not your number. SGHaus turns the actual block,
            floor, lease, and condition into a data-backed opening bid, target price, and hard
            ceiling in minutes.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/buy" className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
              Get your offer range
            </Link>
            <Link href="/guides/how-much-to-offer-for-an-hdb-resale-flat" className="inline-block rounded-lg border border-forest px-6 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5">
              How to offer, explained
            </Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-mist px-4 py-3 sm:px-6">
            <h2 className="font-display text-lg text-charcoal">
              Common questions: {flatName} flats in {townName}
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

        {/* Other flat types in this town */}
        <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
          <h2 className="font-display text-lg text-charcoal">Other flat types in {townName}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/towns/${townSlug}`} className="rounded-lg border border-border px-3 py-1.5 text-sm text-forest transition-colors hover:bg-forest/5">
              All {townName} prices
            </Link>
            {otherFlats.map((ft) => (
              <Link
                key={ft}
                href={`/towns/${townSlug}/${flatTypeToSlug(ft)}`}
                className="rounded-lg border border-border px-3 py-1.5 text-sm text-forest transition-colors hover:bg-forest/5"
              >
                {flatTypeDisplay(ft)} in {townName}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
