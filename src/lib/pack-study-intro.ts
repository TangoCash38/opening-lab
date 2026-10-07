/**
 * Two-card study opener shared by the Slav preview and Queen's Gambit Declined.
 * The cards and board live in SlavPackNotice. This file only supplies the copy.
 */

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
  stem: readonly string[];
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

const SLAV_STUDY_INTRO: StudyIntroCopy = {
  packId: SLAV_PREVIEW_PACK_ID,
  freeLineId: SLAV_FREE_LINE_ID,
  stem: SLAV_STEM,
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
  aboutTitle: "About the opening",
  header: "QUEEN'S GAMBIT DECLINED FOR BLACK",
  subtitle: "An introduction and ten educational drills",
  start: "Starting position: 1.d4 d5 2.c4 e6",
  tagline: "A solid pawn on d5. A trusted reply to 1.d4.",
  lead: "The Queen's Gambit Declined is 1.d4 d5 2.c4 e6. Black keeps the pawn on d5 instead of taking on c4.",
  rest: "It is one of the oldest and most trusted replies to 1.d4, and a world championship staple. It is worth learning because the same first moves meet the main ways White continues. The 10 lines in this pack are the Orthodox setup, freeing with ...dxc4 and ...Nd5, Early Exchange, Exchange development, Exchange with Nge2, the Nf3-first Orthodox, quiet Bd3 and ...c5, Late Exchange, the Lasker Defence, and the Tartakower.",
  welcomeTitle: "Welcome to the start of your Queen's Gambit Declined for Black learning pack",
  howTo: SLAV_HOW_TO,
};

const STUDY_INTROS: Record<string, StudyIntroCopy> = {
  [SLAV_PREVIEW_PACK_ID]: SLAV_STUDY_INTRO,
  [QGD_PACK_ID]: QGD_STUDY_INTRO,
};

export function packStudyIntro(packId: string): StudyIntroCopy | null {
  return STUDY_INTROS[packId] ?? null;
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
