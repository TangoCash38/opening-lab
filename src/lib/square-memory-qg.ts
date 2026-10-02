import { playMemoryLine } from "@/lib/square-memory-line";

/**
 * Opening of the live Queen's Gambit for White pack (`qg-white`) Line 1
 * (`qg1`), stopped at five plies — the same length as the Ruy line through
 * Bb5. Not a made-up order.
 * d4 d5 c4 e6 Nc3.
 */
export const QG_MEMORY_NAME = "Queen's Gambit for White";
export const QG_MEMORY_PACK_ID = "qg-white";
export const QG_MEMORY_MOVES = ["d4", "d5", "c4", "e6", "Nc3"] as const;
export const QG_MEMORY_LINE = playMemoryLine(QG_MEMORY_MOVES);
