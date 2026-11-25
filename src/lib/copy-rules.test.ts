import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findCopyProblems, stripComments } from "./copy-rules";

// Files whose user-facing copy has been cleaned. Later units add the files they clean,
// so the scan can't be bypassed by copy coming back in.
export const CLEAN_FILES = [
  "src/app/page.tsx",
  "src/app/layout.tsx",
  "src/app/opengraph-image.tsx",
  "src/app/about/page.tsx",
  "src/app/buy/page.tsx",
  "src/app/sell/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/outcome/page.tsx",
  "src/components/email-report.tsx",
  "src/lib/emails.ts",
  "src/actions/send-report-email.ts",
  "src/actions/subscribe.ts",
  "src/actions/contact.ts",
  "src/actions/submit-outcome.ts",
  "src/actions/streets.ts",
  "src/lib/send-limits.ts",
];

describe("copy rules on cleaned files", () => {
  it.each(CLEAN_FILES)("%s has no em dashes or named data sources", (file) => {
    expect(findCopyProblems(readFileSync(file, "utf8"))).toEqual([]);
  });
});

describe("findCopyProblems", () => {
  it("flags an em dash and a named source", () => {
    const problems = findCopyProblems(`const a = "Prices — from data.gov.sg";`);
    expect(problems.map((p) => p.rule)).toEqual(["em dash", "names a data source (/data\\.gov/i)"]);
  });

  it("flags a spaced double hyphen but not a CSS custom property", () => {
    expect(findCopyProblems(`"Prices -- rising"`)).toHaveLength(1);
    expect(findCopyProblems(`style={{ "--rise-delay": "80ms" }}`)).toHaveLength(0);
  });

  it("ignores comments but keeps URLs", () => {
    expect(stripComments(`// data.gov.sg client\nconst u = "https://sghaus.com"; /* URA */`)).toBe(
      `\nconst u = "https://sghaus.com"; `,
    );
  });

  it("allows the approved HDB page titles", () => {
    expect(findCopyProblems(`title: "HDB Price Checker"`)).toEqual([]);
  });
});
