import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { playableLines, visiblePacks } from "@/lib/catalog";

/** Same-day Daily tasks line id + answer. Local calendar day, not UTC. */
export const DAILY_GUESS_KEY = "opening-lab:daily-guess";

/** Enough to recognise the opening; traps must not run to the end. */
export const DAILY_REPLAY_PLIES = 14;

export type DailyRecord = {
  date: string;
  lineId: string;
  pickId: string | null;
};

export type DailySession = {
  date: string;
  pack: Pack;
  line: OpeningLine;
  pickId: string | null;
};

export function localDateKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mix(date: string, salt: string): number {
  let h = 2166136261;
  const s = `${date}:${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Free sample lines only, from the live catalog.
 * Today that is Caro ckb1, ckb3, ckb5 and Opening Traps ot1, ot2.
 * Paid Scotch and locked packs are not in FREE_SAMPLE_LINE_IDS / playableLines.
 */
export function dailyLinePool(): { pack: Pack; line: OpeningLine }[] {
  const out: { pack: Pack; line: OpeningLine }[] = [];
  for (const pack of visiblePacks(PACKS)) {
    for (const line of playableLines(pack)) {
      out.push({ pack, line });
    }
  }
  return out;
}

function readRecord(): DailyRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DAILY_GUESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DailyRecord>;
    if (!parsed || typeof parsed.date !== "string" || typeof parsed.lineId !== "string") {
      return null;
    }
    const pickId = typeof parsed.pickId === "string" && parsed.pickId ? parsed.pickId : null;
    return { date: parsed.date, lineId: parsed.lineId, pickId };
  } catch {
    return null;
  }
}

function writeRecord(record: DailyRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DAILY_GUESS_KEY, JSON.stringify(record));
  } catch {
    /* private mode / quota — session still works in memory */
  }
}

export function dailyDoneToday(now = new Date()): boolean {
  const stored = readRecord();
  return !!stored && stored.date === localDateKey(now) && !!stored.pickId;
}

export function loadDailySession(now = new Date()): DailySession | null {
  const pool = dailyLinePool();
  if (pool.length === 0) return null;
  const date = localDateKey(now);
  const stored = readRecord();
  const kept =
    stored && stored.date === date
      ? pool.find((item) => item.line.id === stored.lineId)
      : undefined;
  if (kept) {
    return { date, pack: kept.pack, line: kept.line, pickId: stored?.pickId ?? null };
  }
  const next = pool[mix(date, "line") % pool.length]!;
  writeRecord({ date, lineId: next.line.id, pickId: null });
  return { date, pack: next.pack, line: next.line, pickId: null };
}

export function saveDailyPick(date: string, lineId: string, pickId: string) {
  writeRecord({ date, lineId, pickId });
}

/** Four real visible pack names. One is the pack that owns the day's line. */
export function dailyChoices(correct: Pack, date: string): Pack[] {
  const others = visiblePacks(PACKS).filter((pack) => pack.id !== correct.id);
  const ranked = [...others].sort(
    (a, b) => mix(date, a.id) - mix(date, b.id) || a.id.localeCompare(b.id),
  );
  const picks = [correct, ...ranked.slice(0, 3)];
  return picks.sort(
    (a, b) => mix(date, `opt:${a.id}`) - mix(date, `opt:${b.id}`) || a.id.localeCompare(b.id),
  );
}
