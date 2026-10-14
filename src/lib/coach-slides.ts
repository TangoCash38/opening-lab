export type CoachSlide =
  | { kind: "intro" }
  | { kind: "pair"; index: number; whitePly: number; blackPly: number | null }
  | { kind: "end" };

/** Intro, then one slide per reached move pair, then the question slide when the line is finished. */
export function coachSlides(ply: number, finished: boolean): CoachSlide[] {
  const slides: CoachSlide[] = [{ kind: "intro" }];
  const pairs = ply >= 1 ? Math.ceil(ply / 2) : 0;
  for (let index = 1; index <= pairs; index += 1) {
    const whitePly = index * 2 - 1;
    const blackPly = whitePly + 1 <= ply ? whitePly + 1 : null;
    slides.push({ kind: "pair", index, whitePly, blackPly });
  }
  if (finished) slides.push({ kind: "end" });
  return slides;
}

/** Short beat before the reply that completes the pair on the same slide. */
export const OPPONENT_REPLY_MS = 420;

/**
 * After both moves of a pair are on the board, wait before the next pair.
 * Long enough to read the two notes. The next auto move must not start sooner.
 */
export const PAIR_READ_MS = 4500;

/**
 * Delay before an automatic opponent move.
 * An even ply means a full pair is already on the board, so the next move
 * starts another pair and has to wait. An odd ply is the reply on this slide.
 * The count is the same whichever colour is being trained: White's move is
 * the odd ply and Black's reply is the even ply.
 */
export function opponentAutoDelay(plyIndex: number): number {
  if (plyIndex > 0 && plyIndex % 2 === 0) return PAIR_READ_MS;
  return OPPONENT_REPLY_MS;
}

/** "1. e4 e5" for a pair, or "1. e4" before Black has replied. */
export function coachPairHeading(
  plies: readonly string[],
  index: number,
  blackPly: number | null,
): string {
  const white = plies[index * 2 - 2] ?? "";
  if (blackPly == null) return `${index}. ${white}`;
  return `${index}. ${white} ${plies[blackPly - 1] ?? ""}`;
}
