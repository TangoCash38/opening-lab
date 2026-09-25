import { Chess } from "chess.js";

export type LessonCue = {
  t: number;
  san?: string;
  fromPly?: number;
  note?: string;
};

export type LessonMeta = {
  id: string;
  title: string;
  free: boolean;
  blurb: string;
};

/** Non-empty lines from the caption script. One line is one caption. */
export function parseCaptionScript(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Caption index from the narration clock. Even slices of `durationSec`.
 * The last line holds through the end of the clip.
 */
export function captionIndexAt(timeSec: number, durationSec: number, count: number): number {
  if (count <= 1) return 0;
  if (!(durationSec > 0) || !(timeSec > 0)) return 0;
  if (timeSec >= durationSec) return count - 1;
  const index = Math.floor((timeSec / durationSec) * count);
  if (index < 0) return 0;
  if (index >= count) return count - 1;
  return index;
}

/**
 * SAN list on the board at `timeSec`.
 * Moves without `fromPly` extend the main stem while the line is still that stem.
 * A cue with `fromPly` snaps back to that many stem plies, then plays `san`
 * (the illustrative branch after Bc4).
 */
export function lessonSansAt(cues: readonly LessonCue[], timeSec: number): string[] {
  const stem: string[] = [];
  let line: string[] = [];
  for (const cue of cues) {
    if (cue.t > timeSec + 1e-9) break;
    const branched = line.length !== stem.length;
    if (cue.san && cue.fromPly == null && !branched) {
      stem.push(cue.san);
      line = [...line, cue.san];
      continue;
    }
    if (typeof cue.fromPly === "number") {
      const ply = Math.max(0, Math.min(stem.length, Math.floor(cue.fromPly)));
      line = stem.slice(0, ply);
    }
    if (cue.san) line = [...line, cue.san];
  }
  return line;
}

/** Legal position for the cues at `timeSec`, or null if a SAN is illegal. */
export function lessonFenAt(cues: readonly LessonCue[], timeSec: number): string | null {
  const chess = new Chess();
  for (const san of lessonSansAt(cues, timeSec)) {
    try {
      if (!chess.move(san)) return null;
    } catch {
      return null;
    }
  }
  return chess.fen();
}

/**
 * Free lessons stay open. Paid lessons need the lesson product id
 * (lesson-scotch), not the drill pack id and not a subscription.
 */
export function isLessonUnlocked(
  lesson: Pick<LessonMeta, "free">,
  ownedProductIds: readonly string[],
  productId: string,
): boolean {
  if (lesson.free) return true;
  return ownedProductIds.includes(productId);
}

export type LessonScreen = "player" | "stub" | "locked";

/** Lesson 1 is the only player. Later lessons are stubs once purchased. */
export function lessonScreen(lessonId: string, unlocked: boolean): LessonScreen {
  if (!unlocked) return "locked";
  if (lessonId === "sgl1") return "player";
  return "stub";
}
