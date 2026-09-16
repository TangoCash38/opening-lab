/**
 * Local opening book only (no Lichess explorer, no network).
 * Unknown position → null (UI shows Opening… or hides — never invent a pack-style name).
 * For the Create-your-own authoring identity chip. Not catalog / pack titles.
 */
import { Chess } from "chess.js";
import { OPENING_IDENTITY_BOOK } from "./opening-identity-data";

export type OpeningIdentity = { name: string; eco: string };

const START_FEN_KEY = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";

type IndexedIdentity = OpeningIdentity & { plies: number };

let bookByFen: Map<string, IndexedIdentity> | null = null;

/** Board + side + castling + ep. Drops halfmove / fullmove so clocks do not miss. */
export function openingFenKey(fen: string): string | null {
  const parts = fen.trim().split(/\s+/);
  if (parts.length < 4) return null;
  const [board, side, castling, ep] = parts;
  if (!board || (side !== "w" && side !== "b") || !castling || !ep) return null;
  return `${board} ${side} ${castling} ${ep}`;
}

function playSans(moves: string): { key: string; plies: number } | null {
  const plies = moves.trim().split(/\s+/).filter(Boolean);
  if (plies.length === 0) return null;
  const game = new Chess();
  for (const san of plies) {
    try {
      if (!game.move(san)) return null;
    } catch {
      return null;
    }
  }
  const key = openingFenKey(game.fen());
  if (!key) return null;
  return { key, plies: plies.length };
}

function bookIndex(): Map<string, IndexedIdentity> {
  if (bookByFen) return bookByFen;
  const map = new Map<string, IndexedIdentity>();
  for (const row of OPENING_IDENTITY_BOOK) {
    const played = playSans(row.moves);
    if (!played) continue;
    const prev = map.get(played.key);
    // Deepest / longest match wins when several ECO entries share a FEN.
    if (prev && prev.plies >= played.plies) continue;
    map.set(played.key, { name: row.name, eco: row.eco, plies: played.plies });
  }
  bookByFen = map;
  return map;
}

/**
 * Identity for a chess.js-loaded position. Exact book FEN only —
 * off-book midgame noise returns null.
 */
export function lookupOpeningIdentity(fen: string): OpeningIdentity | null {
  const key = openingFenKey(fen);
  if (!key || key === START_FEN_KEY) return null;
  const hit = bookIndex().get(key);
  return hit ? { name: hit.name, eco: hit.eco } : null;
}

/** Same lookup from a SAN ply list (gym-line `plies`), played from the start. */
export function lookupOpeningIdentityFromPlies(plies: readonly string[]): OpeningIdentity | null {
  if (plies.length === 0) return null;
  const game = new Chess();
  for (const san of plies) {
    try {
      if (!game.move(san)) return null;
    } catch {
      return null;
    }
  }
  return lookupOpeningIdentity(game.fen());
}

/**
 * Deepest book prefix along a SAN-from-start line. Off-book tails keep the
 * last known name (never invent). Empty / unknown → null.
 */
export function lookupOpeningIdentityPrefix(
  plies: readonly string[],
): OpeningIdentity | null {
  if (plies.length === 0) return null;
  const game = new Chess();
  const keys: string[] = [];
  for (const san of plies) {
    try {
      if (!game.move(san)) break;
    } catch {
      break;
    }
    const key = openingFenKey(game.fen());
    if (key) keys.push(key);
  }
  const book = bookIndex();
  for (let i = keys.length - 1; i >= 0; i--) {
    const hit = book.get(keys[i]!);
    if (hit) return { name: hit.name, eco: hit.eco };
  }
  return null;
}

/** Quiet chip label, e.g. `Italian Game · C50`. */
export function formatOpeningIdentity(id: OpeningIdentity): string {
  return `${id.name} · ${id.eco}`;
}
