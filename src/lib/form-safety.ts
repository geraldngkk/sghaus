// Input safety for anything written to Google Sheets or sent by email.
// Spreadsheet apps run a cell as a formula when it starts with one of these characters,
// so every string value gets a leading apostrophe, which the sheet stores as plain text.

const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

export type CellValue = string | number | boolean;

export function neutraliseCell(value: unknown): CellValue {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  const text = String(value);
  return FORMULA_TRIGGERS.some((t) => text.startsWith(t)) ? `'${text}` : text;
}

export function neutraliseRow(row: Record<string, unknown>): Record<string, CellValue> {
  const out: Record<string, CellValue> = {};
  for (const [key, value] of Object.entries(row)) out[key] = neutraliseCell(value);
  return out;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export type FieldCheck =
  | { ok: true; values: Record<string, string> }
  | { ok: false; field: string };

/** Trims each field and checks it against its maximum length. Missing fields become "". */
export function validateFields(
  input: Record<string, string | undefined>,
  limits: Record<string, number>,
): FieldCheck {
  const values: Record<string, string> = {};
  for (const [field, max] of Object.entries(limits)) {
    const value = (input[field] ?? "").trim();
    if (value.length > max) return { ok: false, field };
    values[field] = value;
  }
  return { ok: true, values };
}

/** Forms carry a visually hidden field that people never fill; bots usually do. */
export function isHoneypotTripped(value: string | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
