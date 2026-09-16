/**
 * Client-safe Practice-review Engine helpers.
 *
 * POST /api/practice-review-eval only. Never import the server evaluator,
 * play-engine, or WASM Stockfish. Product copy: "Engine".
 *
 * Fail-soft: network / { ok: false } / garbage → hide bar, arrows, PVs.
 */
import { Chess, type Square } from "chess.js";

export const PRACTICE_REVIEW_EVAL_PATH = "/api/practice-review-eval";

export type PracticeReviewPv = {
  multipv: 1 | 2;
  scoreCp: number | null;
  mate: number | null;
  san: string[];
};

export type PracticeReviewOk = {
  ok: true;
  evalCp: number | null;
  mate: number | null;
  pvs: PracticeReviewPv[];
};

export type PracticeReviewFail = {
  ok: false;
  error: string;
};

export type PracticeReviewResult = PracticeReviewOk | PracticeReviewFail;

export type ReviewArrow = {
  from: Square;
  to: Square;
  kind: "pv1" | "pv2";
};

function stmSign(fen: string): 1 | -1 {
  const side = fen.trim().split(/\s+/)[1];
  return side === "b" ? -1 : 1;
}

/** White-perspective centipawns. Mate becomes a large clipped cp. */
export function whiteEvalCp(
  evalCp: number | null,
  mate: number | null,
  fen: string,
): number | null {
  const sign = stmSign(fen);
  if (mate != null && Number.isFinite(mate)) {
    const mag =
      mate === 0 ? 10000 : Math.sign(mate) * (10000 - Math.min(99, Math.abs(mate)));
    return mag * sign;
  }
  if (evalCp == null || !Number.isFinite(evalCp)) return null;
  return evalCp * sign;
}

/** "+0.3" / "0.0" / "M2" from White's view (eval bar + PV pills). */
export function formatEvalLabel(
  evalCp: number | null,
  mate: number | null,
  fen: string,
): string {
  const sign = stmSign(fen);
  if (mate != null && Number.isFinite(mate)) {
    const whiteMate = mate * sign;
    if (whiteMate === 0) return "M0";
    return whiteMate > 0 ? `M${Math.abs(whiteMate)}` : `-M${Math.abs(whiteMate)}`;
  }
  const cp = whiteEvalCp(evalCp, null, fen);
  if (cp == null) return "";
  const pawns = cp / 100;
  const abs = Math.abs(pawns);
  const body = abs >= 10 ? abs.toFixed(0) : abs.toFixed(1);
  if (Math.abs(cp) < 5) return "0.0";
  return `${cp > 0 ? "+" : "-"}${body}`;
}

/** White share of the vertical bar (bottom = White). */
export function evalBarWhitePct(whiteCp: number | null): number {
  if (whiteCp == null) return 50;
  const t = Math.tanh(whiteCp / 400);
  return Math.min(96, Math.max(4, 50 + 50 * t));
}

/** Short numbered SAN, e.g. `5...Bd6 6.Bg3 O-O`. */
export function formatPvLine(fen: string, sans: string[], maxPlies = 3): string {
  const parts = fen.trim().split(/\s+/);
  let side = parts[1] === "b" ? "b" : "w";
  let moveNo = Number(parts[5]) || 1;
  if (!Number.isFinite(moveNo) || moveNo < 1) moveNo = 1;
  const bits: string[] = [];
  for (const raw of sans.slice(0, maxPlies)) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const san = raw.trim();
    if (side === "w") {
      bits.push(`${moveNo}.${san}`);
      side = "b";
    } else {
      bits.push(bits.length === 0 ? `${moveNo}...${san}` : san);
      side = "w";
      moveNo += 1;
    }
  }
  return bits.join(" ");
}

export function firstMoveSquares(
  fen: string,
  san: string,
): { from: Square; to: Square } | null {
  if (typeof san !== "string" || !san.trim()) return null;
  try {
    const game = new Chess(fen);
    const mv = game.move(san.trim());
    if (!mv) return null;
    return { from: mv.from as Square, to: mv.to as Square };
  } catch {
    return null;
  }
}

export function arrowsFromPvs(fen: string, pvs: PracticeReviewPv[]): ReviewArrow[] {
  const out: ReviewArrow[] = [];
  for (const pv of pvs) {
    const first = pv.san[0];
    if (!first) continue;
    const sq = firstMoveSquares(fen, first);
    if (!sq) continue;
    out.push({
      from: sq.from,
      to: sq.to,
      kind: pv.multipv === 1 ? "pv1" : "pv2",
    });
  }
  return out;
}

export function parsePracticeReviewJson(data: unknown): PracticeReviewResult {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Engine unavailable" };
  }
  const rec = data as Record<string, unknown>;
  if (rec.ok !== true) {
    return {
      ok: false,
      error: typeof rec.error === "string" ? rec.error : "Engine unavailable",
    };
  }
  const pvs: PracticeReviewPv[] = [];
  if (Array.isArray(rec.pvs)) {
    for (const raw of rec.pvs) {
      if (!raw || typeof raw !== "object") continue;
      const p = raw as Record<string, unknown>;
      if (p.multipv !== 1 && p.multipv !== 2) continue;
      const san = Array.isArray(p.san)
        ? p.san.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : [];
      pvs.push({
        multipv: p.multipv,
        scoreCp: typeof p.scoreCp === "number" && Number.isFinite(p.scoreCp) ? p.scoreCp : null,
        mate: typeof p.mate === "number" && Number.isFinite(p.mate) ? p.mate : null,
        san,
      });
    }
  }
  const pv1 = pvs.find((p) => p.multipv === 1);
  const hasScore =
    typeof rec.evalCp === "number" ||
    typeof rec.mate === "number" ||
    (pv1 && (pv1.scoreCp != null || pv1.mate != null || pv1.san.length > 0));
  if (!pv1 || !hasScore) {
    return { ok: false, error: "Engine unavailable" };
  }
  return {
    ok: true,
    evalCp: typeof rec.evalCp === "number" && Number.isFinite(rec.evalCp) ? rec.evalCp : null,
    mate: typeof rec.mate === "number" && Number.isFinite(rec.mate) ? rec.mate : null,
    pvs,
  };
}

export async function fetchPracticeReviewEval(
  fen: string,
  opts?: { depth?: number },
): Promise<PracticeReviewResult> {
  try {
    const payload: { fen: string; depth?: number } = { fen };
    if (opts?.depth != null && Number.isFinite(opts.depth)) {
      payload.depth = opts.depth;
    }
    const res = await fetch(PRACTICE_REVIEW_EVAL_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      return { ok: false, error: "Engine unavailable" };
    }
    if (!res.ok && (res.status === 400 || res.status >= 500)) {
      return parsePracticeReviewJson(
        data && typeof data === "object" ? { ...data, ok: false } : data,
      );
    }
    return parsePracticeReviewJson(data);
  } catch {
    return { ok: false, error: "Engine unavailable" };
  }
}
