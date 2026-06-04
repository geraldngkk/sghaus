import type { AnalysisResult } from "@/types";

// ---------------------------------------------------------------------------
// Shared styles & helpers
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return `$${Math.round(n).toLocaleString("en-SG")}`;
}

function fmtPsf(n: number): string {
  return `$${Math.round(n).toFixed(0)} psf`;
}

const BRAND = {
  forest: "#2D6A4F",
  meadow: "#52B788",
  mist: "#D8F3DC",
  fog: "#F7F9F6",
  amber: "#F4A261",
  charcoal: "#1A1A2E",
  slate: "#4A5568",
  border: "#E2E8E4",
  white: "#FFFFFF",
  red: "#EF4444",
};

const FONT =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const FONT_DISPLAY =
  "'DM Serif Display', Georgia, 'Times New Roman', serif";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.fog};font-family:${FONT};color:${BRAND.charcoal};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.fog};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">

<!-- Header -->
<tr><td style="background:${BRAND.forest};padding:24px 32px;">
  <span style="font-family:${FONT_DISPLAY};font-size:22px;color:${BRAND.white};letter-spacing:-0.5px;">
    <span style="color:${BRAND.white};">SG</span><span style="color:${BRAND.mist};">haus</span>
  </span>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="background:${BRAND.fog};padding:20px 32px;border-top:1px solid ${BRAND.border};">
  <p style="margin:0;font-size:11px;color:${BRAND.slate};line-height:1.6;">
    &copy; ${new Date().getFullYear()} SGHaus<br>
    This is not financial advice. Always conduct your own due diligence.<br>
    <a href="https://sghaus.com" style="color:${BRAND.forest};text-decoration:none;">sghaus.com</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function offerTable(result: AnalysisResult): string {
  const offer = result.offerWithReno ?? result.offer;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td width="33%" style="padding:8px;">
      <div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.slate};">Opening Bid</div>
        <div style="font-family:${FONT_DISPLAY};font-size:24px;color:${BRAND.charcoal};margin-top:8px;">${fmt(offer.low)}</div>
        <div style="font-size:11px;color:${BRAND.slate};margin-top:4px;">${fmtPsf(offer.lowPsf)}</div>
      </div>
    </td>
    <td width="34%" style="padding:8px;">
      <div style="background:${BRAND.mist};border:2px solid ${BRAND.forest};border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.forest};">Target Price</div>
        <div style="font-family:${FONT_DISPLAY};font-size:28px;color:${BRAND.forest};margin-top:8px;">${fmt(offer.mid)}</div>
        <div style="font-size:11px;color:${BRAND.forest};margin-top:4px;">${fmtPsf(offer.midPsf)}</div>
      </div>
    </td>
    <td width="33%" style="padding:8px;">
      <div style="background:#FFF8F0;border:1px solid ${BRAND.amber};border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.amber};">Hard Ceiling</div>
        <div style="font-family:${FONT_DISPLAY};font-size:24px;color:${BRAND.charcoal};margin-top:8px;">${fmt(offer.max)}</div>
        <div style="font-size:11px;color:${BRAND.slate};margin-top:4px;">${fmtPsf(offer.maxPsf)}</div>
      </div>
    </td>
  </tr>
</table>`;
}

function riskBadges(result: AnalysisResult): string {
  if (result.risks.length === 0) return "";

  const severityColor: Record<string, string> = {
    critical: BRAND.red,
    high: BRAND.amber,
    medium: "#F59E0B",
    low: BRAND.slate,
  };

  const items = result.risks
    .slice(0, 3)
    .map(
      (r) =>
        `<span style="display:inline-block;background:${severityColor[r.severity] ?? BRAND.slate};color:${BRAND.white};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:99px;margin-right:6px;margin-bottom:4px;">${r.severity}</span>
        <span style="font-size:13px;color:${BRAND.charcoal};">${r.title}</span>`,
    )
    .join("<br style='margin-bottom:8px;'>");

  return `
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:10px;padding:16px;margin:16px 0;">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.slate};margin-bottom:10px;">Key Risk Flags</div>
  ${items}
