import Link from "next/link";
import type { ReactNode } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

/** Canonical origin, used only for absolute URLs inside structured data. */
export const SITE = "https://sghaus.com";

/** Single source of truth for the guide set (cards, cross-links, breadcrumbs). */
export const GUIDES = [
  {
    slug: "how-much-to-offer-for-an-hdb-resale-flat",
    crumb: "How much to offer",
    title: "How much should you offer for a Singapore house?",
    blurb:
      "Turn recent comparable sales into an opening bid, a target price, and a hard ceiling you never cross.",
  },
  {
    slug: "what-is-cov-cash-over-valuation",
    crumb: "What is COV",
    title: "What is COV (Cash Over Valuation)?",
    blurb:
      "The cash gap between your price and the valuation, why it exists, and how to avoid overpaying it.",
  },
  {
    slug: "bto-vs-resale-which-is-cheaper",
    crumb: "BTO vs resale",
    title: "BTO vs resale: which is cheaper?",
    blurb:
      "BTO wins on sticker price. Resale can still be the better deal once time, location, and lease are in.",
  },
] as const;

export type GuideSlug = (typeof GUIDES)[number]["slug"];

/** Page shell: brand background, shared header and footer, reading-width column. */
export function GuideShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-fog">
      <Header />
      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-12 sm:px-10 sm:py-16">
        {children}
      </div>
      <Footer />
    </main>
  );
}

/** Visible breadcrumb trail (matches the town page treatment). */
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav className="mb-6 text-sm text-slate" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="mx-2 text-border">/</span>}
          {item.href ? (
            <Link
              href={item.href}
              className="transition-colors hover:text-forest"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-charcoal">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** Answer-first callout: the decisive answer, up top, visually distinct. */
export function AnswerCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border border-meadow/40 bg-mist/50 p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">
        The short answer
      </p>
      <div className="mt-2 text-base leading-relaxed text-charcoal">
        {children}
      </div>
    </div>
  );
}

/** Renders an FAQ block. The same array feeds the FAQPage structured data. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl text-charcoal sm:text-2xl">
        Common questions
      </h2>
      <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {items.map((item) => (
          <div key={item.q} className="p-5 sm:p-6">
            <h3 className="font-display text-base text-charcoal sm:text-lg">
              {item.q}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Bottom-of-page conversion block linking into the tool. */
export function GuideCta({
  heading,
  body,
  buyLabel = "Get your buyer report",
  sellLabel = "Get your seller report",
  showSell = true,
}: {
  heading: string;
  body: string;
  buyLabel?: string;
  sellLabel?: string;
  showSell?: boolean;
}) {
  return (
    <div className="mt-12 rounded-xl border border-border bg-white p-6 text-center sm:p-8">
      <h2 className="font-display text-xl text-charcoal sm:text-2xl">{heading}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate">
        {body}
      </p>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/buy"
          className="inline-block rounded-lg bg-forest px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {buyLabel}
        </Link>
        {showSell && (
          <Link
            href="/sell"
            className="inline-block rounded-lg border border-forest px-6 py-2.5 text-sm font-medium text-forest transition-colors hover:bg-forest/5"
          >
            {sellLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

/** Internal-linking block: the other guides in the set. */
export function RelatedGuides({ currentSlug }: { currentSlug: GuideSlug }) {
  const others = GUIDES.filter((g) => g.slug !== currentSlug);
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl text-charcoal sm:text-2xl">
        Keep reading
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {others.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="group rounded-xl border border-border bg-white p-5 transition-colors hover:border-forest"
          >
            <h3 className="font-display text-base text-charcoal transition-colors group-hover:text-forest">
              {g.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{g.blurb}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Structured-data builder shared by every guide page. */
export function buildGuideJsonLd({
  slug,
  title,
  description,
  faqs,
}: {
  slug: GuideSlug;
  title: string;
  description: string;
  faqs: { q: string; a: string }[];
}) {
  const url = `${SITE}/guides/${slug}`;
  const crumb = GUIDES.find((g) => g.slug === slug)?.crumb ?? title;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: title,
      description,
      author: { "@type": "Organization", name: "SGHaus", url: SITE },
      publisher: {
        "@type": "Organization",
        name: "SGHaus",
        logo: {
          "@type": "ImageObject",
          url: `${SITE}/logo-square.svg`,
        },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      datePublished: "2026-07-03",
      dateModified: "2026-07-03",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: "Guides",
          item: `${SITE}/guides`,
        },
        { "@type": "ListItem", position: 3, name: crumb, item: url },
      ],
    },
  ];
}
