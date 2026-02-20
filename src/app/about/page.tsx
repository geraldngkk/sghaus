import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — SGHaus",
  description:
    "SGHaus helps Singapore homebuyers make data-driven offers on HDB resale flats using real government transaction data.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-fog">
      {/* Header */}
      <header className="sticky top-0 z-[200] border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-square.svg" alt="" width={28} height={28} className="rounded-[5px]" />
            <span className="font-display text-xl tracking-tight">
              <span className="text-forest">SG</span>
              <span className="text-charcoal">haus</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-forest transition-colors hover:text-forest/80">
              Home
            </Link>
            <span className="text-xs font-medium text-slate">Beta</span>
          </nav>
        </div>
      </header>

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
            We use publicly available HDB resale transaction data from{" "}
            <a href="https://data.gov.sg" target="_blank" rel="noopener noreferrer" className="text-forest underline underline-offset-2 hover:text-forest/80">
              data.gov.sg
            </a>{" "}
            to generate personalised offer strategies. For every property you&apos;re
            considering, SGHaus gives you three numbers: an opening bid, a target price,
            and a hard ceiling you should never cross.
          </p>

          <h2 className="font-display text-xl text-charcoal pt-4">How it works</h2>
          <ol className="space-y-3 pl-5 list-decimal marker:text-forest marker:font-semibold">
            <li>
              <strong className="text-charcoal">Comparable sales analysis</strong> &mdash;
              We find recent transactions for similar flats on the same street, in the same
              area, and town-wide, then tier them by relevance.
            </li>
            <li>
              <strong className="text-charcoal">Price adjustments</strong> &mdash;
              Each comparable is adjusted for storey height, remaining lease, and floor
              area differences so you&apos;re comparing like for like.
            </li>
            <li>
              <strong className="text-charcoal">3-tier offer strategy</strong> &mdash;
              Your opening bid (data-backed anchor), target price (fair market value),
              and hard ceiling (walk away above this) are calculated from the adjusted
              comparables.
            </li>
            <li>
              <strong className="text-charcoal">Risk assessment</strong> &mdash;
              Flags for lease decay, low liquidity, price trends, and upcoming BTO
              supply help you see what the numbers don&apos;t.
            </li>
          </ol>

          <h2 className="font-display text-xl text-charcoal pt-4">What we&apos;re not</h2>
          <p>
            SGHaus is not a property portal. We don&apos;t list properties, represent sellers,
            or take commissions. We&apos;re a tool that sits entirely on the buyer&apos;s side
            of the table. Our only job is to make sure you know what to offer before you
            walk in.
          </p>

          <div className="mt-8 rounded-xl border border-border bg-white p-5">
            <p className="text-xs text-slate leading-relaxed">
              <strong className="text-charcoal">Disclaimer:</strong> SGHaus provides
              estimates based on publicly available transaction data. This is not
              financial advice. Always conduct your own due diligence and consider
              consulting a licensed property agent before making purchase decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-forest">
        <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg tracking-tight">
                <span className="text-white">SG</span>
                <span className="text-white/60">haus</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/" className="transition-colors hover:text-white">Home</Link>
              <Link href="/about" className="transition-colors hover:text-white">About</Link>
            </div>
            <p className="text-xs text-white/40">
              Data source: data.gov.sg
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
