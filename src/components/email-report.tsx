"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";
import { sendReportEmail } from "@/actions/send-report-email";

interface EmailReportProps {
  result: AnalysisResult;
  mode: "buy" | "sell";
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Optional "Email me this report". Nothing pops up and nothing is required:
 * the person types an address and presses the button if they want a copy.
 */
export default function EmailReport({ result, mode }: EmailReportProps) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    const address = email.trim();
    const res = await sendReportEmail({
      email: address,
      input: result.input,
      renovationAnswers: result.renovation?.answers,
      mode,
      website,
    });
    if (res.success) {
      setSentTo(address);
      setStatus("sent");
    } else {
      setError(res.error ?? "We couldn't send the email just now. Please try again.");
      setStatus("error");
    }
  }

  // The server rebuilds the report from the inputs. A report saved before renovation
  // answers were stored would come back without the renovation adjustment shown here.
  const cannotRebuild = Boolean(result.renovation) && !result.renovation?.answers;

  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <h3 className="text-base font-semibold text-charcoal">Email me this report</h3>

      {cannotRebuild ? (
        <p className="mt-2 text-base text-slate">
          This saved report was made with an older version of SGHaus. Run the analysis again to email it.
        </p>
      ) : status === "sent" ? (
        <p className="mt-2 text-base text-slate" role="status">
          Sent to <strong className="text-charcoal">{sentTo}</strong>. Check your inbox in a minute or two.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3" noValidate>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="report-email" className="sr-only">
              Email address
            </label>
            <input
              id="report-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={status === "error"}
              aria-describedby="report-email-note report-email-error"
              className="min-h-11 flex-1 rounded-xl border border-border bg-white px-4 text-base text-charcoal placeholder:text-slate/60"
            />
            {/* Honeypot: hidden from people, often filled by bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />
            <button
              type="submit"
              disabled={status === "sending" || email.trim() === ""}
              className="min-h-11 rounded-xl bg-forest px-5 text-base font-semibold text-white disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send me the report"}
            </button>
          </div>
          {status === "error" && (
            <p id="report-email-error" className="mt-2 text-sm text-error" role="alert">
              {error}
            </p>
          )}
          <p id="report-email-note" className="mt-2 text-sm text-slate">
            We use your email only to send this report. To have it deleted, write to hello@sghaus.com.
          </p>
        </form>
      )}
    </div>
  );
}
