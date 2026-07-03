// Server Component: crawlable SEO/AEO content for the seller tool.
// Rendered inside the (client) sell page so it ships in the initial HTML.
// Includes an intro, answer-first FAQ, and inline HowTo + FAQPage JSON-LD.

interface Faq {
  q: string;
  a: string;
}

interface Step {
  name: string;
  text: string;
}

const INTRO =
  "SGHaus is a free pricing tool for HDB resale sellers. Enter your flat and you get three numbers grounded in real resale transactions: a floor price you should not drop below, a target that reflects fair value, and an opening ask to list at. It helps you price on the first try instead of chasing the market down with repeated cuts.";

const FAQS: Faq[] = [
  {
    q: "How should I price my HDB resale flat?",
    a: "Set three numbers before you list: a floor you will not go below, a target that reflects fair value, and an opening ask a little above target to leave room to negotiate. The target is the median of recent sales for your block and flat type, adjusted for your floor, remaining lease, and condition. List at the opening ask, expect offers to come in lower, and hold firm above your floor. SGHaus calculates all three from recent transactions.",
  },
  {
    q: "How much will I net after selling?",
    a: "Your net proceeds are the sale price minus selling costs, mainly agent commission (commonly around 2 percent if you engage an agent) and roughly a thousand dollars in legal fees. You also settle any outstanding mortgage and refund the CPF you used plus accrued interest, which goes back into your own CPF rather than out of pocket. SGHaus shows a net proceeds table at your floor, target, and opening ask, so you see your take-home at each price.",
  },
  {
    q: "How long do HDB resale flats take to sell?",
    a: "A fairly priced flat in a decent location often finds a buyer within a few weeks to a couple of months, while an overpriced one can sit for many months and end up selling for less after repeated cuts. The single biggest factor you control is the asking price. Pricing at or near fair value from day one draws more viewings and stronger offers than starting high and chasing the market down.",
  },
  {
    q: "Should I price above or below recent transactions?",
    a: "List a little above fair value, not far above it. A modest premium over recent sold prices gives you room to negotiate down toward your target while still signalling a serious price. Going well above recent transactions filters out genuine buyers and lets the flat go stale. SGHaus sets your opening ask just above fair value, so the listing draws offers instead of scaring them off.",
  },
  {
    q: "Do I need an agent to sell my HDB flat?",
    a: "No. You can sell without an agent and save the commission, though an agent handles viewings, paperwork, and negotiation, which is worth something if you are time-poor or unsure of the process. Either way, going in with a data-backed price keeps you in control of the number. SGHaus gives you the floor, target, and opening ask, so you can brief an agent or negotiate yourself from the same footing.",
  },
  {
    q: "Is SGHaus free for sellers?",
    a: "Yes. The seller pricing tool is completely free. Enter your flat and you get your floor price, target, and opening ask, plus a net proceeds breakdown, with no sign-up and no payment.",
  },
];

const HOWTO_STEPS: Step[] = [
  {
    name: "Enter your flat details",
    text: "Add the town, flat type, block or street, floor, floor area, and remaining lease of the flat you are selling.",
  },
  {
    name: "Review your three prices",
    text: "SGHaus returns a floor price you should not drop below, a target that reflects fair value, and an opening ask to list at.",
  },
  {
    name: "Check comparables and net proceeds",
    text: "See the recent sold prices behind the range and your take-home at each price after agent commission and legal fees.",
  },
  {
    name: "List at your opening ask",
    text: "Set the listing a little above fair value so you have room to negotiate down toward your target.",
  },
  {
    name: "Negotiate toward target, hold above floor",
    text: "Field offers, steer them toward your target price, and do not accept anything below your floor unless you need a fast sale.",
  },
];

const howToJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to price your HDB resale flat for sale",
  description:
    "A step-by-step guide to setting your floor price, target, and opening ask for an HDB resale flat using recent sold prices.",
  step: HOWTO_STEPS.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.name,
    text: s.text,
  })),
};

const faqJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function SellSeoContent() {
  return (
    <section className="border-t border-border bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-10 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl text-charcoal sm:text-3xl">
            Pricing your HDB resale flat for sale
          </h2>
          <p className="mt-3 text-slate leading-relaxed">{INTRO}</p>
        </div>

        <div className="mt-10 max-w-3xl">
          <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate">
            Common questions
          </h3>
          <dl className="mt-5 divide-y divide-border border-t border-border">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="py-6">
                <dt className="text-base font-semibold text-charcoal sm:text-lg">
                  {q}
                </dt>
                <dd className="mt-2 text-slate leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
