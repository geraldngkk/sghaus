"use server";

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

interface ContactResult {
  success: boolean;
  error?: string;
}

export async function submitContactForm(
  name: string,
  email: string,
  message: string,
): Promise<ContactResult> {
  // Validate
  if (!name.trim()) {
    return { success: false, error: "Please enter your name." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  if (!message.trim() || message.trim().length < 10) {
    return { success: false, error: "Please enter a message (at least 10 characters)." };
  }

  if (!GOOGLE_SCRIPT_URL) {
    console.log("[contact] GOOGLE_SCRIPT_URL not set. Message from:", name, email, message);
    return { success: true };
  }

  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "contact",
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.log("[contact] Google Script returned:", res.status);
    }

    return { success: true };
  } catch (err) {
    console.log("[contact] Failed to POST to Google Script:", err);
    return { success: true };
  }
}
