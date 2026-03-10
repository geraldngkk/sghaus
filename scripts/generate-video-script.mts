#!/usr/bin/env npx tsx
// scripts/generate-video-script.mts
// Generate TikTok/Reels video scripts with real transaction data.
//
// Usage:
//   npx tsx scripts/generate-video-script.mts --town "TAMPINES" --flat "5 ROOM" --asking 750000 [--block 497] [--street "TAMPINES ST 21"]

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

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.town || !args.flat || !args.asking) {
    console.error("Error: --town, --flat, and --asking are required.");
    console.error('Usage: npx tsx scripts/generate-video-script.mts --town "TAMPINES" --flat "5 ROOM" --asking 750000 [--block 497] [--street "TAMPINES ST 21"]');
    process.exit(1);
  }

  const town = args.town.toUpperCase();
  const flatType = args.flat.toUpperCase();
  const asking = parseInt(args.asking, 10);
  const block = args.block || null;
  const street = args.street ? args.street.toUpperCase() : null;

  const sqm = TYPICAL_SQM[flatType] || 93;
  const sqft = sqm * SQM_TO_SQFT;

  console.log(`Town: ${town}, Flat: ${flatType}, Asking: ${formatPrice(asking)}`);
  if (block) console.log(`Block: ${block}`);
  if (street) console.log(`Street: ${street}`);
  console.log("");

  // Fetch data
  console.log("Fetching transaction data...");
  const txns = await fetchTransactions(town, flatType, 12);

  // Optionally filter to street
  const filtered = street ? txns.filter((t) => t.streetName === street) : txns;
  const dataset = filtered.length >= 5 ? filtered : txns;
  const dataLabel = filtered.length >= 5 && street ? titleCase(street) : titleCase(town);

  if (dataset.length === 0) {
    console.error("No transactions found. Check town and flat type.");
    process.exit(1);
  }

  const psfs = dataset.map((t) => t.pricePsf);
  const medPsf = median(psfs);
  const p25 = percentile(psfs, 25);
  const p75 = percentile(psfs, 75);

  const fairLow = Math.round(p25 * sqft);
  const fairHigh = Math.round(p75 * sqft);

  const askingPsf = asking / sqft;
  const askingVsMedianPct = ((askingPsf - medPsf) / medPsf) * 100;
  const overunder = askingVsMedianPct > 0 ? "overpriced" : "underpriced";
  const diffLow = Math.abs(asking - fairLow);
  const diffHigh = Math.abs(asking - fairHigh);

  const townDisplay = titleCase(town);
  const ftDisplay = flatType.toLowerCase();
  const blockStr = block ? `Blk ${block} ` : "";
  const locationStr = block && street ? `${blockStr}${titleCase(street)}` : townDisplay;

  // Verdict logic
  let verdict: string;
  let verdictShort: string;
  if (askingVsMedianPct > 10) {
    verdict = `The data says this is overpriced by about ${formatPrice(diffLow)} to ${formatPrice(diffHigh)}.\nOpening bid should be around ${formatPrice(fairLow)}. Walk away above ${formatPrice(fairHigh)}.`;
    verdictShort = `Data says fair range is ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.`;
  } else if (askingVsMedianPct > 0) {
    verdict = `Slightly above market. Fair range is ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.\nYou could try opening at ${formatPrice(fairLow)} and negotiate.`;
    verdictShort = `Slightly above market. Fair range: ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.`;
  } else if (askingVsMedianPct > -5) {
    verdict = `This is right at market value. Fair range is ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.\nDon't overpay, but this isn't a bad deal.`;
    verdictShort = `Right at market value: ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.`;
  } else {
    verdict = `This looks like a good deal. Fair range is ${formatPrice(fairLow)}-${formatPrice(fairHigh)}.\nAt ${formatPrice(asking)}, you're buying below median. Move fast.`;
    verdictShort = `Below market. Fair range: ${formatPrice(fairLow)}-${formatPrice(fairHigh)}. Good deal.`;
  }

  const absPercent = Math.abs(Math.round(askingVsMedianPct));
  const aboveBelow = askingVsMedianPct > 0 ? "above" : "below";

  // --- Video Script ---
  const script = [
    "=== VIDEO SCRIPT ===",
    "",
    `HOOK (0-3s): "This ${townDisplay} ${ftDisplay} is listed at ${formatPrice(asking)}. Is it worth it?"`,
    "",
    `DATA (3-15s): [Show SGHaus screenshot]`,
    `"I pulled the data. Last 12 months, ${dataLabel} ${ftDisplay} median is ${formatPsf(medPsf)} psf.`,
    `At ${sqm} sqm, fair value is ${formatPrice(fairLow)} to ${formatPrice(fairHigh)}.`,
    `${formatPrice(asking)} works out to ${formatPsf(askingPsf)} psf. That's ${absPercent}% ${aboveBelow} median."`,
    "",
    `VERDICT (15-25s):`,
    `"${verdict}"`,
    "",
    `CTA (25-30s):`,
    `"Check any flat free at sghaus.com. Link in bio."`,
    "",
    "=== CAPTION ===",
    `This ${townDisplay} ${ftDisplay} is listed at ${formatPrice(asking)}. ${verdictShort}`,
    "Check any flat free: sghaus.com",
    "#sgproperty #hdbresale #sgfinance #sghomebuyer #singaporeproperty #hdb #bto",
    "",
    "=== THUMBNAIL TEXT ===",
    `"${formatPrice(asking).toUpperCase()} ${townDisplay.toUpperCase()} ${flatType}: WORTH IT?"`,
  ].join("\n");

  console.log("\n" + script);

  // Save
  const parts = [town, flatType, asking.toString()];
  if (block) parts.push(`blk${block}`);
  const slug = parts.join("-").toLowerCase().replace(/[\/\s]+/g, "-");
  const { fileURLToPath } = await import("node:url");
  const { dirname, join } = await import("node:path");
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outputDir = join(scriptDir, "output", "video-scripts");
  const filePath = `${outputDir}/${slug}.txt`;
  await writeOutput(filePath, script);
  console.log(`\nSaved to: ${filePath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
