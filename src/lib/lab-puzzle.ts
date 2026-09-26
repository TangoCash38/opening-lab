import { Chess } from "chess.js";

/**
 * Website-only side puzzles. Opening Lab stays a book-move trainer; this is
 * one static mate, not a rating feed, daily set, or game against a computer.
 * The list can grow later. Each line is the player move, the reply, and so on.
 * The Play wrap never mounts this.
 */
export type LabPuzzle = {
  id: string;
  fen: string;
  side: "w" | "b";
  /** Player moves until mate. A mate in 2 has two player moves. */
  mateIn: number;
  /**
   * Full line from the start. Even indexes are the player; odd indexes are
   * the reply the board auto-plays.
   */
  line: readonly string[];
  /** Short label, e.g. "Mate in 2". */
  label: string;
  /** Board caption, e.g. "White to move · Mate in 2". */
  caption: string;
};

const LAB_PUZZLES: readonly LabPuzzle[] = [
  {
    id: "qb8-mate-in-2",
    fen: "6k1/5ppp/4pb2/8/r7/6Q1/2b1qPPP/4R1K1 w - - 0 1",
    side: "w",
    mateIn: 2,
    line: ["Qb8+", "Bd8", "Qxd8#"],
    label: "Mate in 2",
    caption: "White to move · Mate in 2",
  },
];

export function labPuzzles(): readonly LabPuzzle[] {
  return LAB_PUZZLES;
}

/** The one puzzle the website shows in v1. */
export function starterPuzzle(): LabPuzzle {
  return LAB_PUZZLES[0]!;
}

/** Legal SANs after `san` is played from `fen`. Empty if `san` is illegal. */
export function legalRepliesAfter(fen: string, san: string): string[] {
  try {
    const game = new Chess(fen);
    if (!game.move(san)) return [];
    return game.moves();
  } catch {
    return [];
  }
}

/**
 * Line loads, each SAN is legal, the side to move matches, the length matches
 * mateIn, and the last move is checkmate. Mate-in-2 lines must not already be
 * mate after the first move.
 */
export function verifyLabPuzzle(puzzle: LabPuzzle): string | null {
  if (puzzle.mateIn < 1) return "mate-in";
  if (puzzle.line.length !== puzzle.mateIn * 2 - 1) return "line-length";
  let game: Chess;
  try {
    game = new Chess(puzzle.fen);
  } catch {
    return "fen";
  }
  if (game.turn() !== puzzle.side) return "side";
  for (let i = 0; i < puzzle.line.length; i++) {
    const san = puzzle.line[i]!;
    if (!game.move(san)) return `illegal:${san}`;
  }
  if (!game.isCheckmate()) return "not-mate";
  if (puzzle.mateIn > 1) {
    const first = new Chess(puzzle.fen);
    if (!first.move(puzzle.line[0]!)) return "illegal-first";
    if (first.isCheckmate()) return "mate-in-1";
  }
  return null;
}
