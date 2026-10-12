import raw from "@/data/scotch-coach-notes.json";

export type ScotchCoachLine = {
  intro: string;
  notes: readonly string[];
};

const NOTES = raw as Record<string, ScotchCoachLine>;

export function scotchCoachIntro(lineId: string): string | null {
  const intro = NOTES[lineId]?.intro?.trim();
  return intro || null;
}

/** Ply is 1-based. Ply 0, before any move, has no note. */
export function scotchCoachNote(lineId: string, ply: number): string | null {
  if (!Number.isInteger(ply) || ply < 1) return null;
  const note = NOTES[lineId]?.notes[ply - 1]?.trim();
  return note || null;
}