</div>`;
}

// ---------------------------------------------------------------------------
// Email 1 - Immediate: Your Offer Report
// ---------------------------------------------------------------------------

export function buildImmediateEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;
  const offer = result.offerWithReno ?? result.offer;
  const compCount =
    result.comps.tier1.length +
    result.comps.tier2.length +
    result.comps.tier3.length;

  const subject = `Your SGHaus Offer Report - Blk ${input.block} ${input.streetName}`;

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Your Offer Report
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 20px;line-height:1.5;">
  ${input.flatType} &middot; Blk ${input.block} ${input.streetName}, ${input.town}<br>
  Based on ${compCount} comparable transactions
</p>

${offerTable(result)}

<!-- Negotiation Quick Reference -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:10px;padding:16px;margin:16px 0;">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:10px;">Negotiation Quick Reference</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.charcoal};">
    <tr>
      <td style="padding:4px 0;"><strong>Open at</strong></td>
      <td style="padding:4px 0;">${fmt(offer.low)}. Anchor to data, leave room to move.</td>
    </tr>
    <tr>
      <td style="padding:4px 0;"><strong>Target</strong></td>
      <td style="padding:4px 0;">${fmt(offer.mid)}. Fair market value, present as your number.</td>
    </tr>
    <tr>
      <td style="padding:4px 0;"><strong>Never exceed</strong></td>
      <td style="padding:4px 0;">${fmt(offer.max)}. Walk away above this.</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 0 0;font-size:11px;color:${BRAND.slate};">
        Move in smaller steps as you approach Target. Never reveal your ceiling.
      </td>
    </tr>
  </table>
</div>

${riskBadges(result)}

<!-- CTA -->
<div style="text-align:center;margin:28px 0 12px;">
  <a href="https://sghaus.com" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
    View Full Analysis on SGHaus
  </a>
</div>

<p style="font-size:12px;color:${BRAND.slate};text-align:center;margin:16px 0 0;line-height:1.5;">
  Save this email. You'll need these numbers when you make your offer.
</p>
`);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Email 2 - 48h Reminder
// ---------------------------------------------------------------------------

export function build48hReminderEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;
  const offer = result.offerWithReno ?? result.offer;

  const subject = `Ready to make your offer on Blk ${input.block} ${input.streetName}?`;

  // Pick 3 stage-specific tips
  const tips = [
    `Open at ${fmt(offer.low)} and anchor to the ${result.comps.tier1.length + result.comps.tier2.length} comparable transactions on this street. Don't justify. Let the data speak.`,
    "Move in smaller increments as you approach your target. Each step should be smaller than the last. This signals you're near your limit.",
    `If the seller won't come below ${fmt(offer.max)}, walk away respectfully. Deals that fall through sometimes come back in 3-4 weeks.`,
  ];

  const tipsHtml = tips
    .map(
      (t, i) =>
        `<tr>
          <td style="vertical-align:top;padding:0 10px 12px 0;font-size:18px;font-weight:700;color:${BRAND.forest};">${i + 1}</td>
          <td style="vertical-align:top;padding:0 0 12px;font-size:13px;color:${BRAND.charcoal};line-height:1.5;">${t}</td>
        </tr>`,
    )
    .join("");

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Ready to make your offer?
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 24px;line-height:1.5;">
  ${input.flatType} &middot; Blk ${input.block} ${input.streetName}, ${input.town}
</p>

