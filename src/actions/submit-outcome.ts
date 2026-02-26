"use server";

interface OutcomeResult {
  success: boolean;
  error?: string;
}

/**
 * Submit a user's outcome to Google Sheets.
 * Supports both buyer (offer) and seller (sale) outcomes.
 * Fire-and-forget pattern: never blocks the UI on failure.
 */
export async function submitOutcome(data: {
  mode: "buy" | "sell";
  block: string;
  street: string;
  // Buyer fields
  madeOffer: string;
  accepted: string;
  finalPrice: string;
  // Seller fields
  listed: string;
  sold: string;
  salePrice: string;
  timeToSell: string;
  // Shared
  useful: string;
  email: string;
  comments: string;
}): Promise<OutcomeResult> {
  // Basic validation
  if (data.mode === "sell" && !data.listed) {
    return { success: false, error: "Please answer whether you've listed or sold." };
  }
  if (data.mode === "buy" && !data.madeOffer) {
    return { success: false, error: "Please answer whether you made an offer." };
  }

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) {
    console.log("[submit-outcome] GOOGLE_SCRIPT_URL not set. Logging locally:", data);
    return { success: true };
  }

  try {
    const payload =
      data.mode === "sell"
        ? {
            type: "seller_outcome",
            block: data.block,
            street: data.street,
            listed: data.listed,
            sold: data.sold,
            salePrice: data.salePrice,
            timeToSell: data.timeToSell,
            useful: data.useful,
            email: data.email,
            comments: data.comments,
            timestamp: new Date().toISOString(),
          }
        : {
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
          };

    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`[submit-outcome] ${data.mode} outcome submitted for Blk ${data.block} ${data.street}`);
    return { success: true };
  } catch (err) {
    console.error("[submit-outcome] Failed:", err);
    return { success: true }; // Never fail the user-facing response
  }
}
