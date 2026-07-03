import { HDB_TOWNS } from "@/lib/constants";
import { townToSlug, titleCase } from "@/lib/town-data";

export const revalidate = 86400;

const SITE = "https://sghaus.com";
const UPDATED = new Date("2026-07-03T00:00:00Z").toUTCString();

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// RSS 2.0 feed of the main content pages. Bing accepts this as a sitemap format.
export async function GET() {
  const items = [
    { url: `${SITE}/`, title: "SGHaus: know your number" },
    { url: `${SITE}/buy`, title: "What to offer on a Singapore house" },
    { url: `${SITE}/sell`, title: "Price your Singapore house for sale" },
    { url: `${SITE}/guides`, title: "Singapore home guides" },
    { url: `${SITE}/guides/how-much-to-offer-for-an-hdb-resale-flat`, title: "How much should you offer" },
    { url: `${SITE}/guides/what-is-cov-cash-over-valuation`, title: "What is Cash Over Valuation" },
    { url: `${SITE}/guides/bto-vs-resale-which-is-cheaper`, title: "BTO vs resale: which is cheaper" },
    ...HDB_TOWNS.map((t) => ({
      url: `${SITE}/towns/${townToSlug(t)}`,
      title: `${titleCase(t)} resale prices`,
    })),
  ];
  const body = items
    .map(
      (i) =>
        `<item><title>${esc(i.title)}</title><link>${i.url}</link>` +
        `<guid isPermaLink="true">${i.url}</guid><pubDate>${UPDATED}</pubDate></item>`,
    )
    .join("");
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0"><channel>` +
    `<title>SGHaus</title><link>${SITE}</link>` +
    `<description>Data-backed resale prices and offer strategies for Singapore homes.</description>` +
    `<language>en-SG</language><lastBuildDate>${UPDATED}</lastBuildDate>` +
    body +
    `</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
