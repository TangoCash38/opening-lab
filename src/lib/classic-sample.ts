/**
 * Website-only free Classic GM sample.
 *
 * Fischer vs J. Sherwin, New Jersey Open, 2 Sep 1957, 1-0.
 * The user drills White (Fischer). Sean-locked Expert-cut SAN stops
 * inclusive at 10...Qc7. Not a Play SKU. Not in VISIBLE_PACK_IDS.
 *
 * Run the game is a separate watch-only replay of the whole game from 1.e4
 * (see classic-run.ts). Practice and Test stay on this cut.
 */
import { Chess } from "chess.js";
import type { OpeningLine, Pack } from "@/data/packs";
import {
  WEBSITE_CLASSIC_SAMPLE_LINE_ID,
  WEBSITE_CLASSIC_SAMPLE_PACK_ID,
} from "@/lib/catalog";

export const CLASSIC_SAMPLE_LINE_ID = WEBSITE_CLASSIC_SAMPLE_LINE_ID;

/** Inclusive cut: 10...Qc7. Twenty plies, White to drill. */
export const CLASSIC_SAMPLE_PLIES = [
  "e4",
  "c5",
  "Nf3",
  "e6",
  "d3",
  "Nc6",
  "g3",
  "Nf6",
  "Bg2",
  "Be7",
  "O-O",
  "O-O",
  "Nbd2",
  "Rb8",
  "Re1",
  "d6",
  "c3",
  "b6",
  "d4",
  "Qc7",
] as const;

export function isClassicSamplePack(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return id === WEBSITE_CLASSIC_SAMPLE_PACK_ID;
}

export function classicSampleLine(): OpeningLine {
  return {
    id: CLASSIC_SAMPLE_LINE_ID,
    name: "King's Indian Attack vs Sicilian",
    plies: [...CLASSIC_SAMPLE_PLIES],
    side: "w",
    idea: "Fischer’s King’s Indian Attack against Sherwin’s Sicilian. Drill White’s book moves through 10...Qc7.",
    next: "The book drill stops here, inclusive of 10...Qc7. Run the game replays the whole game from 1.e4 with Professor Potato Pie.",
    players: {
      white: "Bobby Fischer",
      black: "J. Sherwin",
      event: "New Jersey Open 1957 · 1-0",
    },
  };
}

/** Synthetic pack for the website gym. Never added to PACKS or Play SKUs. */
export function classicSamplePack(): Pack {
  return {
    id: WEBSITE_CLASSIC_SAMPLE_PACK_ID,
    name: "Classic GM — Fischer vs Sherwin, 1957",
    eco: "A07",
    side: "White",
    section: "special",
    isFree: true,
    isPremium: false,
    price: null,
    blurb: "King's Indian Attack vs Sicilian",
    closedLabel: "Free · KIA vs Sicilian",
    badge: "KIA vs Sicilian",
    lines: [classicSampleLine()],
  };
}

/** Legal SAN from the start, and the cut is exactly 10...Qc7. */
export function verifyClassicSamplePlies(
  plies: readonly string[] = CLASSIC_SAMPLE_PLIES,
): string | null {
  if (plies.length !== 20) return "length";
  if (plies[plies.length - 1] !== "Qc7") return "cut";
  if (plies[18] !== "d4") return "white-10";
  const game = new Chess();
  for (const san of plies) {
    if (!game.move(san)) return `illegal:${san}`;
  }
  if (game.history().length !== 20) return "history";
  return null;
}
