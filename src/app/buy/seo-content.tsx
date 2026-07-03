// Server Component: crawlable SEO/AEO content for the buyer tool.
// Rendered inside the (client) buy page so it ships in the initial HTML.
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
  "SGHaus is a free offer calculator for HDB resale buyers. Enter a listing and you get three numbers grounded in real resale transactions: an opening bid to start from, a target price that reflects fair value, and a hard ceiling you should not cross. It is built for first-time buyers and anyone who would rather negotiate from data than from the asking price.";

const FAQS: Faq[] = [
  {
    q: "How much should I offer for an HDB resale flat?",
    a: "Start below fair value, aim for fair value, and set a ceiling you will not cross. A sensible opening bid sits a few percent under the median of recent sales for the same block and flat type. Your target is that median, adjusted for floor level, remaining lease, and condition. Your ceiling is around the top quartile of comparable sales. SGHaus works out all three from recent transactions, so you anchor to real prices instead of the asking price.",
  },
  {
    q: "How much below valuation can I offer?",
    a: "Most flats today transact above the official valuation, so the real question is how your offer compares to recent sold prices, not to the valuation figure. A data-led opening bid usually sits a few percent under the median of recent comparable sales. If a flat needs renovation, sits on a low floor, or has a shorter remaining lease, a wider gap is justified. Anchor to what similar flats actually sold for, not to the seller's asking price.",
  },
  {
    q: "What is a fair COV right now?",
    a: "Cash over valuation is the cash you pay above a flat's official valuation, and it cannot be covered by your loan or CPF. A fair COV depends entirely on the town, flat type, and how hot demand is, so there is no single number. The honest way to gauge it is to look at what similar flats recently sold for and work backwards. SGHaus shows you the spread of recent transaction prices, so you can judge whether a seller's expected COV is in line with the market or ahead of it.",
  },
  {
    q: "Should I offer at, above, or below the asking price?",
    a: "Treat the asking price as one data point, not the anchor. Sellers set asking prices and they often sit above fair value, so matching them can mean overpaying. Open below fair value, negotiate toward your target, and walk away above your ceiling. SGHaus gives you those three numbers from recent sold prices, so the asking price stops driving your decision.",
  },
  {
    q: "How accurate is the offer range?",
    a: "The range is built from thousands of recent resale transactions for the same town and flat type, so it reflects what buyers and sellers are actually agreeing to right now, not list prices or opinions. It cannot see inside a specific unit, so it does not account for renovation quality, facing, view, or noise. Treat the three numbers as a data-backed starting point and adjust for what you find on your viewing.",
  },
  {
    q: "Is SGHaus free?",
    a: "Yes. SGHaus is completely free to use. Enter a listing and you get your opening bid, target price, and hard ceiling with no sign-up and no payment. You can also save reports and compare flats side by side at no cost.",
  },
];

const HOWTO_STEPS: Step[] = [
  {
    name: "Enter the listing details",
    text: "Add the town, flat type, block or street, floor, floor area, and remaining lease of the flat you are eyeing.",
  },
  {
    name: "Review your three offer prices",
    text: "SGHaus returns an opening bid to start from, a target price that reflects fair value, and a hard ceiling you should not cross.",
  },
  {
    name: "Check the comparable sales",
    text: "See the recent transactions for the same block and flat type that the range is built from, so you know it is grounded in real prices.",
  },
  {
    name: "Adjust for the specific unit",
    text: "Nudge your numbers for floor level, remaining lease, renovation condition, view, and facing that the data cannot see.",
  },
  {
    name: "Open low and negotiate to target",
    text: "Put in your opening bid, work toward your target price, and walk away if the seller holds firm above your ceiling.",
  },
];

const howToJsonLd: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to price your HDB resale offer",
  description:
    "A step-by-step guide to setting your opening bid, target price, and hard ceiling for an HDB resale flat using recent sold prices.",
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

export default function BuySeoContent() {
  return (
    <section className="border-t border-border bg-white">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-10 sm:py-16">
        <div className="max-w-3xl">
          <h2 className="font-display text-2xl text-charcoal sm:text-3xl">
            Making an offer on an HDB resale flat
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
