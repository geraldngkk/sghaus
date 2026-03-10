#!/usr/bin/env npx tsx
// scripts/generate-reply.mts
// Generate data-rich replies for specific pricing questions on forums.
//
// Usage:
//   npx tsx scripts/generate-reply.mts --town "CLEMENTI" --flat "4 ROOM" --street "CLEMENTI AVE 1" [--block 312] [--asking 650000] [--channel telegram|reddit|hwz|facebook]

import {
  fetchTransactions,
  TYPICAL_SQM,
  SQM_TO_SQFT,
  median,
  percentile,
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

type Channel = "telegram" | "reddit" | "hwz" | "facebook";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.town || !args.flat || !args.street) {
    console.error("Error: --town, --flat, and --street are required.");
    console.error('Usage: npx tsx scripts/generate-reply.mts --town "CLEMENTI" --flat "4 ROOM" --street "CLEMENTI AVE 1" [--block 312] [--asking 650000] [--channel telegram]');
    process.exit(1);
  }

  const town = args.town.toUpperCase();
  const flatType = args.flat.toUpperCase();
  const street = args.street.toUpperCase();
  const block = args.block || null;
  const asking = args.asking ? parseInt(args.asking, 10) : null;
  const channel: Channel = (args.channel as Channel) || "telegram";

  const validChannels: Channel[] = ["telegram", "reddit", "hwz", "facebook"];
  if (!validChannels.includes(channel)) {
    console.error(`Error: Invalid channel "${channel}". Use: ${validChannels.join(", ")}`);
    process.exit(1);
  }

  const sqm = TYPICAL_SQM[flatType] || 93;
  const sqft = sqm * SQM_TO_SQFT;

  console.log(`Town: ${town}, Flat: ${flatType}, Street: ${street}`);
  if (block) console.log(`Block: ${block}`);
  if (asking) console.log(`Asking: ${formatPrice(asking)}`);
  console.log(`Channel: ${channel}\n`);

  // Fetch data
  console.log("Fetching transaction data...");
  const txns = await fetchTransactions(town, flatType, 12);

  // Filter to street
  const streetTxns = txns.filter((t) => t.streetName === street);
  console.log(`${streetTxns.length} transactions on ${street} in the last 12 months.`);

  if (streetTxns.length === 0) {
    console.error(`No transactions found for ${street}. Check the street name matches the data exactly.`);
    console.log(`\nAvailable streets for ${town} / ${flatType}:`);
    const streets = [...new Set(txns.map((t) => t.streetName))].sort();
    for (const s of streets) console.log(`  ${s}`);
    process.exit(1);
  }

  // Street-level stats
  const streetPsfs = streetTxns.map((t) => t.pricePsf);
  const medPsf = median(streetPsfs);
  const p25 = percentile(streetPsfs, 25);
  const p75 = percentile(streetPsfs, 75);

  // Block-level stats (if specified)
  let blockTxns: Transaction[] = [];
  if (block) {
    blockTxns = streetTxns.filter((t) => t.block === block);
    console.log(`${blockTxns.length} transactions at Blk ${block}.`);
  }

  // Asking price comparison
  let askingPsf: number | null = null;
  let askingVsMedianPct: number | null = null;
  if (asking) {
    askingPsf = asking / sqft;
    askingVsMedianPct = ((askingPsf - medPsf) / medPsf) * 100;
  }

  // Fair value range
  const fairLow = Math.round(p25 * sqft);
  const fairHigh = Math.round(p75 * sqft);

  // Generate the post
  const post = formatPost(channel, {
    town,
    flatType,
    street,
    block,
    sqm,
    sqft,
    medPsf,
    p25,
    p75,
    fairLow,
    fairHigh,
    streetTxnCount: streetTxns.length,
    blockTxns,
    asking,
    askingPsf,
    askingVsMedianPct,
  });

  console.log("\n" + "=".repeat(60));
  console.log(post);
  console.log("=".repeat(60));

  // Save
  const slug = `${town}-${street}-${flatType}`.toLowerCase().replace(/[\/\s]+/g, "-");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = join(scriptDir, "output", "replies");
  const filePath = `${outputDir}/${slug}-${channel}.txt`;
  await writeOutput(filePath, post);
  console.log(`\nSaved to: ${filePath}`);
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

interface PostData {
  town: string;
  flatType: string;
  street: string;
  block: string | null;
  sqm: number;
  sqft: number;
  medPsf: number;
  p25: number;
  p75: number;
  fairLow: number;
  fairHigh: number;
  streetTxnCount: number;
  blockTxns: Transaction[];
  asking: number | null;
  askingPsf: number | null;
  askingVsMedianPct: number | null;
}

function formatPost(channel: Channel, d: PostData): string {
  switch (channel) {
    case "telegram":
      return formatTelegram(d);
    case "reddit":
      return formatReddit(d);
    case "hwz":
      return formatHwz(d);
    case "facebook":
      return formatFacebook(d);
  }
}

function blockPsfList(txns: Transaction[]): string {
  return txns.map((t) => formatPsf(t.pricePsf)).join(", ");
}

function askingComparison(d: PostData): string {
  if (!d.asking || !d.askingPsf || d.askingVsMedianPct === null) return "";
  const dir = d.askingVsMedianPct > 0 ? "above" : "below";
  return `${formatPrice(d.asking)} asking price works out to ~${formatPsf(d.askingPsf)} psf which is ${Math.abs(Math.round(d.askingVsMedianPct))}% ${dir} recent transactions.`;
}

