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

const SLUG = "what-is-cov-cash-over-valuation";
const TITLE = "What is COV (Cash Over Valuation)?";
const DESCRIPTION =
  "COV is the cash gap between your agreed resale price and the official valuation. Here is how it works, why it exists, and how to avoid overpaying it.";

export const metadata: Metadata = {
  title: "What is COV (Cash Over Valuation)? - SGHaus",
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
};

const faqs = [
  {
    q: "Is COV legal?",
    a: "Yes. COV is simply paying more than the valuation, in cash. It is common in sought-after areas where strong demand pushes agreed prices above valuations.",
  },
  {
    q: "Can I use my CPF or a loan to pay COV?",
    a: "No. Your loan and CPF are both capped at the official valuation, so COV is paid entirely from your own cash savings.",
  },
  {
    q: "How do I know the COV before I commit?",
    a: "You usually request the valuation after securing the Option to Purchase, so you cannot know it exactly up front. Estimate it by comparing the asking price against what similar flats have recently sold for.",
  },
  {
    q: "Does every resale flat have COV?",
    a: "No. If the agreed price is at or below the valuation, there is no COV. In a soft market you may even buy below valuation.",
  },
];

const jsonLd = buildGuideJsonLd({
  slug: SLUG,
  title: TITLE,
  description: DESCRIPTION,
  faqs,
});

export default function CovGuide() {
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
          { label: "What is COV" },
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
        COV is the gap between the price you agree to pay for a resale flat and
        its official valuation, and you pay that gap in cash. Buyers negotiate the
        price first, then request the valuation, so COV only appears when the
        agreed price lands above the valuation. It cannot be covered by your loan
        or CPF, so a high COV is pure cash out of pocket on top of your deposit
        and stamp duty.
      </AnswerCallout>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          How COV actually works
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          When you buy a resale flat, your loan amount and the CPF you can use are
          both based on the flat&apos;s official valuation, not on the price you
          negotiate. You agree a price with the seller, secure the Option to
          Purchase, then request a valuation. If the agreed price comes in above
          the valuation, that difference is the COV, and you top it up in cash. If
          the price is at or below the valuation, there is no COV.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Why buyers negotiate the price first
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          The process is set up so the price is negotiated before the valuation is
          known. That means COV is no longer a figure sellers can advertise up
          front. It is simply the outcome of agreeing a price that happens to sit
          above the valuation. In a hot area with strong demand, agreed prices
          drift above valuations and COV appears. In a soft market it can shrink
          to zero, or you may even buy below valuation.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Why COV matters to your cash pile
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Because your loan and CPF are capped at the valuation, every dollar of
          COV comes from your own savings. It stacks on top of your down payment,
          Buyer&apos;s Stamp Duty, legal fees, and renovation budget. Two flats at
          the same price can demand very different amounts of upfront cash if one
          carries a big COV and the other none. This is the number that quietly
          breaks budgets, so plan for it early.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          How to avoid overpaying COV
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Base your offer on what comparable flats have recently sold for, not on
          the asking price. If the asking implies a large gap over the likely
          valuation, negotiate down or walk. Knowing the going rate for the block
          before you commit is the single best defence against paying more COV
          than a flat is worth. Our{" "}
          <Link
            href="/guides/how-much-to-offer-for-an-hdb-resale-flat"
            className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
          >
            offer guide
          </Link>{" "}
          shows how to set an opening bid, a target, and a ceiling from the data.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          What COV means if you are selling
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          You cannot advertise a COV, and pricing above the likely valuation
          narrows your pool to buyers with spare cash. Price too far above the
          going rate and viewings dry up. A realistic ask, backed by recent sales,
          sells faster than a hopeful one. If you are selling, a{" "}
          <Link
            href="/sell"
            className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
          >
            pricing report
          </Link>{" "}
          shows you where the market actually is.
        </p>
      </section>

      <Faq items={faqs} />

      <GuideCta
        heading="Know the going rate before you talk COV"
        body="SGHaus turns recent comparable sales into a fair price for any block, so you can spot an inflated ask before it costs you. Buying or selling, start with the number."
      />

      <RelatedGuides currentSlug={SLUG} />
    </GuideShell>
  );
}
