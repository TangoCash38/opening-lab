import { Chess } from "chess.js";
import { localDateKey } from "@/lib/daily-guess";

/** Same-day Find the mate set. Local calendar day, not UTC. */
export const FIND_MATE_KEY = "opening-lab:find-mate";

export const MATE_SET_SIZE = 10;

export type MateSide = "w" | "b";

export type MatePuzzle = {
  id: string;
  fen: string;
  san: string;
  side: MateSide;
};

export type MateSession = {
  date: string;
  index: number;
  total: number;
  puzzle: MatePuzzle | null;
  done: boolean;
};

type MateRecord = {
  date: string;
  index: number;
};

/**
 * Harder club-level mate-in-ones. Not Scotch lines, not Opening Traps ot1/ot2.
 * Each intended SAN is checked with chess.js: legal, checkmate, and the only mate.
 * Order is the set. Mating side is `side` (board flips so that side is at the bottom).
 */
const MATE_PUZZLES: readonly MatePuzzle[] = [
  {
    id: "boden-w",
    fen: "1nkr4/p1p2ppp/2p5/5B2/8/8/PPP2PPP/2K2B2 w - - 0 1",
    san: "Ba6#",
    side: "w",
  },
  {
    id: "boden-b",
    fen: "2kr1b1r/pp3ppp/2p5/8/2b2b2/8/P1P2PPP/1NK5 b - - 0 1",
    san: "Ba3#",
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

/** chess.js: intended SAN is legal and the only mating move. */
export function isUniqueMateInOne(puzzle: MatePuzzle): boolean {
  try {
    const game = new Chess(puzzle.fen);
    if (game.turn() !== puzzle.side || game.isCheck()) return false;
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

export function matePuzzles(): MatePuzzle[] {
  return MATE_PUZZLES.filter(isUniqueMateInOne);
}

function readRecord(): MateRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FIND_MATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MateRecord>;
    if (!parsed || typeof parsed.date !== "string") return null;
    const index = typeof parsed.index === "number" && Number.isFinite(parsed.index) ? parsed.index : 0;
    return { date: parsed.date, index };
  } catch {
    return null;
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

function clampIndex(index: number, total: number) {
  if (!Number.isFinite(index) || index < 0) return 0;
  return Math.min(Math.floor(index), total);
}

export function mateDoneToday(now = new Date()): boolean {
  const pool = matePuzzles();
  const stored = readRecord();
  return !!stored && stored.date === localDateKey(now) && pool.length > 0 && stored.index >= pool.length;
}

export function loadMateSession(now = new Date()): MateSession | null {
  const pool = matePuzzles();
  if (pool.length === 0) return null;
  const date = localDateKey(now);
  const stored = readRecord();
  const sameDay = stored && stored.date === date;
  const index = sameDay ? clampIndex(stored.index, pool.length) : 0;
  if (!sameDay) writeRecord({ date, index: 0 });
  if (index >= pool.length) {
    return { date, index, total: pool.length, puzzle: null, done: true };
  }
  return { date, index, total: pool.length, puzzle: pool[index]!, done: false };
}

/** Remember the first unsolved puzzle so a same-day return resumes the set. */
export function saveMateIndex(date: string, index: number) {
  writeRecord({ date, index });
}
