#!/usr/bin/env npx tsx
// scripts/generate-bto-campaign.mts
// Generate BTO launch campaign posts showing resale pricing as Plan B.
//
// Usage:
//   npx tsx scripts/generate-bto-campaign.mts --towns "TAMPINES,BUKIT MERAH,SEMBAWANG"

import {
  fetchTransactions,
  FLAT_TYPES,
  TYPICAL_SQM,
  SQM_TO_SQFT,
  median,
  titleCase,
  formatPrice,
  formatPsf,
  parseArgs,
  writeOutput,
  type Transaction,
} from "./lib/fetch-data.mjs";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const MIN_TRANSACTIONS = 3;

async function generateForTown(town: string): Promise<string> {
  const name = titleCase(town);
  const lines: string[] = [];
  let totalTxns = 0;

  lines.push(`For those exploring resale as Plan B - here's the resale data for ${name}.`);
  lines.push("");

  for (const ft of FLAT_TYPES) {
    console.log(`  Fetching ${town} / ${ft}...`);
    const txns = await fetchTransactions(town, ft, 12);

    if (txns.length < MIN_TRANSACTIONS) continue;

    totalTxns += txns.length;
    const medPsf = median(txns.map((t) => t.pricePsf));
    const sqm = TYPICAL_SQM[ft] || 93;
    const sqft = sqm * SQM_TO_SQFT;
    const estPrice = medPsf * sqft;

    lines.push(`${ft.charAt(0) + ft.slice(1).toLowerCase()} median: ${formatPsf(medPsf)} psf (~${formatPrice(estPrice)} for ${sqm} sqm)`);
  }

  if (totalTxns === 0) {
    return `No sufficient resale data for ${name} in the last 12 months.`;
  }

  lines.push("");
  lines.push(`Based on ${totalTxns} transactions in the last 12 months.`);
  lines.push("If you want to check a specific block, sghaus.com shows you the fair offer range. Free, no signup needed. Good luck everyone.");

  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.towns) {
    console.error("Error: --towns is required.");
    console.error('Usage: npx tsx scripts/generate-bto-campaign.mts --towns "TAMPINES,BUKIT MERAH,SEMBAWANG"');
    process.exit(1);
  }

  const towns = args.towns.split(",").map((t) => t.trim().toUpperCase());
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = join(scriptDir, "output", "bto-campaign");

  console.log(`Generating BTO campaign posts for: ${towns.join(", ")}\n`);

  for (const town of towns) {
    console.log(`[${titleCase(town)}]`);
    const post = await generateForTown(town);

    const slug = town.toLowerCase().replace(/[\/\s]+/g, "-");
    const filePath = `${outputDir}/${slug}.txt`;
    await writeOutput(filePath, post);

    console.log("");
    console.log(post);
    console.log("\n" + "-".repeat(60) + "\n");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
