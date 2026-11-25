import type { AnalysisResult } from "@/types";
import { escapeHtml, singleLine } from "@/lib/escape-html";

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
        `<span style="display:inline-block;background:${severityColor[r.severity] ?? BRAND.slate};color:${BRAND.white};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:3px 8px;border-radius:99px;margin-right:6px;margin-bottom:4px;">${escapeHtml(r.severity)}</span>
        <span style="font-size:13px;color:${BRAND.charcoal};">${escapeHtml(r.title)}</span>`,
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

  const subject = singleLine(`Your SGHaus Offer Report - Blk ${input.block} ${input.streetName}`);

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Your Offer Report
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 20px;line-height:1.5;">
  ${escapeHtml(input.flatType)} &middot; Blk ${escapeHtml(input.block)} ${escapeHtml(input.streetName)}, ${escapeHtml(input.town)}<br>
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

  const subject = singleLine(`Your SGHaus Pricing Report - Blk ${input.block} ${input.streetName}`);

  const html = layout(`
<h1 style="font-family:${FONT_DISPLAY};font-size:24px;margin:0 0 4px;color:${BRAND.charcoal};">
  Your Pricing Report
</h1>
<p style="font-size:14px;color:${BRAND.slate};margin:0 0 20px;line-height:1.5;">
  ${escapeHtml(input.flatType)} &middot; Blk ${escapeHtml(input.block)} ${escapeHtml(input.streetName)}, ${escapeHtml(input.town)}<br>
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
      <td style="padding:4px 0;">${fmt(offer.max)}. A starting price that leaves room to come down towards target.</td>
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
