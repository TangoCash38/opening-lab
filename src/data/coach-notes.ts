import raw from "@/data/coach-notes.json";
import { scotchCoachIntro, scotchCoachNote } from "@/data/scotch-coach-notes";

type LineNotes = { intro: string; notes: readonly string[] };

const NOTES = raw as Record<string, Record<string, LineNotes>>;

export function coachLineIntro(packId: string, lineId: string): string | null {
  if (packId === "scotch") return scotchCoachIntro(lineId);
  const intro = NOTES[packId]?.[lineId]?.intro?.trim();
  return intro || null;
}

/** Ply is 1-based. Ply 0, before any move, has no note. */
export function coachLineNote(packId: string, lineId: string, ply: number): string | null {
  if (packId === "scotch") return scotchCoachNote(lineId, ply);
  if (!Number.isInteger(ply) || ply < 1) return null;
  const note = NOTES[packId]?.[lineId]?.notes[ply - 1]?.trim();
  return note || null;
}
