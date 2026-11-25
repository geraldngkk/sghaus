const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes text for safe use inside HTML element content and attribute values. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}

/** Collapses line breaks so a value can't add headers or lines to an email subject. */
export function singleLine(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}
