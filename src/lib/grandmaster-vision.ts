/**
 * Grandmaster Vision positions.
 * Every diagram is a legal chess position: a standard endgame, the piece
 * setup of a real opening, or a position reached in a known game.
 * Each level is three rounds. Piece counts climb by one or two pieces
 * from 3 at level 1 to 15–16 at level 10.
 */

export const LEVEL_COUNT = 10;
export const HIGH_ACCURACY = 80;
export const BASE_POINTS = 1000;
export const SPEED_WINDOW_MS = 12000;
export const SPEED_BONUS_MAX = 500;
export const PERFECT_BONUS = 200;
const PROGRESS_KEY = "gmv-progress-v1";
const ONBOARD_KEY = "gmv-onboarding-v1";

export type VisionKind = "endgame" | "opening" | "middlegame";

export type VisionPosition = {
  id: string;
  level: number;
  kind: VisionKind;
  title: string;
  fen: string;
};

/** Piece-count bands. Each step is one or two pieces above the level before it. */
const BOUNDS: ReadonlyArray<{ min: number; max: number }> = [
  { min: 3, max: 3 },
  { min: 4, max: 4 },
  { min: 5, max: 5 },
  { min: 6, max: 6 },
  { min: 7, max: 7 },
  { min: 8, max: 8 },
  { min: 9, max: 10 },
  { min: 12, max: 13 },
  { min: 14, max: 14 },
  { min: 15, max: 16 },
];

export function pieceBounds(level: number): { min: number; max: number } {
  const index = Math.min(LEVEL_COUNT, Math.max(1, Math.round(level))) - 1;
  return BOUNDS[index] ?? BOUNDS[0];
}

export const LEVEL_INFO: ReadonlyArray<{
  level: number;
  name: string;
  range: string;
}> = BOUNDS.map((band, index) => {
  const level = index + 1;
  const name = level <= 5 ? "Endgame" : level <= 7 ? "Opening" : "Middlegame";
  const range = band.min === band.max ? `${band.min} pieces` : `${band.min}–${band.max} pieces`;
  return { level, name, range };
});

export const ROUNDS_PER_LEVEL = 3;

