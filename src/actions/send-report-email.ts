"use server";

import type { PropertyInput } from "@/types";
import type { RenovationAnswer } from "@/lib/renovation";
import { analyzeProperty } from "@/actions/analyze";
import { getResendClient, EMAIL_FROM } from "@/lib/resend";
import { buildImmediateEmail, buildSellerImmediateEmail } from "@/lib/emails";
import { isHoneypotTripped, isValidEmail } from "@/lib/form-safety";

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