<!-- Quick offer recap -->
<div style="background:${BRAND.mist};border:2px solid ${BRAND.forest};border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.forest};">Your Offer Range</div>
  <div style="font-family:${FONT_DISPLAY};font-size:16px;color:${BRAND.charcoal};margin-top:10px;">
    ${fmt(offer.low)} &nbsp;&rarr;&nbsp; <span style="font-size:22px;color:${BRAND.forest};font-weight:700;">${fmt(offer.mid)}</span> &nbsp;&rarr;&nbsp; ${fmt(offer.max)}
  </div>
  <div style="font-size:11px;color:${BRAND.slate};margin-top:6px;">
    Opening Bid &nbsp;&middot;&nbsp; Target &nbsp;&middot;&nbsp; Hard Ceiling
  </div>
</div>

<!-- 3 Tips -->
<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:12px;">
  Top 3 Negotiation Tips
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${tipsHtml}
</table>

<!-- CTA -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
  <p style="font-size:14px;color:${BRAND.charcoal};margin:0 0 12px;">
    Need help with your negotiation?
  </p>
  <a href="https://sghaus.com/contact" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:10px;">
    Get in Touch
  </a>
  <p style="font-size:11px;color:${BRAND.slate};margin:12px 0 0;">
    Or reply directly to this email.
  </p>
</div>
`);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Email 3 - 14-day Outcome Collection
// ---------------------------------------------------------------------------

export function build14dOutcomeEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;

  const subject = `How did your offer on Blk ${input.block} ${input.streetName} go?`;

  const outcomeUrl = `https://sghaus.com/outcome?block=${encodeURIComponent(input.block)}&street=${encodeURIComponent(input.streetName)}`;

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  How did it go?
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 24px;line-height:1.5;">
  Two weeks ago, you analysed ${input.flatType} at Blk ${input.block} ${input.streetName}.<br>
  We'd love to know what happened.
</p>

<!-- Outcome questions preview -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;margin:0 0 24px;">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:16px;">
    Quick Questions
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${BRAND.charcoal};">
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>1.</strong> Did you make an offer on this flat?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>2.</strong> If yes, was it accepted?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>3.</strong> What was the final agreed price?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 4px;line-height:1.5;">
        <strong>4.</strong> Were the SGHaus numbers useful during negotiation?
      </td>
    </tr>
  </table>
</div>

<!-- CTA -->
<div style="text-align:center;margin:0 0 20px;">
  <a href="${outcomeUrl}" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
    Share Your Result
  </a>
  <p style="font-size:12px;color:${BRAND.slate};margin:12px 0 0;">
    Or just reply to this email with your answers.
  </p>
</div>

<div style="background:#FFF8F0;border:1px solid ${BRAND.amber};border-radius:10px;padding:16px;margin:0 0 8px;">
  <p style="font-size:13px;color:${BRAND.charcoal};margin:0;line-height:1.5;">
    <strong>Why share?</strong> Your outcome helps us refine our pricing model for the next buyer.
    Every data point makes SGHaus more accurate. All responses are anonymised.
  </p>
</div>
`);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Seller email helpers
// ---------------------------------------------------------------------------

function sellerPricingTable(result: AnalysisResult): string {
  const offer = result.offerWithReno ?? result.offer;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr>
    <td width="33%" style="padding:8px;">
      <div style="background:${BRAND.fog};border:1px solid ${BRAND.red};border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.red};">Floor Price</div>
        <div style="font-family:${FONT_DISPLAY};font-size:24px;color:${BRAND.charcoal};margin-top:8px;">${fmt(offer.low)}</div>
        <div style="font-size:11px;color:${BRAND.slate};margin-top:4px;">${fmtPsf(offer.lowPsf)}</div>
      </div>
    </td>
    <td width="34%" style="padding:8px;">
      <div style="background:${BRAND.mist};border:2px solid ${BRAND.forest};border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.forest};">Target Price</div>
        <div style="font-family:${FONT_DISPLAY};font-size:28px;color:${BRAND.forest};margin-top:8px;">${fmt(offer.mid)}</div>
        <div style="font-size:11px;color:${BRAND.forest};margin-top:4px;">${fmtPsf(offer.midPsf)}</div>
      </div>
    </td>
    <td width="33%" style="padding:8px;">
      <div style="background:#EFF6FF;border:1px solid #3B82F6;border-radius:12px;padding:16px;text-align:center;">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#3B82F6;">Opening Ask</div>
        <div style="font-family:${FONT_DISPLAY};font-size:24px;color:${BRAND.charcoal};margin-top:8px;">${fmt(offer.max)}</div>
        <div style="font-size:11px;color:${BRAND.slate};margin-top:4px;">${fmtPsf(offer.maxPsf)}</div>
      </div>
    </td>
  </tr>
</table>`;
}

