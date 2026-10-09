/**
 * Two-card study opener for every drill pack.
 * The cards and board live in SlavPackNotice. This file supplies the copy.
 */

import { STUDY_PACK_ROWS } from "@/lib/study-pack-copy";
import { STUDY_INTRO_SETUPS } from "@/lib/study-intro-setup";
import {
  SLAV_ABOUT_TITLE,
  SLAV_FREE_LINE_ID,
  SLAV_HOW_TO,
  SLAV_INTRO_HEADER,
  SLAV_INTRO_LEAD,
  SLAV_INTRO_REST,
  SLAV_INTRO_START,
  SLAV_INTRO_SUBTITLE,
  SLAV_INTRO_TAGLINE,
  SLAV_PREVIEW_PACK_ID,
  SLAV_STEM,
  SLAV_WELCOME_TITLE,
} from "@/lib/slav-preview";

export type StudyIntroCopy = {
  packId: string;
  freeLineId: string;
  /** Defining moves. This is the "Starting position:" sentence, not the board. */
  stem: readonly string[];
  /** Book-line prefix. The intro board shows the position after these moves. */
  setup: readonly string[];
  aboutTitle: string;
  header: string;
  subtitle: string;
  start: string;
  tagline: string;
  lead: string;
  rest: string;
  welcomeTitle: string;
  howTo: readonly string[];
};

const QGD_PACK_ID = "qgd-black";

function setupFor(packId: string): readonly string[] {
  const found = STUDY_INTRO_SETUPS[packId];
  if (!found) throw new Error(`missing intro setup for ${packId}`);
  return found.plies;
}

const SLAV_STUDY_INTRO: StudyIntroCopy = {
  packId: SLAV_PREVIEW_PACK_ID,
  freeLineId: SLAV_FREE_LINE_ID,
  stem: SLAV_STEM,
  setup: setupFor(SLAV_PREVIEW_PACK_ID),
  aboutTitle: SLAV_ABOUT_TITLE,
  header: SLAV_INTRO_HEADER,
  subtitle: SLAV_INTRO_SUBTITLE,
  start: SLAV_INTRO_START,
  tagline: SLAV_INTRO_TAGLINE,
  lead: SLAV_INTRO_LEAD,
  rest: SLAV_INTRO_REST,
  welcomeTitle: SLAV_WELCOME_TITLE,
  howTo: SLAV_HOW_TO,
};

/** Card copy for Queen's Gambit Declined. How-to steps match the Slav. */
export const QGD_STUDY_INTRO: StudyIntroCopy = {
  packId: QGD_PACK_ID,
  freeLineId: "qgdb1",
  stem: ["d4", "d5", "c4", "e6"],
  setup: setupFor(QGD_PACK_ID),
  aboutTitle: "About the opening",
  header: "QUEEN'S GAMBIT DECLINED FOR BLACK",
  subtitle: "An introduction and ten educational drills",
  start: "Starting position: 1.d4 d5 2.c4 e6",
  tagline: "A solid pawn on d5. A trusted reply to 1.d4.",
  lead: "The Queen's Gambit Declined is 1.d4 d5 2.c4 e6. Black keeps the pawn on d5 instead of taking on c4.",
  rest: "It is one of the oldest and most trusted replies to 1.d4, and a world championship staple. It is worth learning because the same first moves meet the main ways White continues. The 10 lines in this pack are the Orthodox setup, freeing with ...dxc4 and ...Nd5, Early Exchange, Exchange development, Exchange with Nge2, the Nf3-first Orthodox, quiet Bd3 and ...c5, the Ragozin, the Lasker Defence, and the Tartakower.",
  welcomeTitle: "Welcome to the start of your Queen's Gambit Declined for Black learning pack",
  howTo: SLAV_HOW_TO,
};

const COUNT_WORD: Readonly<Record<number, string>> = {
  9: "nine",
  10: "ten",
  18: "eighteen",
  20: "twenty",
};

function formatStart(stem: readonly string[]): string {
  const bits: string[] = [];
  for (let i = 0; i < stem.length; i += 1) {
    if (i % 2 === 0) bits.push(`${i / 2 + 1}.${stem[i]}`);
    else bits.push(stem[i] ?? "");
  }
  return `Starting position: ${bits.join(" ")}`;
}

function studyHowTo(side: "w" | "b" | "mixed", line1Free: boolean): readonly string[] {
  const you =
    side === "w"
      ? "You play White."
      : side === "b"
        ? "You play Black."
        : "You play the trapping side.";
  return [
    you,
    "Practice shows a green hint.",
    "Test has no hints.",
    line1Free ? "Line 1 is free." : "Unlock the pack to play the lines.",
  ];
}

function rowToCopy(row: (typeof STUDY_PACK_ROWS)[number]): StudyIntroCopy {
  const count = COUNT_WORD[row.lineCount];
  if (!count) throw new Error(`missing count word for ${row.packId}`);
  return {
    packId: row.packId,
    freeLineId: row.firstLineId,
    stem: row.stem,
    setup: setupFor(row.packId),
    aboutTitle: "About the opening",
    header: row.name.toUpperCase(),
    subtitle: `An introduction and ${count} educational drills`,
    start: formatStart(row.stem),
    tagline: row.tagline,
    lead: row.lead,
    rest: row.rest,
    welcomeTitle: `Welcome to the start of your ${row.name} learning pack`,
    howTo: studyHowTo(row.side, row.line1Free),
  };
}

const STUDY_INTROS: Record<string, StudyIntroCopy> = {
  [SLAV_PREVIEW_PACK_ID]: SLAV_STUDY_INTRO,
  [QGD_PACK_ID]: QGD_STUDY_INTRO,
};

for (const row of STUDY_PACK_ROWS) {
  STUDY_INTROS[row.packId] = rowToCopy(row);
}

export function packStudyIntro(packId: string): StudyIntroCopy | null {
  return STUDY_INTROS[packId] ?? null;
}

/**
 * New study cards replace the character opener.
 * Slav and QGD keep the behaviour they already shipped.
 */
export function studyPackReplacesCoach(packId: string): boolean {
  if (packId === QGD_PACK_ID || packId === SLAV_PREVIEW_PACK_ID) return false;
  return packStudyIntro(packId) != null;
}

/** Slav keeps its original session key. Other packs get their own. */
function studySeenKey(packId: string): string {
  if (packId === SLAV_PREVIEW_PACK_ID) return "opening-lab:slav-preview:intro-seen";
  return `opening-lab:${packId}:study-intro-seen`;
}

export function packStudyIntroAlreadySeen(packId: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(studySeenKey(packId)) === "1";
  } catch {
    return false;
  }
}

export function markPackStudyIntroSeen(packId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(studySeenKey(packId), "1");
  } catch {
    /* private mode */
  }
}
