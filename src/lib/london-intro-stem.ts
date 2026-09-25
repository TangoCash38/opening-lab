/**
 * London System pack intro stem, spoken in
 * professor-potato-pie-london-intro.wav. White moves only — Black never replies.
 * Times are the start of each named move, read off the clip.
 *
 * "Knight to d2" is the queen's knight. The king's knight is already on f3,
 * so both can reach d2 and the legal SAN is Nbd2.
 */
import { Chess, type Move } from "chess.js";

export const LONDON_INTRO_STEM = ["d4", "Nf3", "Bf4", "e3", "c3", "Nbd2", "Bd3", "O-O"] as const;

export const LONDON_INTRO_STEM_AT_SEC = [23.2, 24.9, 26.8, 29.1, 30.6, 32.3, 34.0, 35.2] as const;

/** Hand the move back to White without moving a Black piece. */
function handMoveToWhite(chess: Chess) {
  if (chess.turn() === "w") return;
  const parts = chess.fen().split(" ");
  parts[1] = "w";
  parts[3] = "-";
  chess.load(parts.join(" "));
}

/** Play one White SAN, skipping Black's turn when it is not White to move. */
export function playWhiteOnlySan(chess: Chess, san: string): Move | null {
  handMoveToWhite(chess);
  try {
    return chess.move(san);
  } catch {
    return null;
  }
}

/** Position after the first `count` White-only stem moves. Black stays unmoved. */
export function replayWhiteOnly(sans: readonly string[], count: number): Chess {
  const chess = new Chess();
  const n = Math.max(0, Math.min(sans.length, Math.floor(count)));
  for (let i = 0; i < n; i += 1) {
    const san = sans[i];
    if (!san || !playWhiteOnlySan(chess, san)) break;
  }
  return chess;
}
