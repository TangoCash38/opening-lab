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
  { thinkMs: number; depth: number; randomize: boolean }
> = {
  beginner: { thinkMs: 400, depth: 2, randomize: true },
  intermediate: { thinkMs: 900, depth: 4, randomize: false },
  advanced: { thinkMs: 1200, depth: 5, randomize: false },
};

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

/* a1=0 … h8=63. Black uses sq ^ 56. */
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, -20, -20, 10, 10, 5, 5, -5, -10, 0, 0,
    -10, -5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, 5, 10, 25, 25, 10, 5, 5, 10, 10,
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
  return "intermediate";
}

function thinkBudget(thinkMs: number, level: PlayLevel): number {
  const fallback = PLAY_STRENGTH[level].thinkMs;
  const raw = Number.isFinite(thinkMs) && thinkMs > 0 ? thinkMs : fallback;
  if (level === "beginner") return Math.min(600, Math.max(200, raw));
  if (level === "advanced") return Math.min(1600, Math.max(800, raw));
  return Math.min(1200, Math.max(600, raw));
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

function searchBest(
  fen: string,
  thinkMs: number,
  depthLimit: number,
  randomize: boolean,
): EngineMove | null {
  const chess = new Chess(fen);
  const rootMoves = orderMoves(chess.moves({ verbose: true }));
  if (rootMoves.length === 0) return null;

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
    const pool = rootScores.filter((s) => s.score >= bestScore - 160);
    const choice = pool[Math.floor(Math.random() * pool.length)] ?? { m: best };
    return toEngineMove(choice.m);
  }
  return toEngineMove(best);
}

export function createLiteEngine(level: PlayLevel = "intermediate"): PlayEngine {
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
        return searchBest(fen, budget, spec.depth, spec.randomize) ?? legalFallback(fen);
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
  level: PlayLevel = "intermediate",
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
