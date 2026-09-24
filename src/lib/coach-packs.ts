/**
 * Per-pack Professor Potato Pie coach.
 *
 * Practice opens `introBeats`. The first book line (`firstLineId`, never the
 * line title) opens `firstLineBeats`. Optional `introAudio` / `firstLineAudio`
 * are mp3 paths. With no audio, captions advance on Next and a short timer,
 * and each first-line beat plays its `ply` on the board. A recording uses
 * `atSec` for captions and `plyAtSec` for the moment each move is spoken.
 *
 * Scotch keeps the cuppa clip and the sg1 Canal clip, including the session
 * keys those talks already use. Other packs get their own session keys.
 * Test never mounts a talk: only the Practice button and a learn-mode line
 * open pass these gates.
 */
import {
  SCOTCH_CANAL_BEATS,
  SCOTCH_CANAL_BEAT_AT_SEC,
  SCOTCH_CANAL_LINE_ID,
  SCOTCH_CANAL_NARRATION_FALLBACK_SEC,
  SCOTCH_CANAL_NARRATION_MP3,
  SCOTCH_CANAL_SESSION_KEY,
  SCOTCH_CANAL_TITLE,
  SCOTCH_COACH_BEATS,
  SCOTCH_COACH_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_NARRATION_MP3,
  SCOTCH_COACH_NARRATION_OGG,
  SCOTCH_COACH_SESSION_KEY,
  SCOTCH_COACH_STEM,
  SCOTCH_COACH_STEM_AT_SEC,
  SCOTCH_COACH_TITLE,
  SCOTCH_PACK_ID,
  scotchCanalCoachAlreadySeen,
  scotchCoachAlreadySeen,
  markScotchCanalCoachSeen,
  markScotchCoachSeen,
} from "@/lib/scotch-coach";

/** Gentle caption dwell when a talk has no recording. About 4 to 6 seconds. */
export const COACH_TEXT_BEAT_SEC = 5;

export type CoachLineBeat = {
  caption: string;
  /** SAN played on the board for this beat. Omitted = no new move. */
  ply?: string;
  /** Seconds into `firstLineAudio` when this caption begins. */
  atSec?: number;
  /**
   * Seconds into `firstLineAudio` when `ply` is spoken.
   * Absent: a text talk plays the ply as the caption shows, and an audio
   * talk without this cue does the same.
   */
  plyAtSec?: number;
};

export type CoachPackConfig = {
  introTitle: string;
  /** Captions when Practice opens. */
  introBeats: readonly string[];
  /** Mp3 for the Practice intro. Absent = text-only captions. */
  introAudio?: string;
  introAudioOgg?: string;
  introAudioFallbackSec?: number;
  /** Timings for `introAudio`. Absent = equal slices of the clip. */
  introBeatAtSec?: readonly number[];
  /** Narration-clock stem for an audio intro (Scotch gambit). */
  introStem?: readonly string[];
  introStemAtSec?: readonly number[];
  /** Book line that opens the first-line talk. Not the display title. */
  firstLineId: string;
  firstLineTitle: string;
  firstLineBeats: readonly CoachLineBeat[];
  /** Mp3 for the first-line talk. Absent = text-only captions. */
  firstLineAudio?: string;
  firstLineAudioFallbackSec?: number;
  /**
   * Scotch sg1 plays the pack line on the clip clock.
   * Every other pack plays `firstLineBeats[].ply` as each beat shows.
   */
  firstLinePlaysPackLine?: boolean;
};

const OPENING_TRAPS_PACK_ID = "opening-traps";

export const OPENING_TRAPS_INTRO_MP3 = "/coach/opening-traps/professor-potato-pie-traps-intro.mp3";
export const OPENING_TRAPS_LINE_MP3 = "/coach/opening-traps/professor-potato-pie-traps-legals-mate.mp3";
/** Sean's intro take. Beat times below were read off this clip. */
export const OPENING_TRAPS_INTRO_SEC = 46.4;
/** Sean's Legal's Mate take. Beat and spoken-move times were read off this clip. */
export const OPENING_TRAPS_LINE_SEC = 92.7;

