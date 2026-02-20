"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

interface ShareReportProps {
  result: AnalysisResult;
}

function buildShareText(result: AnalysisResult): string {
  const { input, offer, marketContext } = result;
  const lines = [
    `SGHaus Offer Analysis`,
    `${input.flatType} at ${input.streetName}, ${input.town}`,
    ``,
    `Opening Bid: ${formatPrice(offer.low)}`,
    `Target Price: ${formatPrice(offer.mid)}`,
    `Hard Ceiling: ${formatPrice(offer.max)}`,
    ``,
    `Town median: ${formatPrice(marketContext.medianPrice)} | Trend: ${
      marketContext.trendDirection === "up"
        ? "+"
        : marketContext.trendDirection === "down"
          ? ""
          : ""
    }${marketContext.trendPercentage.toFixed(1)}% YoY`,
    ``,
    `Powered by sghaus.com`,
  ];
  return lines.join("\n");
}

export default function ShareReport({ result }: ShareReportProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = buildShareText(result);

    // Try native share API first (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `SGHaus — ${result.input.flatType} at ${result.input.streetName}`,
          text,
        });
        return;
      } catch {
        // User cancelled or API not available — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Last resort: select a textarea
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-slate transition-colors hover:border-charcoal hover:text-charcoal"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-forest"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-forest font-medium">Copied to clipboard</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Share Report</span>
        </>
      )}
    </button>
  );
}
