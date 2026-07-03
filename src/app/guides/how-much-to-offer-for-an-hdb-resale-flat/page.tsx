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

const SLUG = "how-much-to-offer-for-an-hdb-resale-flat";
const TITLE = "How much should you offer for a Singapore house?";
const DESCRIPTION =
  "Base your offer on recent comparable sales, not the asking price. Set an opening bid, a target, and a hard ceiling, and know your full costs before you sign.";

export const metadata: Metadata = {
  title: "How Much to Offer for a Singapore House - SGHaus",
  description: DESCRIPTION,
  alternates: { canonical: `/guides/${SLUG}` },
};

const faqs = [
  {
    q: "Should I offer above the valuation?",
    a: "Only if the flat and location genuinely justify it and you have the spare cash. Anything above the valuation is Cash Over Valuation, paid entirely in cash on top of your deposit and stamp duty. It cannot be covered by a loan or by CPF.",
  },
  {
    q: "How far below the asking price should my first offer be?",
    a: "It depends on how far the asking sits above recent comparable sales. If the asking is already close to the going rate, a small discount is realistic. If it is well above, anchor closer to what similar flats actually sold for and justify it with the data.",
  },
  {
    q: "What if there are no recent sales in the exact block?",
    a: "Widen your net. Look at the blocks next door first, then the same town for the same flat type, similar storey, and similar remaining lease. A slightly wider comparison beats guessing from the asking price.",
  },
  {
    q: "Does a renovated flat justify a higher offer?",
    a: "Yes, within reason. A move-in-ready unit saves you renovation cost and time, so it can be worth more than a flat you plan to strip back. Just make sure the premium you pay is less than what the renovation would have cost you.",
  },
];

const jsonLd = buildGuideJsonLd({
  slug: SLUG,
  title: TITLE,
  description: DESCRIPTION,
  faqs,
});

export default function HowMuchToOfferGuide() {
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
          { label: "How much to offer" },
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
        Offer what similar flats have actually sold for recently, not the asking
        price. Build three numbers: an opening bid a few percent below the going
        rate for comparable units, a target at the fair value set by recent sales
        of similar flats, and a hard ceiling you refuse to cross. Anchor low,
        negotiate toward your target, and walk away above your ceiling. SGHaus
        works out all three for any block from real resale transactions.
      </AnswerCallout>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Start with comparable sales, not the asking price
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          The asking price is a starting position, often set high to leave room
          to negotiate. What matters is the going rate: what flats like the one
          you want have recently changed hands for. Pull recent sales of the same
          flat type in the same block or the blocks next door, then widen to the
          same town if there are too few. Compare on a per-square-foot basis so a
          larger or smaller unit does not throw the numbers off.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Adjust for the things that move price
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          No two flats are identical. Nudge your estimate up or down for storey
          height (higher floors usually command a premium), remaining lease (a
          shorter lease is worth less and limits how much CPF and loan you can
          use), floor area, and renovation and condition (a freshly done unit is
          worth more than one you will gut). Distance to an MRT station and daily
          amenities matters too. These adjustments turn raw comparables into a
          fair value for the specific unit in front of you.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Set three numbers, then hold the line
        </h2>
        <ul className="mt-4 space-y-3 text-base leading-relaxed text-slate">
          <li>
            <strong className="text-charcoal">Opening bid.</strong> A few percent
            below the going rate. It signals a serious, informed buyer and leaves
            room to negotiate up.
          </li>
          <li>
            <strong className="text-charcoal">Target price.</strong> The fair
            value from your adjusted comparables. This is the number you actually
            expect to pay.
          </li>
          <li>
            <strong className="text-charcoal">Hard ceiling.</strong> The most you
            will pay before the deal stops making sense. Above this, you walk.
            Decide it before you fall in love with the flat.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Watch the valuation and COV
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          For a resale flat, your loan and CPF are based on the official
          valuation, not on the price you agree. If you agree to pay more than the
          valuation, the difference is Cash Over Valuation, and it comes entirely
          from your own cash. Factor this in before you stretch. Our{" "}
          <Link
            href="/guides/what-is-cov-cash-over-valuation"
            className="font-medium text-forest underline decoration-forest/30 underline-offset-2 hover:decoration-forest"
          >
            guide to COV
          </Link>{" "}
          breaks down how it works and how to avoid overpaying it.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          Budget for the full cost, not just the price
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          The purchase price is only part of what leaves your account. Add
          Buyer&apos;s Stamp Duty (a progressive duty that rises with price),
          legal fees, a valuation fee, an optional buyer&apos;s agent commission,
          and renovation, which varies widely by flat age and how much you change.
          A flat you can afford on paper can still be a stretch once these land.
          Remember too that CPF can only be used when the remaining lease covers
          the youngest buyer to age 95, and lenders limit loans on flats with
          short remaining leases.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-charcoal sm:text-2xl">
          How to actually make the offer
        </h2>
        <p className="mt-3 text-base leading-relaxed text-slate">
          Once you and the seller agree on a price, the seller grants an Option to
          Purchase in exchange for an option fee, and you exercise that option
          within the option period. The Option locks in the price, so all your
          negotiating happens before you sign, not after. Do your sums first,
          decide your three numbers, and only then sit down at the table.
        </p>
      </section>

      <Faq items={faqs} />

      <GuideCta
        heading="See your three numbers for any flat"
        body="Enter a block and flat type and SGHaus returns an opening bid, a target price, and a hard ceiling, backed by recent comparable sales. Selling instead? Get a pricing report."
      />

      <RelatedGuides currentSlug={SLUG} />
    </GuideShell>
  );
}
