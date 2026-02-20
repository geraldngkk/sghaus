"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { subscribeEmail } from "@/actions/subscribe";

const STORAGE_KEY = "sghaus-email-captured";

interface EmailCaptureProps {
  /** ID of the element to observe for scroll trigger */
  scrollTargetId?: string;
  /** Delay in ms before showing (timer trigger) */
  delayMs?: number;
}

export default function EmailCapture({
  scrollTargetId = "results",
  delayMs = 8000,
}: EmailCaptureProps) {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const triggered = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopup = useCallback(() => {
    if (triggered.current) return;

    // Don't show if already captured
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    triggered.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(true);
  }, []);

  useEffect(() => {
    // Check if already captured
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}

    // Timer trigger
    timerRef.current = setTimeout(openPopup, delayMs);

    // Scroll trigger via IntersectionObserver
    const target = document.getElementById(scrollTargetId);
    let observer: IntersectionObserver | null = null;

    if (target) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            openPopup();
            observer?.disconnect();
          }
        },
        { threshold: 0.15 },
      );
      observer.observe(target);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer?.disconnect();
    };
  }, [scrollTargetId, delayMs, openPopup]);

  function handleDismiss() {
    setShow(false);
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const result = await subscribeEmail(email.trim());

    if (result.success) {
      setStatus("success");
      try {
        localStorage.setItem(STORAGE_KEY, email.trim());
      } catch {}
    } else {
      setStatus("error");
      setErrorMsg(result.error ?? "Something went wrong. Please try again.");
    }
  }

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-charcoal/50 backdrop-blur-sm animate-[fadeIn_200ms_ease]"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[301] flex items-center justify-center p-4 animate-[slideUp_300ms_ease]">
        <div
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-md)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Green accent bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-forest to-meadow" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3.5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-slate transition-colors hover:bg-fog hover:text-charcoal"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1L13 13M13 1L1 13" />
            </svg>
          </button>

          <div className="px-7 pb-7 pt-6">
            {status === "success" ? (
              /* Success state */
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
                  We&apos;ll send your offer range to <strong className="text-charcoal">{email}</strong>.
                </p>
                <button
                  onClick={handleDismiss}
                  className="mt-5 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
                >
                  Back to analysis
                </button>
              </div>
            ) : (
              /* Form state */
              <>
                <h3
                  className="font-display text-2xl text-charcoal pr-8"
                  style={{ lineHeight: 1.15 }}
                >
                  Where should we send your offer range?
                </h3>
                <p className="mt-3 text-sm text-slate leading-relaxed">
                  We&apos;ll calculate your opening bid, target price, and hard ceiling
                  based on actual government transaction data and send it straight to you.
                </p>

                <form onSubmit={handleSubmit} className="mt-6">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      placeholder="Your email"
                      required
                      className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm text-charcoal placeholder:text-slate/50 focus:border-forest focus:ring-1 focus:ring-forest"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="shrink-0 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest/90 disabled:opacity-60"
                    >
                      {status === "loading" ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        "Calculate My Offer Range"
                      )}
                    </button>
                  </div>

                  {status === "error" && (
                    <p className="mt-2 text-xs text-[#EF4444]">{errorMsg}</p>
                  )}
                </form>

                <p className="mt-4 text-[11px] text-slate/60">
                  Used by buyers who don&apos;t want to overpay.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
