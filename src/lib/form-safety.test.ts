import { describe, expect, it } from "vitest";
import {
  isHoneypotTripped,
  isValidEmail,
  neutraliseCell,
  neutraliseRow,
  validateFields,
} from "./form-safety";

describe("neutraliseCell", () => {
  it("leaves ordinary text unchanged", () => {
    expect(neutraliseCell("Tampines St 45")).toBe("Tampines St 45");
  });

  it.each(["=HYPERLINK(\"x\")", "+65 9000", "-1", "@SUM(A1)", "\tcmd", "\rcmd"])(
    "stores %j as literal text",
    (value) => {
      expect(neutraliseCell(value)).toBe(`'${value}`);
    },
  );

  it("passes numbers, booleans and empty values through", () => {
    expect(neutraliseCell(412000)).toBe(412000);
    expect(neutraliseCell(true)).toBe(true);
    expect(neutraliseCell("")).toBe("");
    expect(neutraliseCell(undefined)).toBe("");
    expect(neutraliseCell(null)).toBe("");
  });
});

describe("neutraliseRow", () => {
  it("neutralises every string field, UTM included", () => {
    expect(
      neutraliseRow({ town: "BEDOK", utmCampaign: "=IMPORTXML(\"x\")", offerLow: 400000 }),
    ).toEqual({ town: "BEDOK", utmCampaign: "'=IMPORTXML(\"x\")", offerLow: 400000 });
  });
});

describe("isValidEmail", () => {
  it("accepts a normal address and rejects malformed ones", () => {
    expect(isValidEmail("aunty.lim@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail(`${"x".repeat(250)}@example.com`)).toBe(false);
    expect(isValidEmail("a@x.com,b@y.com")).toBe(false);
    expect(isValidEmail("a<b@x.com>")).toBe(false);
    expect(isValidEmail('"a"@x.com')).toBe(false);
    expect(isValidEmail("first.last+sghaus@mail.example.sg")).toBe(true);
  });
});

describe("validateFields", () => {
  const limits = { name: 80, question: 500 };

  it("passes values within their limits unchanged, trimmed", () => {
    expect(validateFields({ name: "  Mei Ling ", question: "Is 480k fair?" }, limits)).toEqual({
      ok: true,
      values: { name: "Mei Ling", question: "Is 480k fair?" },
    });
  });

  it("rejects a value over its length limit and names the field", () => {
    const result = validateFields({ name: "x".repeat(81), question: "" }, limits);
    expect(result).toEqual({ ok: false, field: "name" });
  });

  it("treats a missing optional value as empty", () => {
    expect(validateFields({ name: "Ah Hock" }, limits)).toEqual({
      ok: true,
      values: { name: "Ah Hock", question: "" },
    });
  });
});

describe("isHoneypotTripped", () => {
  it("is tripped only when the hidden field has content", () => {
    expect(isHoneypotTripped("")).toBe(false);
    expect(isHoneypotTripped(undefined)).toBe(false);
    expect(isHoneypotTripped("http://spam.example")).toBe(true);
  });
});
