import { describe, expect, it, vi } from "vitest";
import { LIMITS, reserveReportSend, type CountStore } from "./send-limits";

function memoryStore(): CountStore & { keys: () => string[] } {
  const data = new Map<string, unknown>();
  return {
    get: async (key) => data.get(key) ?? null,
    set: async (key, value) => {
      data.set(key, value);
    },
    keys: () => [...data.keys()],
  };
}

const NOW = Date.UTC(2026, 10, 25, 6, 0, 0);

describe("reserveReportSend", () => {
  it("allows sends up to the per-address limit, then refuses that address", async () => {
    const store = memoryStore();
    for (let i = 0; i < LIMITS.perAddressPerDay; i++) {
      expect(await reserveReportSend({ email: "mei@example.com", ip: `1.1.1.${i}` }, store, NOW)).toEqual({ allowed: true });
    }
    expect(await reserveReportSend({ email: "MEI@example.com", ip: "9.9.9.9" }, store, NOW)).toEqual({
      allowed: false,
      reason: "address",
    });
  });

  it("refuses an IP that has sent too many in the hour, whatever the address", async () => {
    const store = memoryStore();
    for (let i = 0; i < LIMITS.perIpPerHour; i++) {
      await reserveReportSend({ email: `p${i}@example.com`, ip: "2.2.2.2" }, store, NOW);
    }
    expect(await reserveReportSend({ email: "new@example.com", ip: "2.2.2.2" }, store, NOW)).toEqual({
      allowed: false,
      reason: "ip",
    });
  });

  it("stops every send once the daily total is reached", async () => {
    const store = memoryStore();
    await store.set(`global:2026-11-25`, LIMITS.globalPerDay);
    expect(await reserveReportSend({ email: "a@example.com", ip: "3.3.3.3" }, store, NOW)).toEqual({
      allowed: false,
      reason: "global",
    });
  });

  it("does not count a refused send against the other limits", async () => {
    const store = memoryStore();
    await store.set(`global:2026-11-25`, LIMITS.globalPerDay);
    await reserveReportSend({ email: "a@example.com", ip: "3.3.3.3" }, store, NOW);
    await store.set(`global:2026-11-25`, 0);
    for (let i = 0; i < LIMITS.perAddressPerDay; i++) {
      expect((await reserveReportSend({ email: "a@example.com", ip: `4.4.4.${i}` }, store, NOW)).allowed).toBe(true);
    }
  });

  it("starts a fresh count the next day", async () => {
    const store = memoryStore();
    for (let i = 0; i < LIMITS.perAddressPerDay; i++) {
      await reserveReportSend({ email: "mei@example.com", ip: `5.5.5.${i}` }, store, NOW);
    }
    const tomorrow = NOW + 24 * 60 * 60 * 1000;
    expect(await reserveReportSend({ email: "mei@example.com", ip: "5.5.5.9" }, store, tomorrow)).toEqual({ allowed: true });
  });

  it("never stores the address or IP in a key", async () => {
    const store = memoryStore();
    await reserveReportSend({ email: "mei@example.com", ip: "6.6.6.6" }, store, NOW);
    const keys = store.keys().join(" ");
    expect(keys).not.toContain("mei");
    expect(keys).not.toContain("6.6.6.6");
  });

  it("allows the send and logs when the store is unavailable", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken: CountStore = {
      get: async () => {
        throw new Error("cache down");
      },
      set: async () => {},
    };
    expect(await reserveReportSend({ email: "a@example.com", ip: "7.7.7.7" }, broken, NOW)).toEqual({ allowed: true });
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
