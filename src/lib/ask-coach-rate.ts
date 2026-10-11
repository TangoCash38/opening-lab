/**
 * Daily question caps. Callers pass a store. The stored key is a hash of the
 * day and the IP or user id, so the log line never needs personal data.
 */
import { createHash } from "node:crypto";

export type CoachTier = "visitor" | "buyer";

export const VISITOR_CAP = 5;
export const BUYER_CAP = 50;

export type CountStore = {
  incr(bucket: string, day: string, tier: CoachTier): Promise<number>;
};

export function memoryCountStore(map = new Map<string, number>()): CountStore {
  return {
    async incr(bucket) {
      const n = (map.get(bucket) ?? 0) + 1;
      map.set(bucket, n);
      return n;
    },
  };
}

export function utcDay(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function rateBucket(day: string, kind: string, id: string): string {
  return createHash("sha256").update(`ask-coach|${day}|${kind}|${id}`).digest("hex");
}

export function capFor(tier: CoachTier): number {
  return tier === "buyer" ? BUYER_CAP : VISITOR_CAP;
}

export async function takeQuestionSlot(
  store: CountStore,
  input: { day: string; tier: CoachTier; kind: "user" | "ip"; id: string },
): Promise<{
  ok: boolean;
  count: number;
  cap: number;
  remaining: number;
  day: string;
  tier: CoachTier;
}> {
  const cap = capFor(input.tier);
  const count = await store.incr(rateBucket(input.day, input.kind, input.id), input.day, input.tier);
  return {
    ok: count <= cap,
    count,
    cap,
    remaining: Math.max(0, cap - count),
    day: input.day,
    tier: input.tier,
  };
}

const memoryGlobal = globalThis as typeof globalThis & {
  __askCoachCounts?: Map<string, number>;
};

export function sharedMemoryCountStore(): CountStore {
  memoryGlobal.__askCoachCounts ??= new Map();
  return memoryCountStore(memoryGlobal.__askCoachCounts);
}