const OPENING_TRAPS_INTRO = [
  "Right then, now for the opening traps. These lines are great fun, and on occasion they can catch an unsuspecting opponent completely off guard. That alone makes them worth knowing.",
  "But there is a more serious point. Studying traps teaches you to recognise the warning signs, so you're far less likely to wander into one yourself.",
  "Work through each line, grasp the idea behind it, and enjoy the elegant little tactical mechanisms at play.",
  "Use them with judgement, understand them properly, and when the opportunity presents itself, let precision do the work.",
  "Have a go, have some fun, and now I think it's time for a potato pie. Enjoy.",
] as const;

const OPENING_TRAPS_INTRO_AT_SEC = [0, 13.6, 22.5, 29.5, 38.2] as const;

const OPENING_TRAPS_LINE: readonly CoachLineBeat[] = [
  {
    caption:
      "Right then, welcome to Line 1. This is Legal's Mate, named after Monsieur de Légal, a French player of the eighteenth century.",
    atSec: 0,
  },
  { caption: "White opens with the king's pawn, e4.", ply: "e4", atSec: 10.4, plyAtSec: 12.7 },
  { caption: "Black answers symmetrically with e5.", ply: "e5", atSec: 14.0, plyAtSec: 15.7 },
  { caption: "Knight to f3 attacks that pawn.", ply: "Nf3", atSec: 17.3, plyAtSec: 18.0 },
  {
    caption: "Black defends it with d6, which is the Philidor Defence.",
    ply: "d6",
    atSec: 20.5,
    plyAtSec: 21.7,
  },
  {
    caption: "White's bishop comes to c4 and eyes the weak little f7 square.",
    ply: "Bc4",
    atSec: 25.4,
    plyAtSec: 26.9,
  },
  {
    caption: "Black's bishop goes to g4 and pins the knight against the queen.",
    ply: "Bg4",
    atSec: 31.0,
    plyAtSec: 32.2,
  },
  { caption: "White calmly develops, knight to c3.", ply: "Nc3", atSec: 35.6, plyAtSec: 38.1 },
  {
    caption: "Black plays g6. It's a slow move, and now the trap is ready.",
    ply: "g6",
    atSec: 39.6,
    plyAtSec: 40.3,
  },
  {
    caption:
      "Knight takes e5! That knight was only pinned to the queen, not to the king, so it's perfectly free to move.",
    ply: "Nxe5",
    atSec: 45.3,
    plyAtSec: 46.2,
  },
  {
    caption:
      "Black can't resist and takes the queen on d1. That's the greedy capture, and it's fatal.",
    ply: "Bxd1",
    atSec: 53.4,
    plyAtSec: 56.1,
  },
  { caption: "Bishop takes f7, check!", ply: "Bxf7+", atSec: 60.4, plyAtSec: 61.2 },
  { caption: "The king has only one square to go to, e7.", ply: "Ke7", atSec: 63.5, plyAtSec: 65.7 },
  { caption: "Knight to d5, and that's checkmate.", ply: "Nd5#", atSec: 67.2, plyAtSec: 67.8 },
  {
    caption:
      "Two knights and one bishop have beaten the entire black army. Black's queen, rooks and the bishop on d1 are all still on the board, and none of them can help.",
    atSec: 70.6,
  },
  {
    caption:
      "So remember: when a queen is offered for free this early in the game, have a good look around before you take it.",
    atSec: 81.1,
  },
  {
    caption: "Now over to you. Practise it until your knights know the way.",
    atSec: 88.6,
  },
];

export const COACH_PACKS: Readonly<Record<string, CoachPackConfig>> = {
  [SCOTCH_PACK_ID]: {
    introTitle: SCOTCH_COACH_TITLE,
    introBeats: SCOTCH_COACH_BEATS,
    introAudio: SCOTCH_COACH_NARRATION_MP3,
    introAudioOgg: SCOTCH_COACH_NARRATION_OGG,
    introAudioFallbackSec: SCOTCH_COACH_NARRATION_FALLBACK_SEC,
    introStem: SCOTCH_COACH_STEM,
    introStemAtSec: SCOTCH_COACH_STEM_AT_SEC,
    firstLineId: SCOTCH_CANAL_LINE_ID,
    firstLineTitle: SCOTCH_CANAL_TITLE,
    firstLineBeats: SCOTCH_CANAL_BEATS.map((caption, index) => ({
      caption,
      atSec: SCOTCH_CANAL_BEAT_AT_SEC[index] ?? 0,
    })),
    firstLineAudio: SCOTCH_CANAL_NARRATION_MP3,
    firstLineAudioFallbackSec: SCOTCH_CANAL_NARRATION_FALLBACK_SEC,
    firstLinePlaysPackLine: true,
  },
  [OPENING_TRAPS_PACK_ID]: {
    introTitle: "Opening Traps",
    introBeats: OPENING_TRAPS_INTRO,
    introAudio: OPENING_TRAPS_INTRO_MP3,
    introAudioFallbackSec: OPENING_TRAPS_INTRO_SEC,
    introBeatAtSec: OPENING_TRAPS_INTRO_AT_SEC,
    firstLineId: "ot1",
    firstLineTitle: "Line 1 · Legal's Mate",
    firstLineBeats: OPENING_TRAPS_LINE,
    firstLineAudio: OPENING_TRAPS_LINE_MP3,
    firstLineAudioFallbackSec: OPENING_TRAPS_LINE_SEC,
  },
};

