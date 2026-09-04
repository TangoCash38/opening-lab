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
  depth: 8,
  randomize: false,
  slack: 0,
  /** Quiescence plies for Hint only — deeper capture resolution. */
  qPly: 4,
  /** Allow iterative deepen past the shared opponent depth cap of 6. */
  depthCap: 8,
  /** Finish depths 1–4 at every root move before spending leftover on 5+. */
  solidDepth: 4,
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
    -20, -10, -10, -10, -10, -10, -10, -20, -10, 8, 5, 5, 5, 5, 8, -10, -10, 12,
    14, 14, 14, 14, 12, -10, -10, 10, 20, 24, 24, 20, 10, -10, -10, 12, 20, 24, 24,
    20, 12, -10, -10, 5, 12, 14, 14, 12, 5, -10, -10, 5, 5, 5, 5, 5, 5, -10, -20,
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

/** Cheap bishop-pair / development nudge — prefers active bishops like Bf4. */
const BISHOP_PAIR = 35;
const BISHOP_DEVELOP = 18;

function evaluate(chess: Chess): number {
  const board = chess.board();
  let score = 0;
  let wBishops = 0;
  let bBishops = 0;
  for (let r = 0; r < 8; r++) {
    const row = board[r]!;
    for (let c = 0; c < 8; c++) {
      const p = row[c];
      if (!p) continue;
      const sq = p.color === "w" ? (7 - r) * 8 + c : r * 8 + c;
      let s = (VAL[p.type] ?? 0) + (PST[p.type]?.[sq] ?? 0);
      if (p.type === "b") {
        if (p.color === "w") wBishops++;
        else bBishops++;
        // Off the back rank counts as developed (c1/f1 or c8/f8).
        const rank = p.color === "w" ? 7 - r : r;
        if (rank > 0) s += BISHOP_DEVELOP;
      }
      score += p.color === "w" ? s : -s;
    }
  }
  if (wBishops >= 2) score += BISHOP_PAIR;
  if (bBishops >= 2) score -= BISHOP_PAIR;
  return chess.turn() === "w" ? score : -score;
}

function pstSq(square: string, color: "w" | "b"): number {
  const file = square.charCodeAt(0) - 97;
  const rank = square.charCodeAt(1) - 49;
  return color === "w" ? rank * 8 + file : (7 - rank) * 8 + file;
}

