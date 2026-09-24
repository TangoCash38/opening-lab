/**
 * Per-pack Professor Potato Pie coach.
 *
 * Practice opens `introBeats`. The first book line (`firstLineId`, never the
 * line title) opens `firstLineBeats`. Optional `introAudio` / `firstLineAudio`
 * are mp3 paths. With no audio, captions advance on Next and a short timer,
 * and each first-line beat plays its `ply` on the board. An audio file uses
 * `atSec` for captions and `plyAtSec` for the moment each move is spoken.
 *
 * Scotch keeps the cuppa clip and the sg1 Canal clip, including the session
 * keys those talks already use. Other packs get their own session keys.
 * Test never mounts a talk: only the Practice button and a learn-mode line
 * open pass these gates.
 *
 * Finishing the pack intro (the last Practice button, or the clip) opens the
 * first-line talk before book Practice, on the line that Practice started.
 * Skip dismisses only the talk on screen. The gym intro pages do not set
 * these session keys.
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
  scotchCanalCoachApplies,
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
  /**
   * Further SANs spoken during this same caption, after `ply`, in order.
   * Each lands when its `plyAtSec` is reached. A one-move beat leaves this out.
   */
  extraPlies?: readonly { ply: string; plyAtSec: number }[];
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
/** AI-generated intro. Beat times below were read off this clip. */
export const OPENING_TRAPS_INTRO_SEC = 46.4;
/** AI-generated Legal's Mate narration. Beat times were read off this clip. */
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

const CARO_KANN_BLACK_PACK_ID = "caro-kann-black";

export const CARO_KANN_INTRO_MP3 = "/coach/caro-kann-black/professor-potato-pie-caro-intro.mp3";
export const CARO_KANN_LINE_MP3 = "/coach/caro-kann-black/professor-potato-pie-caro-line1.mp3";
/** Professor Potato Pie's Caro intro. Beat times below were read off this clip. */
export const CARO_KANN_INTRO_SEC = 112.8;
/** Professor Potato Pie's Line 1 talk. Beat and spoken-move times were read off this clip. */
export const CARO_KANN_LINE_SEC = 135;

const CARO_KANN_INTRO = [
  "Ah, hello again. Professor Potato Pie, tea in hand. And today, we turn our attention to the Caro-Kann Defence, a splendidly resilient opening with excellent manners and a surprisingly sharp pair of elbows.",
  "It begins with e4 c6, and takes its name from Horatio Caro and Marcus Kann, two nineteenth-century players whose analytical work gave this venerable defence its identity.",
  "The strategic premise is admirably economical. Black prepares d5, challenging White's centre at once, while keeping the light-squared bishop free rather than incarcerating it behind the pawn chain.",
  "The Caro-Kann is solid, patient and structurally sound, but do not mistake composure for passivity. Beneath its respectable exterior lies a fine collection of counterpunches, particularly when White becomes overambitious.",
  "You'll study ten carefully chosen lines. The first five cover principal book play against White's most important approaches, giving you a dependable repertoire and a sound position.",
  "The final five examine plausible inaccuracies from White, showing precisely how Black can identify the defect, respond with purpose and secure a clear advantage.",
  "In Practice, I'll provide hints wherever you need them. In Test, the assistance disappears, and it is simply you, the position and your judgement.",
  "Each line concludes where the prepared book line ends. There is no continuation against the computer afterwards.",
  "The object is not to play aimlessly on, but to absorb the moves, comprehend the ideas and recognise the patterns when you return over the board.",
  "Right then. Tea settled, pieces ready. Let's begin.",
] as const;

const CARO_KANN_INTRO_AT_SEC = [0, 17.4, 31.9, 45.9, 62.3, 74.3, 85, 94, 100.4, 109] as const;

