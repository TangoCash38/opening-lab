/**
 * Scotch Gambit coach — Scotch pack Practice only. Professor Potato Pie.
 *
 * Two talks, same seated portrait and cream plate / desktop dock:
 * - Main `Tap to practice`: cuppa and history (`scotchCoachApplies`).
 *   The board auto-plays the gambit stem while he speaks.
 *   Finishing that intro (Practice or the clip, not Skip) opens the
 *   Line 1 pack-recipe talk before book Practice.
 * - First book line, Line 1 (`sg1`): what the ten lines teach
 *   (`scotchCanalCoachApplies`). The board auto-plays that line's SAN
 *   from the pack (not a hardcoded copy) and holds the final position
 *   until the talk ends. Practice then starts again at ply 0.
 *   Later variations do not open him. A line-card tap still opens only
 *   this talk, not the cuppa intro.
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

/** AI-generated narration of SCOTCH_COACH_BEATS. Playback only. */
export const SCOTCH_COACH_NARRATION_MP3 = "/scotch-coach/coach-narration.mp3";
export const SCOTCH_COACH_NARRATION_OGG = "/scotch-coach/coach-narration.ogg";
/** Equal quarters until the element reports a duration. The file is ~44s. */
export const SCOTCH_COACH_NARRATION_FALLBACK_SEC = 44;

/**
 * First variation in the Scotch pack. The pack-recipe talk opens only here.
 */
export const SCOTCH_CANAL_LINE_ID = "sg1";

export const SCOTCH_CANAL_TITLE = "Line 1 · ten lines from the gambit";

/**
 * AI-generated Canal pack-recipe narration. Same mp3 family as the cuppa
 * narration (24 kHz mono). This file does not replace coach-narration.
 */
export const SCOTCH_CANAL_NARRATION_MP3 = "/scotch-coach/professor-potato-pie-canal.mp3";
/** The file is ~95s. Used when the element has not reported a duration yet. */
export const SCOTCH_CANAL_NARRATION_FALLBACK_SEC = 95;

/**
 * On-screen beats for professor-potato-pie-canal.mp3.
 * The 5+5 recipe beats now say 10 lines from Opening Lab. The recording still speaks the older split.
 */
export const SCOTCH_CANAL_BEATS = [
  "Right then — welcome to Line 1. Professor Potato Pie, at your service.",
  "In this learning pack, we've distilled the gambit into ten carefully selected lines.",
  "10 lines from Opening Lab.",
  "Learn those and you won't merely survive the theory. You'll return the correct moves with confidence, keep the balance, and stay firmly in the game.",
  "You get 10 lines from Opening Lab.",
  "When Black slips, you'll learn to recognise why the move is faulty, choose the precise continuation, convert the error into a clear advantage and, on occasion, a rather exquisite checkmate.",
  "Naturally, Black has more than ten ways to play. Think of this as a compact, bite-sized primer rather than an exhaustive encyclopedia — the logic behind the moves, not simply a sequence to memorise.",
  "Complete the pack and the Scotch Gambit will look familiar whenever it appears. You'll recognise the landmarks, understand the plans, and have a proper footing from which to take your study further.",
  "Enjoy it. Take your time, walk through every line, and I'll see you at the board.",
] as const;

/**
 * Seconds into the ~95s Canal recording when each beat begins.
 * Welcome, ten lines, 10 lines from Opening Lab, stay in the game,
 * you get 10 lines from Opening Lab, advantage / mate, primer, complete the pack, goodbye.
 */
export const SCOTCH_CANAL_BEAT_AT_SEC = [
  0, 7.92, 13.86, 20.32, 31.52, 40.62, 56.98, 77.56, 89.94,
] as const;

/**
 * Session flag for the sg1 pack-recipe talk. Set when that line opens it.
 * Distinct from the cuppa intro so Skip on one does not hide the other.
 * Gone when the tab closes.
 */
export const SCOTCH_CANAL_SESSION_KEY = "opening-lab:scotch-canal-coach-session";

