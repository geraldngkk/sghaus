import type { Metadata } from "next";
import Link from "next/link";
import {
  GuideShell,
  Breadcrumb,
  AnswerCallout,
  Faq,
  GuideCta,
  RelatedGuides,
  buildGuideJsonLd,
} from "../_components/guide-ui";

const SLUG = "bto-vs-resale-which-is-cheaper";
const TITLE = "BTO vs resale: which is cheaper?";
const DESCRIPTION =
  "BTO almost always wins on sticker price, but grants, renovation, waiting time, and lease can change the real answer. Here is how to compare the true cost.";

export const metadata: Metadata = {
  title: "BTO vs Resale: Which Is Cheaper? - SGHaus",
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
};

const faqs = [
  {
    q: "Is BTO always cheaper than resale?",
    a: "Usually on sticker price, yes. But grants, renovation, the cost of waiting, and the lease remaining can narrow the gap or even change which one is cheaper over the years you own it.",
  },
  {
    q: "Can I get a grant for a resale flat?",
    a: "Eligible first-timer households can, and it can meaningfully narrow the gap with BTO. Check your current eligibility before assuming resale is out of reach.",
  },
  {
    q: "Which one has the longer lease?",
    a: "A BTO flat starts fresh at 99 years. A resale flat has whatever is left, which can be much shorter and affects how much CPF and loan you can use.",
  },
  {
    q: "How long is the wait and the MOP?",
    a: "BTO construction typically takes several years, and a 5-year Minimum Occupation Period applies before you can sell or rent out the whole flat. Resale has no wait to move in.",
  },
];

const jsonLd = buildGuideJsonLd({
  slug: SLUG,
  title: TITLE,
  description: DESCRIPTION,
  faqs,
});

export default function BtoVsResaleGuide() {
  return (
    <GuideShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: "BTO vs resale" },
        ]}
      />

      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">
        Buyer guide
      </p>
      <h1
        className="mt-2 font-display text-3xl text-charcoal sm:text-4xl"
        style={{ lineHeight: 1.15 }}
      >
        {TITLE}
      </h1>

      <AnswerCallout>
        On sticker price, a BTO flat is almost always cheaper than a comparable
        resale flat, often by a wide margin, because it is sold below market rate.
        But cheaper upfront is not the full story. BTO means waiting several
        years, a fresh 99-year lease, and a 5-year minimum occupation period.
        Resale lets you move in now, pick a mature location, and see exactly what
        you are buying. If lowest price is all that matters, BTO wins. If timing,
        location, or certainty matter more, resale can be the better deal.
      </AnswerCallout>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Why BTO is cheaper on paper
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          BTO flats are sold at subsidised, below-market prices and can come with
          housing grants for eligible buyers. Resale prices are set by the open
          market, by what buyers and sellers actually agree. That structural gap
          is why a new flat almost always lists below a comparable resale unit in
          the same area.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          What BTO costs you in time and flexibility
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          The lower price comes with strings. You ballot for a chance to select,
          and demand in popular towns means you may not get it. Construction takes
          several years, during which you rent or stay with family. Once you
          collect keys, a 5-year Minimum Occupation Period applies before you can
          sell the flat or rent it out whole. And you are limited to wherever the
          launches happen to be.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          What resale gives you, and charges for
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Resale buys you certainty and choice. You move in now, in any town
          including mature estates near an MRT and amenities, and you see the
          actual unit, its condition, and its renovation before you commit. You
          pay for that with a market price, possibly some Cash Over Valuation, and
          a lease that has already been running, which affects how much CPF and
          loan you can use. Our{" "}
          <Link
            href="/guides/what-is-cov-cash-over-valuation"
            className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
          >
            COV guide
          </Link>{" "}
          explains that cash gap in full.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Grants and the real net price
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Do not compare sticker prices alone. Eligible first-timer households can
          receive housing grants that narrow the gap, and the grant available on a
          resale purchase can be substantial. Renovation matters too: a new BTO is
          a blank slate that often needs a full fit-out, while a resale flat may
          already be liveable or freshly done. Add the cost of waiting, whether
          that is rent or the opportunity cost of staying put, and the true gap
          between the two shrinks.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Which should you choose?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Choose BTO if the lowest possible price and a fresh full lease matter
          most, you can wait, and you are flexible on location. Choose resale if
          you need a home now, want a specific mature location, or value seeing the
          exact flat over saving on the sticker. Either way, run the total cost of
          ownership, not just the headline price, before you decide.
        </p>
      </section>

      <Faq items={faqs} />

      <GuideCta
        heading="Decided on resale? Price it right"
        body="SGHaus turns recent comparable sales into an opening bid, a target, and a ceiling for any resale flat. Selling your current place first? Get a pricing report."
      />

      <RelatedGuides currentSlug={SLUG} />
    </GuideShell>
  );
}
