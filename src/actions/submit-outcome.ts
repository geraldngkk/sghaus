"use server";

import { postToSheet } from "@/lib/sheets";

interface OutcomeResult {
  success: boolean;
  error?: string;
}

/**
 * Submit a user's outcome to Google Sheets.
 * Supports both buyer (offer) and seller (sale) outcomes.
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
  if (data.mode === "sell" && !data.listed) {
    return { success: false, error: "Please answer whether you've listed or sold." };
  }
  if (data.mode === "buy" && !data.madeOffer) {
    return { success: false, error: "Please answer whether you made an offer." };
  }

  const shared = {
    block: data.block.slice(0, 10),
    street: data.street.slice(0, 80),
    useful: data.useful.slice(0, 40),
    email: data.email.trim().slice(0, 254),
    comments: data.comments.slice(0, 2000),
    timestamp: new Date().toISOString(),
  };

  const { success } =
    data.mode === "sell"
      ? await postToSheet("seller_outcome", {
          ...shared,
          listed: data.listed,
          sold: data.sold,
          salePrice: data.salePrice.slice(0, 20),
          timeToSell: data.timeToSell.slice(0, 40),
        })
      : await postToSheet("outcome", {
          ...shared,
          madeOffer: data.madeOffer,
          accepted: data.accepted,
          finalPrice: data.finalPrice.slice(0, 20),
        });

  return success
    ? { success: true }
    : { success: false, error: "We couldn't save your answers just now. Please try again in a minute." };
}
