import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CountUp from "@/components/count-up";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <Header />

      <main className="flex-1">
        {/* Hero — drenched forest canvas, no photo overlay */}
        <section className="hero-drench relative overflow-hidden">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />

          <div className="relative mx-auto max-w-[1200px] px-5 pb-16 pt-16 sm:px-10 sm:pb-20 sm:pt-24 lg:pb-28 lg:pt-28">
            {/* Headline block */}
            <div className="max-w-3xl">
              <h1
                className="rise text-balance font-display text-white"
                style={{
                  fontSize: "clamp(2.5rem, 1.4rem + 4vw, 4.25rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.01em",
                }}
              >
                The biggest decision of your life.{" "}
                <span className="text-mist">Don&rsquo;t wing it.</span>
              </h1>

              <p
                className="rise mt-6 max-w-xl text-pretty text-lg leading-relaxed text-mist/85 sm:text-xl"
                style={{ "--rise-delay": "80ms" } as React.CSSProperties}
              >
                Real resale transactions, turned into three numbers you can act
                on. Where to start, what to pay, and exactly when to walk away.
              </p>
            </div>

            {/* Two doors */}
            <div
              className="rise mt-12 grid grid-cols-1 gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6"
              style={{ "--rise-delay": "160ms" } as React.CSSProperties}
            >
              {/* Buy */}
              <Link
                href="/buy"
                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-mist/15 bg-white p-7 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] sm:p-8"
              >
                <span className="absolute inset-x-0 top-0 h-1.5 bg-forest" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-forest">
                  I&rsquo;m buying
                </span>
                <h2 className="mt-3 font-display text-[1.75rem] leading-tight text-charcoal sm:text-[2rem]">
                  Know what to offer before you walk in
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">
                  Stop guessing against agents who do this for a living.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate">
                  <span className="rounded-full bg-fog px-3 py-1">Opening bid</span>
                  <span className="text-border">→</span>
                  <span className="rounded-full bg-mist/50 px-3 py-1 text-forest">Target price</span>
                  <span className="text-border">→</span>
                  <span className="rounded-full bg-fog px-3 py-1">Hard ceiling</span>
                </div>

                <span className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-forest">
                  Find my offer range
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">→</span>
                </span>
              </Link>

              {/* Sell */}
              <Link
                href="/sell"
                className="group relative flex flex-col overflow-hidden rounded-[20px] border border-mist/15 bg-white p-7 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] sm:p-8"
              >
                <span className="absolute inset-x-0 top-0 h-1.5 bg-amber" />
                <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[#C8741F]">
                  I&rsquo;m selling
                </span>
                <h2 className="mt-3 font-display text-[1.75rem] leading-tight text-charcoal sm:text-[2rem]">
                  Know what your flat is really worth
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-slate">
                  Price too high and it sits. Too low and you leave money behind.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate">
                  <span className="rounded-full bg-fog px-3 py-1">Floor price</span>
                  <span className="text-border">→</span>
                  <span className="rounded-full bg-amber-light px-3 py-1 text-[#C8741F]">Target</span>
                  <span className="text-border">→</span>
                  <span className="rounded-full bg-fog px-3 py-1">Opening ask</span>
                </div>

                <span className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-[#C8741F]">
                  Price my flat
                  <span className="transition-transform duration-300 ease-out group-hover:translate-x-1">→</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stat band */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-px overflow-hidden px-5 py-10 sm:grid-cols-3 sm:px-10">
            <Stat
              value={<CountUp value={53000} suffix="+" className="price-display" />}
              label="Resale sales analysed"
            />
            <Stat value={<span className="price-display">Free</span>} label="No signup, no catch" />
            <Stat
              value={<CountUp value={30} suffix="s" className="price-display" />}
              label="From flat to numbers"
            />
          </div>
        </section>

        {/* How it works — a real 3-step sequence */}
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-10 sm:py-20">
          <h2 className="max-w-2xl text-balance font-display text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)] leading-tight text-charcoal">
            Three steps to a number you can stand behind
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-3">
            <Step
              n={1}
              title="Tell us the flat"
              body="Town, type, block, floor, size. The details that actually move the price."
            />
            <Step
              n={2}
              title="We read the comparables"
              body="Recent sales of the most similar flats, weighted by how close they really are to yours."
            />
            <Step
              n={3}
              title="You get three numbers"
              body="An opening position, a fair target, and the ceiling where you walk away. With the reasoning behind each."
            />
          </ol>
        </section>

        {/* Closing CTA */}
        <section className="hero-drench relative overflow-hidden">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-10 sm:py-20">
            <h2 className="mx-auto max-w-2xl text-balance font-display text-[clamp(1.75rem,1.4rem+1.6vw,2.75rem)] leading-tight text-white">
              Walk into the negotiation knowing your numbers
            </h2>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="inline-flex w-full items-center justify-center rounded-xl bg-meadow px-6 py-3.5 text-[15px] font-semibold text-forest-deep transition-colors duration-200 hover:bg-mist sm:w-auto"
              >
                I&rsquo;m buying
              </Link>
              <Link
                href="/sell"
                className="inline-flex w-full items-center justify-center rounded-xl border border-mist/30 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-white/10 sm:w-auto"
              >
                I&rsquo;m selling
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="px-2 py-3 text-center sm:py-2">
      <div className="text-[2rem] leading-none text-charcoal sm:text-[2.5rem]">
        {value}
      </div>
      <div className="mt-2 text-sm text-slate">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="relative">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-mist/60 price-display text-lg text-forest">
        {n}
      </div>
      <h3 className="mt-5 text-lg font-bold text-charcoal">{title}</h3>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-slate">{body}</p>
    </li>
  );
}
