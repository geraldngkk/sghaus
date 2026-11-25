"use server";

import type { PropertyInput } from "@/types";
import type { RenovationAnswer } from "@/lib/renovation";
import { analyzeProperty } from "@/actions/analyze";
import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import { buildImmediateEmail, buildSellerImmediateEmail } from "@/lib/emails";
import { isHoneypotTripped, isValidEmail } from "@/lib/form-safety";
import { reserveReportSend } from "@/lib/send-limits";
import { checkBotId } from "botid/server";
import { getCache, ipAddress } from "@vercel/functions";
import { headers } from "next/headers";

interface SendReportResult {
  success: boolean;
  error?: string;
}

interface SendReportRequest {
  email: string;
  input: PropertyInput;
  renovationAnswers?: RenovationAnswer[];
  mode: "buy" | "sell";
  /** Hidden honeypot field; people leave it empty. */
  website?: string;
}

/**
 * Sends one report email when the person asks for it.
 *
 * The browser sends only the property details and the address. The analysis is rerun here and
 * the email is built from that server result, so nobody can use this action to send their own
 * HTML or links from the sghaus.com domain. No follow-up emails are scheduled, and the address
 * is not stored or logged.
 */
export async function sendReportEmail(request: SendReportRequest): Promise<SendReportResult> {
  if (isHoneypotTripped(request.website)) return { success: true };

  const email = request.email.trim();
  if (!isValidEmail(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // BotID runs an invisible browser check; the page must list this path in instrumentation-client.ts.
  try {
    const verification = await checkBotId();
    if (verification.isBot) {
      return { success: false, error: "We couldn't verify this request. Please refresh the page and try again." };
    }
  } catch (err) {
    console.error("[send-report-email] bot check failed:", err instanceof Error ? err.message : "unknown error");
    return { success: false, error: "We couldn't verify this request. Please refresh the page and try again." };
  }

  const decision = await reserveReportSend({ email, ip: ipAddress(await headers()) }, getCache({ namespace: "report-email" }));
  if (!decision.allowed) {
    return {
      success: false,
      error:
        decision.reason === "address"
          ? "We’ve already sent this report to that address a few times today. Please check your inbox, or try again tomorrow."
          : "We’ve sent a lot of reports in a short time. Please try again in an hour.",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("[send-report-email] Resend is not configured");
    return { success: false, error: "We couldn't send the email just now. Please try again later." };
  }

  let result;
  try {
    result = await analyzeProperty(request.input, request.renovationAnswers, undefined, { log: false });
  } catch (err) {
    console.error("[send-report-email] analysis failed:", err instanceof Error ? err.message : "unknown error");
    return { success: false, error: "We couldn't prepare your report. Please run the analysis again." };
  }

  const message = request.mode === "sell" ? buildSellerImmediateEmail(result) : buildImmediateEmail(result);

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [email],
      replyTo: process.env.RESEND_REPLY_TO ?? "hello@sghaus.com",
      subject: message.subject,
      html: message.html,
    });
    if (error) {
      console.error("[send-report-email] Resend rejected the email:", error.message ?? "no message");
      return { success: false, error: "We couldn't send the email just now. Please try again in a minute." };
    }
    return { success: true };
  } catch (err) {
    console.error("[send-report-email] send failed:", err instanceof Error ? err.message : "unknown error");
    return { success: false, error: "We couldn't send the email just now. Please try again in a minute." };
  }
}
