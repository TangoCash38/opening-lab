import { Chess } from "chess.js";

/** Find the mate progress. Batches of 5 with a 24h lock — not calendar midnight. */
export const FIND_MATE_KEY = "opening-lab:find-mate";

/** Full puzzle bank size (two batches of five). */
export const MATE_SET_SIZE = 10;

/** Puzzles unlocked per batch. */
export const MATE_BATCH_SIZE = 5;

/** Lock between batches from the moment the batch is finished. */
export const MATE_LOCK_MS = 24 * 60 * 60 * 1000;

export type MateSide = "w" | "b";

export type MatePuzzle = {
  id: string;
  fen: string;
  san: string;
  side: MateSide;
};

export type MateSession = {
  batchIndex: number;
  progress: number;
  total: number;
  puzzle: MatePuzzle | null;
  done: boolean;
  locked: boolean;
  nextUnlockAt: number | null;
  batchCompletedAt: number | null;
  justUnlocked: boolean;
  reminderOptIn: boolean;
  reminderAsked: boolean;
};

type MateRecord = {
  batchIndex: number;
  progress: number;
  batchCompletedAt: number | null;
  nextUnlockAt: number | null;
  reminderOptIn: boolean;
  reminderAsked: boolean;
  reminderNotifiedAt: number | null;
};

/**
 * Harder club-level mate-in-ones. Not Scotch lines, not Opening Traps ot1/ot2.
 * Each intended SAN is checked with chess.js: legal, checkmate, and the only mate.
 * Positions must also be quiet for both kings (side to move not in check; opponent
 * not already in check — illegal if the side that just "moved" left their king hanging).
 * Order is the bank. Mating side is `side` (board flips so that side is at the bottom).
 */
const MATE_PUZZLES: readonly MatePuzzle[] = [
  {
    id: "damiano",
    fen: "r1b2rk1/pp3pp1/2n1p1N1/3pP3/3P4/8/PPP2PP1/R1BQK2R w KQ - 0 1",
    san: "Rh8#",
    side: "w",
  },
  {
    id: "cross-b",
    fen: "6k1/ppp2Npp/2p4r/8/8/1bq4R/PPP2PPP/6K1 b - - 0 1",
    san: "Qe1#",
    side: "b",
  },
  {
    id: "smother-w",
    fen: "r2q2rk/1p3ppp/p1n5/6N1/2B5/2N5/PP3PPP/5RK1 w - - 0 1",
    san: "Nxf7#",
    side: "w",
  },
  {
    id: "hook",
    fen: "5r1k/1ppq2pp/p6N/8/3B4/8/1PP3PP/5R1K w - - 0 1",
    san: "Rxf8#",
    side: "w",
  },
  {
    id: "anastasia",
    fen: "2r4k/pp2N1p1/2p4p/8/8/1BQ4R/PPP2PPP/6K1 w - - 0 1",
    san: "Rxh6#",
    side: "w",
  },
  {
    id: "smother-b",
    fen: "2kr1r2/1pp2ppp/p7/8/6n1/2n5/PPP2PPP/R3R1RK b - - 0 1",
    san: "Nxf2#",
    side: "b",
  },
  {
    id: "corridor-b",
    fen: "r3r1k1/1p3ppp/p7/8/8/5q2/PPP2PPP/4R1K1 b - - 0 1",
    san: "Rxe1#",
    side: "b",
  },
  {
    id: "arab-w",
    fen: "7k/1pp2ppp/5N2/8/R7/2B5/1PP2PPP/6K1 w - - 0 1",
    san: "Ra8#",
    side: "w",
  },
  {
    id: "greek-qh7",
    fen: "r1b2rk1/pp3ppp/2n1p3/3pP1NQ/3P4/8/PPP2PPP/R1B1K2R w KQ - 0 1",
    san: "Qxh7#",
    side: "w",
  },
  {
    id: "arab-b",
    fen: "6k1/1p3ppp/p4n2/8/1r6/2b5/5PPP/6KR b - - 0 1",
    san: "Rb1#",
    side: "b",
  },
];

