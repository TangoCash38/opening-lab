/**
 * Scotch Gambit coach — Scotch pack Practice only. Professor Potato Pie.
 *
 * Two talks, same seated portrait and cream plate / desktop dock:
 * - Main `Tap to practice`: cuppa and history (`scotchCoachApplies`).
 * - First variation, Canal Variation: what the ten lines teach
 *   (`scotchCanalCoachApplies`). Later variations do not open him.
 *
 * Phone and the Play wrap mount the same dock; a narrow cream plate keeps
 * him off the squares. Test, line switches, and other packs never match.
 *
 * Once per browser session, separately for each talk.
 * `opening-lab:scotch-coach-session` is the cuppa intro.
 * `opening-lab:scotch-canal-coach-session` is the Canal pack talk.
 * Closing the tab or window clears them. Skip is the escape for the rest
 * of that visit — there is no forever hide.
 */
export const SCOTCH_PACK_ID = "scotch";

/** Flip off to hide the intro without changing Practice, Test, or other packs. */
export const SCOTCH_COACH_ENABLED = true;

/**
 * Session flag. Set when main Practice opens the coach. Gone when the
 * tab closes. Not localStorage — a forever key must not keep him away.
 */
export const SCOTCH_COACH_SESSION_KEY = "opening-lab:scotch-coach-session";

/** Leftover forever flags from earlier builds. Dropped, never read as the gate. */
const SCOTCH_COACH_FOREVER_KEYS = [
  "opening-lab:scotch-coach-seen",
  "opening-lab:scotch-coach-dock-seen",
] as const;

/** Visible name on the cream plate, the desktop dock, and coach alt / aria. */
export const SCOTCH_COACH_NAME = "Professor Potato Pie";

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

/**
 * First variation in the Scotch pack. The pack-recipe talk opens only here.
 */
export const SCOTCH_CANAL_LINE_ID = "sg1";

export const SCOTCH_CANAL_TITLE = "Canal Variation · ten lines from the gambit";

/** Sean's pack-recipe substance, in on-screen beats until his recording arrives. */
export const SCOTCH_CANAL_BEATS = [
  "We have ten lines from the gambit.",
  "The first five are solid book moves people would play if they knew the opening. That lets you play the book moves back and stay firmly in the game.",
  "The last five lines let you punish the not-so-good moves people could make, so you play the right moves to gain a firm advantage and sometimes a checkmate.",
] as const;

/**
 * Sean's Canal reading, same pair as the cuppa narration.
 * Drop these beside sean-coach-narration when the take arrives:
 *   public/scotch-coach/sean-canal-narration.mp3
 *   public/scotch-coach/sean-canal-narration.ogg
 * Then set SCOTCH_CANAL_NARRATION_READY. Until then the beats stay on screen.
 * No synthetic speech and no stand-in file.
 */
export const SCOTCH_CANAL_NARRATION_MP3 = "/scotch-coach/sean-canal-narration.mp3";
export const SCOTCH_CANAL_NARRATION_OGG = "/scotch-coach/sean-canal-narration.ogg";
export const SCOTCH_CANAL_NARRATION_READY = false;

/**
 * Canal session flag. Set when Canal Variation opens this talk.
 * Distinct from the cuppa intro so Skip on one does not hide the other.
 * Gone when the tab closes.
 */
export const SCOTCH_CANAL_SESSION_KEY = "opening-lab:scotch-canal-coach-session";

/**
 * Scotch Gambit stem Sean names while he speaks:
 * e4, e5, knights out, d4, pawn takes, bishop to c4.
 */
export const SCOTCH_COACH_STEM = ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"] as const;

/**
 * Seconds into the 44s recording when each stem ply is spoken.
 * Pauses in sean-coach-narration: "e4", "e5", "knights out" (both knights),
 * "with d4", "takes on d4", "bishop on c4".
 */
export const SCOTCH_COACH_STEM_AT_SEC = [5.28, 6.28, 7.42, 7.92, 10.25, 12.95, 16.25] as const;

/** Map playback time onto the four cream beats. Never past the last beat. */
export function scotchCoachBeatIndex(
  currentTimeSec: number,
  durationSec: number,
  beatCount: number = SCOTCH_COACH_BEATS.length,
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

/** How many stem plies should already be on the board at this narration time. */
export function scotchCoachStemPlyCount(currentTimeSec: number, durationSec: number): number {
  const duration =
    Number.isFinite(durationSec) && durationSec > 0
      ? durationSec
      : SCOTCH_COACH_NARRATION_FALLBACK_SEC;
  const scale = duration / SCOTCH_COACH_NARRATION_FALLBACK_SEC;
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  let count = 0;
  for (const at of SCOTCH_COACH_STEM_AT_SEC) {
    if (currentTimeSec + 1e-9 >= at * scale) count += 1;
    else break;
  }
  return count;
}

function dropScotchCoachForeverFlag(): void {
  if (typeof localStorage === "undefined") return;
  try {
    for (const key of SCOTCH_COACH_FOREVER_KEYS) localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
}

/** True after main Practice has opened the coach in this tab. */
export function scotchCoachAlreadySeen(): boolean {
  dropScotchCoachForeverFlag();
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SCOTCH_COACH_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remember the coach for this visit only. Closing the tab brings him back. */
export function markScotchCoachSeen(): void {
  dropScotchCoachForeverFlag();
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SCOTCH_COACH_SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/** True after Canal Variation has opened the pack-recipe talk in this tab. */
export function scotchCanalCoachAlreadySeen(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SCOTCH_CANAL_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

/** Remember the Canal talk for this visit only. Closing the tab brings it back. */
export function markScotchCanalCoachSeen(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SCOTCH_CANAL_SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

/**
 * Website side-dock starts here. Narrower viewports, and every Play wrap,
 * use the cream plate above the wood (see styles.css).
 */
export const SCOTCH_COACH_DOCK_MIN_PX = 960;

/**
 * True when the seated coach should sit in the phone/Play plate instead of
 * the desktop cream dock beside the wood.
 */
export function scotchCoachPlateLayout(input: {
  playApp: boolean;
  viewportWidthPx: number;
}): boolean {
  if (input.playApp) return true;
  return input.viewportWidthPx < SCOTCH_COACH_DOCK_MIN_PX;
}

export function scotchCoachApplies(input: {
  packId: string;
  /** True only for the pack's main Practice control, not a line tap. */
  practiceEntry: boolean;
}): boolean {
  if (!SCOTCH_COACH_ENABLED) return false;
  if (input.packId !== SCOTCH_PACK_ID) return false;
  if (!input.practiceEntry) return false;
  return true;
}

/**
 * Pack-recipe talk. Scotch only, and only the first variation (Canal).
 * Main Tap to practice stays on the cuppa intro. Test never calls this.
 */
export function scotchCanalCoachApplies(input: {
  packId: string;
  lineId: string;
  /** Index in the pack. Canal is variation 0. */
  lineIndex: number;
  /** True for Tap to practice — that mount keeps the cuppa intro. */
  practiceEntry: boolean;
}): boolean {
  if (!SCOTCH_COACH_ENABLED) return false;
  if (input.practiceEntry) return false;
  if (input.packId !== SCOTCH_PACK_ID) return false;
  if (input.lineIndex !== 0) return false;
  if (input.lineId !== SCOTCH_CANAL_LINE_ID) return false;
  return true;
}
