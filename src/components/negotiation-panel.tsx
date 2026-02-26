"use client";

import { useState, useCallback } from "react";
import type { AnalysisResult } from "@/types";
import {
  generateNegotiationSequence,
  type NegotiationSequence,
  type NegotiationScript,
} from "@/lib/negotiation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-SG")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        copied
          ? "border-meadow/40 bg-mist/50 text-forest"
          : "border-border bg-white text-slate hover:border-forest hover:text-forest"
      }`}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function WhatsAppButton({ text }: { text: string }) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/5 px-3 py-1.5 text-xs font-medium text-[#128C7E] transition-all hover:bg-[#25D366]/10"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      WhatsApp
    </a>
  );
}

/** Single script card — shows the message, amount, copy/share, and tips */
function ScriptCard({
  script,
  showWhatsApp = true,
}: {
  script: NegotiationScript;
  showWhatsApp?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      {/* Offer amount badge */}
      <div className="flex items-center gap-3">
        <span className="price-display text-2xl text-forest sm:text-3xl">
          {fmt(script.offerAmount)}
        </span>
        {script.scenario && (
          <span className="rounded-full bg-amber/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
            {script.scenario === "below-market"
              ? "Below Market"
              : script.scenario === "long-dom"
                ? "60+ Days Listed"
                : "Lease Warning"}
          </span>
        )}
      </div>

      {/* Rationale */}
      <p className="text-xs text-slate/70">{script.rationale}</p>

      {/* Script message */}
      <div className="rounded-xl border border-border bg-fog/60 p-4">
        <p className="text-sm leading-relaxed text-charcoal">
          &ldquo;{script.message}&rdquo;
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={script.message} />
        {showWhatsApp && <WhatsAppButton text={script.whatsappTemplate} />}
        <CopyButton text={script.whatsappTemplate} />
        <span className="text-[10px] text-slate/50">short version</span>
      </div>

      {/* Tips — collapsible */}
      {script.tips.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-medium text-forest transition-colors hover:text-forest/80"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <path d="M3 1.5L7 5L3 8.5" />
            </svg>
            {expanded ? "Hide tips" : `${script.tips.length} tips for this round`}
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1.5 pl-4">
              {script.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate leading-relaxed"
                >
                  <span className="mt-0.5 shrink-0 text-meadow">&bull;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content components
// ---------------------------------------------------------------------------

function OpeningBidTab({ sequence }: { sequence: NegotiationSequence }) {
  const script = sequence.rounds[0];
  if (!script) return null;
  return <ScriptCard script={script} />;
}

function NegotiationTab({ sequence }: { sequence: NegotiationSequence }) {
  const negotiateRounds = sequence.rounds.filter((r) => r.stage === "negotiate");
  const [activeRound, setActiveRound] = useState(0);

  if (negotiateRounds.length === 0) {
    return (
      <p className="text-sm text-slate">
        Scenario suggests moving directly to your target. See Opening Bid tab.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* Round selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate">Round:</span>
        <div className="flex gap-1">
          {negotiateRounds.map((r, i) => (
            <button
              key={i}
              onClick={() => setActiveRound(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all ${
                activeRound === i
                  ? "bg-forest text-white"
                  : "border border-border bg-white text-slate hover:border-forest hover:text-forest"
              }`}
            >
              {r.round}
            </button>
          ))}
        </div>
      </div>

      {/* Round amount progression */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {/* Opening bid reference */}
        <div className="shrink-0 rounded-lg bg-fog px-2.5 py-1 text-[10px] text-slate">
          R1: {fmt(sequence.rounds[0].offerAmount)}
        </div>
        {negotiateRounds.map((r, i) => (
          <div key={i} className="flex items-center gap-1">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="#E2E8E4" strokeWidth="1.5">
              <path d="M0 4h8M8 1l3 3-3 3" />
            </svg>
            <div
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium ${
                activeRound === i
                  ? "bg-forest text-white"
                  : "bg-fog text-slate"
              }`}
            >
              R{r.round}: {fmt(r.offerAmount)}
            </div>
          </div>
        ))}
      </div>

      {/* Active round script */}
      <ScriptCard script={negotiateRounds[activeRound]} />
    </div>
  );
}

function FinalOfferTab({ sequence }: { sequence: NegotiationSequence }) {
  const commitScript = sequence.rounds[sequence.rounds.length - 1];
  if (!commitScript) return null;

  const walkAwayScript =
    "I appreciate the time and I genuinely liked the flat. But the number the seller needs " +
    "is beyond what the market supports for this unit, and I'm not able to close that gap. " +
    "If anything changes on their end, I'd welcome a call.";

  return (
    <div className="space-y-6">
      {/* Commit script */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest">
            Commit
          </span>
          <span className="text-xs text-slate">If the seller is close to your number</span>
        </div>
        <ScriptCard script={commitScript} />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate/50">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Walk away script */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-[#EF4444]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
            Walk Away
          </span>
          <span className="text-xs text-slate">If the seller won&apos;t come below your ceiling</span>
        </div>
        <div className="rounded-xl border border-[#EF4444]/15 bg-[#EF4444]/[0.03] p-4">
          <p className="text-sm leading-relaxed text-charcoal">
            &ldquo;{walkAwayScript}&rdquo;
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <CopyButton text={walkAwayScript} />
        </div>
        <p className="mt-3 text-xs text-slate/70 leading-relaxed">
          Deals that fall through sometimes come back. A seller who rejects your offer today may
          return in 3-4 weeks if the flat hasn&apos;t moved. Leaving the door open costs you nothing.
        </p>
      </div>
    </div>
  );
}

function TacticsSection({ sequence }: { sequence: NegotiationSequence }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-6 border-t border-border pt-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h4 className="text-sm font-semibold text-charcoal">
            Agent Tactics & Rebuttals
          </h4>
          <p className="mt-0.5 text-xs text-slate">
            Common pressure tactics and how to respond
          </p>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`shrink-0 text-slate transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {sequence.tacticRebuttals.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-fog/40 p-4">
              <p className="text-xs font-semibold text-amber">{item.tactic}</p>
              <div className="mt-2 rounded-lg border border-border bg-white p-3">
                <p className="text-sm leading-relaxed text-charcoal">
                  &ldquo;{item.rebuttal}&rdquo;
                </p>
              </div>
              <div className="mt-2">
                <CopyButton text={item.rebuttal} />
              </div>
            </div>
          ))}

          {/* Do Not Say */}
          <div className="rounded-xl border border-[#EF4444]/15 bg-[#EF4444]/[0.03] p-4">
            <p className="text-xs font-semibold text-[#EF4444]">What Not to Say</p>
            <ul className="mt-2 space-y-1.5">
              {sequence.doNotSay.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate leading-relaxed">
                  <span className="mt-0.5 shrink-0 text-[#EF4444]/60">&times;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Tab = "open" | "negotiate" | "final";

interface NegotiationPanelProps {
  result: AnalysisResult;
}

export default function NegotiationPanel({ result }: NegotiationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("open");

  // Generate the full negotiation sequence
  const sequence: NegotiationSequence = generateNegotiationSequence(result);

  const tabs: { key: Tab; label: string; shortLabel: string }[] = [
    { key: "open", label: "Opening Bid", shortLabel: "Open" },
    { key: "negotiate", label: "Negotiation", shortLabel: "Negotiate" },
    { key: "final", label: "Final Offer", shortLabel: "Final" },
  ];

  if (!isOpen) {
    return (
      <div className="mt-8">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-forest/30 bg-forest/[0.02] px-6 py-5 text-left transition-all hover:border-forest/50 hover:bg-forest/[0.04]"
        >
          <div>
            <h3 className="font-display text-lg text-charcoal sm:text-xl">
              Negotiation Scripts
            </h3>
            <p className="mt-1 text-sm text-slate">
              Personalised scripts for each stage: what to say, when to move, and when to walk.
            </p>
          </div>
          <div className="ml-4 shrink-0 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-forest/90">
            View Scripts
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-xl text-charcoal">Negotiation Scripts</h3>
          <p className="mt-1 text-sm text-slate">
            Personalised for {result.input.flatType} at {result.input.streetName} &middot;{" "}
            {sequence.rounds.length} rounds
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate transition-colors hover:bg-fog hover:text-charcoal"
          aria-label="Collapse"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 9l4-4 4 4" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 rounded-xl border border-border bg-fog p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
              activeTab === tab.key
                ? "bg-white text-forest shadow-sm"
                : "text-slate hover:text-charcoal"
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-5">
        {activeTab === "open" && <OpeningBidTab sequence={sequence} />}
        {activeTab === "negotiate" && <NegotiationTab sequence={sequence} />}
        {activeTab === "final" && <FinalOfferTab sequence={sequence} />}
      </div>

      {/* Tactics & Do Not Say — shared across all tabs */}
      <TacticsSection sequence={sequence} />
    </div>
  );
}