// ---------------------------------------------------------------------------
// Seller Email 1 - Immediate: Your Pricing Report
// ---------------------------------------------------------------------------

export function buildSellerImmediateEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;
  const offer = result.offerWithReno ?? result.offer;
  const compCount =
    result.comps.tier1.length +
    result.comps.tier2.length +
    result.comps.tier3.length;

  const agentCommission = Math.round(offer.mid * 0.02);
  const legalFees = 1000;
  const netAtTarget = offer.mid - agentCommission - legalFees;

  const subject = `Your SGHaus Pricing Report - Blk ${input.block} ${input.streetName}`;

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Your Pricing Report
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 20px;line-height:1.5;">
  ${input.flatType} &middot; Blk ${input.block} ${input.streetName}, ${input.town}<br>
  Based on ${compCount} comparable transactions
</p>

${sellerPricingTable(result)}

<!-- Pricing Quick Reference -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:10px;padding:16px;margin:16px 0;">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:10px;">Pricing Quick Reference</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:${BRAND.charcoal};">
    <tr>
      <td style="padding:4px 0;"><strong>Floor</strong></td>
      <td style="padding:4px 0;">${fmt(offer.low)}. Don't accept offers at or below this level.</td>
    </tr>
    <tr>
      <td style="padding:4px 0;"><strong>Target</strong></td>
      <td style="padding:4px 0;">${fmt(offer.mid)}. Fair market value based on comparable sales.</td>
    </tr>
    <tr>
      <td style="padding:4px 0;"><strong>Opening Ask</strong></td>
      <td style="padding:4px 0;">${fmt(offer.max)}. List here and negotiate down toward target.</td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 0 0;font-size:11px;color:${BRAND.slate};">
        Net proceeds at target (after 2% agent + legal): ${fmt(netAtTarget)}
      </td>
    </tr>
  </table>
</div>

${riskBadges(result)}

<!-- CTA -->
<div style="text-align:center;margin:28px 0 12px;">
  <a href="https://sghaus.com/sell" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
    View Full Analysis on SGHaus
  </a>
</div>

<p style="font-size:12px;color:${BRAND.slate};text-align:center;margin:16px 0 0;line-height:1.5;">
  Save this email. You'll need these numbers when setting your asking price.
</p>
`);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Seller Email 2 - 48h: Listing Strategy Tips
// ---------------------------------------------------------------------------

export function buildSeller48hEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;
  const offer = result.offerWithReno ?? result.offer;

  const subject = `Ready to list Blk ${input.block} ${input.streetName}?`;

  const tips = [
    `List at ${fmt(offer.max)} and be prepared to negotiate. Buyers anchored by data will open around ${fmt(offer.low)}, so know your floor before you start.`,
    "Highlight your flat's strengths: high floor, good facing, recent renovation, or proximity to MRT. These justify pricing above the median.",
    `If offers cluster around ${fmt(offer.mid)}, that's the market speaking. Holding out too long risks losing serious buyers to competing listings.`,
  ];

  const tipsHtml = tips
    .map(
      (t, i) =>
        `<tr>
          <td style="vertical-align:top;padding:0 10px 12px 0;font-size:18px;font-weight:700;color:${BRAND.forest};">${i + 1}</td>
          <td style="vertical-align:top;padding:0 0 12px;font-size:13px;color:${BRAND.charcoal};line-height:1.5;">${t}</td>
        </tr>`,
    )
    .join("");

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Ready to list your flat?
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 24px;line-height:1.5;">
  ${input.flatType} &middot; Blk ${input.block} ${input.streetName}, ${input.town}
