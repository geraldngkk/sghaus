#!/usr/bin/env npx tsx
// scripts/generate-mop-outreach.mts
// Generate MOP outreach messages for sellers and buyers near a specific project.
//
// Usage:
//   npx tsx scripts/generate-mop-outreach.mts --project "Alkaff Oasis" --town "TOA PAYOH" --blocks "210,211,212,213"

import {
  fetchAllFlatTypes,
  median,
  percentile,
  titleCase,
  formatPsf,
  parseArgs,
  writeOutput,
  type Transaction,
} from "./lib/fetch-data.mjs";

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function parseBlockRange(blocksCsv: string, adjacentRange = 2): number[] {
  const blocks = blocksCsv.split(",").map((b) => parseInt(b.trim(), 10));
  const expanded = new Set<number>();
  for (const b of blocks) {
    for (let i = b - adjacentRange; i <= b + adjacentRange; i++) {
      expanded.add(i);
    }
  }
  return [...expanded].sort((a, b) => a - b);
}

interface FlatTypeRange {
  flatType: string;
  psfLow: number;
  psfHigh: number;
  count: number;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.project || !args.town || !args.blocks) {
    console.error("Error: --project, --town, and --blocks are all required.");
    console.error('Usage: npx tsx scripts/generate-mop-outreach.mts --project "Alkaff Oasis" --town "TOA PAYOH" --blocks "210,211,212,213"');
    process.exit(1);
  }

  const project = args.project;
  const town = args.town.toUpperCase();
  const blockNums = parseBlockRange(args.blocks);

  console.log(`Project: ${project}`);
  console.log(`Town: ${town}`);
  console.log(`Block range: ${blockNums.join(", ")}\n`);

  // Fetch 24 months for the town
  console.log("Fetching transaction data...");
  const allTxns = await fetchAllFlatTypes(town, 24);

  // Filter to blocks in range
  const blockStrs = blockNums.map(String);
  // Also match blocks like "210A" by checking if the numeric part matches
  const matched = allTxns.filter((t) => {
    const num = parseInt(t.block, 10);
    return blockNums.includes(num);
  });

  console.log(`Found ${matched.length} transactions in block range.\n`);

  if (matched.length === 0) {
    console.error("No transactions found for the specified blocks. Try expanding the block range.");
    process.exit(1);
  }

  // Group by flat type and compute PSF range (P25-P75)
  const byFlatType: Record<string, Transaction[]> = {};
  for (const t of matched) {
    if (!byFlatType[t.flatType]) byFlatType[t.flatType] = [];
    byFlatType[t.flatType].push(t);
  }

  const ranges: FlatTypeRange[] = [];
  for (const [ft, txns] of Object.entries(byFlatType).sort()) {
    if (txns.length < 2) continue;
    const psfs = txns.map((t) => t.pricePsf);
    ranges.push({
      flatType: ft,
      psfLow: Math.round(percentile(psfs, 25)),
      psfHigh: Math.round(percentile(psfs, 75)),
      count: txns.length,
    });
  }

  if (ranges.length === 0) {
    console.error("Not enough transactions per flat type to generate ranges.");
    process.exit(1);
  }

  const townDisplay = titleCase(town);

  // --- Seller message ---
  const sellerLines: string[] = [];
  sellerLines.push(`MOP is here for ${project}. If you're thinking of selling, here's what similar units in your blocks have sold for:`);
  sellerLines.push("");
  for (const r of ranges) {
    sellerLines.push(`${r.flatType.charAt(0) + r.flatType.slice(1).toLowerCase()}: ${formatPsf(r.psfLow)}-${formatPsf(r.psfHigh)} psf (based on ${r.count} transactions)`);
  }
  sellerLines.push("");
  sellerLines.push(`SGHaus (sghaus.com/sell) gives you Floor/Target/Opening Ask for your specific unit. Free.`);

  // --- Buyer message ---
  const buyerLines: string[] = [];
  buyerLines.push(`Units from ${project} are hitting the resale market. If you're looking to buy in ${townDisplay}, here's current pricing:`);
  buyerLines.push("");
  for (const r of ranges) {
    buyerLines.push(`${r.flatType.charAt(0) + r.flatType.slice(1).toLowerCase()}: ${formatPsf(r.psfLow)}-${formatPsf(r.psfHigh)} psf`);
  }
  buyerLines.push("");
  buyerLines.push("Check any block at sghaus.com. Free offer range in 60 seconds.");

  const combined = [
    "=== SELLER MESSAGE ===",
    sellerLines.join("\n"),
    "",
    "=== BUYER MESSAGE ===",
    buyerLines.join("\n"),
  ].join("\n");

  // Output
  const slug = project.toLowerCase().replace(/\s+/g, "-");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = join(scriptDir, "output", "mop-outreach");
  const filePath = `${outputDir}/${slug}.txt`;
  await writeOutput(filePath, combined);

  console.log(combined);
  console.log(`\nSaved to: ${filePath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
