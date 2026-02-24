"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { submitOutcome } from "@/actions/submit-outcome";

type FormState = "idle" | "submitting" | "success" | "error";

export default function OutcomePage() {
  return (
    <Suspense>
      <OutcomePageInner />
    </Suspense>
  );
}

function OutcomePageInner() {
  const searchParams = useSearchParams();
  const block = searchParams.get("block") ?? "";
  const street = searchParams.get("street") ?? "";

  const [madeOffer, setMadeOffer] = useState("");
  const [accepted, setAccepted] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [useful, setUseful] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    const result = await submitOutcome({
      block,
      street,
      madeOffer,
      accepted,
      finalPrice,
      useful,
      email,
      comments,
    });

    if (result.success) {
      setState("success");
    } else {
      setState("error");
      setErrorMsg(result.error || "Something went wrong. Please try again.");
    }
  }

  const propertyLabel =
    block && street ? `Blk ${block} ${street}` : "your property";

  return (
    <main className="min-h-screen flex flex-col bg-fog">
      {/* Header */}
      <header className="sticky top-0 z-[200] border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-square.svg"
              alt=""
              width={28}
              height={28}
              className="rounded-[5px]"
            />
            <span className="font-display text-xl tracking-tight">
              <span className="text-forest">SG</span>
              <span className="text-charcoal">haus</span>
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-forest transition-colors hover:text-forest/80"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm font-medium text-slate transition-colors hover:text-charcoal"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-slate transition-colors hover:text-charcoal"
            >
              Contact
            </Link>
            <span className="rounded-full bg-mist px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-forest">
              Beta
            </span>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[720px] flex-1 px-5 py-16 sm:px-10 sm:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-forest">
          Outcome
        </p>
        <h1
          className="mt-2 font-display text-3xl text-charcoal sm:text-4xl"
          style={{ lineHeight: 1.15 }}
        >
          How did it go?
        </h1>
        <p
          className="mt-4 text-base text-slate leading-relaxed"
          style={{ maxWidth: "50ch" }}
        >
          {block && street ? (
            <>
              You analysed <strong className="text-charcoal">{propertyLabel}</strong>.
              Tell us what happened — your outcome helps us make SGHaus more
              accurate for the next buyer.
            </>
          ) : (
            <>
              Tell us how your property search went. Your outcome helps us
              refine our pricing model for the next buyer.
            </>
          )}
        </p>

        <div className="mt-10" style={{ maxWidth: "480px" }}>
          {state === "success" ? (
            <div className="rounded-xl border border-meadow/40 bg-mist/30 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white text-xl">
                &#10003;
              </div>
              <h2 className="mt-4 font-display text-xl text-charcoal">
                Thanks for sharing
              </h2>
              <p className="mt-2 text-sm text-slate">
                Your outcome is anonymised and helps improve our pricing model.
                Every data point makes SGHaus more accurate.
              </p>
              <Link
                href="/"
                className="mt-6 inline-block text-sm font-medium text-forest transition-colors hover:text-forest/80"
              >
                Back to SGHaus
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Q1: Made an offer? */}
              <fieldset>
                <legend className="block text-sm font-medium text-charcoal">
                  1. Did you make an offer on this flat?
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Yes", "No", "Still deciding"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setMadeOffer(opt)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                        madeOffer === opt
                          ? "border-forest bg-mist text-forest font-semibold"
                          : "border-border bg-white text-slate hover:border-forest/40 hover:text-charcoal"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Q2: Accepted? (conditional) */}
              {madeOffer === "Yes" && (
                <fieldset>
                  <legend className="block text-sm font-medium text-charcoal">
                    2. Was it accepted?
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      "Yes, accepted",
                      "No, rejected",
                      "Counter-offered",
                      "Pending",
                    ].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setAccepted(opt)}
                        className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                          accepted === opt
                            ? "border-forest bg-mist text-forest font-semibold"
                            : "border-border bg-white text-slate hover:border-forest/40 hover:text-charcoal"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Q3: Final price (conditional) */}
              {madeOffer === "Yes" && (
                <div>
                  <label
                    htmlFor="finalPrice"
                    className="block text-sm font-medium text-charcoal"
                  >
                    3. What was the final agreed price?
                  </label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate">
                      $
                    </span>
                    <input
                      id="finalPrice"
                      type="text"
                      inputMode="numeric"
                      value={finalPrice}
                      onChange={(e) =>
                        setFinalPrice(e.target.value.replace(/[^0-9]/g, ""))
                      }
                      placeholder="e.g. 590000"
                      className="w-full rounded-lg border border-border bg-white pl-8 pr-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate/60">
                    Leave blank if not finalised yet
                  </p>
                </div>
              )}

              {/* Q4: Were SGHaus numbers useful? */}
              <fieldset>
                <legend className="block text-sm font-medium text-charcoal">
                  {madeOffer === "Yes" ? "4" : "2"}. Were the SGHaus numbers
                  useful?
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    "Very useful",
                    "Somewhat useful",
                    "Not really",
                    "Didn't use them",
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setUseful(opt)}
                      className={`rounded-lg border px-4 py-2 text-sm transition-all ${
                        useful === opt
                          ? "border-forest bg-mist text-forest font-semibold"
                          : "border-border bg-white text-slate hover:border-forest/40 hover:text-charcoal"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Email (optional) */}
              <div>
                <label
                  htmlFor="outcome-email"
                  className="block text-sm font-medium text-charcoal"
                >
                  Email{" "}
                  <span className="font-normal text-slate">(optional)</span>
                </label>
                <input
                  id="outcome-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
                <p className="mt-1 text-xs text-slate/60">
                  Only if you&apos;d like us to follow up
                </p>
              </div>

              {/* Comments (optional) */}
              <div>
                <label
                  htmlFor="outcome-comments"
                  className="block text-sm font-medium text-charcoal"
                >
                  Anything else?{" "}
                  <span className="font-normal text-slate">(optional)</span>
                </label>
                <textarea
                  id="outcome-comments"
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any feedback, tips, or suggestions..."
                  className="mt-1.5 w-full resize-none rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-slate/50 outline-none transition-colors focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>

              {state === "error" && errorMsg && (
                <p className="text-sm text-[#EF4444]">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={state === "submitting" || !madeOffer}
                className="rounded-[10px] bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {state === "submitting" ? "Submitting..." : "Share Your Result"}
              </button>

              <p className="text-xs text-slate/50">
                All responses are anonymised and used only to improve our
                pricing model.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-forest mt-auto">
        <div className="mx-auto max-w-[1200px] px-5 py-8 sm:px-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg tracking-tight">
                <span className="text-white">SG</span>
                <span className="text-white/60">haus</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/60">
              <Link href="/" className="transition-colors hover:text-white">
                Home
              </Link>
              <Link href="/about" className="transition-colors hover:text-white">
                About
              </Link>
              <Link
                href="/contact"
                className="transition-colors hover:text-white"
              >
                Contact
              </Link>
            </div>
            <p className="text-xs text-white/40">Data source: data.gov.sg</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
