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
