import { describe, expect, it } from "vitest";
import { decodeAnalysisUrl, encodeAnalysisUrl } from "./share-url";
import type { PropertyInput } from "@/types";

const input = {
  town: "TAMPINES",
  flatType: "4 ROOM",
  streetName: "TAMPINES ST 45",
  block: "497",
  storeyRange: "07 TO 09",
  floorAreaSqm: 92,
} as PropertyInput;

describe("share-url", () => {
  it("round-trips town, flat type, street, block, storey and floor area", () => {
    const url = encodeAnalysisUrl(input, "sell");
    expect(url.startsWith("/sell?")).toBe(true);
    const decoded = decodeAnalysisUrl(new URLSearchParams(url.split("?")[1]));
    expect(decoded).toEqual({
      town: "TAMPINES",
      flatType: "4 ROOM",
      streetName: "TAMPINES ST 45",
      block: "497",
      storeyRange: "07 TO 09",
      floorAreaSqm: 92,
    });
  });

  it("returns null when the town is missing", () => {
    expect(decodeAnalysisUrl(new URLSearchParams(""))).toBeNull();
  });
});
