import { HDB_TOWNS } from "@/lib/constants";
import { townToSlug, titleCase } from "@/lib/town-data";

export const revalidate = 86400;

const SITE = "https://sghaus.com";
const UPDATED = "2026-07-03T00:00:00Z";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Atom 1.0 feed of the main content pages. Bing accepts this as a sitemap format.
export async function GET() {
  const entries = [
    { url: `${SITE}/`, title: "SGHaus: know your number" },
    { url: `${SITE}/buy`, title: "What to offer on a Singapore house" },
    { url: `${SITE}/sell`, title: "Price your Singapore house for sale" },
    { url: `${SITE}/guides`, title: "Singapore home guides" },
    ...HDB_TOWNS.map((t) => ({
      url: `${SITE}/towns/${townToSlug(t)}`,
      title: `${titleCase(t)} resale prices`,
    })),
  ];
  const body = entries
    .map(
      (e) =>
        `<entry><title>${esc(e.title)}</title><link href="${e.url}"/>` +
        `<id>${e.url}</id><updated>${UPDATED}</updated></entry>`,
    )
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<feed xmlns="http://www.w3.org/2005/Atom">` +
    `<title>SGHaus</title><link href="${SITE}"/>` +
    `<link rel="self" href="${SITE}/atom.xml"/>` +
    `<id>${SITE}/</id><updated>${UPDATED}</updated>` +
    body +
    `</feed>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
  });
}
