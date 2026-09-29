import { PACKS, type OpeningLine, type Pack } from "@/data/packs";

/** Book name, straight or curly apostrophe. Does not invent a line. */
const LEGAL_MATE_NAME = /legal['’]s mate/i;

/**
 * Opening Traps practice line for the homepage free try.
 * Prefer ot1 when that id is Legal’s Mate. Otherwise the named line in the pack.
 */
export function legalMateLine(): { pack: Pack; line: OpeningLine } | null {
  const pack = PACKS.find((item) => item.id === "opening-traps");
  if (!pack) return null;
  const ot1 = pack.lines.find((line) => line.id === "ot1");
  if (ot1 && LEGAL_MATE_NAME.test(ot1.name)) return { pack, line: ot1 };
  const named = pack.lines.find((line) => LEGAL_MATE_NAME.test(line.name));
  return named ? { pack, line: named } : null;
}