</p>

<!-- Quick pricing recap -->
<div style="background:${BRAND.mist};border:2px solid ${BRAND.forest};border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
  <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.forest};">Your Pricing Range</div>
  <div style="font-family:${FONT_DISPLAY};font-size:16px;color:${BRAND.charcoal};margin-top:10px;">
    ${fmt(offer.low)} &nbsp;&rarr;&nbsp; <span style="font-size:22px;color:${BRAND.forest};font-weight:700;">${fmt(offer.mid)}</span> &nbsp;&rarr;&nbsp; ${fmt(offer.max)}
  </div>
  <div style="font-size:11px;color:${BRAND.slate};margin-top:6px;">
    Floor &nbsp;&middot;&nbsp; Target &nbsp;&middot;&nbsp; Opening Ask
  </div>
</div>

<!-- 3 Tips -->
<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:12px;">
  Top 3 Listing Tips
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
  ${tipsHtml}
</table>

<!-- CTA -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:10px;padding:20px;text-align:center;margin:20px 0;">
  <p style="font-size:14px;color:${BRAND.charcoal};margin:0 0 12px;">
    Need help with your listing?
  </p>
  <a href="https://sghaus.com/contact" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:10px;">
    Get in Touch
  </a>
  <p style="font-size:11px;color:${BRAND.slate};margin:12px 0 0;">
    Or reply directly to this email.
  </p>
</div>
`);

  return { subject, html };
}

// ---------------------------------------------------------------------------
// Seller Email 3 - 14-day Outcome Collection
// ---------------------------------------------------------------------------

export function buildSeller14dOutcomeEmail(result: AnalysisResult): {
  subject: string;
  html: string;
} {
  const { input } = result;

  const subject = `How did your sale of Blk ${input.block} ${input.streetName} go?`;

  const outcomeUrl = `https://sghaus.com/outcome?block=${encodeURIComponent(input.block)}&street=${encodeURIComponent(input.streetName)}&mode=sell`;

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  How did it go?
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 24px;line-height:1.5;">
  Two weeks ago, you analysed ${input.flatType} at Blk ${input.block} ${input.streetName} for sale.<br>
  We'd love to know what happened.
</p>

<!-- Outcome questions preview -->
<div style="background:${BRAND.fog};border:1px solid ${BRAND.border};border-radius:12px;padding:24px;margin:0 0 24px;">
  <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.forest};margin-bottom:16px;">
    Quick Questions
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:${BRAND.charcoal};">
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>1.</strong> Have you listed or sold this flat?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>2.</strong> If sold, what was the final agreed price?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 14px;line-height:1.5;">
        <strong>3.</strong> How long did the process take?
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 4px;line-height:1.5;">
        <strong>4.</strong> Were the SGHaus pricing numbers useful?
      </td>
    </tr>
  </table>
</div>

<!-- CTA -->
<div style="text-align:center;margin:0 0 20px;">
  <a href="${outcomeUrl}" style="display:inline-block;background:${BRAND.forest};color:${BRAND.white};font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;">
    Share Your Result
  </a>
  <p style="font-size:12px;color:${BRAND.slate};margin:12px 0 0;">
    Or just reply to this email with your answers.
  </p>
</div>

<div style="background:#FFF8F0;border:1px solid ${BRAND.amber};border-radius:10px;padding:16px;margin:0 0 8px;">
  <p style="font-size:13px;color:${BRAND.charcoal};margin:0;line-height:1.5;">
    <strong>Why share?</strong> Your outcome helps us refine our pricing model for the next seller.
    Every data point makes SGHaus more accurate. All responses are anonymised.
  </p>
</div>
`);

  return { subject, html };
}