const CARO_KANN_LINE: readonly CoachLineBeat[] = [
  {
    caption:
      "Right then, welcome to Line 1, the Advance Variation. White claims the centre with e4.",
    ply: "e4",
    atSec: 0,
    plyAtSec: 7.1,
  },
  {
    caption: "We answer c6, preparing the thematic d5 advance.",
    ply: "c6",
    atSec: 8.1,
    plyAtSec: 8.7,
  },
  {
    caption:
      "White establishes a broad centre with d4, and we challenge it immediately with d5.",
    ply: "d4",
    atSec: 13.3,
    plyAtSec: 15.9,
    extraPlies: [{ ply: "d5", plyAtSec: 18.8 }],
  },
  {
    caption: "White pushes on to e5, gaining space.",
    ply: "e5",
    atSec: 20.2,
    plyAtSec: 21.4,
  },
  {
    caption:
      "Before closing the pawn chain with e6, our bishop escapes to f5. That, in essence, is the Caro-Kann's first piece of good housekeeping. The bishop gets out before the door closes.",
    ply: "Bf5",
    atSec: 24,
    plyAtSec: 28.1,
  },
  {
    caption:
      "Knight f3 follows, then e6. With the bishop safely developed, e6 is now entirely comfortable.",
    ply: "Nf3",
    atSec: 37,
    plyAtSec: 37.2,
    extraPlies: [{ ply: "e6", plyAtSec: 38.9 }],
  },
  {
    caption:
      "White chooses the quiet and sensible bishop e2 set-up, a system popularised by the English grandmaster Nigel Short.",
    ply: "Be2",
    atSec: 44.7,
    plyAtSec: 47.4,
  },
  {
    caption: "We strike with c5, attacking the base of White's pawn chain on d4.",
    ply: "c5",
    atSec: 53.3,
    plyAtSec: 54.1,
  },
  {
    caption: "White castles, and knight c6 adds another piece to the pressure.",
    ply: "O-O",
    atSec: 58.9,
    plyAtSec: 59.3,
    extraPlies: [{ ply: "Nc6", plyAtSec: 61 }],
  },
  {
    caption: "White reinforces d4 with c3.",
    ply: "c3",
    atSec: 64.4,
    plyAtSec: 66.5,
  },
  {
    caption:
      "We exchange pawns on d4, opening the c-file and giving our counterplay a useful avenue.",
    ply: "cxd4",
    atSec: 67.7,
    plyAtSec: 69.2,
    extraPlies: [{ ply: "cxd4", plyAtSec: 70.4 }],
  },
  {
    caption:
      "The remaining knight develops to e7, bound for f5, where it can question d4 once again.",
    ply: "Nge7",
    atSec: 74.7,
    plyAtSec: 76.5,
  },
  {
    caption: "White plays knight c3, and our bishop applies the pin from g4.",
    ply: "Nc3",
    atSec: 82.3,
    plyAtSec: 83.1,
    extraPlies: [{ ply: "Bg4", plyAtSec: 86.2 }],
  },
  {
    caption: "White answers with knight e1, breaking the pin.",
    ply: "Ne1",
    atSec: 87.8,
    plyAtSec: 89.2,
  },
  {
    caption:
      "We therefore exchange White's useful bishop on e2. Recapturing with the knight keeps d4 securely defended.",
    ply: "Bxe2",
    atSec: 91.7,
    plyAtSec: 94.4,
    extraPlies: [{ ply: "Nxe2", plyAtSec: 96.7 }],
  },
  {
    caption: "Our knight settles on f5, still eyeing d4.",
    ply: "Nf5",
    atSec: 100.3,
    plyAtSec: 101.5,
  },
  {
    caption:
      "White protects it with bishop e3, and we calmly develop the bishop to e7, ready to castle.",
    ply: "Be3",
    atSec: 104.4,
    plyAtSec: 105.8,
    extraPlies: [{ ply: "Be7", plyAtSec: 108.8 }],
  },
  {
    caption:
      "The result is an equal position with a coherent plan. Maintain the pressure on d4 and make purposeful use of the c-file.",
    atSec: 111.7,
  },
  {
    caption:
      "No fireworks required, just sound structure, patient pressure and every piece gainfully employed.",
    atSec: 120.7,
  },
  {
    caption: "Over to you. Drill the line until the moves feel less like memory and more like good sense.",
    atSec: 128.7,
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
  [CARO_KANN_BLACK_PACK_ID]: {
    introTitle: "Caro-Kann for Black",
    introBeats: CARO_KANN_INTRO,
    introAudio: CARO_KANN_INTRO_MP3,
    introAudioFallbackSec: CARO_KANN_INTRO_SEC,
    introBeatAtSec: CARO_KANN_INTRO_AT_SEC,
    firstLineId: "ckb1",
    firstLineTitle: "Line 1",
    firstLineBeats: CARO_KANN_LINE,
    firstLineAudio: CARO_KANN_LINE_MP3,
    firstLineAudioFallbackSec: CARO_KANN_LINE_SEC,
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

/**
 * Talk to open when the pack intro finishes.
 * `null` for Skip, a line that is not the coached first line, or a talk
 * already played this visit. Scotch sg1 is the canal talk; other packs use
 * `firstLineId`.
 */
export function coachTalkAfterPackIntro(input: {
  packId: string;
  lineId: string;
  lineIndex: number;
  skipped: boolean;
  lineAlreadySeen: boolean;
}): "canal" | "line" | null {
  if (input.skipped || input.lineAlreadySeen) return null;
  if (
    scotchCanalCoachApplies({
      packId: input.packId,
      lineId: input.lineId,
      lineIndex: input.lineIndex,
      practiceEntry: false,
    })
  ) {
    return "canal";
  }
  if (coachPackLineApplies({ packId: input.packId, lineId: input.lineId })) return "line";
  return null;
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

/** Caption-aligned SANs. A beat with extra moves contributes each SAN, in order. */
function lineBeatScript(beats: readonly CoachLineBeat[]): (string | undefined)[] {
  const out: (string | undefined)[] = [];
  for (const beat of beats) {
    const extras = beat.extraPlies ?? [];
    if (!beat.ply && extras.length === 0) {
      out.push(undefined);
      continue;
    }
    if (beat.ply) out.push(beat.ply);
    for (const extra of extras) out.push(extra.ply);
  }
  return out;
}

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
  const plies = talk === "intro" ? pack.introBeats.map(() => undefined) : lineBeatScript(pack.firstLineBeats);
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
  const times: number[] = [];
  for (const beat of pack.firstLineBeats) {
    const moves: { ply?: string; plyAtSec?: number }[] = [];
    if (beat.ply) moves.push({ ply: beat.ply, plyAtSec: beat.plyAtSec });
    for (const extra of beat.extraPlies ?? []) moves.push(extra);
    for (const move of moves) {
      if (!move.ply) continue;
      if (move.plyAtSec == null) return null;
      times.push(move.plyAtSec);
    }
  }
  if (times.length === 0) return null;
  return times;
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
