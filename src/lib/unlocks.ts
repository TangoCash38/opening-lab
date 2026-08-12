/**
 * Client-side unlock store (localStorage).
 * Demo-ready for GitHub export — swap for real payments later.
 */

const STORAGE_KEY = "opening-lab:unlocks:v1";

export type UnlockState = {
  /** Unlocks every pack + future content */
  allAccess: boolean;
  /** Individually purchased pack ids */
  packs: string[];
};

const DEFAULT: UnlockState = { allAccess: false, packs: [] };

function read(): UnlockState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as UnlockState;
    return {
      allAccess: !!parsed.allAccess,
      packs: Array.isArray(parsed.packs) ? parsed.packs : [],
    };
  } catch {
    return DEFAULT;
  }
}

function write(state: UnlockState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("opening-lab:unlocks"));
}

export function getUnlocks(): UnlockState {
  return read();
}

export function isPackUnlocked(packId: string, isFree: boolean): boolean {
  if (isFree) return true;
  const s = read();
  return s.allAccess || s.packs.includes(packId);
}

export function unlockPack(packId: string) {
  const s = read();
  if (!s.packs.includes(packId)) {
    s.packs = [...s.packs, packId];
    write(s);
  }
}

export function unlockAllAccess() {
  write({ ...read(), allAccess: true });
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
