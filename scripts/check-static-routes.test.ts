import { describe, expect, it } from "vitest";
import { findRegressions, parseRouteTable } from "./check-static-routes";

const table = [
  "Route (app)                         Revalidate  Expire",
  "┌ ○ /",
  "├ ƒ /buy",
  "├ ○ /towns                          1d      1y",
  "├ ● /towns/[town]                   1d      1y",
  "└ ● /towns/[town]/[flatType]        1d      1y",
].join("\n");

describe("check-static-routes", () => {
  it("reads each route's rendering marker", () => {
    const routes = parseRouteTable(table);
    expect(routes.get("/towns/[town]")).toBe("●");
    expect(routes.get("/buy")).toBe("ƒ");
  });

  it("passes when required routes are static or SSG", () => {
    expect(findRegressions(table, ["/towns", "/towns/[town]"])).toEqual([]);
  });

  it("flags a required route that turned dynamic or disappeared", () => {
    expect(findRegressions(table, ["/buy", "/insights"])).toEqual([
      "/buy: now dynamic",
      "/insights: missing from the build table",
    ]);
  });
});
