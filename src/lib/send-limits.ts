import { createHash } from "node:crypto";

// Caps on "Email me this report", so nobody can use the button to mail strangers or burn
// the sending quota. Counts live in Vercel's runtime cache, which is shared by function
// instances in a region. That's enough for abuse caps; it isn't an exact ledger.
// Keys carry a hash, never the address or IP itself.

export const LIMITS = {
  perAddressPerDay: 3,
  perIpPerHour: 10,
  globalPerDay: 200,
} as const;

export interface CountStore {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
}

export type SendDecision = { allowed: true } | { allowed: false; reason: "address" | "ip" | "global" };

const DAY = 24 * 60 * 60;
const HOUR = 60 * 60;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function asCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function reserveReportSend(
  who: { email: string; ip: string | undefined },
  store: CountStore,
  now: number = Date.now(),
): Promise<SendDecision> {
  const iso = new Date(now).toISOString();
  const day = iso.slice(0, 10);
  const hour = iso.slice(0, 13);

  const checks = [
    { key: `global:${day}`, limit: LIMITS.globalPerDay, ttl: DAY, reason: "global" as const },
    { key: `addr:${hash(who.email.trim().toLowerCase())}:${day}`, limit: LIMITS.perAddressPerDay, ttl: DAY, reason: "address" as const },
    ...(who.ip
      ? [{ key: `ip:${hash(who.ip)}:${hour}`, limit: LIMITS.perIpPerHour, ttl: HOUR, reason: "ip" as const }]
      : []),
  ];

  try {
    const counts = await Promise.all(checks.map((c) => store.get(c.key).then(asCount)));
    const over = checks.find((c, i) => counts[i] >= c.limit);
    if (over) return { allowed: false, reason: over.reason };
    await Promise.all(checks.map((c, i) => store.set(c.key, counts[i] + 1, { ttl: c.ttl })));
    return { allowed: true };
  } catch (err) {
    // Bot checks still run in front of this, so a cache outage shouldn't take the button down.
    console.error("[send-limits] count store unavailable:", err instanceof Error ? err.message : "unknown error");
    return { allowed: true };
  }
}
