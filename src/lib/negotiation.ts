import type { AnalysisResult, RiskFlag } from "@/types";
import { calculateRemainingLease } from "./adjustments";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NegotiationStage = "open" | "negotiate" | "commit";

export interface NegotiationScript {
  stage: NegotiationStage;
  /** The round within the stage (1-based). Open = round 1, negotiate = rounds 2-4, commit = final. */
  round: number;
  /** The dollar amount the buyer should offer this round */
  offerAmount: number;
  /** The full script the buyer can use */
  message: string;
  /** Why this script/amount works at this stage */
  rationale: string;
  /** Tactical tips for this round */
  tips: string[];
  /** Short WhatsApp-ready message (data point + offer + one sentence) */
  whatsappTemplate: string;
  /** Special scenario detected, if any */
  scenario?: "below-market" | "long-dom" | "lease-warning" | null;
}

export interface NegotiationSequence {
  /** All rounds from open to commit */
  rounds: NegotiationScript[];
  /** Things the buyer should never say */
  doNotSay: string[];
  /** Common agent tactics with rebuttals */
  tacticRebuttals: { tactic: string; rebuttal: string }[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-SG")}`;
}

function fmtPsf(n: number): string {
  return `$${Math.round(n).toLocaleString("en-SG")} psf`;
}

function hasRisk(risks: RiskFlag[], id: string): boolean {
  return risks.some((r) => r.id === id);
}

function hasHighRisk(risks: RiskFlag[], id: string): boolean {
  return risks.some((r) => r.id === id && (r.severity === "high" || r.severity === "critical"));
}

// ---------------------------------------------------------------------------
// Scenario detection
// ---------------------------------------------------------------------------

interface DetectedScenario {
  type: "below-market" | "long-dom" | "lease-warning" | null;
  skipLow: boolean;
  leverageSpeed: boolean;
  leaseWarning: boolean;
}

function detectScenario(
  result: AnalysisResult,
  askingPrice?: number,
  daysOnMarket?: number,
): DetectedScenario {
  const offer = result.offerWithReno ?? result.offer;
  const remainingLease = calculateRemainingLease(result.input.leaseCommenceDate);

  // Scenario A,Seller is already below market (asking < MID)
  const belowMarket = askingPrice != null && askingPrice <= offer.mid;

  // Scenario B,Long days on market (60+ days)
  const longDom = daysOnMarket != null && daysOnMarket >= 60;

  // Lease warning,walk-away language applicable
  const leaseWarning = remainingLease < 60;

  if (belowMarket) {
    return { type: "below-market", skipLow: true, leverageSpeed: false, leaseWarning };
  }
  if (longDom) {
    return { type: "long-dom", skipLow: false, leverageSpeed: true, leaseWarning };
  }
  if (leaseWarning) {
    return { type: "lease-warning", skipLow: false, leverageSpeed: false, leaseWarning: true };
  }

  return { type: null, skipLow: false, leverageSpeed: false, leaseWarning };
}

// ---------------------------------------------------------------------------
// Round amount calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the offer amount for each negotiation round.
 * Follows diminishing-step pattern from the negotiation script:
 *   Open  → LOW
 *   R2    → LOW + 40% of (MID − LOW)
 *   R3    → MID − 1%
 *   R4    → MID (final target)
 *   R5    → MAX signal (commit or walk)
 */
function calculateRoundAmounts(
  low: number,
  mid: number,
  max: number,
  scenario: DetectedScenario,
): number[] {
  if (scenario.skipLow) {
    // Scenario A: skip LOW, open at or just below MID
    const openAmount = Math.round((mid * 0.99) / 1000) * 1000;
    return [openAmount, mid, max];
  }

  const gap = mid - low;
  const r2 = Math.round((low + gap * 0.4) / 1000) * 1000;
  const r3 = Math.round((mid * 0.99) / 1000) * 1000;
  const r4 = mid;
  // Commit round: signal near MAX without revealing it
  const commitAmount = Math.round((max * 0.98) / 1000) * 1000;

  return [low, r2, r3, r4, commitAmount];
}

// ---------------------------------------------------------------------------
// Script generation per round
// ---------------------------------------------------------------------------

function generateOpenScript(
  result: AnalysisResult,
  offerAmount: number,
  scenario: DetectedScenario,
): NegotiationScript {
  const offer = result.offerWithReno ?? result.offer;
  const compCount = result.comps.tier1.length + result.comps.tier2.length;
  const street = result.input.streetName;
  const remainingLease = calculateRemainingLease(result.input.leaseCommenceDate);

  // Pick the best opening reason
  let reason = `${compCount} recent comparable transactions on this street`;
  if (scenario.leaseWarning) {
    reason = `the remaining lease of ~${Math.round(remainingLease)} years, which affects financing eligibility`;
  } else if (scenario.leverageSpeed) {
    reason = "the flat has been on the market for some time, and I'm a committed buyer who can move quickly";
  } else if (hasRisk(result.risks, "bto-supply")) {
    reason = "upcoming BTO supply in this area that gives buyers more alternatives";
  }

  let message: string;
  let tips: string[];

  if (scenario.skipLow) {
    // Scenario A: open near MID
    message =
      `I can see the flat is priced sensibly. I'd like to offer ${fmt(offerAmount)}, ` +
      `which is close to the median of ${compCount} recent transactions on ${street}. ` +
      `I think that's fair for both sides and I'm ready to move quickly.`;
    tips = [
      "The seller is already near or below market,don't risk losing the deal by going lower.",
      "Speed is your value-add here. Signal that you can commit fast.",
      "If the agent confirms other interest, move to MID immediately.",
    ];
  } else {
    message =
      `Based on recent transactions on ${street}, the market value for this type of unit is ` +
      `around ${fmt(offer.mid)}. I'd like to open at ${fmt(offerAmount)}, which I think is a fair ` +
      `starting point given ${reason}. I'm serious about this flat and happy to move if we can ` +
      `find a number that works for both of us.`;
    tips = [
      "You're anchoring to data (MID), not to your LOW. Your LOW is a position relative to a stated reference point.",
      "If the agent pushes back immediately, ask: \"Can you help me understand what's driving the asking price above recent sales?\"",
      "Never reveal your maximum budget or say \"I love this flat\",it signals urgency.",
    ];
  }

  if (scenario.leverageSpeed) {
    tips.push(
      "The flat has been listed for 60+ days. Speed and certainty are genuine value-adds,use them.",
    );
  }

  const whatsappTemplate =
    `Offer: ${fmt(offerAmount)}. ` +
    `Based on ${compCount} recent transactions on ${street}, ` +
    `median price is approx ${fmtPsf(offer.midPsf)}. ` +
    `Happy to discuss.`;

  return {
    stage: "open",
    round: 1,
    offerAmount,
    message,
    rationale: scenario.skipLow
      ? "Seller is at or below market value. Opening near MID shows good faith and avoids losing the deal."
      : `Opening at ${fmt(offerAmount)} (~${((1 - offerAmount / offer.mid) * 100).toFixed(0)}% below market) anchors the negotiation and leaves room to move toward your target.`,
    tips,
    whatsappTemplate,
    scenario: scenario.type,
  };
}

function generateNegotiateScript(
  result: AnalysisResult,
  offerAmount: number,
  roundNumber: number,
  totalNegotiateRounds: number,
  scenario: DetectedScenario,
): NegotiationScript {
  const offer = result.offerWithReno ?? result.offer;
  const compCount = result.comps.tier1.length + result.comps.tier2.length;
  const street = result.input.streetName;

  const isFinalTarget = offerAmount >= offer.mid;

  let message: string;
  let tips: string[];

  if (isFinalTarget) {
    message =
      `My target is ${fmt(offerAmount)}. That's the median of ${compCount} recent transactions ` +
      `on ${street},it's not a number I made up, it's what the market says this flat is worth. ` +
      `I'd be happy to close at this price.`;
    tips = [
      "This is your MID,fair market value. Present it as your final target with conviction.",
      "If you have the SGHaus comp data, offer to share it. Good-faith sellers and agents will engage with data.",
      "Don't say \"this is my final offer\" unless you truly mean it. Credibility is your main asset.",
    ];
  } else {
    message =
      `I can come up to ${fmt(offerAmount)}. I want to be transparent,I'm working toward a number ` +
      `that reflects what comparable units have actually sold for. I'm not far from where I need to be, ` +
      `but I can't go much further without overpaying relative to the market.`;
    tips = [
      "Move in smaller steps as you approach MID,this communicates you're nearing your limit.",
      `You're now at Round ${roundNumber} of ~${totalNegotiateRounds}. Don't jump straight to MID.`,
      "If the agent says \"we have another offer\", don't panic-bid. Stick to your number.",
    ];
  }

  if (scenario.leverageSpeed) {
    message += ` I should mention,if we can close the gap, I can commit this week and move the process forward quickly.`;
    tips.push("Speed and certainty are genuine leverage when a flat has been listed 60+ days.");
  }

  const whatsappTemplate =
    `Updated offer: ${fmt(offerAmount)}. ` +
    `Based on ${compCount} comps on ${street}, ` +
    `median is ${fmtPsf(offer.midPsf)}. ` +
    `${isFinalTarget ? "This is my target,happy to close here." : "Room to move is limited."}`;

  return {
    stage: "negotiate",
    round: roundNumber,
    offerAmount,
    message,
    rationale: isFinalTarget
      ? `${fmt(offerAmount)} is the data-backed market value. Half of comparable sales closed above this, half below.`
      : `Moving to ${fmt(offerAmount)} (${((offerAmount - offer.low) / (offer.mid - offer.low) * 100).toFixed(0)}% of the way from LOW to MID),diminishing steps signal you're approaching your limit.`,
    tips,
    whatsappTemplate,
    scenario: scenario.type,
  };
}

function generateCommitScript(
  result: AnalysisResult,
  offerAmount: number,
  scenario: DetectedScenario,
): NegotiationScript {
  const offer = result.offerWithReno ?? result.offer;
  const compCount = result.comps.tier1.length + result.comps.tier2.length;
  const street = result.input.streetName;
  const remainingLease = calculateRemainingLease(result.input.leaseCommenceDate);

  let message =
    `This is my best offer: ${fmt(offerAmount)}. I've based this on what above-average buyers ` +
    `have paid for similar units on ${street},I'm already at the top of that range. ` +
    `If this doesn't work for the seller, I understand, but I won't be able to improve on it.`;

  const tips = [
    "NEVER reveal your actual MAX number. Say \"I cannot go further\" without naming it.",
    "If the seller rejects, walk respectfully. Deals that fall through sometimes come back in 3-4 weeks.",
  ];

  if (scenario.leaseWarning) {
    message +=
      ` I should also flag that with ~${Math.round(remainingLease)} years remaining on the lease, ` +
      `financing options for this flat are limited. That's factored into my valuation.`;
    tips.push(
      "Lease below 60 years is a real constraint,CPF and bank loans are restricted. This isn't a negotiating tactic, it's a fact.",
    );
  }

  tips.push(
    "Walk-away script if rejected: \"I appreciate the time and I genuinely liked the flat. But the number the seller needs is beyond what the market supports. If anything changes, I'd welcome a call.\"",
  );

  const whatsappTemplate =
    `Best and final: ${fmt(offerAmount)}. ` +
    `Top of comparable range on ${street} (${compCount} transactions). ` +
    `I'm not able to go further,hope we can close.`;

  return {
    stage: "commit",
    round: 99, // overwritten by caller
    offerAmount,
    message,
    rationale:
      `${fmt(offerAmount)} is near the top of what comparable data supports. ` +
      `Above this, the total cost of ownership exceeds the rational threshold.`,
    tips,
    whatsappTemplate,
    scenario: scenario.type,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the full negotiation sequence for a given analysis.
 *
 * @param result - The analysis result containing offers, comps, risks, etc.
 * @param askingPrice - Optional: the seller's listing price (enables scenario detection)
 * @param daysOnMarket - Optional: how long the listing has been active
 */
export function generateNegotiationSequence(
  result: AnalysisResult,
  askingPrice?: number,
  daysOnMarket?: number,
): NegotiationSequence {
  const offer = result.offerWithReno ?? result.offer;
  const scenario = detectScenario(result, askingPrice, daysOnMarket);
  const amounts = calculateRoundAmounts(offer.low, offer.mid, offer.max, scenario);

  const rounds: NegotiationScript[] = [];
  let roundNum = 1;

  // Round 1: Open
  rounds.push(generateOpenScript(result, amounts[0], scenario));
  roundNum++;

  // Middle rounds: negotiate toward MID
  const negotiateAmounts = amounts.slice(1, -1);
  const totalNegotiateRounds = negotiateAmounts.length + 2; // including open and commit
  for (const amt of negotiateAmounts) {
    rounds.push(
      generateNegotiateScript(result, amt, roundNum, totalNegotiateRounds, scenario),
    );
    roundNum++;
  }

  // Final round: commit or walk
  const commitScript = generateCommitScript(
    result,
    amounts[amounts.length - 1],
    scenario,
  );
  commitScript.round = roundNum;
  rounds.push(commitScript);

  return {
    rounds,
    doNotSay: [
      "\"This is my final offer\",unless it genuinely is. If you say final and then move, the seller knows you have more room.",
      "\"I love this flat\",reveals urgency, reduces your leverage.",
      "\"My maximum budget is $X\",never share your ceiling, even approximately.",
      "\"I can go a little higher\",vague signal that you have room. Just move to your next number or don't.",
      "\"The market is going down\",may be true, but sounds like a scare tactic. Use trend data as a flag, not a threat.",
    ],
    tacticRebuttals: [
      {
        tactic: "\"We have another offer\"",
        rebuttal:
          "I understand. I'm not in a position to get into a bidding war,I have a number that works for me based on the market, and I'll stick to it. If the other offer doesn't work out, I hope you'll come back to me.",
      },
      {
        tactic: "\"The seller paid $X for renovations\"",
        rebuttal:
          "I respect that, and I can see the flat is well-maintained. But renovation costs are factored into the overall asking price, not added on top of market value. The comps I'm working from already include renovated units.",
      },
      {
        tactic: "\"The valuation came in at $X\"",
        rebuttal:
          "Valuation sets the CPF ceiling, but market value is set by what buyers are actually paying. The recent transactions I'm looking at are the better benchmark for what this flat is worth today.",
      },
      {
        tactic: "\"Other buyers are willing to pay more\"",
        rebuttal:
          "Maybe so. But I'm buying based on what the data says, not what other people are willing to pay. If a buyer wants to pay above market, that's their decision,it's not the benchmark I'm using.",
      },
    ],
  };
}

/**
 * Get a single negotiation script for a specific stage and round.
 * Convenience wrapper around generateNegotiationSequence.
 */
export function getNegotiationScript(
  result: AnalysisResult,
  stage: NegotiationStage,
  round: number = 1,
  askingPrice?: number,
  daysOnMarket?: number,
): NegotiationScript | null {
  const sequence = generateNegotiationSequence(result, askingPrice, daysOnMarket);
  if (stage === "open") return sequence.rounds[0] ?? null;
  if (stage === "commit") return sequence.rounds[sequence.rounds.length - 1] ?? null;

  // For negotiate, find the matching round
  const match = sequence.rounds.find((r) => r.stage === "negotiate" && r.round === round);
  return match ?? sequence.rounds.find((r) => r.stage === "negotiate") ?? null;
}