export function coachPack(packId: string): CoachPackConfig | undefined {
  return COACH_PACKS[packId];
}

/** Practice-button intro for a coached pack other than Scotch (Scotch has its own gate). */
export function coachPackIntroApplies(packId: string): boolean {
  if (packId === SCOTCH_PACK_ID) return false;
  return Boolean(COACH_PACKS[packId]);
}

/**
 * First-line talk. Matches `firstLineId` only — not the line's display name,
 * and not "the first row" if that id ever moves. Scotch sg1 stays on its own gate.
 */
export function coachPackLineApplies(input: { packId: string; lineId: string }): boolean {
  if (input.packId === SCOTCH_PACK_ID) return false;
  const pack = COACH_PACKS[input.packId];
  if (!pack) return false;
  return input.lineId === pack.firstLineId;
}

export function coachTalkHasAudio(packId: string, talk: "intro" | "line" | "canal"): boolean {
  const pack = COACH_PACKS[packId];
  if (!pack) return false;
  if (talk === "intro") return Boolean(pack.introAudio);
  return Boolean(pack.firstLineAudio);
}

export function isCoachTextOnly(packId: string, talk: "intro" | "line" | "canal"): boolean {
  const pack = COACH_PACKS[packId];
  if (!pack) return false;
  return !coachTalkHasAudio(packId, talk);
}

const plyCache = new Map<string, readonly (string | undefined)[]>();

/**
 * Beat-aligned plies for a text talk (or a future audio talk that follows beats).
 * Null when this talk uses the Scotch narration clock instead.
 */
export function coachTalkPlies(
  packId: string,
  talk: "intro" | "line" | "canal",
): readonly (string | undefined)[] | null {
  const pack = COACH_PACKS[packId];
  if (!pack) return null;
  if (talk === "canal") return null;
  // Scotch stem follows the cuppa clip. Any other intro, audio or not, holds
  // the start position: its captions have no plies.
  if (talk === "intro" && pack.introStem) return null;
  if (talk === "line" && pack.firstLinePlaysPackLine) return null;
  const key = `${packId}:${talk}`;
  const cached = plyCache.get(key);
  if (cached) return cached;
  const plies =
    talk === "intro"
      ? pack.introBeats.map(() => undefined)
      : pack.firstLineBeats.map((beat) => beat.ply);
  plyCache.set(key, plies);
  return plies;
}

/** How many script plies should already be on the board at this beat. */
export function coachTextPlyCount(
  plies: readonly (string | undefined)[],
  beatIndex: number,
): number {
  if (!Number.isFinite(beatIndex) || beatIndex < 0) return 0;
  const end = Math.min(plies.length, Math.floor(beatIndex) + 1);
  let count = 0;
  for (let i = 0; i < end; i += 1) {
    if (plies[i]) count += 1;
  }
  return count;
}

/** SAN prefix on the board at this beat, in script order. */
export function coachTextPlayedSans(
  plies: readonly (string | undefined)[],
  beatIndex: number,
): string[] {
  if (!Number.isFinite(beatIndex) || beatIndex < 0) return [];
  const end = Math.min(plies.length, Math.floor(beatIndex) + 1);
  const played: string[] = [];
  for (let i = 0; i < end; i += 1) {
    const ply = plies[i];
    if (ply) played.push(ply);
  }
  return played;
}

/**
 * Spoken-move cues for an audio first-line talk, in ply order.
 * Null when the talk is text-only, or when a move has no `plyAtSec`
 * (that talk plays the ply as the caption shows).
 */
