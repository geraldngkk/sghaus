"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/types";
import { encodeAnalysisUrl } from "@/lib/share-url";

function formatPrice(value: number): string {
  return `$${value.toLocaleString("en-SG")}`;
}

interface ShareReportProps {
  result: AnalysisResult;
  mode?: "buy" | "sell";
}

function buildShareText(result: AnalysisResult, mode: "buy" | "sell"): string {
  const { input } = result;
  const offer = result.offerWithReno ?? result.offer;
  const shareUrl = `https://sghaus.com${encodeAnalysisUrl(input, mode)}`;

  if (mode === "sell") {
    return [
      `I checked what my flat is worth on SGHaus`,
      `${input.flatType} at Blk ${input.block} ${input.streetName}`,
      ``,
      `Floor: ${formatPrice(offer.low)}`,
      `Target: ${formatPrice(offer.mid)}`,
      `Opening Ask: ${formatPrice(offer.max)}`,
      ``,
      `Free tool, no signup: sghaus.com/sell`,
      ``,
      shareUrl,
    ].join("\n");
  }

  return [
    `I checked this flat on SGHaus`,
    `${input.flatType} at Blk ${input.block} ${input.streetName}`,
    ``,
    `Opening Bid: ${formatPrice(offer.low)}`,
    `Target Price: ${formatPrice(offer.mid)}`,
    `Hard Ceiling: ${formatPrice(offer.max)}`,
    ``,
    `Free tool, no signup: sghaus.com/buy`,
    ``,
    shareUrl,
  ].join("\n");
}

export default function ShareReport({ result, mode = "buy" }: ShareReportProps) {
  const [copied, setCopied] = useState(false);

  const text = buildShareText(result, mode);
  const shareUrl = `https://sghaus.com${encodeAnalysisUrl(result.input, mode)}`;

  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  function handleTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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
    <div className="flex items-center gap-2">
      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-slate transition-colors hover:border-[#25D366] hover:text-[#25D366]"
        title="Share on WhatsApp"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="hidden sm:inline">WhatsApp</span>
      </button>

      {/* Telegram */}
      <button
        onClick={handleTelegram}
        className="inline-flex items-center gap-2 rounded-[10px] border border-border px-4 py-2.5 text-sm text-slate transition-colors hover:border-[#0088cc] hover:text-[#0088cc]"
        title="Share on Telegram"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
        <span className="hidden sm:inline">Telegram</span>
      </button>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className={`inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm transition-colors ${
          copied
            ? "border-forest/30 text-forest"
            : "border-border text-slate hover:border-charcoal hover:text-charcoal"
        }`}
        title="Copy to clipboard"
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
            <span className="font-medium">Copied</span>
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
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="hidden sm:inline">Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
