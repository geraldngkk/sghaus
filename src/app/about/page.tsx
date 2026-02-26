import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "About - SGHaus",
  description:
    "SGHaus helps Singapore homebuyers make data-driven offers on HDB resale flats using official transaction records and market intelligence.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-fog">
      <Header activeNav="about" />

      <div className="mx-auto max-w-[720px] px-5 py-16 sm:px-10 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">About</p>
        <h1
          className="mt-2 font-display text-3xl text-charcoal sm:text-4xl"
          style={{ lineHeight: 1.15 }}
        >
          Home is possible for everyone.
        </h1>

        <div className="mt-10 space-y-6 text-base text-slate leading-relaxed" style={{ maxWidth: "60ch" }}>
          <p>
            SGHaus was built with one belief: buying a home shouldn&apos;t be a guessing game.
            Too many first-time buyers walk into viewings without knowing what a fair price
            looks like, or go into negotiations armed with nothing but a listing agent&apos;s
            asking price.
          </p>

          <p>
            We collect data from various data sources and analyse them with our
            unique calculation formula to generate personalised offer strategies.
            For every property you&apos;re considering, SGHaus gives you three
            numbers: an opening bid, a target price, and a hard ceiling you
            should never cross.
          </p>

          <h2 className="font-display text-xl text-charcoal pt-4">How it works</h2>
          <ol className="space-y-3 pl-5 list-decimal marker:text-forest marker:font-semibold">
            <li>
              <strong className="text-charcoal">Comparable sales analysis</strong> :
              We find recent transactions for similar flats on the same street, in the same
              area, and town-wide, then tier them by relevance.
            </li>
            <li>
              <strong className="text-charcoal">Price adjustments</strong> :
              Each comparable is adjusted for storey height, remaining lease, and floor
              area differences so you&apos;re comparing like for like.
            </li>
            <li>
              <strong className="text-charcoal">3-tier offer strategy</strong> :
              Your opening bid (data-backed anchor), target price (fair market value),
              and hard ceiling (walk away above this) are calculated from the adjusted
              comparables.
            </li>
            <li>
              <strong className="text-charcoal">Risk assessment</strong> :
              Flags for lease decay, low liquidity, price trends, and upcoming BTO
              supply help you see what the numbers don&apos;t.
            </li>
          </ol>

          <h2 className="font-display text-xl text-charcoal pt-4">What we&apos;re not</h2>
          <p>
            SGHaus is not a property portal. We don&apos;t list properties or take commissions.
            We&apos;re an independent tool that helps both buyers and sellers make
            data-informed decisions. Whether you&apos;re buying or selling, our only job
            is to make sure you know the right number before you sit down at the table.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-white p-5">
            <p className="text-xs text-slate leading-relaxed">
              <strong className="text-charcoal">Disclaimer:</strong> SGHaus provides
              estimates based on official transaction records. This is not
              financial advice. Always conduct your own due diligence and consider
              consulting a licensed property agent before making purchase decisions.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