export const POSITIONS: readonly VisionPosition[] = [
  {
    id: "krk",
    level: 1,
    kind: "endgame",
    title: "King and rook",
    fen: "8/8/8/8/8/4k3/8/R3K3 w - - 0 1",
  },
  {
    id: "kqk",
    level: 1,
    kind: "endgame",
    title: "King and queen",
    fen: "8/8/8/8/3k4/8/3K4/3Q4 w - - 0 1",
  },
  {
    id: "kpk",
    level: 1,
    kind: "endgame",
    title: "King and pawn",
    fen: "8/8/8/3k4/8/3K4/3P4/8 w - - 0 1",
  },
  {
    id: "kpkr",
    level: 2,
    kind: "endgame",
    title: "King and pawn versus rook",
    fen: "1K6/1P6/8/8/8/8/r7/2k5 w - - 0 1",
  },
  {
    id: "philidor-pawn",
    level: 2,
    kind: "endgame",
    title: "Rook versus pawn",
    fen: "4k3/8/8/4R3/4p3/8/8/4K3 w - - 0 1",
  },
  {
    id: "saavedra",
    level: 2,
    kind: "endgame",
    title: "Saavedra position",
    fen: "8/8/1KP5/3r4/8/8/8/k7 w - - 0 1",
  },
  {
    id: "pawn-ending",
    level: 3,
    kind: "endgame",
    title: "King and pawn ending",
    fen: "8/8/8/3k1p2/3P4/3K4/4P3/8 w - - 0 1",
  },
  {
    id: "lucena",
    level: 3,
    kind: "endgame",
    title: "Lucena position",
    fen: "3K4/3P2k1/8/8/8/8/2r5/5R2 w - - 0 1",
  },
  {
    id: "philidor",
    level: 3,
    kind: "endgame",
    title: "Philidor position",
    fen: "4k3/R7/7r/3K4/4P3/8/8/8 w - - 0 1",
  },
  {
    id: "petroff",
    level: 4,
    kind: "opening",
    title: "Petroff setup",
    fen: "4k3/8/5n2/4p3/4P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "four-pawns",
    level: 4,
    kind: "endgame",
    title: "Four-pawn ending",
    fen: "8/8/4k3/4pp2/4PP2/4K3/8/8 w - - 0 1",
  },
  {
    id: "rook-pawns",
    level: 4,
    kind: "endgame",
    title: "Equal rook ending",
    fen: "8/8/4k3/4p3/4P3/4K3/8/r3R3 w - - 0 1",
  },
  {
    id: "scotch",
    level: 5,
    kind: "opening",
    title: "Scotch Game",
    fen: "4k3/8/2n5/4p3/3PP3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "extra-pawn",
    level: 5,
    kind: "endgame",
    title: "Extra pawn ending",
    fen: "8/8/2k2p2/2p1p3/2P1P3/2K5/8/8 w - - 0 1",
  },
  {
    id: "rook-two",
    level: 5,
    kind: "endgame",
    title: "Rook and two pawns",
    fen: "8/8/4k3/4p3/2P1P3/4K3/8/r3R3 w - - 0 1",
  },
  {
    id: "italian",
    level: 6,
    kind: "opening",
    title: "Italian Game",
    fen: "4k3/8/2n5/2b1p3/2B1P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "ruy",
    level: 6,
    kind: "opening",
    title: "Ruy Lopez",
    fen: "4k3/8/p1n5/1B2p3/4P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "london",
    level: 6,
    kind: "opening",
    title: "London System",
    fen: "4k3/8/5n2/3p4/3P1B2/4PN2/8/4K3 w - - 0 1",
  },
  {
    id: "french",
    level: 7,
    kind: "opening",
    title: "French Defence",
    fen: "4k3/8/2n1p3/2ppP3/3P4/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "kid",
    level: 7,
    kind: "opening",
    title: "King's Indian",
    fen: "4k3/6bp/6n1/8/3P4/6N1/6PB/4K3 w - - 0 1",
  },
  {
    id: "sicilian",
    level: 7,
    kind: "opening",
    title: "Sicilian Defence",
    fen: "4k3/8/p2p1n2/2p5/3PP3/4BN2/8/4K3 w - - 0 1",
  },
  {
    id: "bishops",
    level: 8,
    kind: "endgame",
    title: "Bishop endgame",
    fen: "8/5pk1/2b3p1/3p3p/3P1B1P/6P1/5PK1/8 w - - 0 44",
  },
  {
    id: "rook-a",
    level: 8,
    kind: "endgame",
    title: "Rook endgame",
    fen: "8/8/1p1r1k2/p4p1p/P3RP2/1P2K1PP/8/8 w - - 0 35",
  },
  {
    id: "rook-b",
    level: 8,
    kind: "endgame",
    title: "Rook and pawn ending",
    fen: "2r5/5pk1/6p1/p7/P1p4P/2P3P1/5PK1/5R2 w - - 0 41",
  },
  {
    id: "pawns",
    level: 9,
    kind: "endgame",
    title: "Pawn endgame",
    fen: "8/2p2pk1/4p1p1/3p3p/3P3P/2P1P1P1/5PK1/8 w - - 0 40",
  },
  {
    id: "queen-end",
    level: 9,
    kind: "endgame",
    title: "Queen endgame",
    fen: "6k1/1p3pp1/p2q3p/8/8/P2Q4/1P3PPP/6K1 w - - 0 32",
  },
  {
    id: "two-rooks",
    level: 9,
    kind: "endgame",
    title: "Double rook ending",
    fen: "2r3k1/pp3ppp/8/8/8/8/PP3PPP/2R3K1 w - - 0 24",
  },
  {
    id: "italian-slim",
    level: 10,
    kind: "middlegame",
    title: "Simplified Italian",
    fen: "6k1/5pp1/2nb1n2/4p3/2BPP3/5N2/5PP1/4R1K1 w - - 0 20",
  },
  {
    id: "century-15",
    level: 10,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "3Q1bk1/1p3p1p/2p3p1/3b4/8/7P/r4nPK/4N3 w - - 1 31",
  },
  {
    id: "minor-end",
    level: 10,
    kind: "endgame",
    title: "Minor-piece ending",
    fen: "6k1/5ppp/p3bn2/4p3/P1B1P3/5NP1/5P1P/6K1 w - - 0 28",
  },
];

const FILES = "abcdefgh";

export function pieceCount(fen: string): number {
  return fen.split(" ")[0]?.replace(/[^pnbrqkPNBRQK]/g, "").length ?? 0;
}

/** Square → piece letter. Uppercase is white, lowercase is black. */
export function piecesFromFen(fen: string): Record<string, string> {
  const rows = (fen.split(" ")[0] ?? "").split("/");
  const out: Record<string, string> = {};
  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const ch of rows[rank] ?? "") {
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);
        continue;
      }
      if (file > 7) break;
      out[`${FILES[file]}${8 - rank}`] = ch;
      file += 1;
    }
  }
  return out;
}

export type SquareMark = "ok" | "miss" | "wrong";

export type AttemptScore = {
  correct: number;
  total: number;
  accuracy: number;
  marks: Record<string, SquareMark>;
};

/**
 * Accuracy is the share of the original pieces put back on the right
 * square in the right colour. A different piece, a miss, or an extra
 * piece is not counted as correct.
 */
export function scoreAttempt(
  original: Record<string, string>,
  attempt: Record<string, string>,
): AttemptScore {
  const marks: Record<string, SquareMark> = {};
  let correct = 0;
  const squares = new Set([...Object.keys(original), ...Object.keys(attempt)]);
  for (const sq of squares) {
    const want = original[sq];
    const got = attempt[sq];
    if (want && got === want) {
      correct += 1;
      marks[sq] = "ok";
    } else if (want) {
      marks[sq] = got ? "wrong" : "miss";
    } else if (got) {
      marks[sq] = "wrong";
    }
  }
  const total = Object.keys(original).length;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, accuracy, marks };
}

