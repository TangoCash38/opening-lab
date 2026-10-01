import { Chess, type Color, type PieceSymbol } from "chess.js";

/**
 * The hidden line. Each ply is two flashes: the square the piece leaves,
 * then the square it lands on. This one stops at Bb5, the move that names
 * the Ruy Lopez. The year is not part of the reveal.
 */
export const SQUARE_MEMORY_NAME = "Ruy Lopez";
export const SQUARE_MEMORY_PACK_ID = "ruy-lopez-white";
export const SQUARE_MEMORY_MOVES = ["e4", "e5", "Nf3", "Nc6", "Bb5"] as const;

export type MemoryPiece = { type: PieceSymbol; color: Color } | null;
/** Rank 0 is the 8th rank, matching chess.js. */
export type MemoryBoard = MemoryPiece[][];

export type MemoryPly = {
  san: string;
  from: string;
  to: string;
};

export type PlayedMemory = {
  plies: MemoryPly[];
  squares: string[];
  positions: MemoryBoard[];
};

export function playMemoryLine(moves: readonly string[]): PlayedMemory {
  const chess = new Chess();
  const positions: MemoryBoard[] = [chess.board()];
  const plies: MemoryPly[] = [];
  for (const san of moves) {
    const move = chess.move(san);
    if (!move) throw new Error(`Illegal Square Memory move ${san}`);
    plies.push({ san: move.san, from: move.from, to: move.to });
    positions.push(chess.board());
  }
  const squares: string[] = [];
  for (const ply of plies) squares.push(ply.from, ply.to);
  return { plies, squares, positions };
}

export const SQUARE_MEMORY_LINE = playMemoryLine(SQUARE_MEMORY_MOVES);
