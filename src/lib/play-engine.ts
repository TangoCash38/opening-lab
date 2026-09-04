/**
 * Single-thread lite in-browser engine for Play on.
 *
 * Loaded only via dynamic import() after the trainer is already done.
 * Pure JS — no SharedArrayBuffer, no pthread / WASM Stockfish, so it can
 * run in the Play app System WebView (OpeningLabPlay/1.0, min Android 7).
 */
import { Chess, type Move } from "chess.js";

export type EngineMove = {
  from: string;
  to: string;
  promotion?: "q" | "r" | "b" | "n";
};

export type PlayLevel = "beginner" | "intermediate" | "advanced";

export const PLAY_STRENGTH: Record<
  PlayLevel,
  { thinkMs: number; depth: number; randomize: boolean; slack: number }
> = {
  // Slack ~100 keeps L1 weaker than L2/L3 among *sensible* near-best moves.
  beginner: { thinkMs: 400, depth: 2, randomize: true, slack: 100 },
  intermediate: { thinkMs: 800, depth: 3, randomize: true, slack: 40 },
  advanced: { thinkMs: 1400, depth: 5, randomize: false, slack: 0 },
};

/** Deeper same-engine search for Play-on Hint (user side only; does not move). */
export const HINT_STRENGTH = {
  thinkMs: 2500,
  depth: 6,
  randomize: false,
  slack: 0,
} as const;

export type PlayEngine = {
  pickMove: (
    fen: string,
    thinkMs: number,
    level?: PlayLevel,
  ) => Promise<EngineMove | null>;
  dispose: () => void;
};

const VAL: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20_000,
};

/** A piece (N/B/R/Q), not a pawn. Weakness is shallow search, not hanging pieces. */
const HANG_CP = 250;

/* a1=0 … h8=63. Black uses sq ^ 56. */
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0,
    -10, -5, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10,
    20, 30, 30, 20, 10, 10, 50, 50, 50, 50, 50, 50, 50, 50, 0, 0, 0, 0, 0, 0, 0,
    0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 5, 5, 0, -20, -40, -30,
    5, 10, 15, 15, 10, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 15, 20,
    20, 15, 5, -30, -30, 0, 10, 15, 15, 10, 0, -30, -40, -20, 0, 0, 0, 0, -20,
    -40, -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 5, 0, 0, 0, 0, 5, -10, -10, 10,
    10, 10, 10, 10, 10, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 5, 5, 10, 10,
    5, 5, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20,
    -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 5, 5, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 5, 0, 0, 0, 0, -10, -10, 5, 5,
    5, 5, 5, 0, -10, 0, 0, 5, 5, 5, 5, 0, -5, -5, 0, 5, 5, 5, 5, 0, -5, -10, 0,
    5, 5, 5, 5, 0, -10, -10, 0, 0, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10,
    -10, -20,
  ],
  k: [
    20, 30, 10, 0, 0, 10, 30, 20, 20, 20, 0, 0, 0, 0, 20, 20, -10, -20, -20, -20,
    -20, -20, -20, -10, -20, -30, -30, -40, -40, -30, -30, -20, -30, -40, -40,
    -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40,
    -40, -50, -50, -40, -40, -30, -50, -40, -40, -50, -50, -40, -40, -50,
  ],
};

function evaluate(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  for (let r = 0; r < 8; r++) {
    const row = board[r]!;
    for (let c = 0; c < 8; c++) {
      const p = row[c];
      if (!p) continue;
      const sq = p.color === "w" ? (7 - r) * 8 + c : r * 8 + c;
      const s = (VAL[p.type] ?? 0) + (PST[p.type]?.[sq] ?? 0);
      score += p.color === "w" ? s : -s;
    }
  }
  return chess.turn() === "w" ? score : -score;
}

function orderMoves(moves: Move[]): Move[] {
  return moves
    .map((m) => {
      let s = 0;
      if (m.captured) s += 10 * (VAL[m.captured] ?? 0) - (VAL[m.piece] ?? 0);
      if (m.promotion) s += VAL[m.promotion] ?? 0;
      if (m.flags?.includes("k") || m.flags?.includes("q")) s += 40;
      return { m, s };
    })
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
}

function toEngineMove(m: Move): EngineMove {
  const promo = m.promotion;
  if (promo === "q" || promo === "r" || promo === "b" || promo === "n") {
    return { from: m.from, to: m.to, promotion: promo };
  }
  return { from: m.from, to: m.to };
}

