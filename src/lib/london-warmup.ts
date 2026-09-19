import type { OpeningLine, Pack } from "@/data/packs";
import { isPackVisible } from "@/lib/catalog";
import type { LineProgress } from "@/lib/progress";

/** Fight the London (Anti-London flagship). Catalog id, not vs-london / london. */
export const LONDON_PACK_ID = "london-black";

/** Warm-up trains exactly this many book plies from the start (or resume) ply. */
export const LONDON_WARMUP_PLIES = 3;

export type TrainStartOptions = {
  plyLimit?: number;
  startPly?: number;
};

export type LondonWarmupProgress = Pick<
  LineProgress,
  "cleanPractice" | "testBestPly" | "lastTrainedAt" | "learned"
>;

export type LondonWarmupPick = {
  line: OpeningLine;
  startPly: number;
  plyLimit: number;
};

export function warmupEndPly(
  startPly: number,
  bookLen: number,
  plyLimit = LONDON_WARMUP_PLIES,
): number {
  const start = Math.max(0, Math.min(Math.floor(startPly) || 0, bookLen));
  const limit = Math.max(0, Math.floor(plyLimit) || 0);
  return Math.min(bookLen, start + limit);
}

/**
 * Pick a Fight the London line for the 3-ply warm-up.
 * Uses existing pack lines only. Resume is cheap: last unfinished line
 * with testBestPly / lastTrainedAt; otherwise the first catalog line.
 */
export function pickLondonWarmup(
  pack: Pack | undefined,
  progressOf: (lineId: string) => LondonWarmupProgress,
): LondonWarmupPick | null {
  if (!pack || pack.id !== LONDON_PACK_ID || !isPackVisible(pack)) return null;
  const lines = pack.lines;
  if (!lines.length) return null;

  const unfinished = lines.filter((line) => !progressOf(line.id).cleanPractice);
  const pool = unfinished.length > 0 ? unfinished : lines;

  const withResume = pool
    .map((line) => ({ line, p: progressOf(line.id) }))
    .filter(({ line, p }) => {
      if (p.cleanPractice) return false;
      const mid =
        p.testBestPly > 0 && p.testBestPly < line.plies.length;
      return mid || Boolean(p.lastTrainedAt) || p.learned;
    })
    .sort((a, b) => {
      const ta = a.p.lastTrainedAt ? Date.parse(a.p.lastTrainedAt) : 0;
      const tb = b.p.lastTrainedAt ? Date.parse(b.p.lastTrainedAt) : 0;
      if (tb !== ta) return tb - ta;
      return b.p.testBestPly - a.p.testBestPly;
    });

  const picked = withResume[0]?.line ?? pool[0] ?? lines[0]!;
  const progress = progressOf(picked.id);
  const startPly =
    !progress.cleanPractice &&
    progress.testBestPly > 0 &&
    progress.testBestPly < picked.plies.length
      ? progress.testBestPly
      : 0;

  return {
    line: picked,
    startPly,
    plyLimit: LONDON_WARMUP_PLIES,
  };
}
