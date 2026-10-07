/**
 * Slav Defence for Black preview.
 * Not listed in the live catalog. Open with ?pack=slav-defence.
 * Intro and line sd1 are free. Line 2 onward uses the usual pack lock.
 */

export const SLAV_PREVIEW_PACK_ID = "slav-defence";
export const SLAV_FREE_LINE_ID = "sd1";

/** Moves the intro board plays on its own. The player does not move here. */
export const SLAV_STEM = ["d4", "d5", "c4", "c6"] as const;

export const SLAV_INTRO_HEADER = "SLAV DEFENCE FOR BLACK";
export const SLAV_INTRO_SUBTITLE = "An introduction and ten educational drills";
export const SLAV_INTRO_START = "Starting position: 1.d4 d5 2.c4 c6";
export const SLAV_INTRO_TAGLINE = "A solid centre. An active bishop. A clear plan.";

/** Card 1. No coach portrait. */
export const SLAV_ABOUT_TITLE = "About the opening";

/** Card 2. Start goes straight into line 1. */
export const SLAV_WELCOME_TITLE =
  "Welcome to the start of your Slav Defence for Black learning pack";

/** Full write-up on card 1. The card scrolls if a short phone runs out of room. */
export const SLAV_INTRO_LEAD =
  "The Slav Defence begins with 1.d4 d5 2.c4 c6. Black supports the d5-pawn with the c-pawn rather than immediately playing ...e6.";

export const SLAV_INTRO_REST =
  "This keeps the c8 bishop available to develop outside the pawn chain. The opening rewards sound development, careful move order and an understanding of central pawn breaks.";

export const SLAV_HOW_TO = [
  "You play Black.",
  "Practice shows a green hint.",
  "Test has no hints.",
  "Line 1 is free.",
] as const;

const INTRO_SEEN_KEY = "opening-lab:slav-preview:intro-seen";

export function isSlavPreviewPack(pack: { id: string } | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return id === SLAV_PREVIEW_PACK_ID;
}

export function slavIntroAlreadySeen(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markSlavIntroSeen(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
}