export function positionsForLevel(level: number): VisionPosition[] {
  return POSITIONS.filter((position) => position.level === level);
}

export function pickPosition(
  level: number,
  avoidId?: string,
  random: () => number = Math.random,
): VisionPosition {
  const pool = positionsForLevel(level);
  const fresh = pool.filter((position) => position.id !== avoidId);
  const bag = fresh.length > 0 ? fresh : pool;
  const index = Math.min(bag.length - 1, Math.floor(random() * bag.length));
  return bag[index] ?? pool[0];
}

export function formatRebuildTime(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  return `${(safe / 1000).toFixed(1)}s`;
}

export function formatStudyTime(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  return `${(safe / 1000).toFixed(1)}s`;
}

export function starsForAccuracy(accuracy: number): 0 | 1 | 2 | 3 {
  const safe = Math.max(0, Math.min(100, Math.round(accuracy)));
  if (safe >= 100) return 3;
  if (safe >= 85) return 2;
  if (safe >= 60) return 1;
  return 0;
}

export type RoundScore = {
  accuracy: number;
  studyMs: number;
  base: number;
  speed: number;
  perfect: number;
  total: number;
  stars: 0 | 1 | 2 | 3;
};

/** Score = (base × accuracy) + speed bonus + 200 when accuracy is perfect. */
export function scoreRound(accuracy: number, studyMs: number): RoundScore {
  const safeAcc = Math.max(0, Math.min(100, Math.round(accuracy)));
  const fraction = safeAcc / 100;
  const base = Math.round(BASE_POINTS * fraction);
  const studySec = Math.max(0, Number.isFinite(studyMs) ? studyMs : 0) / 1000;
  const windowSec = SPEED_WINDOW_MS / 1000;
  const speedFactor = Math.max(0, (windowSec - studySec) / windowSec);
  const speed = Math.round(fraction * speedFactor * SPEED_BONUS_MAX);
  const perfect = safeAcc === 100 ? PERFECT_BONUS : 0;
  const stars = starsForAccuracy(safeAcc);
  return {
    accuracy: safeAcc,
    studyMs: Math.max(0, Number.isFinite(studyMs) ? studyMs : 0),
    base,
    speed,
    perfect,
    total: base + speed + perfect,
    stars,
  };
}

export type LevelRound = {
  correct: number;
  total: number;
  score: RoundScore;
};

/**
 * A level is the rounds played together. Stars use the same accuracy
 * thresholds as a single round, on the share of pieces placed correctly
 * across every round. The score is those rounds added up.
 */
export function scoreLevel(rounds: readonly LevelRound[]): RoundScore {
  const correct = rounds.reduce((sum, round) => sum + round.correct, 0);
  const total = rounds.reduce((sum, round) => sum + round.total, 0);
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
  const base = rounds.reduce((sum, round) => sum + round.score.base, 0);
  const speed = rounds.reduce((sum, round) => sum + round.score.speed, 0);
  const perfect = rounds.reduce((sum, round) => sum + round.score.perfect, 0);
  const studyMs = rounds.reduce((sum, round) => sum + round.score.studyMs, 0);
  return {
    accuracy,
    studyMs,
    base,
    speed,
    perfect,
    total: base + speed + perfect,
    stars: starsForAccuracy(accuracy),
  };
}

export type LevelProgress = { stars: number; best: number };

export type VisionProgress = { levels: Record<string, LevelProgress> };

export function emptyProgress(): VisionProgress {
  return { levels: {} };
}

export function loadProgress(): VisionProgress {
  if (typeof window === "undefined") return emptyProgress();
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as VisionProgress;
    if (!parsed || typeof parsed !== "object" || !parsed.levels || typeof parsed.levels !== "object") {
      return emptyProgress();
    }
    return { levels: parsed.levels };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress: VisionProgress): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function isLevelUnlocked(progress: VisionProgress, level: number): boolean {
  if (level <= 1) return true;
  const prev = progress.levels[String(level - 1)];
  return (prev?.stars ?? 0) >= 1;
}

export function recordResult(
  progress: VisionProgress,
  level: number,
  stars: number,
  total: number,
): VisionProgress {
  const key = String(level);
  const prev = progress.levels[key];
  return {
    levels: {
      ...progress.levels,
      [key]: {
        stars: Math.max(prev?.stars ?? 0, stars),
        best: Math.max(prev?.best ?? 0, total),
      },
    },
  };
}

export function onboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARD_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissOnboarding(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARD_KEY, "1");
}

export function progressTotals(progress: VisionProgress): { score: number; stars: number } {
  let score = 0;
  let stars = 0;
  for (const row of Object.values(progress.levels)) {
    score += row?.best || 0;
    stars += row?.stars || 0;
  }
  return { score, stars };
}
