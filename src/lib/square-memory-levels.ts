/**
 * Level mode for Square Memory.
 * A position from the chosen level is shown, then rebuilt from the tray.
 * There is no clock and no saved best. Opening-line scores stay on their own API.
 */

import {
  SQUARE_MEMORY_POSITIONS,
  type SquareMemoryLevel,
  type SquareMemoryPosition,
} from "@/lib/square-memory-positions";

export const MEMORY_LEVELS = [1, 2, 3, 4, 5] as const;

export const PIECE_COUNTS: Record<SquareMemoryLevel, number> = {
  1: 3,
  2: 4,
  3: 5,
  4: 6,
  5: 10,
};

/** How long the diagram stays up, including the pop. Longer as the board fills. */
export const SHOW_MS: Record<SquareMemoryLevel, number> = {
  1: 3200,
  2: 3800,
  3: 4500,
  4: 5400,
  5: 8000,
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

export function isMemoryLevel(level: number): level is SquareMemoryLevel {
  return level === 1 || level === 2 || level === 3 || level === 4 || level === 5;
}

export function showMs(level: number): number {
  return isMemoryLevel(level) ? SHOW_MS[level] : SHOW_MS[1];
}

export function piecesFromFen(fen: string): Record<string, string> {
  const rows = (fen.split(" ")[0] ?? "").split("/");
  const out: Record<string, string> = {};
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const ch of rows[rank] ?? "") {
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);
        continue;
      }
      if (file > 7) break;
      const square = FILES[file];
      if (square) out[`${square}${8 - rank}`] = ch;
      file += 1;
    }
  }
  return out;
}

export function pieceCount(fen: string): number {
  return Object.keys(piecesFromFen(fen)).length;
}

export function boardsMatch(original: Record<string, string>, attempt: Record<string, string>): boolean {
  const squares = new Set([...Object.keys(original), ...Object.keys(attempt)]);
  for (const square of squares) {
    if (original[square] !== attempt[square]) return false;
  }
  return true;
}

export function positionsForLevel(level: number): SquareMemoryPosition[] {
  return SQUARE_MEMORY_POSITIONS.filter((position) => position.level === level);
}

/** A random diagram from the level, skipping the one just played when another exists. */
export function pickPosition(
  level: number,
  avoidId?: string | null,
  random: () => number = Math.random,
): SquareMemoryPosition {
  const pool = positionsForLevel(level);
  const first = pool[0];
  if (!first) throw new Error(`No Square Memory positions for level ${level}`);
  const fresh = avoidId ? pool.filter((position) => position.id !== avoidId) : pool;
  const bag = fresh.length > 0 ? fresh : pool;
  const index = Math.min(bag.length - 1, Math.floor(Math.max(0, random()) * bag.length));
  return bag[index] ?? first;
}
