import { playMemoryLine } from "@/lib/square-memory-line";

/**
 * Opening of the live Caro-Kann for Black pack (`caro-kann-black`) Line 1
 * (`ckb1`), stopped at five plies — the same length as the Ruy line through
 * Bb5. Not a made-up order. White gains space with e5. Black sits at the bottom.
 * e4 c6 d4 d5 e5.
 */
export const CARO_MEMORY_NAME = "Caro-Kann";
export const CARO_MEMORY_PACK_ID = "caro-kann-black";
export const CARO_MEMORY_ORIENTATION = "black" as const;
export const CARO_MEMORY_MOVES = ["e4", "c6", "d4", "d5", "e5"] as const;
export const CARO_MEMORY_LINE = playMemoryLine(CARO_MEMORY_MOVES);
