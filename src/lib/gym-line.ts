/**
 * Client-side gym line (Create your own).
 *
 * Remembered SAN lives in localStorage so Practice / Test can reload it.
 * Not a catalog pack — curated PACKS / VISIBLE_PACK_IDS stay unchanged.
 *
 * Engine chrome (eval bar, MultiPV-2, green PV hints) is authoring-only
 * via POST /api/practice-review-eval, depth 12. Practice / Test use book
 * green hints only — no mid-drill MultiPV.
 */
import type { OpeningLine, Pack, Side } from "@/data/packs";

export const GYM_PACK_ID = "gym-line";
export const GYM_LINE_ID = "gym-1";
export const GYM_STORAGE_KEY = "opening-lab:gym-line";
export const GYM_EVENT = "opening-lab:gym-line";
export const GYM_AUTHOR_DEPTH = 12;
export const GYM_AUTHOR_DEBOUNCE_MS = 400;

export type GymLine = {
  plies: string[];
  side: Side;
  rememberedAt: number;
};

export function isGymPackId(id: string): boolean {
  return id === GYM_PACK_ID;
}

export function isGymPack(pack: Pick<Pack, "id"> | string): boolean {
  return isGymPackId(typeof pack === "string" ? pack : pack.id);
}

export function isGymLineId(id: string): boolean {
  return id === GYM_LINE_ID;
}

export function parseGymLine(raw: unknown): GymLine | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  if (rec.side !== "w" && rec.side !== "b") return null;
  if (!Array.isArray(rec.plies)) return null;
  const plies = rec.plies.filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (plies.length === 0) return null;
  const rememberedAt =
    typeof rec.rememberedAt === "number" && Number.isFinite(rec.rememberedAt)
      ? rec.rememberedAt
      : Date.now();
  return { plies, side: rec.side, rememberedAt };
}

export function readGymLine(): GymLine | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(GYM_STORAGE_KEY);
    if (!raw) return null;
    return parseGymLine(JSON.parse(raw));
  } catch {
    return null;
  }
}

function writeRaw(line: GymLine | null) {
  if (typeof localStorage === "undefined") return;
  try {
    if (line) localStorage.setItem(GYM_STORAGE_KEY, JSON.stringify(line));
    else localStorage.removeItem(GYM_STORAGE_KEY);
  } catch {
    /* quota / private mode */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GYM_EVENT));
  }
}

export function sameGymLine(a: GymLine | null, b: GymLine | null): boolean {
  if (!a || !b) return false;
  return (
    a.side === b.side &&
    a.plies.length === b.plies.length &&
    a.plies.every((p, i) => p === b.plies[i])
  );
}

/** Drop the last ply only. Empty stays empty (Back is a no-op at start). */
export function undoAuthorPlies(plies: readonly string[]): string[] {
  if (plies.length === 0) return [];
  return plies.slice(0, -1);
}

/**
 * Home asks to discard only when the board has plies that are not the
 * remembered gym line. Empty or already-saved lines leave straight home.
 */
export function hasUnsavedAuthorPlies(
  plies: readonly string[],
  saved: GymLine | null,
): boolean {
  if (plies.length === 0) return false;
  if (!saved) return true;
  return (
    saved.plies.length !== plies.length ||
    saved.plies.some((p, i) => p !== plies[i])
  );
}

export function rememberGymLine(plies: string[], side: Side): GymLine | null {
  const clean = plies.filter((p) => typeof p === "string" && p.trim().length > 0);
  if (clean.length === 0) return null;
  const next: GymLine = {
    plies: clean,
    side,
    rememberedAt: Date.now(),
  };
  writeRaw(next);
  return next;
}

export function clearGymLine(): void {
  writeRaw(null);
}

export function subscribeGymLine(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(GYM_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(GYM_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Numbered SAN, e.g. `1.e4 e5 2.Nf3 Nc6`. */
export function formatGymSan(plies: readonly string[]): string {
  const bits: string[] = [];
  for (let i = 0; i < plies.length; i++) {
    const san = plies[i]!;
    if (i % 2 === 0) bits.push(`${i / 2 + 1}.${san}`);
    else bits.push(san);
  }
  return bits.join(" ");
}

export type GymSanChip = {
  key: string;
  label: string;
  ply: number;
};

/** Individual chips as in the author mock: `1.e4` · `e5` · `2.Nf3` · `Nc6`. */
export function gymSanChips(plies: readonly string[]): GymSanChip[] {
  return plies.map((san, i) => ({
    key: `${i}-${san}`,
    label: i % 2 === 0 ? `${i / 2 + 1}.${san}` : san,
    ply: i + 1,
  }));
}

export function gymLineName(side: Side): string {
  return side === "b" ? "My line · Black" : "My line · White";
}

export function gymOpeningLine(line: GymLine): OpeningLine {
  return {
    id: GYM_LINE_ID,
    name: gymLineName(line.side),
    plies: line.plies,
    side: line.side,
  };
}

/** Synthetic pack for TrainView. Never added to the curated catalog. */
export function gymPackFromLine(line: GymLine): Pack {
  return {
    id: GYM_PACK_ID,
    name: "My line",
    eco: "Gym",
    side: line.side === "b" ? "Black" : "White",
    section: line.side === "b" ? "black" : "white",
    isFree: true,
    isPremium: false,
    price: null,
    blurb: "Yours · remembered",
    lines: [gymOpeningLine(line)],
  };
}
