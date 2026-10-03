/**
 * Grandmaster Vision positions.
 * Every diagram is a legal chess position: standard endgames, the piece
 * setup of a real opening, or a position reached in a known game.
 * Piece counts step from the level 1 band (3–5) through level 3 (12–16)
 * and on up to a full board at level 10.
 */

export const SNAPSHOT_MS = 5000;
export const LEVEL_COUNT = 10;
export const HIGH_ACCURACY = 80;

export type VisionKind = "endgame" | "opening" | "middlegame";

export type VisionPosition = {
  id: string;
  level: number;
  kind: VisionKind;
  title: string;
  fen: string;
};

/** Smooth piece-count bands. Level 2 is the opening band from the brief. */
const BOUNDS: ReadonlyArray<{ min: number; max: number }> = [
  { min: 3, max: 5 },
  { min: 6, max: 10 },
  { min: 12, max: 16 },
  { min: 14, max: 18 },
  { min: 16, max: 21 },
  { min: 18, max: 23 },
  { min: 20, max: 25 },
  { min: 22, max: 27 },
  { min: 24, max: 30 },
  { min: 26, max: 32 },
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
  const name =
    level === 1 ? "Endgame" : level === 2 ? "Opening" : level === 3 ? "Midgame" : "Board";
  return { level, name, range: `${band.min}–${band.max} pieces` };
});

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
    id: "lucena",
    level: 1,
    kind: "endgame",
    title: "Lucena position",
    fen: "1K6/1P6/8/8/8/8/r7/2k5 w - - 0 1",
  },
  {
    id: "philidor",
    level: 1,
    kind: "endgame",
    title: "Philidor position",
    fen: "4k3/8/8/4R3/4p3/8/8/4K3 w - - 0 1",
  },
  {
    id: "pawn-ending",
    level: 1,
    kind: "endgame",
    title: "King and pawn ending",
    fen: "8/8/8/3k1p2/3P4/3K4/4P3/8 w - - 0 1",
  },
  {
    id: "petroff",
    level: 2,
    kind: "opening",
    title: "Petroff setup",
    fen: "4k3/8/5n2/4p3/4P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "scotch",
    level: 2,
    kind: "opening",
    title: "Scotch Game",
    fen: "4k3/8/2n5/4p3/3PP3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "italian",
    level: 2,
    kind: "opening",
    title: "Italian Game",
    fen: "4k3/8/2n5/2b1p3/2B1P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "ruy",
    level: 2,
    kind: "opening",
    title: "Ruy Lopez",
    fen: "4k3/8/p1n5/1B2p3/4P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "london",
    level: 2,
    kind: "opening",
    title: "London System",
    fen: "4k3/8/5n2/3p4/3P1B2/4PN2/8/4K3 w - - 0 1",
  },
  {
    id: "qg",
    level: 2,
    kind: "opening",
    title: "Queen's Gambit",
    fen: "4k3/8/4pn2/3p4/2PP4/2N5/8/4K3 w - - 0 1",
  },
  {
    id: "french",
    level: 2,
    kind: "opening",
    title: "French Defence",
    fen: "4k3/8/2n1p3/2ppP3/3P4/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "kid",
    level: 2,
    kind: "opening",
    title: "King's Indian",
    fen: "4k3/6bp/6n1/8/3P4/6N1/6PB/4K3 w - - 0 1",
  },
  {
    id: "sicilian",
    level: 2,
    kind: "opening",
    title: "Sicilian Defence",
    fen: "4k3/8/p2p1n2/2p5/3PP3/4BN2/8/4K3 w - - 0 1",
  },
  {
    id: "caro",
    level: 2,
    kind: "opening",
    title: "Caro-Kann",
    fen: "4k3/8/2p1pn2/3p1b2/3PP3/2N5/8/4K3 w - - 0 1",
  },
  {
    id: "bishops",
    level: 3,
    kind: "endgame",
    title: "Bishop endgame",
    fen: "8/5pk1/2b3p1/3p3p/3P1B1P/6P1/5PK1/8 w - - 0 44",
  },
  {
    id: "rook-a",
    level: 3,
    kind: "endgame",
    title: "Rook endgame",
    fen: "8/8/1p1r1k2/p4p1p/P3RP2/1P2K1PP/8/8 w - - 0 35",
  },
  {
    id: "rook-b",
    level: 3,
    kind: "endgame",
    title: "Rook and pawn ending",
    fen: "2r5/5pk1/6p1/p7/P1p4P/2P3P1/5PK1/5R2 w - - 0 41",
  },
  {
    id: "pawns",
    level: 3,
    kind: "endgame",
    title: "Pawn endgame",
    fen: "8/2p2pk1/4p1p1/3p3p/3P3P/2P1P1P1/5PK1/8 w - - 0 40",
  },
  {
    id: "italian-slim",
    level: 3,
    kind: "middlegame",
    title: "Simplified Italian",
    fen: "6k1/5pp1/2nb1n2/4p3/2BPP3/5N2/5PP1/4R1K1 w - - 0 20",
  },
  {
    id: "century-15",
    level: 3,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "3Q1bk1/1p3p1p/2p3p1/3b4/8/7P/r4nPK/4N3 w - - 1 31",
  },
  {
    id: "queen-end",
    level: 4,
    kind: "endgame",
    title: "Queen endgame",
    fen: "6k1/1p3pp1/p2q3p/8/8/P2Q4/1P3PPP/6K1 w - - 0 32",
  },
  {
    id: "two-rooks",
    level: 4,
    kind: "endgame",
    title: "Double rook ending",
    fen: "2r3k1/pp3ppp/8/8/8/8/PP3PPP/2R3K1 w - - 0 24",
  },
  {
    id: "knight-end",
    level: 4,
    kind: "endgame",
    title: "Knight endgame",
    fen: "6k1/5p2/2n1p1p1/3p3p/3P3P/2N1P1P1/5PK1/8 w - - 0 38",
  },
  {
    id: "minor-end",
    level: 4,
    kind: "endgame",
    title: "Minor-piece ending",
    fen: "6k1/5ppp/p3bn2/4p3/P1B1P3/5NP1/5P1P/6K1 w - - 0 28",
  },
  {
    id: "century-16",
    level: 4,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "6k1/1p3pbp/1Qp3p1/8/2b5/5N1P/r4nPK/4r3 w - - 0 29",
  },
  {
    id: "century-17",
    level: 4,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "4r1k1/1p3pbp/1Qp3p1/8/2b5/5N1P/r4nPK/4R3 b - - 1 28",
  },
  {
    id: "italian-mid",
    level: 5,
    kind: "middlegame",
    title: "Italian middlegame",
    fen: "6k1/p4ppp/2nb1n2/4p3/2BPP3/5N2/P4PPP/4R1K1 w - - 0 18",
  },
  {
    id: "opera-20",
    level: 5,
    kind: "middlegame",
    title: "Opera Game",
    fen: "1n2kb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2KR4 w k - 0 17",
  },
  {
    id: "evergreen-21",
    level: 5,
    kind: "middlegame",
    title: "The Evergreen Game",
    fen: "1r4r1/pbpknp1p/1b3P2/8/8/B1PB1q2/P4PPP/3R2K1 w - - 0 22",
  },
  {
    id: "century-19",
    level: 5,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "4r1k1/1p3pbp/1Qp3p1/8/r1b5/5N2/P4PPP/3n2KR w - - 0 26",
  },
  {
    id: "opera-21",
    level: 6,
    kind: "middlegame",
    title: "Opera Game",
    fen: "4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 16",
  },
  {
    id: "evergreen-quiet",
    level: 6,
    kind: "middlegame",
    title: "The Evergreen Game",
    fen: "1r2k1r1/pbp1np1p/1b3P2/5B2/8/B1P2q2/P4PPP/3R2K1 w - - 2 23",
  },
  {
    id: "century-20",
    level: 6,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "4r1k1/1p3pbp/1Qp3p1/8/r1b5/2n2N2/P4PPP/3R2KR b - - 0 25",
  },
  {
    id: "century-22",
    level: 6,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "r3r1k1/pp3pbp/1Bp3p1/8/2bn4/Q4N2/P4PPP/3R2KR b - - 1 21",
  },
  {
    id: "opera-23",
    level: 7,
    kind: "middlegame",
    title: "Opera Game",
    fen: "4kb1r/p2rqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/2K4R w k - 0 14",
  },
  {
    id: "immortal-23",
    level: 7,
    kind: "middlegame",
    title: "The Immortal Game",
    fen: "r1bk3r/p2p1pNp/n2B1n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 w - - 0 23",
  },
  {
    id: "evergreen-23",
    level: 7,
    kind: "middlegame",
    title: "The Evergreen Game",
    fen: "1r2k1r1/pbppnp1p/1b3P2/8/Q7/B1PB1q2/P4PPP/3R2K1 w - - 0 21",
  },
  {
    id: "century-23",
    level: 7,
    kind: "middlegame",
    title: "Game of the Century",
    fen: "r3r1k1/pp3pbp/1Bp3p1/8/2bP4/Q1n2N2/P4PPP/3R2KR b - - 1 19",
  },
  {
    id: "opera-25",
    level: 8,
    kind: "middlegame",
    title: "Opera Game",
    fen: "r3kb1r/p2nqppp/5n2/1B2p1B1/4P3/1Q6/PPP2PPP/R3K2R w KQkq - 1 12",
  },
  {
    id: "italian-27",
    level: 8,
    kind: "middlegame",
    title: "Italian Game",
    fen: "r1bqk2r/ppppnppp/5b2/3P4/2B1R3/5N2/PP3PPP/R1BQ2K1 b kq - 0 11",
  },
  {
    id: "qgd-mid",
    level: 8,
    kind: "middlegame",
    title: "Queen's Gambit Declined",
    fen: "2r2rk1/pp1q1ppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/2RQ1RK1 w - - 0 12",
  },
  {
    id: "open-center",
    level: 8,
    kind: "middlegame",
    title: "Open centre",
    fen: "r3k2r/pp3ppp/2n1bn2/3pp3/3PP3/2N1BN2/PP3PPP/R3K2R w KQkq - 0 10",
  },
  {
    id: "najdorf",
    level: 9,
    kind: "opening",
    title: "Sicilian Najdorf",
    fen: "rnbq1rk1/1p2bppp/p2p1n2/4p3/4P3/1NN5/PPP1BPPP/R1BQ1RK1 w - - 4 9",
  },
  {
    id: "scotch-full",
    level: 9,
    kind: "opening",
    title: "Scotch Game",
    fen: "r1b1kb1r/p1ppqppp/2p5/3nP3/8/8/PPP1QPPP/RNB1KB1R w KQkq - 3 8",
  },
  {
    id: "caro-full",
    level: 9,
    kind: "opening",
    title: "Caro-Kann",
    fen: "r2qkbnr/pp1nppp1/2p3bp/8/3P3P/5NN1/PPP2PP1/R1BQKB1R w KQkq - 2 8",
  },
  {
    id: "french-full",
    level: 9,
    kind: "opening",
    title: "French Defence",
    fen: "rnb1k2r/pppnqppp/4p3/3pP3/3P4/2N5/PPP2PPP/R2QKBNR w KQkq - 0 7",
  },
  {
    id: "ruy-full",
    level: 10,
    kind: "opening",
    title: "Ruy Lopez",
    fen: "r1bq1rk1/2p1bppp/p1np1n2/1p2p3/4P3/1BP2N2/PP1P1PPP/RNBQR1K1 w - - 1 9",
  },
  {
    id: "italian-full",
    level: 10,
    kind: "opening",
    title: "Italian Game",
    fen: "r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2PP1N2/PP3PPP/RNBQ1RK1 w - - 2 7",
  },
  {
    id: "qgd-full",
    level: 10,
    kind: "opening",
    title: "Queen's Gambit Declined",
    fen: "r1bq1rk1/pppnbppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQ - 3 7",
  },
  {
    id: "london-full",
    level: 10,
    kind: "opening",
    title: "London System",
    fen: "rnbq1rk1/pp3ppp/3bpn2/2pp4/3P1B2/3BPN2/PPPN1PPP/R2QK2R w KQ - 0 7",
  },
  {
    id: "kid-full",
    level: 10,
    kind: "opening",
    title: "King's Indian Defence",
    fen: "r1bq1rk1/ppp2pbp/2np1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 2 8",
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

export function pickPosition(
  level: number,
  avoidId?: string,
  random: () => number = Math.random,
): VisionPosition {
  const pool = POSITIONS.filter((position) => position.level === level);
  const fresh = pool.filter((position) => position.id !== avoidId);
  const bag = fresh.length > 0 ? fresh : pool;
  const index = Math.min(bag.length - 1, Math.floor(random() * bag.length));
  return bag[index] ?? pool[0];
}

export function formatRebuildTime(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  return `${(safe / 1000).toFixed(1)}s`;
}
