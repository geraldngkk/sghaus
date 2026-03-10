#!/usr/bin/env npx tsx
// scripts/generate-market-pulse.mts
// Generate monthly market pulse posts for Telegram, Reddit, and Facebook.
//
// Usage:
//   npx tsx scripts/generate-market-pulse.mts [--town TAMPINES] [--month 2026-03]

import {
  fetchTransactions,
  HDB_TOWNS,
  FLAT_TYPES,
  SQM_TO_SQFT,
  median,
  titleCase,
  formatPrice,
  formatPsf,
  currentMonth,
  displayMonth,
  parseArgs,
  writeOutput,
  type Transaction,
} from "./lib/fetch-data.mjs";

// ---------------------------------------------------------------------------
// Stats calculation
// ---------------------------------------------------------------------------

interface TownStats {
  town: string;
  month: string;
  txnCount12m: number;
  medianPsf12m: number;
  medianPsf12to24m: number;
  yoyTrend: number | null;
  highestSale: Transaction | null;
  lowestSale: Transaction | null;
  mostActiveFlatType: string;
}

async function computeTownStats(town: string, targetMonth: string): Promise<TownStats> {
  // Fetch 24 months of data across all flat types
  const allTxns: Transaction[] = [];
  for (const ft of FLAT_TYPES) {
    console.log(`  Fetching ${town} / ${ft}...`);
    const txns = await fetchTransactions(town, ft, 24);
    allTxns.push(...txns);
  }

  // Split into 12m and 12-24m windows
  const cutoff12m = new Date();
  cutoff12m.setMonth(cutoff12m.getMonth() - 12);
  const cutoff12mStr = `${cutoff12m.getFullYear()}-${String(cutoff12m.getMonth() + 1).padStart(2, "0")}`;

  const recent = allTxns.filter((t) => t.month >= cutoff12mStr);
  const older = allTxns.filter((t) => t.month < cutoff12mStr);

  const medianPsf12m = median(recent.map((t) => t.pricePsf));
  const medianPsf12to24m = median(older.map((t) => t.pricePsf));
  const yoyTrend =
    medianPsf12to24m > 0
      ? ((medianPsf12m - medianPsf12to24m) / medianPsf12to24m) * 100
      : null;

  // Highest and lowest by absolute price in 12m
  const sorted = [...recent].sort((a, b) => a.resalePrice - b.resalePrice);
  const lowestSale = sorted.length > 0 ? sorted[0] : null;
  const highestSale = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  // Most active flat type
  const ftCounts: Record<string, number> = {};
  for (const t of recent) {
    ftCounts[t.flatType] = (ftCounts[t.flatType] || 0) + 1;
  }
  const mostActiveFlatType =
    Object.entries(ftCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return {
    town,
    month: targetMonth,
    txnCount12m: recent.length,
    medianPsf12m,
    medianPsf12to24m,
    yoyTrend,
    highestSale,
    lowestSale,
    mostActiveFlatType,
  };
}

// ---------------------------------------------------------------------------
// Post generation
// ---------------------------------------------------------------------------

function trendStr(yoy: number | null): string {
  if (yoy === null) return "N/A";
  const sign = yoy >= 0 ? "+" : "";
  return `${sign}${yoy.toFixed(1)}%`;
}

function trendStrVerbose(yoy: number | null): string {
  if (yoy === null) return "N/A";
  const sign = yoy >= 0 ? "+" : "";
  return `${sign}${yoy.toFixed(1)}% vs last year`;
}

function saleStr(t: Transaction | null): string {
  if (!t) return "N/A";
  return `Blk ${t.block} ${formatPrice(t.resalePrice)} (${formatPsf(t.pricePsf)} psf)`;
}

function saleStrLong(t: Transaction | null): string {
  if (!t) return "N/A";
  return `Blk ${t.block} - ${formatPrice(t.resalePrice)} (${formatPsf(t.pricePsf)} psf)`;
}

function generateTelegram(s: TownStats): string {
  const name = titleCase(s.town);
  const monthDisplay = displayMonth(s.month);
  return [
    `${name} Resale Pulse - ${monthDisplay}`,
    "",
    `Transactions: ${s.txnCount12m}`,
    `Median PSF: ${formatPsf(s.medianPsf12m)} (${trendStr(s.yoyTrend)} YoY)`,
    `Biggest sale: ${saleStr(s.highestSale)}`,
    `Most active: ${s.mostActiveFlatType}`,
    "",
    `Personalised offer range for any block: sghaus.com`,
  ].join("\n");
}

function generateReddit(s: TownStats): string {
  const name = titleCase(s.town);
  const monthDisplay = displayMonth(s.month);
  return [
    `## ${name} HDB Resale Pulse - ${monthDisplay}`,
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Transactions | ${s.txnCount12m} |`,
    `| Median PSF | ${formatPsf(s.medianPsf12m)} (${trendStr(s.yoyTrend)} YoY) |`,
    `| Biggest sale | ${saleStrLong(s.highestSale)} |`,
    `| Most active flat type | ${s.mostActiveFlatType} |`,
    "",
    "Data from real transactions. If you want to check a specific block, sghaus.com gives you a personalised offer range (free, no signup).",
    "",
    "---",
    "*I pull this data monthly for the towns I track. Happy to run other towns if anyone wants.*",
  ].join("\n");
}

function generateFacebook(s: TownStats): string {
  const name = titleCase(s.town);
  const monthDisplay = displayMonth(s.month);
  return [
    `${name} Resale Update - ${monthDisplay}`,
    "",
    `Transactions: ${s.txnCount12m}`,
    `Median PSF: ${formatPsf(s.medianPsf12m)} (${trendStrVerbose(s.yoyTrend)})`,
    `Highest: ${saleStr(s.highestSale)}`,
    `Lowest: ${saleStr(s.lowestSale)}`,
    `Most active: ${s.mostActiveFlatType}`,
    "",
    "Want to check a specific block? sghaus.com shows you the fair offer range. Free, no signup needed.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetMonth = args.month || currentMonth();
  const towns = args.town ? [args.town.toUpperCase()] : [...HDB_TOWNS];

  // Validate town
  if (args.town && !HDB_TOWNS.includes(args.town.toUpperCase() as typeof HDB_TOWNS[number])) {
    console.error(`Error: Unknown town "${args.town}". Valid towns:`);
    console.error(HDB_TOWNS.join(", "));
    process.exit(1);
  }

  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = join(scriptDir, "output", `market-pulse-${targetMonth}`);

  console.log(`Generating market pulse for ${displayMonth(targetMonth)}`);
  console.log(`Towns: ${towns.length === 1 ? towns[0] : `ALL (${towns.length})`}`);
  console.log(`Output: ${outputDir}\n`);

  for (let i = 0; i < towns.length; i++) {
    const town = towns[i];
    console.log(`[${i + 1}/${towns.length}] ${titleCase(town)}...`);

    const stats = await computeTownStats(town, targetMonth);

    if (stats.txnCount12m === 0) {
      console.log(`  Skipping ${town}: no transactions in the last 12 months.\n`);
      continue;
    }

    const telegram = generateTelegram(stats);
    const reddit = generateReddit(stats);
    const facebook = generateFacebook(stats);

    const combined = [
      "=== TELEGRAM ===",
      telegram,
      "",
      "=== REDDIT ===",
      reddit,
      "",
      "=== FACEBOOK ===",
      facebook,
    ].join("\n");

    const slug = town.toLowerCase().replace(/[\/\s]+/g, "-");
    const filePath = `${outputDir}/${slug}.txt`;
    await writeOutput(filePath, combined);

    // Print to stdout
    console.log("");
    console.log(combined);
    console.log("\n" + "-".repeat(60) + "\n");
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
