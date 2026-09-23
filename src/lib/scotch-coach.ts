/**
 * Scotch Gambit coach intro — website desktop Practice only.
 *
 * Flag + pack id. Play wrap and the phone train route never mount it.
 * Test is not intercepted; other packs never match.
 */
export const SCOTCH_PACK_ID = "scotch";

/** Flip off to hide the intro without changing Practice, Test, or other packs. */
export const SCOTCH_COACH_ENABLED = true;

/** Placeholder history. Opening Expert can replace these beats. */
export const SCOTCH_COACH_BEATS = [
  "The Scotch Gambit: after 1.e4 e5 2.Nf3 Nc6 3.d4, White often plays Bc4, aiming at f7 with rapid development.",
  "A hobbyist favourite: open play, with clear attacking ideas.",
  "Let’s practice the book moves.",
] as const;

export function scotchCoachApplies(input: {
  packId: string;
  playApp: boolean;
  websiteDesktop: boolean;
}): boolean {
  if (!SCOTCH_COACH_ENABLED) return false;
  if (input.packId !== SCOTCH_PACK_ID) return false;
  if (input.playApp) return false;
  if (!input.websiteDesktop) return false;
  return true;
}
