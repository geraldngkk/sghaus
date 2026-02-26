"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
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
  const mode = searchParams.get("mode") === "sell" ? "sell" : "buy";
  const isSeller = mode === "sell";

  // Shared fields
  const [useful, setUseful] = useState("");
  const [email, setEmail] = useState("");
  const [comments, setComments] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Buyer-specific fields
  const [madeOffer, setMadeOffer] = useState("");
  const [accepted, setAccepted] = useState("");
  const [finalPrice, setFinalPrice] = useState("");

  // Seller-specific fields
  const [listed, setListed] = useState("");
  const [sold, setSold] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [timeToSell, setTimeToSell] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");

    const result = await submitOutcome({
      mode,
      block,
      street,
      // Buyer fields
      madeOffer: isSeller ? "" : madeOffer,
      accepted: isSeller ? "" : accepted,
      finalPrice: isSeller ? "" : finalPrice,
      // Seller fields
      listed: isSeller ? listed : "",
      sold: isSeller ? sold : "",
      salePrice: isSeller ? salePrice : "",
      timeToSell: isSeller ? timeToSell : "",
      // Shared
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

  // Primary action answered?
  const primaryAnswered = isSeller ? !!listed : !!madeOffer;

  return (
    <main className="min-h-screen flex flex-col bg-fog">
      <Header />

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
              You analysed <strong className="text-charcoal">{propertyLabel}</strong>
              {isSeller ? " for sale" : ""}.
              Tell us what happened. Your outcome helps us make SGHaus more
              accurate for the next {isSeller ? "seller" : "buyer"}.
            </>
          ) : (
            <>
              Tell us how your {isSeller ? "sale" : "property search"} went.
              Your outcome helps us refine our pricing model for the
              next {isSeller ? "seller" : "buyer"}.
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
          ) : isSeller ? (
            <SellerForm
              listed={listed}
              setListed={setListed}
              sold={sold}
              setSold={setSold}
              salePrice={salePrice}
              setSalePrice={setSalePrice}
              timeToSell={timeToSell}
              setTimeToSell={setTimeToSell}
              useful={useful}
              setUseful={setUseful}
              email={email}
              setEmail={setEmail}
              comments={comments}
              setComments={setComments}
              state={state}
              errorMsg={errorMsg}
              primaryAnswered={primaryAnswered}
              onSubmit={handleSubmit}
            />
          ) : (
            <BuyerForm
              madeOffer={madeOffer}
              setMadeOffer={setMadeOffer}
              accepted={accepted}
              setAccepted={setAccepted}
              finalPrice={finalPrice}
              setFinalPrice={setFinalPrice}
              useful={useful}
              setUseful={setUseful}
              email={email}
              setEmail={setEmail}
              comments={comments}
              setComments={setComments}
              state={state}
              errorMsg={errorMsg}
              primaryAnswered={primaryAnswered}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-sm transition-all ${
        selected
          ? "border-forest bg-mist text-forest font-semibold"
          : "border-border bg-white text-slate hover:border-forest/40 hover:text-charcoal"
      }`}
    >
      {label}
    </button>
  );
}

function UsefulField({
  useful,
  setUseful,
  questionNum,
}: {
  useful: string;
  setUseful: (v: string) => void;
  questionNum: number;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-charcoal">
        {questionNum}. Were the SGHaus pricing numbers useful?
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {["Very useful", "Somewhat useful", "Not really", "Didn't use them"].map(
          (opt) => (
            <OptionButton
              key={opt}
              label={opt}
              selected={useful === opt}
              onClick={() => setUseful(opt)}
            />
          ),
        )}
      </div>
    </fieldset>
  );
}

function SharedFields({
  email,
  setEmail,
  comments,
  setComments,
  state,
  errorMsg,
  primaryAnswered,
}: {
  email: string;
  setEmail: (v: string) => void;
  comments: string;
  setComments: (v: string) => void;
  state: FormState;
  errorMsg: string;
  primaryAnswered: boolean;
}) {
  return (
    <>
      {/* Email (optional) */}
      <div>
        <label
          htmlFor="outcome-email"
          className="block text-sm font-medium text-charcoal"
        >
          Email <span className="font-normal text-slate">(optional)</span>
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
        disabled={state === "submitting" || !primaryAnswered}
        className="rounded-[10px] bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-forest/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "Submitting..." : "Share Your Result"}
      </button>

      <p className="text-xs text-slate/50">
        All responses are anonymised and used only to improve our pricing model.
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Buyer form
// ---------------------------------------------------------------------------

function BuyerForm({
  madeOffer,
  setMadeOffer,
  accepted,
  setAccepted,
  finalPrice,
  setFinalPrice,
  useful,
  setUseful,
  email,
  setEmail,
  comments,
  setComments,
  state,
  errorMsg,
  primaryAnswered,
  onSubmit,
}: {
  madeOffer: string;
  setMadeOffer: (v: string) => void;
  accepted: string;
  setAccepted: (v: string) => void;
  finalPrice: string;
  setFinalPrice: (v: string) => void;
  useful: string;
  setUseful: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  comments: string;
  setComments: (v: string) => void;
  state: FormState;
  errorMsg: string;
  primaryAnswered: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Q1: Made an offer? */}
      <fieldset>
        <legend className="block text-sm font-medium text-charcoal">
          1. Did you make an offer on this flat?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Yes", "No", "Still deciding"].map((opt) => (
            <OptionButton
              key={opt}
              label={opt}
              selected={madeOffer === opt}
              onClick={() => setMadeOffer(opt)}
            />
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
            {["Yes, accepted", "No, rejected", "Counter-offered", "Pending"].map(
              (opt) => (
                <OptionButton
                  key={opt}
                  label={opt}
                  selected={accepted === opt}
                  onClick={() => setAccepted(opt)}
                />
              ),
            )}
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
      <UsefulField
        useful={useful}
        setUseful={setUseful}
        questionNum={madeOffer === "Yes" ? 4 : 2}
      />

      <SharedFields
        email={email}
        setEmail={setEmail}
        comments={comments}
        setComments={setComments}
        state={state}
        errorMsg={errorMsg}
        primaryAnswered={primaryAnswered}
      />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Seller form
// ---------------------------------------------------------------------------

function SellerForm({
  listed,
  setListed,
  sold,
  setSold,
  salePrice,
  setSalePrice,
  timeToSell,
  setTimeToSell,
  useful,
  setUseful,
  email,
  setEmail,
  comments,
  setComments,
  state,
  errorMsg,
  primaryAnswered,
  onSubmit,
}: {
  listed: string;
  setListed: (v: string) => void;
  sold: string;
  setSold: (v: string) => void;
  salePrice: string;
  setSalePrice: (v: string) => void;
  timeToSell: string;
  setTimeToSell: (v: string) => void;
  useful: string;
  setUseful: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  comments: string;
  setComments: (v: string) => void;
  state: FormState;
  errorMsg: string;
  primaryAnswered: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const showFollowUp = listed === "Yes, listed" || listed === "Yes, sold";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Q1: Have you listed or sold? */}
      <fieldset>
        <legend className="block text-sm font-medium text-charcoal">
          1. Have you listed or sold this flat?
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {["Yes, listed", "Yes, sold", "Not yet", "Decided not to sell"].map(
            (opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={listed === opt}
                onClick={() => setListed(opt)}
              />
            ),
          )}
        </div>
      </fieldset>

      {/* Q2: Sale status (conditional) */}
      {listed === "Yes, listed" && (
        <fieldset>
          <legend className="block text-sm font-medium text-charcoal">
            2. Have you received any offers?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Yes, accepted an offer",
              "Yes, still negotiating",
              "No offers yet",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={sold === opt}
                onClick={() => setSold(opt)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* Q3: Final sale price (conditional) */}
      {showFollowUp && (
        <div>
          <label
            htmlFor="salePrice"
            className="block text-sm font-medium text-charcoal"
          >
            {listed === "Yes, sold" ? "2" : "3"}. What was the final sale price?
          </label>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate">
              $
            </span>
            <input
              id="salePrice"
              type="text"
              inputMode="numeric"
              value={salePrice}
              onChange={(e) =>
                setSalePrice(e.target.value.replace(/[^0-9]/g, ""))
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

      {/* Q4: Time to sell (conditional) */}
      {showFollowUp && (
        <fieldset>
          <legend className="block text-sm font-medium text-charcoal">
            {listed === "Yes, sold" ? "3" : "4"}. How long did the process take?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Less than 2 weeks",
              "2 to 4 weeks",
              "1 to 3 months",
              "More than 3 months",
            ].map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                selected={timeToSell === opt}
                onClick={() => setTimeToSell(opt)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {/* Were SGHaus numbers useful? */}
      <UsefulField
        useful={useful}
        setUseful={setUseful}
        questionNum={
          listed === "Yes, sold" ? 4 :
          showFollowUp ? 5 :
          2
        }
      />

      <SharedFields
        email={email}
        setEmail={setEmail}
        comments={comments}
        setComments={setComments}
        state={state}
        errorMsg={errorMsg}
        primaryAnswered={primaryAnswered}
      />
    </form>
  );
}
