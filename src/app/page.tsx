import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fog">
      <Header />

      <main className="flex-1">
        {/* Hero — full viewport minus header */}
        <section className="hero-landing relative flex min-h-[calc(100vh-64px)] items-center justify-center border-b border-border">
          {/* Dark overlay with forest gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A2E]/75 via-[#1A1A2E]/65 to-[#2D6A4F]/70" />

          <div className="relative mx-auto max-w-[1200px] px-5 py-16 text-center sm:px-10">
            {/* Headline */}
            <h1
              className="mx-auto max-w-[700px] font-display text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]"
              style={{ lineHeight: 1.1 }}
            >
              This is probably the biggest decision of your life.{" "}
              <span className="text-mist">Don&rsquo;t wing it.</span>
            </h1>

            {/* Two-path cards */}
            <div className="mx-auto mt-12 flex max-w-[600px] flex-col gap-4 sm:flex-row sm:gap-6">
              {/* Buy card */}
              <Link
                href="/buy"
                className="group flex-1 rounded-[14px] border border-border bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
              >
                <h2 className="text-[22px] font-semibold text-charcoal">
                  I&rsquo;m Buying
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate">
                  Stop guessing. Get a data-backed offer strategy.
                </p>
                <span className="mt-6 inline-flex w-full items-center justify-center rounded-[10px] bg-forest px-5 py-3 text-[15px] font-semibold text-white transition-colors group-hover:bg-forest/90">
                  Find my offer range
                </span>
              </Link>

              {/* Sell card */}
              <Link
                href="/sell"
                className="group flex-1 rounded-[14px] border border-border bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
              >
                <h2 className="text-[22px] font-semibold text-charcoal">
                  I&rsquo;m Selling
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-slate">
                  Stop underpricing. Know what your flat is really worth.
                </p>
                <span className="mt-6 inline-flex w-full items-center justify-center rounded-[10px] bg-forest px-5 py-3 text-[15px] font-semibold text-white transition-colors group-hover:bg-forest/90">
                  Price my flat
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust strip */}
        <section className="bg-fog">
          <div className="mx-auto max-w-[1200px] px-5 py-12 text-center sm:px-10">
            <p className="text-sm font-medium text-slate">
              53,000+ HDB sales analysed{" "}
              <span className="mx-2 text-border">&middot;</span>{" "}
              Free, no signup{" "}
              <span className="mx-2 text-border">&middot;</span>{" "}
              Results in 30 seconds
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