export function playMateSan(game: Chess, san: string) {
  return game.move(san) || game.move(san.replace(/#$/, ""));
}

/** Flip side-to-move in a FEN (clear EP). Used to detect opponent-in-check. */
export function fenWithFlippedTurn(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 2) return fen;
  parts[1] = parts[1] === "w" ? "b" : "w";
  if (parts.length >= 4) parts[3] = "-";
  return parts.join(" ");
}

/**
 * chess.js `isCheck()` only covers the side to move. If the opponent is already
 * in check, the prior "move" left their king hanging — illegal quiet mate puzzle.
 */
export function opponentIsInCheck(fen: string): boolean {
  try {
    return new Chess(fenWithFlippedTurn(fen)).isCheck();
  } catch {
    return true;
  }
}

/**
 * Strengthened gate: FEN loads, side matches, side to move not in check,
 * opponent not already in check, intended SAN is legal + unique mate-in-one.
 */
export function isUniqueMateInOne(puzzle: MatePuzzle): boolean {
  try {
    const game = new Chess(puzzle.fen);
    if (game.turn() !== puzzle.side) return false;
    if (game.isCheck()) return false;
    if (opponentIsInCheck(puzzle.fen)) return false;
    const mates = game.moves({ verbose: true }).filter((move) => {
      const next = new Chess(puzzle.fen);
      const played = next.move(move);
      return !!played && next.isCheckmate();
    });
    if (mates.length !== 1 || mates[0]!.san !== puzzle.san) return false;
    const check = new Chess(puzzle.fen);
    const played = playMateSan(check, puzzle.san);
    return !!played && check.isCheckmate() && played.san === puzzle.san;
  } catch {
    return false;
  }
}

/** Raw bank (for regression tests). Prefer `matePuzzles()` in app code. */
export function matePuzzleBank(): readonly MatePuzzle[] {
  return MATE_PUZZLES;
}

export function matePuzzles(): MatePuzzle[] {
  return MATE_PUZZLES.filter(isUniqueMateInOne);
}

function clampBatch(index: number) {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), 1);
}

function clampProgress(progress: number) {
  if (!Number.isFinite(progress) || progress < 0) return 0;
  return Math.min(Math.floor(progress), MATE_BATCH_SIZE);
}

function emptyRecord(): MateRecord {
  return {
    batchIndex: 0,
    progress: 0,
    batchCompletedAt: null,
    nextUnlockAt: null,
    reminderOptIn: false,
    reminderAsked: false,
    reminderNotifiedAt: null,
  };
}

function migrateRecord(parsed: Record<string, unknown>): MateRecord {
  const base = emptyRecord();

  if (typeof parsed.batchIndex === "number" || typeof parsed.progress === "number") {
    base.batchIndex = clampBatch(Number(parsed.batchIndex) || 0);
    base.progress = clampProgress(Number(parsed.progress) || 0);
    if (typeof parsed.batchCompletedAt === "number" && Number.isFinite(parsed.batchCompletedAt)) {
      base.batchCompletedAt = parsed.batchCompletedAt;
    }
    if (typeof parsed.nextUnlockAt === "number" && Number.isFinite(parsed.nextUnlockAt)) {
      base.nextUnlockAt = parsed.nextUnlockAt;
    }
    base.reminderOptIn = parsed.reminderOptIn === true;
    base.reminderAsked = parsed.reminderAsked === true;
    if (typeof parsed.reminderNotifiedAt === "number" && Number.isFinite(parsed.reminderNotifiedAt)) {
      base.reminderNotifiedAt = parsed.reminderNotifiedAt;
    }
    return base;
  }

  // Legacy same-day { date, index } from the 10-at-once set.
  if (typeof parsed.index === "number" && Number.isFinite(parsed.index)) {
    const index = Math.max(0, Math.floor(parsed.index));
    if (index >= MATE_SET_SIZE) {
      base.batchIndex = 1;
      base.progress = MATE_BATCH_SIZE;
      base.batchCompletedAt = Date.now();
      base.nextUnlockAt = Date.now();
      return base;
    }
    base.batchIndex = clampBatch(Math.floor(index / MATE_BATCH_SIZE));
    base.progress = clampProgress(index % MATE_BATCH_SIZE);
    return base;
  }

  return base;
}

function readRecord(): MateRecord {
  if (typeof window === "undefined") return emptyRecord();
  try {
    const raw = window.localStorage.getItem(FIND_MATE_KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return emptyRecord();
    return migrateRecord(parsed);
  } catch {
    return emptyRecord();
  }
}

function writeRecord(record: MateRecord) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FIND_MATE_KEY, JSON.stringify(record));
  } catch {
    /* private mode / quota — session still works in memory */
  }
}

function batchOffset(batchIndex: number) {
  return clampBatch(batchIndex) * MATE_BATCH_SIZE;
}

function puzzleFor(pool: MatePuzzle[], batchIndex: number, progress: number): MatePuzzle | null {
  if (progress < 0 || progress >= MATE_BATCH_SIZE) return null;
  return pool[batchOffset(batchIndex) + progress] ?? null;
}

function advanceAfterUnlock(record: MateRecord): MateRecord {
  const nextBatch = record.batchIndex >= 1 ? 0 : 1;
  return {
    ...record,
    batchIndex: nextBatch,
    progress: 0,
    batchCompletedAt: null,
    nextUnlockAt: null,
    reminderNotifiedAt: null,
  };
}

