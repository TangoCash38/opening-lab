/**
 * Server-only Practice-review Engine eval.
 *
 * Ops: Vercel has no Stockfish binary. When STOCKFISH_PATH is unset the
 * handler MUST fail-soft `{ ok: false }` (HTTP 200) so the UI can hide the
 * eval bar / PVs and keep Expert "why" text. Live eval comes later via a
 * small worker that sets STOCKFISH_PATH — not WASM in the client or Play wrap.
 *
 * Do not ship WASM Stockfish (or any GPL engine net) to the client / Play
 * WebView bundle. This path never imports play-engine lite JS.
 *
 * Product rules: Practice only — after a finished Practice line or wrong-move
 * review. Never Test. No free-play analysis. No mid-drill MultiPV. UI copy
 * should say "Engine", not "Lichess / Stockfish cloud".
 *
 * Search: MultiPV 2, depth target 14, hard cap 16, wall ~1.5–2.5s.
 *
 * Cheap rate note: thin unauthenticated test endpoint (same as /api/feedback).
 * Hosts that expose it publicly can add a cheap per-IP throttle later.
 */
import { spawn, type ChildProcess, type SpawnOptions } from "node:child_process";
import { Chess } from "chess.js";

export const DEFAULT_DEPTH = 14;
export const MIN_DEPTH = 8;
export const MAX_DEPTH = 16;
export const WALL_MS = 2500;

const FEN_MAX_LEN = 200;
const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/** Hint paths for a worker host that sets STOCKFISH_PATH. Not probed on Vercel. */
export const STOCKFISH_PATH_HINTS = [
  "/usr/games/stockfish",
  "/usr/bin/stockfish",
  "/usr/local/bin/stockfish",
] as const;

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

export type ParsedInfo = {
  multipv: 1 | 2;
  scoreCp: number | null;
  mate: number | null;
  uci: string[];
};

export type PracticeReviewRequest = {
  fen: string;
  depth: number;
};

export type ParseRequestResult =
  | { ok: true; value: PracticeReviewRequest }
  | { ok: false; error: string; status: 400 };

export type StockfishSpawn = (
  command: string,
  args?: readonly string[],
  options?: SpawnOptions,
) => ChildProcess;

export type EvaluateOpts = {
  /** Test hook only. */
  spawnImpl?: StockfishSpawn;
  wallMs?: number;
  /** Pass null to force the missing-binary fail-soft path. */
  stockfishPath?: string | null;
};

function failSoft(error: string): PracticeReviewFail {
  return { ok: false, error };
}

export function clampPracticeReviewDepth(requested?: number): number {
  const n =
    typeof requested === "number" && Number.isFinite(requested)
      ? Math.round(requested)
      : DEFAULT_DEPTH;
  return Math.min(MAX_DEPTH, Math.max(MIN_DEPTH, n));
}

/** True when chess.js can load the FEN (rejects garbage / illegal positions). */
export function isValidPracticeFen(fen: string): boolean {
  if (typeof fen !== "string") return false;
  const trimmed = fen.trim();
  if (!trimmed || trimmed.length > FEN_MAX_LEN) return false;
  try {
    const game = new Chess(trimmed);
    return Boolean(game.fen());
  } catch {
    return false;
  }
}

export function parsePracticeReviewBody(body: unknown): ParseRequestResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request", status: 400 };
  }
  const rec = body as Record<string, unknown>;
  if (typeof rec.fen !== "string") {
    return { ok: false, error: "Invalid FEN", status: 400 };
  }
  const fen = rec.fen.trim();
  if (!isValidPracticeFen(fen)) {
    return { ok: false, error: "Invalid FEN", status: 400 };
  }
  if (rec.depth !== undefined) {
    if (typeof rec.depth !== "number" || !Number.isFinite(rec.depth)) {
      return { ok: false, error: "Invalid depth", status: 400 };
    }
  }
  return {
    ok: true,
    value: {
      fen,
      depth: clampPracticeReviewDepth(
        typeof rec.depth === "number" ? rec.depth : undefined,
      ),
    },
  };
}

/**
 * Binary path for a live eval. Unset / empty STOCKFISH_PATH → null (fail-soft).
 * Vercel does not install Stockfish and must leave this unset. A later worker
 * sets STOCKFISH_PATH (e.g. /usr/games/stockfish). Common paths are not
 * auto-probed so an unset env never silently finds a host binary.
 */
export function resolveStockfishPath(
  envPath = process.env.STOCKFISH_PATH,
): string | null {
  const fromEnv = envPath?.trim();
  return fromEnv || null;
}

export function parseUciInfoLine(line: string): ParsedInfo | null {
  if (!line.startsWith("info ") || !/\bmultipv\b/.test(line) || !/\bpv\b/.test(line)) {
    return null;
  }
  const mp = /\bmultipv\s+(\d+)\b/.exec(line);
  if (!mp) return null;
  const n = Number(mp[1]);
  if (n !== 1 && n !== 2) return null;

  const mateM = /\bscore\s+mate\s+(-?\d+)\b/.exec(line);
  const cpM = /\bscore\s+cp\s+(-?\d+)\b/.exec(line);
  const mate = mateM ? Number(mateM[1]) : null;
  const scoreCp = mateM ? null : cpM ? Number(cpM[1]) : null;

  const pvM = /\bpv\s+(.+)$/.exec(line);
  if (!pvM) return null;
  const uci = pvM[1]
    .trim()
    .split(/\s+/)
    .filter((tok) => UCI_MOVE.test(tok));
  if (uci.length === 0) return null;

  return { multipv: n, scoreCp, mate, uci };
}

