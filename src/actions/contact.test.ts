import { beforeEach, describe, expect, it, vi } from "vitest";

const postToSheet = vi.fn();
const checkBotId = vi.fn();
vi.mock("@/lib/sheets", () => ({ postToSheet }));
vi.mock("botid/server", () => ({ checkBotId }));

const { submitContactForm } = await import("./contact");

const ARGS = ["Mei Lim", "mei@example.com", "When is the next clinic, please?"] as const;

beforeEach(() => {
  postToSheet.mockReset();
  postToSheet.mockResolvedValue({ success: true });
  checkBotId.mockReset();
  checkBotId.mockResolvedValue({ isBot: false });
});

describe("submitContactForm", () => {
  it("saves a real message", async () => {
    expect(await submitContactForm(...ARGS)).toEqual({ success: true });
    expect(postToSheet).toHaveBeenCalledWith("contact", expect.objectContaining({ email: "mei@example.com" }));
  });

  it("refuses a bot without saving or notifying", async () => {
    checkBotId.mockResolvedValue({ isBot: true });
    const result = await submitContactForm(...ARGS);
    expect(result.success).toBe(false);
    expect(postToSheet).not.toHaveBeenCalled();
  });

  it("refuses when the bot check itself fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    checkBotId.mockRejectedValue(new Error("not configured"));
    expect((await submitContactForm(...ARGS)).success).toBe(false);
    expect(postToSheet).not.toHaveBeenCalled();
  });

  it("shows an error when the save fails", async () => {
    postToSheet.mockResolvedValue({ success: false });
    expect((await submitContactForm(...ARGS)).success).toBe(false);
  });
});