function formatTelegram(d: PostData): string {
  const streetDisplay = titleCase(d.street);
  const ftLower = d.flatType.toLowerCase();
  const parts: string[] = [];

  parts.push(
    `Last 12 months, ${streetDisplay} ${ftLower} resale averaged ${formatPsf(d.p25)}-${formatPsf(d.p75)} psf. At ${d.sqm} sqm that puts fair range around ${formatPrice(d.fairLow)}-${formatPrice(d.fairHigh)}.`
  );

  if (d.block && d.blockTxns.length > 0) {
    parts.push(
      `Blk ${d.block} specifically had ${d.blockTxns.length} transaction${d.blockTxns.length > 1 ? "s" : ""}: ${blockPsfList(d.blockTxns)} psf.`
    );
  }

  const askComp = askingComparison(d);
  if (askComp) parts.push(askComp);

  return parts.join(" ");
}

function formatReddit(d: PostData): string {
  const streetDisplay = titleCase(d.street);
  const ftLower = d.flatType.toLowerCase();
  const lines: string[] = [];

  lines.push(`Pulled the data for ${streetDisplay} ${ftLower}:`);
  lines.push("");
  lines.push(`- Last 12 months median: ${formatPsf(d.medPsf)} psf`);
  lines.push(`- Range: ${formatPsf(d.p25)}-${formatPsf(d.p75)} psf`);

  if (d.block && d.blockTxns.length > 0) {
    const psfRange =
      d.blockTxns.length === 1
        ? `at ${formatPsf(d.blockTxns[0].pricePsf)} psf`
        : `at ${formatPsf(Math.min(...d.blockTxns.map((t) => t.pricePsf)))}-${formatPsf(Math.max(...d.blockTxns.map((t) => t.pricePsf)))} psf`;
    lines.push(`- Blk ${d.block}: ${d.blockTxns.length} transaction${d.blockTxns.length > 1 ? "s" : ""} ${psfRange}`);
  }

  lines.push(`- At ${d.sqm} sqm, fair value range: ${formatPrice(d.fairLow)}-${formatPrice(d.fairHigh)}`);

  if (d.asking && d.askingPsf && d.askingVsMedianPct !== null) {
    const dir = d.askingVsMedianPct > 0 ? "above" : "below";
    lines.push("");
    lines.push(
      `The asking price of ${formatPrice(d.asking)} (${formatPsf(d.askingPsf)} psf) is ~${Math.abs(Math.round(d.askingVsMedianPct))}% ${dir} the median. I used SGHaus to run this - free tool that pulls from real transactions. sghaus.com if you want to check other blocks.`
    );
  } else {
    lines.push("");
    lines.push("I used SGHaus to run this - free tool that pulls from real transactions. sghaus.com if you want to check other blocks.");
  }

  return lines.join("\n");
}

function formatHwz(d: PostData): string {
  const ftLower = d.flatType.toLowerCase();
  const parts: string[] = [];

  if (d.block && d.blockTxns.length > 0) {
    parts.push(
      `Bro, Blk ${d.block} ${titleCase(d.street)} last 12 months got ${d.blockTxns.length} transaction${d.blockTxns.length > 1 ? "s" : ""}: ${blockPsfList(d.blockTxns)} psf. Median ${formatPsf(d.medPsf)} psf. ${d.sqm} sqm x ${formatPsf(d.medPsf).slice(1)} / 10.764 = ~${formatPrice(d.medPsf * d.sqft)} fair value.`
    );
  } else {
    parts.push(
      `Bro, ${titleCase(d.street)} ${ftLower} last 12 months median ${formatPsf(d.medPsf)} psf. Range ${formatPsf(d.p25)}-${formatPsf(d.p75)} psf. ${d.sqm} sqm = ~${formatPrice(d.fairLow)}-${formatPrice(d.fairHigh)} fair value.`
    );
  }

  if (d.asking && d.askingPsf && d.askingVsMedianPct !== null) {
    const label = d.askingVsMedianPct > 5 ? "quite high" : d.askingVsMedianPct < -5 ? "quite low" : "about right";
    parts.push(`${formatPrice(d.asking)} asking = ${formatPsf(d.askingPsf)} psf, ${label}. Unless very high floor or renovated.`);
  }

  return parts.join(" ");
}

function formatFacebook(d: PostData): string {
  const parts: string[] = [];

  parts.push(
    `Based on recent transactions around that block, similar flats sold for ${formatPsf(d.p25)}-${formatPsf(d.p75)} psf. `
  );

  if (d.asking && d.askingPsf && d.askingVsMedianPct !== null) {
    const label =
      d.askingVsMedianPct > 10
        ? "on the high side"
        : d.askingVsMedianPct > 0
          ? "slightly above average"
          : d.askingVsMedianPct < -10
            ? "below average"
            : "about right";
    parts.push(
      `Your asking price works out to about ${formatPsf(d.askingPsf)} psf which is ${label}. `
    );
  }

  parts.push(
    `I'd suggest offering around ${formatPsf(d.medPsf)} psf as a starting point. That's roughly ${formatPrice(d.medPsf * d.sqft)} for a ${d.sqm} sqm unit.`
  );

  return parts.join("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