function resolveLevel(level?: PlayLevel): PlayLevel {
  if (level === "beginner" || level === "advanced" || level === "intermediate") {
    return level;
  }
  return "beginner";
}

function thinkBudget(thinkMs: number, level: PlayLevel): number {
  const fallback = PLAY_STRENGTH[level].thinkMs;
  const raw = Number.isFinite(thinkMs) && thinkMs > 0 ? thinkMs : fallback;
  if (level === "beginner") return Math.min(550, Math.max(280, raw));
  if (level === "advanced") return Math.min(1800, Math.max(900, raw));
  return Math.min(1100, Math.max(550, raw));
}

/** Always a legal capture, else the first legal move. Never throws. */
function legalFallback(fen: string): EngineMove | null {
  try {
    const g = new Chess(fen);
    const moves = g.moves({ verbose: true });
    if (moves.length === 0) return null;
    const capture = moves.find((m) => m.captured);
    return toEngineMove(capture ?? moves[0]!);
  } catch {
    return null;
  }
}

/** Capture-only qsearch with no clock — used to see if a recapture wins a piece. */
function captureQsearch(
  chess: Chess,
  alpha: number,
  beta: number,
  qply: number,
): number {
  const stand = evaluate(chess);
  if (qply <= 0) return stand;
  if (chess.isCheckmate()) return -20_000;
  if (chess.isDraw()) return 0;
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  const caps = orderMoves(
    chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion),
  );
  for (const m of caps) {
    chess.move(m);
    const score = -captureQsearch(chess, -beta, -alpha, qply - 1);
    chess.undo();
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

/**
 * True when opponent can recapture (or keep capturing) and we are down a
 * piece or more, with no compensation visible in capture qsearch.
 */
function hangsPiece(chess: Chess, move: Move): boolean {
  chess.move(move);
  try {
    if (chess.isCheckmate()) return false;
    const our = -captureQsearch(chess, -50_000, 50_000, 6);
    return our <= -HANG_CP;
  } finally {
    chess.undo();
  }
}

/**
 * Quiet N/B/R/Q shuffle onto our back two ranks — no capture, no check.
 * Typical waste: knight retreats home (…Nc6-b8) when better options exist.
 * Kept when every non-hanging alternative is also wasteful (escape-only).
 */
export function isWastefulUndeveloping(chess: Chess, move: Move): boolean {
  const piece = move.piece;
  if (piece !== "n" && piece !== "b" && piece !== "r" && piece !== "q") {
    return false;
  }
  if (move.captured || move.promotion) return false;

  const toRank = Number(move.to[1]);
  const backTwo = chess.turn() === "w" ? toRank <= 2 : toRank >= 7;
  if (!backTwo) return false;

  chess.move(move);
  try {
    if (chess.isCheck()) return false;
  } finally {
    chess.undo();
  }
  return true;
}

function filterRootMoves(
  chess: Chess,
  legal: Move[],
  filterWasteful: boolean,
): Move[] {
  const safe = legal.filter((m) => !hangsPiece(chess, m));
  if (safe.length === 0) return [];
  if (!filterWasteful) return safe;
  const sensible = safe.filter((m) => !isWastefulUndeveloping(chess, m));
  return sensible.length > 0 ? sensible : safe;
}

function searchBest(
  fen: string,
  thinkMs: number,
  depthLimit: number,
  randomize: boolean,
  slack = 160,
  filterWasteful = false,
): EngineMove | null {
  const chess = new Chess(fen);
  const legal = orderMoves(chess.moves({ verbose: true }));
  if (legal.length === 0) return null;
  const rootMoves = filterRootMoves(chess, legal, filterWasteful);
  if (rootMoves.length === 0) return legalFallback(fen);

  const deadline = Date.now() + thinkMs;
  let nodes = 0;
  let aborted = false;

  const qsearch = (alpha: number, beta: number, qply: number): number => {
    if (aborted) return evaluate(chess);
    const stand = evaluate(chess);
    if (qply <= 0) return stand;
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    const caps = orderMoves(
      chess.moves({ verbose: true }).filter((m) => m.captured || m.promotion),
    );
    for (const m of caps) {
      chess.move(m);
      nodes++;
      if ((nodes & 63) === 0 && Date.now() >= deadline) {
        aborted = true;
        chess.undo();
        return stand;
      }
      const score = -qsearch(-beta, -alpha, qply - 1);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  const search = (depth: number, alpha: number, beta: number): number => {
    if (aborted) return evaluate(chess);
    if (chess.isCheckmate()) return -20_000 + (8 - depth);
    if (chess.isDraw()) return 0;
    if (depth <= 0) return qsearch(alpha, beta, 2);

    const moves = orderMoves(chess.moves({ verbose: true }));
    if (moves.length === 0) return 0;

    for (const m of moves) {
      chess.move(m);
      nodes++;
      if ((nodes & 63) === 0 && Date.now() >= deadline) {
        aborted = true;
        chess.undo();
        return evaluate(chess);
      }
      const score = -search(depth - 1, -beta, -alpha);
      chess.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  };

  let best = rootMoves[0]!;
  let rootScores: { m: Move; score: number }[] = [];
  const maxDepth = Math.max(1, Math.min(6, depthLimit));
  for (let depth = 1; depth <= maxDepth; depth++) {
    aborted = false;
    let alpha = -50_000;
    let local = best;
    const thisScores: { m: Move; score: number }[] = [];
    for (const m of rootMoves) {
      if (Date.now() >= deadline && depth > 1) break;
      chess.move(m);
      const score = -search(depth - 1, -50_000, -alpha);
      chess.undo();
      thisScores.push({ m, score });
      if (!aborted && score > alpha) {
        alpha = score;
        local = m;
      }
    }
    if (!aborted || depth === 1) {
      best = local;
      rootScores = thisScores;
    }
    if (Date.now() >= deadline) break;
  }

  if (randomize && rootScores.length > 1) {
    const bestScore = Math.max(...rootScores.map((s) => s.score));
    const pool = rootScores.filter((s) => s.score >= bestScore - slack);
    const choice = pool[Math.floor(Math.random() * pool.length)] ?? { m: best };
    return toEngineMove(choice.m);
  }
  return toEngineMove(best);
}

/**
 * Stronger suggestion for Play-on Hint — depth 6 / ~2.5s, no randomize.
 * Does not go through pickMove thinkMs clamps (those cap advanced at 1800ms).
 */
export async function pickHintMove(fen: string): Promise<EngineMove | null> {
  await new Promise<void>((resolve) => {
    const later =
      typeof globalThis.setTimeout === "function"
        ? globalThis.setTimeout
        : window.setTimeout;
    later(resolve, 16);
  });
  try {
    return (
      searchBest(
        fen,
        HINT_STRENGTH.thinkMs,
        HINT_STRENGTH.depth,
        HINT_STRENGTH.randomize,
        HINT_STRENGTH.slack,
      ) ?? legalFallback(fen)
    );
  } catch {
    return legalFallback(fen);
  }
}

export function createLiteEngine(level: PlayLevel = "beginner"): PlayEngine {
  let dead = false;
  const defaultLevel = resolveLevel(level);
  return {
    async pickMove(fen, thinkMs, lvl) {
      if (dead) return legalFallback(fen);
      const used = resolveLevel(lvl ?? defaultLevel);
      const spec = PLAY_STRENGTH[used];
      const budget = thinkBudget(thinkMs, used);
      await new Promise<void>((resolve) => {
        const later =
          typeof globalThis.setTimeout === "function"
            ? globalThis.setTimeout
            : window.setTimeout;
        later(resolve, 16);
      });
      if (dead) return legalFallback(fen);
      try {
        // L1/L2: drop purposeless back-rank retreats from the candidate pool.
        const filterWasteful = used === "beginner" || used === "intermediate";
        return (
          searchBest(
            fen,
            budget,
            spec.depth,
            spec.randomize,
            spec.slack,
            filterWasteful,
          ) ?? legalFallback(fen)
        );
      } catch {
        return legalFallback(fen);
      }
    },
    dispose() {
      dead = true;
    },
  };
}

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Always returns a playable engine. A smoke search that throws or returns
 * null is ignored — pickMove already falls back to a legal capture / first
 * legal move. Callers should only treat a rejected dynamic import as
 * "Computer unavailable on this phone".
 */
export async function loadPlayEngine(
  level: PlayLevel = "beginner",
): Promise<PlayEngine> {
  const engine = createLiteEngine(level);
  try {
    // Probe with the raw 80ms budget, not pickMove's think clamp — a
    // depth-4 start-position search on the main thread used to abort the
    // whole load on some WebViews and look like an ancient phone.
    searchBest(START_FEN, 80, 2, false);
  } catch {
    // Search may throw. Engine still plays via legalFallback.
  }
  return engine;
}
