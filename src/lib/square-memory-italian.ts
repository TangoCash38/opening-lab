import { playMemoryLine } from "@/lib/square-memory-line";

/**
 * Opening of the live Italian Game for White pack (`italian-white`) Line 1
 * (`it1`), stopped at five plies — the same length as the Ruy line through
 * Bb5. Not a made-up order. The bishop to c4 is the move that names the Italian.
 * e4 e5 Nf3 Nc6 Bc4.
 */
export const ITALIAN_MEMORY_NAME = "Italian Game";
export const ITALIAN_MEMORY_PACK_ID = "italian-white";
export const ITALIAN_MEMORY_MOVES = ["e4", "e5", "Nf3", "Nc6", "Bc4"] as const;
export const ITALIAN_MEMORY_LINE = playMemoryLine(ITALIAN_MEMORY_MOVES);
