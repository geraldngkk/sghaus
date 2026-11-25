// Fails when a route that must stay static or ISR shows up as dynamic in `next build` output.
// Usage: pnpm build > build.log && pnpm check:static build.log
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// Routes outside the translated (i18n) group; a cookie read must never reach them.
export const MUST_STAY_STATIC = [
  "/towns",
  "/towns/[town]",
  "/towns/[town]/[flatType]",
  "/insights",
  "/guides",
  "/guides/bto-vs-resale-which-is-cheaper",
  "/guides/how-much-to-offer-for-an-hdb-resale-flat",
  "/guides/what-is-cov-cash-over-valuation",
  "/contact",
  "/outcome",
  "/sitemap.xml",
  "/sitemap.txt",
  "/rss.xml",
  "/atom.xml",
];

/** Maps each route in the build table to its marker: ○ static, ● SSG, ƒ dynamic. */
export function parseRouteTable(log: string): Map<string, string> {
  const routes = new Map<string, string>();
  for (const line of log.split(/\r?\n/)) {
    const match = line.match(/^[┌├└]\s+([○●ƒ◐])\s+(\/\S*)/);
    if (match) routes.set(match[2], match[1]);
  }
  return routes;
}

export function findRegressions(log: string, required = MUST_STAY_STATIC): string[] {
  const routes = parseRouteTable(log);
  return required.flatMap((route) => {
    const marker = routes.get(route);
    if (marker === undefined) return [`${route}: missing from the build table`];
    if (marker === "ƒ") return [`${route}: now dynamic`];
    return [];
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: check-static-routes <build-log>");
    process.exit(2);
  }
  const problems = findRegressions(readFileSync(file, "utf8"));
  if (problems.length > 0) {
    console.error(`Static rendering regressions:\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`All ${MUST_STAY_STATIC.length} routes are still static or ISR.`);
}
