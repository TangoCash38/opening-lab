import { playMemoryLine } from "@/lib/square-memory-line";

/**
 * Queen's Gambit Declined, Orthodox Exchange, from Black's side.
 * The whole line through 9...Re8 — not a shorter preview of the Declined line.
 * Each ply is still two squares: the piece leaves, then the square it lands on.
 * d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 cxd5 exd5 Bd3 c6 Qc2 Re8.
 */
export const ORTHODOX_MEMORY_NAME = "QGD Orthodox Exchange";
export const ORTHODOX_MEMORY_PACK_ID = "qgd-black";
export const ORTHODOX_MEMORY_ORIENTATION = "black" as const;
export const ORTHODOX_MEMORY_MOVES = [
  "d4",
  "d5",
  "c4",
  "e6",
  "Nc3",
  "Nf6",
  "Bg5",
  "Be7",
  "e3",
  "O-O",
  "Nf3",
  "Nbd7",
  "cxd5",
  "exd5",
  "Bd3",
  "c6",
  "Qc2",
  "Re8",
] as const;
export const ORTHODOX_MEMORY_LINE = playMemoryLine(ORTHODOX_MEMORY_MOVES);
