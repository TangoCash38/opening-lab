import { playMemoryLine } from "@/lib/square-memory-line";

/**
 * Opening of the live London pack Line 1 (`lon1`), stopped at five plies —
 * the same length as the Ruy line through Bb5. Not a made-up order.
 * d4 d5 Bf4 Nf6 e3.
 */
export const LONDON_MEMORY_NAME = "London System";
export const LONDON_MEMORY_PACK_ID = "london";
export const LONDON_MEMORY_MOVES = ["d4", "d5", "Bf4", "Nf6", "e3"] as const;
export const LONDON_MEMORY_LINE = playMemoryLine(LONDON_MEMORY_MOVES);
