"use server";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

interface SubscribeResult {
  success: boolean;
  error?: string;
}

export async function subscribeEmail(email: string): Promise<SubscribeResult> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  // POST to Google Apps Script web app
  if (!GOOGLE_SCRIPT_URL) {
    console.log("[subscribe] GOOGLE_SCRIPT_URL not set. Email captured:", email);
    return { success: true };
  }

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "sghaus-website",
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.log("[subscribe] Google Script returned:", res.status);
      // Still count as success — we don't want to block the user
      return { success: true };
    }

    return { success: true };
  } catch (err) {
    console.log("[subscribe] Failed to POST to Google Script:", err);
    // Still return success — email was validated, we just couldn't store it
    return { success: true };
  }
}
