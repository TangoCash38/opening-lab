/**
 * Client-side unlock store (localStorage).
 * Demo-ready — swap for real Play Billing later.
 */

const STORAGE_KEY = "opening-lab:unlocks:v2";

export type SubPlan = "monthly" | "yearly";

export type UnlockState = {
  packs: string[];
  plan: SubPlan | null;
  expiresAt: number | null;
};

const DEFAULT: UnlockState = { packs: [], plan: null, expiresAt: null };

export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function read(): UnlockState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<UnlockState>;
    return normalizeUnlockState(parsed);
  } catch {
    return DEFAULT;
  }
}

function write(state: UnlockState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("opening-lab:unlocks"));
}

export function normalizeUnlockState(parsed: Partial<UnlockState> | null | undefined): UnlockState {
  return {
    packs: Array.isArray(parsed?.packs)
      ? parsed.packs.filter((id): id is string => typeof id === "string" && !!id)
      : [],
    plan: parsed?.plan === "monthly" || parsed?.plan === "yearly" ? parsed.plan : null,
    expiresAt: typeof parsed?.expiresAt === "number" && Number.isFinite(parsed.expiresAt)
      ? parsed.expiresAt
      : null,
  };
}

export function getUnlocks(): UnlockState {
  return read();
}

export function replaceUnlocks(state: UnlockState) {
  write(normalizeUnlockState(state));
}

export function isSubscriptionActive(state: UnlockState = read()): boolean {
  return !!state.plan && typeof state.expiresAt === "number" && Date.now() < state.expiresAt;
}

export function isPackUnlocked(packId: string, isFree: boolean): boolean {
  if (isFree) return true;
  const s = read();
  return isSubscriptionActive(s) || s.packs.includes(packId);
}

export function unlockPack(packId: string) {
  const s = read();
  if (!s.packs.includes(packId)) {
    s.packs = [...s.packs, packId];
    write(s);
  }
}

export function startSubscription(plan: SubPlan) {
  const now = Date.now();
  write({
    ...read(),
    plan,
    expiresAt: now + (plan === "yearly" ? YEAR_MS : MONTH_MS),
  });
}

export function subscribeUnlocks(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("opening-lab:unlocks", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("opening-lab:unlocks", handler);
    window.removeEventListener("storage", handler);
  };
}

export async function fetchAccountUnlocks(): Promise<UnlockState | null> {
  const res = await fetch("/api/unlocks", { credentials: "same-origin" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Could not load unlocks");
  return normalizeUnlockState((await res.json()) as Partial<UnlockState>);
}

export async function claimAccountUnlocks(
  state: UnlockState,
): Promise<UnlockState | null> {
  const res = await fetch("/api/unlocks/claim", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packs: state.packs,
      plan: state.plan,
      expiresAt: state.expiresAt,
    }),
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Could not save unlocks");
  return normalizeUnlockState((await res.json()) as Partial<UnlockState>);
}
