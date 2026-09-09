import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { visiblePacks } from "@/lib/catalog";

/** Same-day Guess the opening set. Local calendar day, not UTC. */
export const DAILY_GUESS_KEY = "opening-lab:daily-guess";

/** Replay only a short book prefix. Never the rest of a trainer line. */
export const DAILY_REPLAY_PLIES = 14;

export const GUESS_SET_SIZE = 5;

export type DailyRecord = {
  date: string;
  index: number;
  pickId: string | null;
};

export type DailyRound = {
  pack: Pack;
  line: OpeningLine;
};

export type DailySession = {
  date: string;
  index: number;
  total: number;
  pack: Pack | null;
  line: OpeningLine | null;
  pickId: string | null;
  done: boolean;
};

/**
 * Quiz-only prefixes from five different visible packs.
 * Real SAN, sliced to a quiet 8–14 ply prefix. Not added to FREE_SAMPLE_LINE_IDS.
 * Does not unlock the pack, start Stripe, or grant trainer access.
 */
const GUESS_PREFIXES: readonly { packId: string; lineId: string; plies: number }[] = [
  { packId: "caro-kann-black", lineId: "ckb1", plies: 12 },
  { packId: "italian-white", lineId: "it1", plies: 14 },
  { packId: "ruy-white", lineId: "rl1", plies: 14 },
  { packId: "french-white", lineId: "fr1", plies: 10 },
  { packId: "kg-black", lineId: "kg1", plies: 8 },
];

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

function prefixLine(line: OpeningLine, plies: number): OpeningLine | null {
  const n = Math.min(plies, line.plies.length, DAILY_REPLAY_PLIES);
  if (n < 8) return null;
  return { ...line, plies: line.plies.slice(0, n) };
}

/** Five distinct visible packs. Lookup is read-only; it does not unlock lines. */
export function guessRounds(): DailyRound[] {
  const packs = visiblePacks(PACKS);
  const out: DailyRound[] = [];
  const seen = new Set<string>();
  for (const item of GUESS_PREFIXES) {
    const pack = packs.find((entry) => entry.id === item.packId);
    const line = pack?.lines.find((entry) => entry.id === item.lineId);
    if (!pack || !line || seen.has(pack.id)) continue;
    const prefixed = prefixLine(line, item.plies);
    if (!prefixed) continue;
    seen.add(pack.id);
    out.push({ pack, line: prefixed });
  }
  return out;
}

function readRecord(): DailyRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DAILY_GUESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DailyRecord>;
    if (!parsed || typeof parsed.date !== "string") return null;
    const index = typeof parsed.index === "number" && Number.isFinite(parsed.index) ? parsed.index : 0;
    const pickId = typeof parsed.pickId === "string" && parsed.pickId ? parsed.pickId : null;
    return { date: parsed.date, index, pickId };
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

function clampIndex(index: number, total: number) {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), total);
}

function sessionFrom(date: string, index: number, pickId: string | null, rounds: DailyRound[]): DailySession {
  if (index >= rounds.length) {
    return { date, index, total: rounds.length, pack: null, line: null, pickId: null, done: true };
  }
  const round = rounds[index]!;
  return {
    date,
    index,
    total: rounds.length,
    pack: round.pack,
    line: round.line,
    pickId,
    done: false,
  };
}

export function dailyDoneToday(now = new Date()): boolean {
  const rounds = guessRounds();
  const stored = readRecord();
  return !!stored && stored.date === localDateKey(now) && rounds.length > 0 && stored.index >= rounds.length;
}

export function loadDailySession(now = new Date()): DailySession | null {
  const rounds = guessRounds();
  if (rounds.length === 0) return null;
  const date = localDateKey(now);
  const stored = readRecord();
  const sameDay = stored && stored.date === date;
  const index = sameDay ? clampIndex(stored.index, rounds.length) : 0;
  const pickId = sameDay && index < rounds.length ? stored.pickId : null;
  if (!sameDay) writeRecord({ date, index: 0, pickId: null });
  return sessionFrom(date, index, pickId, rounds);
}

export function saveDailyPick(date: string, index: number, pickId: string) {
  const rounds = guessRounds();
  if (index + 1 >= rounds.length) {
    writeRecord({ date, index: rounds.length, pickId: null });
    return;
  }
  writeRecord({ date, index, pickId });
}

export function saveGuessIndex(date: string, index: number) {
  writeRecord({ date, index, pickId: null });
}

/** Four real visible pack names. One is the pack that owns this round's line. */
export function dailyChoices(correct: Pack, salt: string): Pack[] {
  const others = visiblePacks(PACKS).filter((pack) => pack.id !== correct.id);
  const ranked = [...others].sort(
    (a, b) => mix(salt, a.id) - mix(salt, b.id) || a.id.localeCompare(b.id),
  );
  const picks = [correct, ...ranked.slice(0, 3)];
  return picks.sort(
    (a, b) => mix(salt, `opt:${a.id}`) - mix(salt, `opt:${b.id}`) || a.id.localeCompare(b.id),
  );
}
