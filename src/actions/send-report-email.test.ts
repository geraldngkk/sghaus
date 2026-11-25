import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult, PropertyInput } from "@/types";

const send = vi.fn();
const analyzeProperty = vi.fn();
const resendConfigured = { value: true };

vi.mock("@/lib/resend", () => ({
  getResendClient: () => (resendConfigured.value ? { emails: { send } } : null),
  EMAIL_FROM: "SGHaus <hello@sghaus.com>",
}));
vi.mock("@/actions/analyze", () => ({ analyzeProperty }));

const { sendReportEmail } = await import("./send-report-email");

const input = {
  town: "TAMPINES",
  flatType: "4 ROOM",
  streetName: "TAMPINES ST 45",
  block: "497",
  storeyRange: "07 TO 09",
  floorAreaSqm: 92,
  leaseCommenceDate: 0,
} as PropertyInput;

function serverResult(streetName = "TAMPINES ST 45"): AnalysisResult {
  const offer = { low: 500000, mid: 530000, max: 560000, lowPsf: 505, midPsf: 535, maxPsf: 565 };
  return {
    input: { ...input, streetName },
    offer,
    comps: { tier1: [{}], tier2: [], tier3: [] },
    risks: [{ severity: "high", title: "<b>Lease</b>" }],
  } as unknown as AnalysisResult;
}

beforeEach(() => {
  send.mockResolvedValue({ error: null });
  analyzeProperty.mockResolvedValue(serverResult());
});

afterEach(() => {
  send.mockReset();
  analyzeProperty.mockReset();
});

describe("sendReportEmail", () => {
  it("reruns the analysis on the server and sends one immediate email", async () => {
    const result = await sendReportEmail({ email: "mei@example.com", input, mode: "buy" });
    expect(result).toEqual({ success: true });
    expect(analyzeProperty).toHaveBeenCalledWith(input, undefined, undefined, { log: false });
    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][0];
    expect(message.to).toEqual(["mei@example.com"]);
    expect(message.scheduledAt).toBeUndefined();
    expect(message.html).toContain("$530,000");
  });

  it("escapes values from the analysis before they reach the HTML", async () => {
    analyzeProperty.mockResolvedValue(serverResult(`<img src=x onerror=alert(1)>`));
    await sendReportEmail({ email: "mei@example.com", input, mode: "sell" });
    const { html, subject } = send.mock.calls[0][0];
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>Lease</b>");
    expect(html).toContain("&lt;b&gt;Lease&lt;/b&gt;");
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it("keeps the street and block out of the subject line", async () => {
    analyzeProperty.mockResolvedValue(serverResult("YOUR ACCOUNT IS LOCKED VERIFY AT EVIL DOT COM"));
    await sendReportEmail({ email: "mei@example.com", input, mode: "buy" });
    expect(send.mock.calls[0][0].subject).toBe("Your SGHaus offer report: 4 ROOM in TAMPINES");
  });

  it("rejects a malformed address without analysing or sending", async () => {
    const result = await sendReportEmail({ email: "not-an-email", input, mode: "buy" });
    expect(result.success).toBe(false);
    expect(analyzeProperty).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it("quietly drops a bot that filled the honeypot", async () => {
    const result = await sendReportEmail({ email: "bot@example.com", input, mode: "buy", website: "spam" });
    expect(result).toEqual({ success: true });
    expect(send).not.toHaveBeenCalled();
  });

  it("returns an error when the analysis fails", async () => {
    analyzeProperty.mockRejectedValue(new Error("Block not found"));
    const result = await sendReportEmail({ email: "mei@example.com", input, mode: "buy" });
    expect(result.success).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns an error without sending when Resend is not configured", async () => {
    resendConfigured.value = false;
    const result = await sendReportEmail({ email: "mei@example.com", input, mode: "buy" });
    resendConfigured.value = true;
    expect(result.success).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends the seller template in sell mode", async () => {
    await sendReportEmail({ email: "mei@example.com", input, mode: "sell" });
    expect(send.mock.calls[0][0].subject).toMatch(/pricing report/);
  });

  it("returns an error when Resend rejects the email", async () => {
    send.mockResolvedValue({ error: { message: "rate limited" } });
    const result = await sendReportEmail({ email: "mei@example.com", input, mode: "buy" });
    expect(result.success).toBe(false);
  });
});
