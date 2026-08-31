/** Shared GAME pitch — first card of the pack intro. Not opening-specific. */
export const GAME_INTRO_TITLE = "Opening Lab";

export const GAME_INTRO =
  "Opening Lab is a strict book-move trainer. Practice with the yellow hint. Test with none. Only the book move counts. Then Play on from the setup if you want.";

const GYM_SNIPPETS = [
  "Practice the main book moves with the yellow hint",
  "Then Test with none",
  "Play on from the setup",
];

/** Extra opening ideas from the guide Block when it is richer than `about`. */
export const PACK_OPENING_EXTRA: Readonly<Record<string, string>> = {
  "caro-kann-black":
    "Free sample: Advance, Classical, Exchange. Other Caro lines are in the full pack.",
};

function isGymCopy(text: string): boolean {
  return GYM_SNIPPETS.some((s) => text.includes(s));
}

/** Opening-card paragraphs: first non-gym `about` para, plus richer guide extras. */
export function openingParagraphs(about: string, packId?: string): string[] {
  const paras = about
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !isGymCopy(p));
  const extra = packId ? PACK_OPENING_EXTRA[packId] : undefined;
  if (extra && !paras.some((p) => p.includes(extra.slice(0, 24)))) {
    paras.push(extra);
  }
  return paras;
}

const seen = new Set<string>();

export function hasSeenPackIntro(packId: string): boolean {
  return seen.has(packId);
}

export function markPackIntroSeen(packId: string): void {
  seen.add(packId);
}