function resolveRecord(now: number): { record: MateRecord; justUnlocked: boolean } {
  let record = readRecord();
  let justUnlocked = false;

  const locked =
    record.progress >= MATE_BATCH_SIZE &&
    typeof record.nextUnlockAt === "number" &&
    record.nextUnlockAt > now;

  if (
    record.progress >= MATE_BATCH_SIZE &&
    typeof record.nextUnlockAt === "number" &&
    record.nextUnlockAt <= now
  ) {
    record = advanceAfterUnlock(record);
    writeRecord(record);
    justUnlocked = true;
  } else if (!locked && record.progress >= MATE_BATCH_SIZE && record.nextUnlockAt == null) {
    // Incomplete lock metadata — treat as ready to advance.
    record = advanceAfterUnlock(record);
    writeRecord(record);
    justUnlocked = true;
  }

  return { record, justUnlocked };
}

/** Rough remaining lock label, e.g. "3h 12m" or "40m". */
export function formatUnlockRemaining(ms: number): string {
  const safe = Math.max(0, ms);
  const totalMin = Math.max(1, Math.ceil(safe / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** True while the current batch of 5 is finished and still locked. */
export function mateDoneToday(now = new Date()): boolean {
  const pool = matePuzzles();
  if (pool.length < MATE_BATCH_SIZE) return false;
  const { record } = resolveRecord(now.getTime());
  return (
    record.progress >= MATE_BATCH_SIZE &&
    typeof record.nextUnlockAt === "number" &&
    record.nextUnlockAt > now.getTime()
  );
}

export function mateUnlockRemainingMs(now = new Date()): number {
  const { record } = resolveRecord(now.getTime());
  if (typeof record.nextUnlockAt !== "number") return 0;
  return Math.max(0, record.nextUnlockAt - now.getTime());
}

export function loadMateSession(now = new Date()): MateSession | null {
  const pool = matePuzzles();
  if (pool.length < MATE_BATCH_SIZE) return null;

  const t = now.getTime();
  const { record, justUnlocked } = resolveRecord(t);
  const locked =
    record.progress >= MATE_BATCH_SIZE &&
    typeof record.nextUnlockAt === "number" &&
    record.nextUnlockAt > t;

  if (locked) {
    return {
      batchIndex: record.batchIndex,
      progress: MATE_BATCH_SIZE,
      total: MATE_BATCH_SIZE,
      puzzle: null,
      done: true,
      locked: true,
      nextUnlockAt: record.nextUnlockAt,
      batchCompletedAt: record.batchCompletedAt,
      justUnlocked: false,
      reminderOptIn: record.reminderOptIn,
      reminderAsked: record.reminderAsked,
    };
  }

  const puzzle = puzzleFor(pool, record.batchIndex, record.progress);
  return {
    batchIndex: record.batchIndex,
    progress: record.progress,
    total: MATE_BATCH_SIZE,
    puzzle,
    done: false,
    locked: false,
    nextUnlockAt: null,
    batchCompletedAt: null,
    justUnlocked,
    reminderOptIn: record.reminderOptIn,
    reminderAsked: record.reminderAsked,
  };
}

/** Persist progress within the current batch of 5. Completing sets the 24h lock. */
export function saveMateProgress(batchIndex: number, progress: number, now = new Date()) {
  const t = now.getTime();
  const prev = readRecord();
  const nextProgress = clampProgress(progress);
  const record: MateRecord = {
    ...prev,
    batchIndex: clampBatch(batchIndex),
    progress: nextProgress,
  };

  if (nextProgress >= MATE_BATCH_SIZE) {
    record.batchCompletedAt = t;
    record.nextUnlockAt = t + MATE_LOCK_MS;
  } else {
    record.batchCompletedAt = null;
    record.nextUnlockAt = null;
  }

  writeRecord(record);
  return record;
}

export function markMateReminderAsked(optIn: boolean) {
  const record = readRecord();
  record.reminderAsked = true;
  record.reminderOptIn = optIn;
  writeRecord(record);
}

export function markMateReminderNotified(at = Date.now()) {
  const record = readRecord();
  record.reminderNotifiedAt = at;
  writeRecord(record);
}

export function readMateReminderState() {
  const record = readRecord();
  return {
    nextUnlockAt: record.nextUnlockAt,
    reminderOptIn: record.reminderOptIn,
    reminderAsked: record.reminderAsked,
    reminderNotifiedAt: record.reminderNotifiedAt,
    locked:
      record.progress >= MATE_BATCH_SIZE &&
      typeof record.nextUnlockAt === "number" &&
      record.nextUnlockAt > Date.now(),
  };
}
