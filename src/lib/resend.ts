import { Resend } from "resend";

/**
 * Singleton Resend client.
 * Requires RESEND_API_KEY in environment variables.
 * Returns null if not configured (graceful fallback for local dev).
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("[resend] RESEND_API_KEY not set — email sending disabled");
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Verified sender address.
 * Must match a verified domain in Resend dashboard.
 * Fallback to Resend's test domain for development.
 */
export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL ?? "SGHaus <hello@sghaus.com>";
