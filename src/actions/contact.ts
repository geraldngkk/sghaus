"use server";

import { isHoneypotTripped, isValidEmail, validateFields } from "@/lib/form-safety";
import { postToSheet } from "@/lib/sheets";
import { checkBotId } from "botid/server";

interface ContactResult {
  success: boolean;
  error?: string;
}

export async function submitContactForm(
  name: string,
  email: string,
  message: string,
  website?: string,
): Promise<ContactResult> {
  // Bots fill the hidden "website" field; pretend success so they move on.
  if (isHoneypotTripped(website)) return { success: true };

  const checked = validateFields({ name, message }, { name: 80, message: 2000 });
  if (!checked.ok) {
    return { success: false, error: checked.field === "name" ? "Please keep your name shorter." : "Please keep your message under 2,000 characters." };
  }
  if (!checked.values.name) {
    return { success: false, error: "Please enter your name." };
  }
  if (!isValidEmail(email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (checked.values.message.length < 10) {
    return { success: false, error: "Please enter a message (at least 10 characters)." };
  }

  // Every saved message also emails Gerald, so bots must not reach the sheet.
  try {
    if ((await checkBotId()).isBot) {
      return { success: false, error: "We couldn't verify this request. Please refresh the page and try again." };
    }
  } catch (err) {
    console.error("[contact] bot check failed:", err instanceof Error ? err.message : "unknown error");
    return { success: false, error: "We couldn't verify this request. Please refresh the page and try again." };
  }

  const { success } = await postToSheet("contact", {
    name: checked.values.name,
    email: email.trim(),
    message: checked.values.message,
    timestamp: new Date().toISOString(),
  });

  return success
    ? { success: true }
    : { success: false, error: "We couldn't send your message just now. Please try again, or email hello@sghaus.com." };
}
