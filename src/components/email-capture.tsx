"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { AnalysisResult } from "@/types";
import type { UtmParams } from "@/lib/utm";
import { subscribeEmail } from "@/actions/subscribe";
import { sendReportEmail } from "@/actions/send-report-email";

const STORAGE_KEY = "sghaus-email-captured";

interface EmailCaptureProps {
  /** Delay in ms before showing the gate after mount */
  delayMs?: number;
  /** Analysis result to send via email on capture */
  result?: AnalysisResult | null;
  /** Controls copy tone: buyer sees "offer" language, seller sees "pricing" language */
  mode?: "buy" | "sell";
  /** UTM params to pass through to subscribe */
  utm?: UtmParams;
}

/**
 * Forced email capture gate.
 * Blurs the background and requires email submission before the user
 * can continue reading their analysis results.
 *
 * - Appears `delayMs` ms after mount (default 12s)
 * - Cannot be dismissed without submitting a valid email
 * - Skipped entirely if user already submitted email (localStorage)
 * - On success, blur lifts and reading continues
 */
export default function EmailCapture({ delayMs = 12_000, result, mode = "buy", utm }: EmailCaptureProps) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alreadyCaptured = useRef(false);

  // Check localStorage once on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) {
        alreadyCaptured.current = true;
      }
    } catch {}
  }, []);

  const openGate = useCallback(() => {
    if (alreadyCaptured.current) return;
    setShow(true);
    // Prevent background scrolling while gate is active
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    if (alreadyCaptured.current) return;
    timerRef.current = setTimeout(openGate, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [delayMs, openGate]);

  function unlock() {
    setShow(false);
    document.body.style.overflow = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const subResult = await subscribeEmail(email.trim(), utm);

    if (subResult.success) {
      setStatus("success");
      try {
        localStorage.setItem(STORAGE_KEY, email.trim());
      } catch {}
      alreadyCaptured.current = true;

      // Fire-and-forget: send the report email sequence via Resend
      if (result) {
        sendReportEmail(email.trim(), result, true, mode).catch(() => {});
      }
    } else {
      setStatus("error");
      setErrorMsg(subResult.error ?? "Something went wrong. Please try again.");
    }
  }

  if (!show) return null;

  return (
    <>
      {/* Full-screen blur overlay — no click-to-dismiss */}
      <div className="fixed inset-0 z-[300] bg-charcoal/60 backdrop-blur-md animate-[fadeIn_300ms_ease]" />

      {/* Modal — centred, no close button */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 animate-[slideUp_300ms_ease]">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Green accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-forest to-meadow" />

          <div className="px-7 pb-7 pt-6">
            {status === "success" ? (
              /* Success state — auto-dismiss after brief confirmation */
              <div className="text-center py-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-mist">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 font-display text-xl text-charcoal">
                  You&apos;re in.
                </h3>
                <p className="mt-2 text-sm text-slate">
                  {mode === "sell"
                    ? "We'll send your personalised pricing report to "
                    : "We'll send your personalised offer report to "}
                  <strong className="text-charcoal">{email}</strong>.
                </p>
                <button
                  onClick={unlock}
                  className="mt-5 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
                >
                  Continue reading
                </button>
              </div>
            ) : (
              /* Capture form — no close/dismiss option */
              <>
                <h3
                  className="font-display text-2xl text-charcoal"
                  style={{ lineHeight: 1.15 }}
                >
                  {mode === "sell"
                    ? "Your pricing range is ready."
                    : "Your offer range is ready."}
                </h3>
                <p className="mt-3 text-sm text-slate leading-relaxed">
                  {mode === "sell"
                    ? "Enter your email to unlock the full analysis: comparable sales, net proceeds breakdown, risk flags, and your personalised pricing strategy."
                    : "Enter your email to unlock the full analysis: comparable sales, cost breakdown, risk flags, and your personalised negotiation strategy."}
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal placeholder:text-slate/50 focus:border-forest focus:ring-1 focus:ring-forest"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="mt-3 w-full rounded-xl bg-forest py-3 text-sm font-semibold text-white transition-colors hover:bg-forest/90 disabled:opacity-60"
                  >
                    {status === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Unlock Full Analysis"
                    )}
                  </button>

                  {status === "error" && (
                    <p className="mt-2 text-xs text-[#EF4444]">{errorMsg}</p>
                  )}
                </form>

                <p className="mt-5 text-center text-[11px] text-slate/50">
                  {mode === "sell"
                    ? "No spam. Just your pricing report and market insights."
                    : "No spam. Just your offer report and negotiation scripts."}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