/** Convert a UCI PV to SAN from the given FEN. Stops at the first illegal ply. */
export function pvUciToSan(fen: string, uciMoves: string[]): string[] {
  const chess = new Chess(fen);
  const san: string[] = [];
  for (const uci of uciMoves) {
    if (!UCI_MOVE.test(uci)) break;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promo = uci[4];
    const promotion =
      promo === "q" || promo === "r" || promo === "b" || promo === "n"
        ? promo
        : undefined;
    try {
      const mv = chess.move(promotion ? { from, to, promotion } : { from, to });
      if (!mv) break;
      san.push(mv.san);
    } catch {
      break;
    }
  }
  return san;
}

function buildResult(
  fen: string,
  latest: Map<number, ParsedInfo>,
): PracticeReviewOk | null {
  const pvs: PracticeReviewPv[] = [];
  for (const n of [1, 2] as const) {
    const info = latest.get(n);
    if (!info) continue;
    pvs.push({
      multipv: n,
      scoreCp: info.scoreCp,
      mate: info.mate,
      san: pvUciToSan(fen, info.uci),
    });
  }
  const pv1 = pvs.find((p) => p.multipv === 1);
  if (!pv1) return null;
  return {
    ok: true,
    evalCp: pv1.scoreCp,
    mate: pv1.mate,
    pvs,
  };
}

function killEngine(proc: ChildProcess): void {
  if (proc.killed || proc.exitCode !== null) return;
  try {
    proc.kill("SIGTERM");
  } catch {
    // already gone
  }
  const t = setTimeout(() => {
    if (!proc.killed && proc.exitCode === null) {
      try {
        proc.kill("SIGKILL");
      } catch {
        // already gone
      }
    }
  }, 200);
  t.unref?.();
}

/**
 * Run a short MultiPV-2 Engine search. Scores are Stockfish UCI values
 * (side to move). Fail-soft on missing binary, crash, or empty search.
 */
export function evaluatePracticeReview(
  fen: string,
  depth: number = DEFAULT_DEPTH,
  opts: EvaluateOpts = {},
): Promise<PracticeReviewResult> {
  const usedDepth = clampPracticeReviewDepth(depth);
  const wallMs = opts.wallMs ?? WALL_MS;
  const bin =
    opts.stockfishPath === undefined
      ? resolveStockfishPath()
      : opts.stockfishPath;
  if (!bin) return Promise.resolve(failSoft("Engine unavailable"));

  const spawnFn = opts.spawnImpl ?? spawn;
  let proc: ChildProcess;
  try {
    proc = spawnFn(bin, [], { stdio: ["pipe", "pipe", "ignore"] });
  } catch {
    return Promise.resolve(failSoft("Engine unavailable"));
  }

  return new Promise((resolve) => {
    let settled = false;
    let buffer = "";
    const latest = new Map<number, ParsedInfo>();

    const finish = (result: PracticeReviewResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      killEngine(proc);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish(buildResult(fen, latest) ?? failSoft("Engine timeout"));
    }, wallMs);

    proc.on("error", () => {
      finish(failSoft("Engine unavailable"));
    });
    proc.on("close", () => {
      finish(buildResult(fen, latest) ?? failSoft("Engine unavailable"));
    });

    proc.stdout?.on("data", (chunk: Buffer | string) => {
      buffer += String(chunk);
      let nl = buffer.indexOf("\n");
      while (nl >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line.startsWith("bestmove")) {
          finish(buildResult(fen, latest) ?? failSoft("Engine empty"));
          return;
        }
        const parsed = parseUciInfoLine(line);
        if (parsed) latest.set(parsed.multipv, parsed);
        nl = buffer.indexOf("\n");
      }
    });

    const cmds = [
      "uci",
      "setoption name MultiPV value 2",
      "isready",
      "ucinewgame",
      `position fen ${fen}`,
      `go depth ${usedDepth}`,
    ].join("\n") + "\n";

    try {
      const ok = proc.stdin?.write(cmds);
      if (ok === false) {
        proc.stdin?.once("drain", () => {
          /* queued */
        });
      }
    } catch {
      finish(failSoft("Engine unavailable"));
    }
  });
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

/** TanStack Start POST handler — 400 for garbage FEN; 200 fail-soft for Engine miss. */
export async function practiceReviewEvalPost({
  request,
}: {
  request: Request;
}): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  const parsed = parsePracticeReviewBody(body);
  if (!parsed.ok) {
    return json({ error: parsed.error }, parsed.status);
  }

  const result = await evaluatePracticeReview(parsed.value.fen, parsed.value.depth);
  return json(result, 200);
}
