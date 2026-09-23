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

/** Sean's recorded reading of SCOTCH_COACH_BEATS. Not synthetic speech. */
export const SCOTCH_COACH_NARRATION_MP3 = "/scotch-coach/sean-coach-narration.mp3";
export const SCOTCH_COACH_NARRATION_OGG = "/scotch-coach/sean-coach-narration.ogg";
/** Equal quarters until the element reports a duration. The file is ~44s. */
export const SCOTCH_COACH_NARRATION_FALLBACK_SEC = 44;

/** Map playback time onto the four cream beats. Never past the last beat. */
export function scotchCoachBeatIndex(
  currentTimeSec: number,
  durationSec: number,
  beatCount = SCOTCH_COACH_BEATS.length,
): number {
  const count = Math.max(1, beatCount);
  const duration =
    Number.isFinite(durationSec) && durationSec > 0
      ? durationSec
      : SCOTCH_COACH_NARRATION_FALLBACK_SEC;
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  const index = Math.floor(currentTimeSec / (duration / count));
  return Math.min(count - 1, Math.max(0, index));
}

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
