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

export type PlayEngine = {
  pickMove: (fen: string, thinkMs: number) => Promise<EngineMove | null>;
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
      if (m.flags.includes("k") || m.flags.includes("q")) s += 40;
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

function searchBest(fen: string, thinkMs: number): EngineMove | null {
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
  const maxDepth = 3;
  for (let depth = 1; depth <= maxDepth; depth++) {
    aborted = false;
    let alpha = -50_000;
    let local = best;
    for (const m of rootMoves) {
      if (Date.now() >= deadline && depth > 1) break;
      chess.move(m);
      const score = -search(depth - 1, -50_000, -alpha);
      chess.undo();
      if (!aborted && score > alpha) {
        alpha = score;
        local = m;
      }
    }
    if (!aborted || depth === 1) best = local;
    if (Date.now() >= deadline) break;
  }
  return toEngineMove(best);
}

function createLiteEngine(): PlayEngine {
  let dead = false;
  return {
    async pickMove(fen, thinkMs) {
      if (dead) return null;
      const budget = Math.min(1000, Math.max(280, thinkMs));
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 16);
      });
      if (dead) return null;
      try {
        return searchBest(fen, budget);
      } catch {
        const g = new Chess(fen);
        const moves = g.moves({ verbose: true });
        if (moves.length === 0) return null;
        const capture = moves.find((m) => m.captured);
        return toEngineMove(capture ?? moves[0]!);
      }
    },
    dispose() {
      dead = true;
    },
  };
}

export async function loadPlayEngine(): Promise<PlayEngine> {
  if (typeof window === "undefined") {
    throw new Error("engine is browser-only");
  }
  const engine = createLiteEngine();
  const smoke = await engine.pickMove(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    80,
  );
  if (!smoke?.from || !smoke.to) {
    engine.dispose();
    throw new Error("engine smoke test failed");
  }
  return engine;
}
