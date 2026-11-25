"use server";

import { isValidEmail } from "@/lib/form-safety";
import { postToSheet } from "@/lib/sheets";

interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeEmail(
  email: string,
  utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string },
): Promise<SubscribeResult> {
  const address = email.trim();
  if (!isValidEmail(address)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const { success } = await postToSheet("subscribe", {
    email: address,
    source: utm?.utm_source || "direct",
    medium: utm?.utm_medium || "",
    campaign: utm?.utm_campaign || "",
    content: utm?.utm_content || "",
    timestamp: new Date().toISOString(),
  });

  return success
    ? { success: true }
    : { success: false, error: "We couldn't save that just now. Please try again in a minute." };
}
