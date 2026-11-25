import { describe, expect, it } from "vitest";
import { escapeHtml, singleLine } from "./escape-html";

describe("escapeHtml", () => {
  it("turns markup and quotes in a street name into entities", () => {
    expect(escapeHtml(`<script>alert("x")</script> O'Neil & Co`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; O&#39;Neil &amp; Co",
    );
  });

  it("renders null, undefined and numbers safely", () => {
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(497)).toBe("497");
  });
});

describe("singleLine", () => {
  it("removes line breaks from subject text", () => {
    expect(singleLine("Blk 497\r\nBcc: x@y.z")).toBe("Blk 497 Bcc: x@y.z");
  });
});
