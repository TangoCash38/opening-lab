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
 * Original mate-in-one diagrams. Not Scotch lines, not Opening Traps ot1/ot2.
 * Each intended SAN is checked with chess.js: legal, checkmate, and the only mate.
 * Order is the set. Mating side is `side` (board flips so that side is at the bottom).
 */
const MATE_PUZZLES: readonly MatePuzzle[] = [
  {
    id: "scholar",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    san: "Qxf7#",
    side: "w",
  },
  {
    id: "black-back-rank",
    fen: "4r1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",
    san: "Re1#",
    side: "b",
  },
  {
    id: "white-queen",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    san: "Qg7#",
    side: "w",
  },
  {
    id: "black-queen",
    fen: "6K1/8/5k1q/8/8/8/8/8 b - - 0 1",
    san: "Qg7#",
    side: "b",
  },
  {
    id: "white-back-rank",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    san: "Re8#",
    side: "w",
  },
  {
    id: "black-bishop",
    fen: "7b/8/8/8/8/8/PPk5/K7 b - - 0 1",
    san: "Bxb2#",
    side: "b",
  },
  {
    id: "white-bishop",
    fen: "7k/5Kpp/8/8/8/8/8/B7 w - - 0 1",
    san: "Bxg7#",
    side: "w",
  },
  {
    id: "black-knight",
    fen: "6k1/8/8/8/6n1/8/6PP/6RK b - - 0 1",
    san: "Nf2#",
    side: "b",
  },
  {
    id: "white-knight",
    fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
    san: "Nf7#",
    side: "w",
  },
  {
    id: "black-rook-file",
    fen: "5r2/8/8/8/8/8/5k2/7K b - - 0 1",
    san: "Rh8#",
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
