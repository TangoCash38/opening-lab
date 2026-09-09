import { Chess } from "chess.js";
import { localDateKey } from "@/lib/daily-guess";

/** Same-day Find the mate puzzle. Local calendar day, not UTC. */
export const FIND_MATE_KEY = "opening-lab:find-mate";

export type MateSide = "w" | "b";

export type MatePuzzle = {
  id: string;
  fen: string;
  san: string;
  side: MateSide;
};

export type MateSession = MatePuzzle & {
  date: string;
  solved: boolean;
};

type MateRecord = {
  date: string;
  id: string;
  solved: boolean;
};

/**
 * Original mate-in-one diagrams. Not Scotch lines, not Opening Traps ot1/ot2.
 * Each intended SAN is checked with chess.js: legal, checkmate, and the only mate.
 */
const MATE_PUZZLES: readonly MatePuzzle[] = [
  {
    id: "scholar",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    san: "Qxf7#",
    side: "w",
  },
  {
    id: "white-back-rank",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    san: "Re8#",
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
];

function mix(date: string, salt: string): number {
  let h = 2166136261;
  const s = `${date}:${salt}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function playMateSan(game: Chess, san: string) {
  return game.move(san) || game.move(san.replace(/#$/, ""));
}

/** chess.js: intended SAN is legal and the only mating move. */
export function isUniqueMateInOne(puzzle: MatePuzzle): boolean {
  try {
    const game = new Chess(puzzleFen(puzzle));
    if (game.turn() !== puzzle.side || game.isCheck()) return false;
    const mates = game.moves({ verbose: true }).filter((move) => {
      const next = new Chess(puzzleFen(puzzle));
      const played = next.move(move);
      return !!played && next.isCheckmate();
    });
    if (mates.length !== 1 || mates[0]!.san !== puzzle.san) return false;
    const check = new Chess(puzzleFen(puzzle));
    const played = playMateSan(check, puzzle.san);
    return !!played && check.isCheckmate() && played.san === puzzle.san;
  } catch {
    return false;
  }
}

function puzzleFen(puzzle: MatePuzzle): string {
  return puzzle.fen;
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
    if (!parsed || typeof parsed.date !== "string" || typeof parsed.id !== "string") {
      return null;
    }
    return { date: parsed.date, id: parsed.id, solved: parsed.solved === true };
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

export function mateDoneToday(now = new Date()): boolean {
  const stored = readRecord();
  return !!stored && stored.date === localDateKey(now) && stored.solved;
}

export function loadMateSession(now = new Date()): MateSession | null {
  const pool = matePuzzles();
  if (pool.length === 0) return null;
  const date = localDateKey(now);
  const stored = readRecord();
  const kept =
    stored && stored.date === date ? pool.find((item) => item.id === stored.id) : undefined;
  if (kept) {
    return { ...kept, date, solved: stored?.solved ?? false };
  }
  const next = pool[mix(date, "mate") % pool.length]!;
  writeRecord({ date, id: next.id, solved: false });
  return { ...next, date, solved: false };
}

export function saveMateSolved(date: string, id: string) {
  writeRecord({ date, id, solved: true });
}
