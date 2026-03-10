import type { MetadataRoute } from "next";
import { HDB_TOWNS } from "@/lib/constants";

function townToSlug(town: string): string {
  return town.toLowerCase().replace(/[\s/]+/g, "-");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sghaus.com";
  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/buy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/sell`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...HDB_TOWNS.map((town) => ({
      url: `${base}/towns/${townToSlug(town)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];
}