export function coachLinePlyCues(packId: string): readonly number[] | null {
  const pack = COACH_PACKS[packId];
  if (!pack?.firstLineAudio) return null;
  const moves = pack.firstLineBeats.filter((beat) => beat.ply);
  if (moves.length === 0 || moves.some((beat) => beat.plyAtSec == null)) return null;
  return moves.map((beat) => beat.plyAtSec ?? 0);
}

/**
 * How many spoken plies belong on the board at this clip time.
 * Cues are seconds into `fallbackSec`. A different reported duration scales them,
 * the same way the Scotch stem clock does.
 */
export function coachAudioPlyCount(
  cues: readonly number[],
  currentTimeSec: number,
  durationSec: number,
  fallbackSec: number,
): number {
  const duration =
    Number.isFinite(durationSec) && durationSec > 0 ? durationSec : Math.max(1, fallbackSec);
  const basis = fallbackSec > 0 ? fallbackSec : duration;
  const scale = duration / basis;
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  let count = 0;
  for (const at of cues) {
    if (currentTimeSec + 1e-9 >= at * scale) count += 1;
    else break;
  }
  return Math.min(cues.length, count);
}

/**
 * Map a clip clock onto beats. Explicit `atSec` wins; otherwise equal slices.
 * Adding audio later passes the same `atSec` values stored on the beats.
 */
export function coachAudioBeatIndex(
  atSec: readonly number[] | undefined,
  currentTimeSec: number,
  durationSec: number,
  beatCount: number,
  fallbackSec: number,
): number {
  const count = Math.max(1, beatCount);
  const duration =
    Number.isFinite(durationSec) && durationSec > 0 ? durationSec : Math.max(1, fallbackSec);
  if (!Number.isFinite(currentTimeSec) || currentTimeSec <= 0) return 0;
  if (atSec && atSec.length > 0) {
    const basis = fallbackSec > 0 ? fallbackSec : duration;
    const scale = duration / basis;
    let index = 0;
    const n = Math.min(atSec.length, count);
    for (let i = 0; i < n; i += 1) {
      if (currentTimeSec + 1e-9 >= atSec[i]! * scale) index = i;
      else break;
    }
    return Math.min(count - 1, index);
  }
  const index = Math.floor(currentTimeSec / (duration / count));
  return Math.min(count - 1, Math.max(0, index));
}

export function lineBeatAtSec(beats: readonly CoachLineBeat[]): readonly number[] | undefined {
  if (beats.length === 0 || beats.some((beat) => beat.atSec == null)) return undefined;
  return beats.map((beat) => beat.atSec ?? 0);
}

export function coachIntroSessionKey(packId: string): string {
  if (packId === SCOTCH_PACK_ID) return SCOTCH_COACH_SESSION_KEY;
  return `opening-lab:coach-intro:${packId}`;
}

export function coachLineSessionKey(packId: string, lineId: string): string {
  if (packId === SCOTCH_PACK_ID && lineId === SCOTCH_CANAL_LINE_ID) {
    return SCOTCH_CANAL_SESSION_KEY;
  }
  return `opening-lab:coach-line:${packId}:${lineId}`;
}

function sessionFlag(key: string): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSessionFlag(key: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* private mode / quota */
  }
}

export function coachIntroAlreadySeen(packId: string): boolean {
  if (packId === SCOTCH_PACK_ID) return scotchCoachAlreadySeen();
  return sessionFlag(coachIntroSessionKey(packId));
}

export function markCoachIntroSeen(packId: string): void {
  if (packId === SCOTCH_PACK_ID) {
    markScotchCoachSeen();
    return;
  }
  markSessionFlag(coachIntroSessionKey(packId));
}

export function coachLineAlreadySeen(packId: string, lineId: string): boolean {
  if (packId === SCOTCH_PACK_ID && lineId === SCOTCH_CANAL_LINE_ID) {
    return scotchCanalCoachAlreadySeen();
  }
  return sessionFlag(coachLineSessionKey(packId, lineId));
}

export function markCoachLineSeen(packId: string, lineId: string): void {
  if (packId === SCOTCH_PACK_ID && lineId === SCOTCH_CANAL_LINE_ID) {
    markScotchCanalCoachSeen();
    return;
  }
  markSessionFlag(coachLineSessionKey(packId, lineId));
}
