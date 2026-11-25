import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { postToSheet } from "./sheets";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GOOGLE_SCRIPT_URL", "https://script.example/exec");
  vi.stubEnv("SHEETS_SHARED_SECRET", "s3cret");
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const ok = (body: unknown) => ({ ok: true, json: async () => body });

describe("postToSheet", () => {
  it("sends the type, the secret and a neutralised row, and succeeds on status ok", async () => {
    fetchMock.mockResolvedValue(ok({ status: "ok" }));
    const result = await postToSheet("clinic_signup", { name: "=cmd", email: "a@b.co" });
    expect(result).toEqual({ success: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://script.example/exec");
    expect(JSON.parse(init.body)).toEqual({
      type: "clinic_signup",
      secret: "s3cret",
      name: "'=cmd",
      email: "a@b.co",
    });
  });

  it("fails when the script answers 200 with status error", async () => {
    fetchMock.mockResolvedValue(ok({ status: "error", message: "bad secret" }));
    expect(await postToSheet("subscribe", { email: "a@b.co" })).toEqual({ success: false });
  });

  it("fails when the body is not JSON", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new Error("html"); } });
    expect(await postToSheet("subscribe", { email: "a@b.co" })).toEqual({ success: false });
  });

  it("fails on a non-2xx response", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect(await postToSheet("subscribe", { email: "a@b.co" })).toEqual({ success: false });
  });

  it("fails on a network error", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    expect(await postToSheet("subscribe", { email: "a@b.co" })).toEqual({ success: false });
  });

  it("fails without calling fetch when the script URL is missing", async () => {
    vi.stubEnv("GOOGLE_SCRIPT_URL", "");
    expect(await postToSheet("clinic_signup", { email: "a@b.co" })).toEqual({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