/**
 * Scotch Gambit stem the narration names:
 * e4, e5, knights out, d4, pawn takes, bishop to c4.
 */
export const SCOTCH_COACH_STEM = ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4"] as const;

/**
 * Seconds into the 44s recording when each stem ply is spoken.
 * Pauses in coach-narration: "e4", "e5", "knights out" (both knights),
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

/** Map Canal playback time onto the pack-recipe beats. Never past the last beat. */
export function scotchCanalBeatIndex(currentTimeSec: number, durationSec: number): number {
  const duration =
    Number.isFinite(durationSec) && durationSec > 0
      ? durationSec
      : SCOTCH_CANAL_NARRATION_FALLBACK_SEC;
  const scale = duration / SCOTCH_CANAL_NARRATION_FALLBACK_SEC;
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  let index = 0;
  for (let i = 0; i < SCOTCH_CANAL_BEAT_AT_SEC.length; i += 1) {
    if (currentTimeSec + 1e-9 >= SCOTCH_CANAL_BEAT_AT_SEC[i] * scale) index = i;
    else break;
  }
  return index;
}

/**
 * Seconds of the final Line 1 position held before the Canal clip ends.
 * The demo finishes a few seconds early, then Practice restarts at ply 0.
 */
export const SCOTCH_CANAL_LINE_END_LEAD_SEC = 5;

/** After the Canal demo, book Practice always begins on the start position. */
export const SCOTCH_CANAL_PRACTICE_START_PLY = 0;

function scotchCanalNarrationDuration(durationSec: number): number {
  return Number.isFinite(durationSec) && durationSec > 0
    ? durationSec
    : SCOTCH_CANAL_NARRATION_FALLBACK_SEC;
}

/**
 * Second when the last Line 1 ply should already be on the board.
 * A few seconds before the clip so the final position can sit there.
 */
export function scotchCanalLineFinishSec(durationSec: number): number {
  const duration = scotchCanalNarrationDuration(durationSec);
  const lead = Math.min(SCOTCH_CANAL_LINE_END_LEAD_SEC, duration / 2);
  return duration - lead;
}

/** Second when this 1-based ply belongs on the board. Evenly paced up to the finish. */
export function scotchCanalLineCueSec(
  ply: number,
  durationSec: number,
  plyCount: number,
): number {
  const count = Math.max(1, Math.floor(plyCount));
  const n = Math.min(count, Math.max(1, Math.floor(ply)));
  return (n / count) * scotchCanalLineFinishSec(durationSec);
}

/**
 * How many Line 1 plies should already be on the board at this narration time.
 * `plyCount` is the pack line length (sg1). Never past that length.
 * Duration 0 / NaN uses SCOTCH_CANAL_NARRATION_FALLBACK_SEC.
 */
export function scotchCanalLinePlyCount(
  currentTimeSec: number,
  durationSec: number,
  plyCount: number,
): number {
  const count = Math.max(0, Math.floor(plyCount));
  if (count === 0) return 0;
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  let played = 0;
  for (let i = 1; i <= count; i += 1) {
    if (currentTimeSec + 1e-9 >= scotchCanalLineCueSec(i, durationSec, count)) played = i;
    else break;
  }
  return played;
}

/** Prefix of `sans` that belongs on the board, in pack order. */
export function scotchCanalLinePlayed<T>(
  sans: readonly T[],
  currentTimeSec: number,
  durationSec: number,
): readonly T[] {
  return sans.slice(0, scotchCanalLinePlyCount(currentTimeSec, durationSec, sans.length));
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

/** True after sg1 has opened the pack-recipe talk in this tab. */
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
 * Pack-recipe talk. Scotch only, and only line id sg1 (the first book line).
 * The display name is not the gate. Main Tap to practice stays on the cuppa intro.
 */
export function scotchCanalCoachApplies(input: {
  packId: string;
  lineId: string;
  /** Index in the pack. sg1 is variation 0. */
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
