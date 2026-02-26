"use server";

import type { AnalysisResult } from "@/types";
import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import {
  buildImmediateEmail,
  build48hReminderEmail,
  build14dOutcomeEmail,
  buildSellerImmediateEmail,
  buildSeller48hEmail,
  buildSeller14dOutcomeEmail,
} from "@/lib/emails";

interface SendReportResult {
  success: boolean;
  error?: string;
}

/**
 * Send the 3-email follow-up sequence for an analysis:
 *   1. Immediate — offer report + negotiation reference
 *   2. 48 hours — reminder + negotiation tips
 *   3. 14 days — outcome collection
 *
 * Uses Resend's `scheduledAt` for delayed emails.
 * Note: scheduledAt supports up to 72h on Resend free tier,
 * up to 1 year on paid plans. Email 3 (14d) requires a paid plan.
 *
 * Fire-and-forget: should never block the UI.
 */
export async function sendReportEmail(
  email: string,
  result: AnalysisResult,
  sendFollowUps: boolean = true,
  mode: "buy" | "sell" = "buy",
): Promise<SendReportResult> {
  const resend = getResendClient();
  if (!resend) {
    console.log("[send-report-email] Resend not configured. Skipping.");
    return { success: true };
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Invalid email address." };
  }

  const replyTo = process.env.RESEND_REPLY_TO ?? "hello@sghaus.com";

  try {
    // Email 1 — Immediate
    const email1 = mode === "sell" ? buildSellerImmediateEmail(result) : buildImmediateEmail(result);
    const { error: err1 } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      replyTo,
      subject: email1.subject,
      html: email1.html,
    });

    if (err1) {
      console.error("[send-report-email] Email 1 failed:", err1);
      return { success: false, error: "Failed to send report email." };
    }

    console.log(`[send-report-email] Email 1 (immediate) sent to ${email}`);

    if (!sendFollowUps) return { success: true };

    // Brief delay to avoid Resend rate limit (2 req/s on free tier)
    await new Promise((r) => setTimeout(r, 600));

    // Email 2 — 48 hours later
    const email2 = mode === "sell" ? buildSeller48hEmail(result) : build48hReminderEmail(result);
    const scheduledAt48h = new Date(
      Date.now() + 48 * 60 * 60 * 1000,
    ).toISOString();

    const { error: err2 } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      replyTo,
      subject: email2.subject,
      html: email2.html,
      scheduledAt: scheduledAt48h,
    });

    if (err2) {
      // Non-critical — log but don't fail
      console.error("[send-report-email] Email 2 (48h) scheduling failed:", err2);
    } else {
      console.log(
        `[send-report-email] Email 2 (48h) scheduled for ${scheduledAt48h}`,
      );
    }

    await new Promise((r) => setTimeout(r, 600));

    // Email 3 — 14 days later
    // Requires Resend paid plan (free tier only supports up to 72h scheduling)
    const email3 = mode === "sell" ? buildSeller14dOutcomeEmail(result) : build14dOutcomeEmail(result);
    const scheduledAt14d = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: err3 } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      replyTo,
      subject: email3.subject,
      html: email3.html,
      scheduledAt: scheduledAt14d,
    });

    if (err3) {
      // Non-critical — log but don't fail
      console.error(
        "[send-report-email] Email 3 (14d) scheduling failed (may require paid plan):",
        err3,
      );
    } else {
      console.log(
        `[send-report-email] Email 3 (14d) scheduled for ${scheduledAt14d}`,
      );
    }

    return { success: true };
  } catch (err) {
    console.error("[send-report-email] Unexpected error:", err);
    return { success: false, error: "Failed to send email." };
  }
}
