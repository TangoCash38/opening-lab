/**
 * Scotch Gambit coach intro — website desktop Practice only.
 *
 * Flag + pack id. Play wrap and the phone train route never mount it.
 * Test is not intercepted; other packs never match.
 */
export const SCOTCH_PACK_ID = "scotch";

/** Flip off to hide the intro without changing Practice, Test, or other packs. */
export const SCOTCH_COACH_ENABLED = true;

export const SCOTCH_COACH_TITLE = "Scotch Gambit · a cuppa and the open board";

export const SCOTCH_COACH_BEATS = [
  "Right — Scotch Gambit. It starts like a proper open game: e4, e5, knights out, then White hits the centre with d4.",
  "When Black takes on d4, White can leave the pawn and plant the bishop on c4. That is the gambit — develop fast, aim at f7, and put Black under pressure before they tidy up.",
  "The Scotch family got its name from those Edinburgh–London correspondence matches in the eighteen-twenties. Hobbyists still love this line because the board opens up and the plans are concrete — not a long quiet squeeze.",
  "Grab your tea. Practice the book moves with me — I'll keep you on the real Scotch Gambit path.",
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
