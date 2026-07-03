import type { Metadata } from "next";
import Link from "next/link";
import {
  GUIDES,
  SITE,
  GuideShell,
  Breadcrumb,
} from "./_components/guide-ui";

export const metadata: Metadata = {
  title: "Singapore Home Guides - SGHaus",
  description:
    "Plain-English answers for HDB resale buyers and sellers: how much to offer, what COV really costs, and whether BTO or resale is cheaper.",
  alternates: { canonical: "/guides" },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Singapore Home Guides",
    description:
      "Answer-first guides for HDB resale buyers and sellers, from how much to offer to what Cash Over Valuation costs you.",
    url: `${SITE}/guides`,
    hasPart: GUIDES.map((g) => ({
      "@type": "Article",
      name: g.title,
      url: `${SITE}/guides/${g.slug}`,
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE}/guides` },
    ],
  },
];

export default function GuidesHubPage() {
  return (
    <GuideShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Guides" }]} />

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">
        Guides
      </p>
      <h1
        className="mt-2 font-display text-3xl text-charcoal sm:text-4xl"
        style={{ lineHeight: 1.15 }}
      >
        Singapore home guides
      </h1>
      <p
        className="mt-4 text-base leading-relaxed text-slate"
        style={{ maxWidth: "60ch" }}
      >
        Plain answers to the questions buyers and sellers actually ask, from how
        much to offer to what Cash Over Valuation really costs you. Each guide
        gives you the decisive answer first, then the detail. When you want the
        numbers on a specific flat, run the tool.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group flex flex-col rounded-xl border border-border bg-white p-6 transition-colors hover:border-forest"
          >
            <h2 className="font-display text-lg text-charcoal transition-colors group-hover:text-forest sm:text-xl">
              {g.title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">
              {g.blurb}
            </p>
            <span className="mt-4 text-sm font-medium text-forest">
              Read guide &rarr;
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-border bg-white p-6 text-center sm:p-8">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Ready for numbers on a real flat?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate">
          Get three data-backed prices for any block: an opening bid, a target,
          and a hard ceiling. Selling instead? Get a pricing report for your
          flat.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/buy"
            className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Get your buyer report
          </Link>
          <Link
            href="/sell"
            className="inline-block rounded-lg border border-forest px-6 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
          >
            Get your seller report
          </Link>
        </div>
      </div>
    </GuideShell>
  );
}
