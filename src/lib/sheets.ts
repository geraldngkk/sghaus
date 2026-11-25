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
        type,
        secret: process.env.SHEETS_SHARED_SECRET ?? "",
        ...neutraliseRow(row),
      }),
    });
    if (!res.ok) {
      console.error(`[sheets] ${type}: HTTP ${res.status}`);
      return { success: false };
    }
    const body = (await res.json()) as { status?: string };
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
