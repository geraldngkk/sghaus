import type { MetadataRoute } from "next";
import { HDB_TOWNS } from "@/lib/constants";
import { getValidTownFlatCombos } from "@/lib/town-data";

// Stable timestamp: bumped intentionally on meaningful content changes, not on
// every crawl. A moving "now" date erodes crawler trust in lastModified.
const LAST_UPDATED = new Date("2026-07-03");

function townToSlug(town: string): string {
  return town.toLowerCase().replace(/[\s/]+/g, "-");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://sghaus.com";
  const combos = await getValidTownFlatCombos();
  return [
    { url: base, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/buy`, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sell`, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: LAST_UPDATED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: LAST_UPDATED, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/towns`, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/insights`, lastModified: LAST_UPDATED, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/guides`, lastModified: LAST_UPDATED, changeFrequency: "monthly", priority: 0.6 },
    {
      url: `${base}/guides/how-much-to-offer-for-an-hdb-resale-flat`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/guides/what-is-cov-cash-over-valuation`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/guides/bto-vs-resale-which-is-cheaper`,
      lastModified: LAST_UPDATED,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...HDB_TOWNS.map((town) => ({
      url: `${base}/towns/${townToSlug(town)}`,
      lastModified: LAST_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...combos.map((c) => ({
      url: `${base}/towns/${c.townSlug}/${c.flatSlug}`,
      lastModified: LAST_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
