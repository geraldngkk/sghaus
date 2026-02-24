"use server";

interface OutcomeResult {
  success: boolean;
  error?: string;
}

/**
 * Submit a user's offer outcome to Google Sheets.
 * Fire-and-forget pattern — never blocks the UI on failure.
 */
export async function submitOutcome(data: {
  block: string;
  street: string;
  madeOffer: string;
  accepted: string;
  finalPrice: string;
  useful: string;
  email: string;
  comments: string;
}): Promise<OutcomeResult> {
  // Basic validation
  if (!data.madeOffer) {
    return { success: false, error: "Please answer whether you made an offer." };
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    console.log("[submit-outcome] GOOGLE_SCRIPT_URL not set. Logging locally:", data);
    return { success: true };
  }

  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "outcome",
        block: data.block,
        street: data.street,
        madeOffer: data.madeOffer,
        accepted: data.accepted,
        finalPrice: data.finalPrice,
        useful: data.useful,
        email: data.email,
        comments: data.comments,
        timestamp: new Date().toISOString(),
      }),
    });

    console.log(`[submit-outcome] Outcome submitted for Blk ${data.block} ${data.street}`);
    return { success: true };
  } catch (err) {
    console.error("[submit-outcome] Failed:", err);
    return { success: true }; // Never fail the user-facing response
  }
}
