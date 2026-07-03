import { HDB_TOWNS } from "@/lib/constants";
import { getValidTownFlatCombos, townToSlug } from "@/lib/town-data";

export const revalidate = 86400;

const SITE = "https://sghaus.com";
const STATIC_PATHS = [
  "",
  "/buy",
  "/sell",
  "/about",
  "/contact",
  "/towns",
  "/insights",
  "/guides",
  "/guides/how-much-to-offer-for-an-hdb-resale-flat",
  "/guides/what-is-cov-cash-over-valuation",
  "/guides/bto-vs-resale-which-is-cheaper",
];

// Plain-text sitemap (one URL per line). Same coverage as /sitemap.xml.
export async function GET() {
  const combos = await getValidTownFlatCombos();
  const urls = [
    ...STATIC_PATHS.map((p) => `${SITE}${p}`),
    ...HDB_TOWNS.map((t) => `${SITE}/towns/${townToSlug(t)}`),
    ...combos.map((c) => `${SITE}/towns/${c.townSlug}/${c.flatSlug}`),
  ];
  return new Response(urls.join("\n") + "\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
