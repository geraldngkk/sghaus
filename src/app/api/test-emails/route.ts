import { NextResponse } from "next/server";
import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import {
  buildImmediateEmail,
  build48hReminderEmail,
  build14dOutcomeEmail,
  buildSellerImmediateEmail,
  buildSeller48hEmail,
  buildSeller14dOutcomeEmail,
} from "@/lib/emails";
import type { AnalysisResult, TieredComparable, ChecklistItem } from "@/types";

function mockComp(overrides: Partial<TieredComparable> & { tier: 1 | 2 | 3 }, i: number): TieredComparable {
  return {
    id: 1000 + i,
    month: "2025-12",
    town: "CLEMENTI",
    flatType: "4 ROOM",
    block: String(350 + i),
    streetName: "CLEMENTI AVE 3",
    storeyRange: "10 TO 12",
    storeyMidpoint: 11,
    floorAreaSqm: 93,
    floorAreaSqft: 1001,
    flatModel: "Model A",
    leaseCommenceDate: 1984,
    remainingLeaseYears: 57,
    resalePrice: 580000 + i * 10000,
    pricePsf: 580 + i * 10,
    adjustedPricePsf: 580 + i * 10,
    ...overrides,
  };
}

const checklist: ChecklistItem[] = [
  { category: "Budget", question: "Is the target price within your budget?", assessment: "positive", detail: "Target $590k is within typical 4-room Clementi range." },
  { category: "Data", question: "Are there enough comparable transactions?", assessment: "positive", detail: "13 comps across 3 tiers — good confidence." },
  { category: "Lease", question: "Is remaining lease sufficient for CPF?", assessment: "negative", detail: "~57 years remaining. Verify CPF eligibility for your age." },
  { category: "Location", question: "Is the estate mature with amenities?", assessment: "positive", detail: "Clementi is a mature estate near MRT." },
];

const MOCK_RESULT: AnalysisResult = {
  input: {
    town: "CLEMENTI",
    flatType: "4 ROOM",
    streetName: "CLEMENTI AVE 3",
    block: "352",
    storeyRange: "10 TO 12",
    floorAreaSqm: 93,
    leaseCommenceDate: 1984,
  },
  generatedAt: new Date().toISOString(),
  comps: {
    tier1: Array.from({ length: 5 }, (_, i) => mockComp({ tier: 1 }, i)),
    tier2: Array.from({ length: 8 }, (_, i) => mockComp({ tier: 2, block: String(360 + i), streetName: "CLEMENTI AVE 4" }, i + 10)),
    tier3: Array.from({ length: 12 }, (_, i) => mockComp({ tier: 3, block: String(370 + i), streetName: "CLEMENTI ST 11" }, i + 20)),
    totalRecordsFetched: 245,
  },
  offer: {
    low: 555000,
    mid: 590000,
    max: 625000,
    lowPsf: 555,
    midPsf: 590,
    maxPsf: 625,
    lowRationale: "Below median of 5 same-block comps. Anchors negotiation with data.",
    midRationale: "Median of Tier 1 comps adjusted for storey and lease. Fair market value.",
    maxRationale: "75th percentile of local comps. Walk away above this number.",
    walkAwayTriggers: [
      "Seller demands above $625,000",
      "Hidden structural defects discovered",
      "Competing BTO launches in Clementi within 12 months",
    ],
  },
  costs: {
    atLow: {
      purchasePrice: 555000,
      bsd: 12450,
      legalFees: { hdbLoan: 1000, bankLoan: 2000 },
      renovationEstimate: { low: 30000, high: 60000 },
      agentCommission: 5550,
      totalLow: 604000,
      totalHigh: 635000,
    },
    atMid: {
      purchasePrice: 590000,
      bsd: 13500,
      legalFees: { hdbLoan: 1000, bankLoan: 2000 },
      renovationEstimate: { low: 30000, high: 60000 },
      agentCommission: 5900,
      totalLow: 640400,
      totalHigh: 671400,
    },
    atMax: {
      purchasePrice: 625000,
      bsd: 14550,
      legalFees: { hdbLoan: 1000, bankLoan: 2000 },
      renovationEstimate: { low: 30000, high: 60000 },
      agentCommission: 6250,
      totalLow: 676800,
      totalHigh: 707800,
    },
  },
  risks: [
    {
      id: "lease-decay",
      title: "Remaining lease below 60 years",
      severity: "high",
      description: "With ~57 years remaining, CPF usage may be restricted.",
      detail: "Lease commenced 1984. Remaining: ~57 years.",
    },
    {
      id: "bto-supply",
      title: "Upcoming BTO supply in Clementi",
      severity: "medium",
      description: "New BTO launches may soften resale demand.",
      detail: "~1,200 units expected in the next 2 years.",
    },
    {
      id: "price-trend",
      title: "Prices trending upward in Clementi",
      severity: "low",
      description: "Median PSF up 3.2% YoY — seller's market.",
      detail: "12-month: $585 psf vs 24-month: $567 psf.",
    },
  ],
  checklist,
  marketContext: {
    medianPsf: 585,
    medianPrice: 585000,
    transactionCount12m: 42,
    trendDirection: "up",
    trendPercentage: 3.2,
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  const mode = url.searchParams.get("mode") === "sell" ? "sell" : "buy";

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=email@example.com&mode=buy|sell" }, { status: 400 });
  }

  const resend = getResendClient();
  if (!resend) {
    return NextResponse.json({ error: "Resend not configured — check RESEND_API_KEY" }, { status: 500 });
  }

  const replyTo = process.env.RESEND_REPLY_TO ?? "gerald@sghaus.com";
  const results: Record<string, unknown> = {};

  // Email 1 — Immediate report
  const email1 = mode === "sell" ? buildSellerImmediateEmail(MOCK_RESULT) : buildImmediateEmail(MOCK_RESULT);
  const { data: d1, error: e1 } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo,
    subject: `[TEST] ${email1.subject}`,
    html: email1.html,
  });
  results.email1_immediate = e1 ? { error: e1 } : { id: d1?.id, subject: email1.subject };

  // Avoid Resend rate limit (2 req/s on free tier)
  await new Promise((r) => setTimeout(r, 600));

  // Email 2 — 48h (sent immediately for test)
  const email2 = mode === "sell" ? buildSeller48hEmail(MOCK_RESULT) : build48hReminderEmail(MOCK_RESULT);
  const { data: d2, error: e2 } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo,
    subject: `[TEST] ${email2.subject}`,
    html: email2.html,
  });
  results.email2_48h = e2 ? { error: e2 } : { id: d2?.id, subject: email2.subject };

  await new Promise((r) => setTimeout(r, 600));

  // Email 3 — 14d outcome (sent immediately for test)
  const email3 = mode === "sell" ? buildSeller14dOutcomeEmail(MOCK_RESULT) : build14dOutcomeEmail(MOCK_RESULT);
  const { data: d3, error: e3 } = await resend.emails.send({
    from: EMAIL_FROM,
    to: [to],
    replyTo,
    subject: `[TEST] ${email3.subject}`,
    html: email3.html,
  });
  results.email3_14d = e3 ? { error: e3 } : { id: d3?.id, subject: email3.subject };

  return NextResponse.json({ success: true, to, results });
}