/** Quiet-move PST gain (to − from). Pushes Bf4 ahead of junk retreats at root. */
function pstDelta(m: Move, color: "w" | "b"): number {
  const table = PST[m.piece];
  if (!table) return 0;
  return (table[pstSq(m.to, color)] ?? 0) - (table[pstSq(m.from, color)] ?? 0);
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

/**
 * Root ordering (Hint): captures/checks first, quiet moves by PST delta, plus a
 * tiny B/N-toward-centre develop nudge (ranks 3–6, files c–f).
 */
function orderRootMoves(moves: Move[], color: "w" | "b"): Move[] {
  return moves
    .map((m) => {
      let s = 0;
      if (m.captured) s += 10 * (VAL[m.captured] ?? 0) - (VAL[m.piece] ?? 0);
      if (m.promotion) s += VAL[m.promotion] ?? 0;
      if (m.flags?.includes("k") || m.flags?.includes("q")) s += 40;
      if (typeof m.san === "string" && m.san.includes("+")) s += 55;
      if (!m.captured) {
        s += pstDelta(m, color);
        if (m.piece === "b" || m.piece === "n") {
          const file = m.to.charCodeAt(0) - 97;
          const rank = m.to.charCodeAt(1) - 49;
          if (file >= 2 && file <= 5 && rank >= 2 && rank <= 5) s += 12;
          // Active bishop diagonals (c4/f4/c5/f5) ahead of quieter knight junk.
          if (
            m.piece === "b" &&
            file >= 2 &&
            file <= 5 &&
            rank >= 3 &&
            rank <= 4
          ) {
            s += 40;
          }
        }
      }
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
 * Quiet N/B/R/Q *retreat* onto our back two ranks — no capture, no check.
 * White: fromRank > toRank and toRank <= 2; Black: fromRank < toRank and
 * toRank >= 7. Developing onto rank 2/7 (Be2, Bd2, Bg2, …) is not waste.
 * Kept when every non-hanging alternative is also wasteful (escape-only).
 */
export function isWastefulUndeveloping(chess: Chess, move: Move): boolean {
  const piece = move.piece;
  if (piece !== "n" && piece !== "b" && piece !== "r" && piece !== "q") {
    return false;
  }
  if (move.captured || move.promotion) return false;

  const fromRank = Number(move.from[1]);
  const toRank = Number(move.to[1]);
  const retreating =
    chess.turn() === "w"
      ? fromRank > toRank && toRank <= 2
      : fromRank < toRank && toRank >= 7;
  if (!retreating) return false;

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

type SearchOpts = {
  /** Hard cap on iterative deepening (opponents stay at 6; Hint uses 8). */
  depthCap?: number;
  /** Quiescence depth when depth hits 0 (default 2; Hint uses 4). */
  qPly?: number;
  /**
   * Finish every root move at depths ≤ this before allowing mid-root aborts
   * (Hint: 4). Opponents omit this and keep the old depth>1 abort behaviour.
   */
  solidDepth?: number;
  /** Root-order quiet moves by PST delta + tiny B/N centre develop bonus. */
  rootPstOrder?: boolean;
};

function searchBest(
  fen: string,
  thinkMs: number,
  depthLimit: number,
  randomize: boolean,
  slack = 160,
  filterWasteful = false,
  opts?: SearchOpts,
): EngineMove | null {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const legal = orderMoves(chess.moves({ verbose: true }));
  if (legal.length === 0) return null;
  const filtered = filterRootMoves(chess, legal, filterWasteful);
  const rootMoves = opts?.rootPstOrder
    ? orderRootMoves(filtered, turn)
    : filtered;
  if (rootMoves.length === 0) return legalFallback(fen);

  const deadline = Date.now() + thinkMs;
  const depthCap = opts?.depthCap ?? 6;
  const leafQPly = opts?.qPly ?? 2;
  /** Hint finishes depths 1–4 at every root move before burning rest on 5+. */
  const solidDepth = opts?.solidDepth ?? 0;
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
    if (depth <= 0) return qsearch(alpha, beta, leafQPly);

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
  const maxDepth = Math.max(1, Math.min(depthCap, depthLimit));
  for (let depth = 1; depth <= maxDepth; depth++) {
    const solid = solidDepth > 0 && depth <= solidDepth;
    // Burn leftover think time on depths beyond the solid band only.
    if (!solid && solidDepth > 0 && Date.now() >= deadline) break;
    aborted = false;
    let alpha = -50_000;
    let local = best;
    const thisScores: { m: Move; score: number }[] = [];
    for (const m of rootMoves) {
      // Hint solid depths: do not mid-root-abort (finish the iteration).
      // Opponents / deeper Hint plies: stop once the clock elapses.
      if (
        Date.now() >= deadline &&
        !solid &&
        (solidDepth > 0 || depth > 1)
      ) {
        break;
      }
      chess.move(m);
      const score = -search(depth - 1, -50_000, -alpha);
      chess.undo();
      thisScores.push({ m, score });
      if (!aborted && score > alpha) {
        alpha = score;
        local = m;
      }
    }
    if (!aborted || solid || depth === 1) {
      best = local;
      rootScores = thisScores;
    }
    if (Date.now() >= deadline && !solid) break;
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
 * Stronger suggestion for Play-on Hint — depth 8 / ~2.5s, deeper qsearch,
 * PST root order, no randomize. Time-boxed by thinkMs so wall time stays ~2.5s.
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
        false,
        {
          depthCap: HINT_STRENGTH.depthCap,
          qPly: HINT_STRENGTH.qPly,
          solidDepth: HINT_STRENGTH.solidDepth,
          rootPstOrder: true,
        },
      ) ?? legalFallback(fen)
    );
  } catch {
    return legalFallback(fen);
  }
}

/** Sync Hint search for tests — same params as pickHintMove, no UI yield. */
export function searchHintMove(fen: string): EngineMove | null {
  try {
    return (
      searchBest(
        fen,
        HINT_STRENGTH.thinkMs,
        HINT_STRENGTH.depth,
        HINT_STRENGTH.randomize,
        HINT_STRENGTH.slack,
        false,
        {
          depthCap: HINT_STRENGTH.depthCap,
          qPly: HINT_STRENGTH.qPly,
          solidDepth: HINT_STRENGTH.solidDepth,
          rootPstOrder: true,
        },
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
