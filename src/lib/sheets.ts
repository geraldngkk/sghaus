import { neutraliseRow } from "./form-safety";

// Every write to the Google Apps Script web app goes through here.
// The script is public, so it checks SHEETS_SHARED_SECRET on every request, and it answers
// HTTP 200 even on failure, so success is read from the JSON body, never from the status code.
// Logs carry the record type and outcome only, never names, emails or listing details.

export type SheetRecordType = "subscribe" | "analysis" | "contact" | "outcome" | "seller_outcome" | "clinic_signup";

export interface SheetResult {
  success: boolean;
}

export async function postToSheet(
  type: SheetRecordType,
  row: Record<string, unknown>,
): Promise<SheetResult> {
  const url = process.env.GOOGLE_SCRIPT_URL;
  if (!url) {
    console.error(`[sheets] ${type}: GOOGLE_SCRIPT_URL is not set`);
    return { success: false };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...neutraliseRow(row),
        type,
        secret: process.env.SHEETS_SHARED_SECRET ?? "",
      }),
    });
    if (!res.ok) {
      console.error(`[sheets] ${type}: HTTP ${res.status}`);
      return { success: false };
    }
    // Until the new script is deployed, the old one answers in an unknown format. With
    // SHEETS_ACCEPT_LEGACY_REPLY=1 a 2xx reply that carries no status counts as saved,
    // as it always did. Remove the variable once the new script is live.
    const legacy = process.env.SHEETS_ACCEPT_LEGACY_REPLY === "1";
    let body: { status?: string } | null = null;
    try {
      body = (await res.json()) as { status?: string };
    } catch {
      if (legacy) {
        console.warn(`[sheets] ${type}: legacy script reply accepted (not JSON)`);
        return { success: true };
      }
      console.error(`[sheets] ${type}: script reply was not JSON`);
      return { success: false };
    }
    if (legacy && (body === null || typeof body !== "object" || !("status" in body))) {
      console.warn(`[sheets] ${type}: legacy script reply accepted (no status)`);
      return { success: true };
    }
    if (body?.status !== "ok") {
      console.error(`[sheets] ${type}: script reported ${body?.status ?? "no status"}`);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error(`[sheets] ${type}: request failed`, err instanceof Error ? err.message : "unknown error");
    return { success: false };
  }
}
