/**
 * Cache Stockfish depth 18, MultiPV 3, for every ply of the 10 Scotch lines.
 * One thread so the scores stay deterministic. Writes src/data/scotch-coach-engine.json.
 *
 *   node scripts/precompute-scotch-coach-engine.mjs
 */
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src/data/scotch-coach-engine.json");
const BIN = process.env.STOCKFISH_PATH?.trim() || "/usr/games/stockfish";
const DEPTH = 18;
const MULTIPV = 3;
const WORKERS = Math.max(1, Math.min(4, Number(process.env.COACH_ENGINE_WORKERS) || 4));
const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

function scotchLines() {
  const src = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = src.indexOf('id: "scotch"');
  const end = src.indexOf('id: "italian"', start);
  if (start < 0 || end < 0) throw new Error("Could not find the Scotch pack in packs.ts");
  const block = src.slice(start, end);
  const re = /id: "(sg\d+)",\s*name: "([^"]+)",\s*plies: \[([\s\S]*?)\]/g;
  const lines = [];
  for (const match of block.matchAll(re)) {
    const plies = [...match[3].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (plies.length === 0) throw new Error(`No plies for ${match[1]}`);
    lines.push({ id: match[1], name: match[2], plies });
  }
  if (lines.length !== 10) throw new Error(`Expected 10 Scotch lines, found ${lines.length}`);
  return lines;
}

function positionsFor(plies) {
  const chess = new Chess();
  const fens = [chess.fen()];
  for (const san of plies) {
    const mv = chess.move(san);
    if (!mv) throw new Error(`Illegal SAN ${san} after ${fens.length - 1} plies`);
    fens.push(chess.fen());
  }
  return fens;
}

function pvToSan(fen, uciMoves) {
  const chess = new Chess(fen);
  const san = [];
  for (const uci of uciMoves) {
    if (!UCI_MOVE.test(uci)) break;
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promo = uci[4];
    const promotion = promo === "q" || promo === "r" || promo === "b" || promo === "n" ? promo : undefined;
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

function parseInfo(line) {
  if (!line.startsWith("info ") || !line.includes(" multipv ") || !line.includes(" pv ")) return null;
  const depth = Number(/\bdepth (\d+)/.exec(line)?.[1]);
  const multipv = Number(/\bmultipv (\d+)/.exec(line)?.[1]);
  if (!Number.isFinite(depth) || multipv < 1 || multipv > MULTIPV) return null;
  const mateM = /\bscore mate (-?\d+)/.exec(line);
  const cpM = /\bscore cp (-?\d+)/.exec(line);
  const pvRaw = /\bpv (.+)$/.exec(line)?.[1] ?? "";
  const uci = pvRaw.trim().split(/\s+/).filter((tok) => UCI_MOVE.test(tok));
  if (uci.length === 0) return null;
  return {
    depth,
    multipv,
    mate: mateM ? Number(mateM[1]) : null,
    cp: mateM ? null : cpM ? Number(cpM[1]) : null,
    uci,
  };
}

function whiteScore(stm, cp, mate) {
  const sign = stm === "b" ? -1 : 1;
  return {
    whiteEvalCp: cp == null ? null : cp * sign,
    whiteMate: mate == null ? null : mate * sign,
  };
}

function openEngine() {
  const proc = spawn(BIN, [], { stdio: ["pipe", "pipe", "ignore"] });
  const queue = [];
  let pending = null;
  let buf = "";
  proc.stdout.setEncoding("utf8");
  proc.stdout.on("data", (chunk) => {
    buf += chunk;
    let nl = buf.indexOf("\n");
    while (nl >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, "");
      buf = buf.slice(nl + 1);
      if (pending) {
        const resolve = pending;
        pending = null;
        resolve(line);
      } else {
        queue.push(line);
      }
      nl = buf.indexOf("\n");
    }
  });
  const closed = new Promise((resolve, reject) => {
    proc.once("error", reject);
    proc.once("exit", (code) => resolve(code));
  });
  function nextLine() {
    if (queue.length) return Promise.resolve(queue.shift());
    return new Promise((resolve) => {
      pending = resolve;
    });
  }
  function send(cmd) {
    proc.stdin.write(`${cmd}\n`);
  }
  return { proc, send, nextLine, closed };
}

async function boot(engine) {
  engine.send("uci");
  let name = "Stockfish";
  for (;;) {
    const line = await engine.nextLine();
    if (line.startsWith("id name ")) name = line.slice("id name ".length).trim();
    if (line === "uciok") break;
  }
  engine.send("setoption name Threads value 1");
  engine.send("setoption name Hash value 32");
  engine.send(`setoption name MultiPV value ${MULTIPV}`);
  engine.send("isready");
  for (;;) {
    const line = await engine.nextLine();
    if (line === "readyok") break;
  }
  return name;
}

async function search(engine, fen) {
  const stm = fen.split(/\s+/)[1] === "b" ? "b" : "w";
  engine.send("ucinewgame");
  engine.send("isready");
  for (;;) {
    const line = await engine.nextLine();
    if (line === "readyok") break;
  }
  engine.send(`position fen ${fen}`);
  engine.send(`go depth ${DEPTH}`);
  const latest = new Map();
  const timer = setTimeout(() => {
    try {
      engine.proc.kill("SIGKILL");
    } catch {
      /* already gone */
    }
  }, 90_000);
  try {
    for (;;) {
      const line = await engine.nextLine();
      if (line.startsWith("bestmove")) break;
      const info = parseInfo(line);
      if (!info) continue;
      const prev = latest.get(info.multipv);
      if (!prev || info.depth >= prev.depth) latest.set(info.multipv, info);
    }
  } finally {
    clearTimeout(timer);
  }
  const moves = [];
  for (let n = 1; n <= MULTIPV; n += 1) {
    const info = latest.get(n);
    if (!info) continue;
    const pv = pvToSan(fen, info.uci);
    if (pv.length === 0) continue;
    const score = whiteScore(stm, info.cp, info.mate);
    moves.push({
      san: pv[0],
      whiteEvalCp: score.whiteEvalCp,
      whiteMate: score.whiteMate,
      pv,
    });
  }
  if (moves.length === 0) throw new Error(`Empty search for ${fen}`);
  const top = moves[0];
  return {
    fen,
    stm,
    whiteEvalCp: top.whiteEvalCp,
    whiteMate: top.whiteMate,
    moves,
  };
}

const lines = scotchLines();
const jobs = [];
const seen = new Set();
for (const line of lines) {
  const fens = positionsFor(line.plies);
  line.fens = fens;
  for (const fen of fens) {
    if (seen.has(fen)) continue;
    seen.add(fen);
    jobs.push(fen);
  }
}

console.log(`[coach-engine] ${lines.length} lines, ${jobs.length} unique positions, depth ${DEPTH}, workers ${WORKERS}`);

const byFen = new Map();
let write = Promise.resolve();
let done = 0;

function snapshot() {
  const file = {
    engine: engineName,
    depth: DEPTH,
    multipv: MULTIPV,
    threads: 1,
    positions: byFen.size,
    lines: {},
  };
  for (const line of lines) {
    file.lines[line.id] = line.fens.map((fen) => byFen.get(fen) ?? null);
  }
  write = write.then(() => {
    writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`);
  });
}

let engineName = "Stockfish";
let cursor = 0;

async function worker() {
  const engine = openEngine();
  const name = await boot(engine);
  engineName = name;
  try {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= jobs.length) break;
      const fen = jobs[index];
      const row = await search(engine, fen);
      byFen.set(fen, row);
      done += 1;
      if (done === 1 || done % 10 === 0 || done === jobs.length) {
        const top = row.moves.map((m) => m.san).join(", ");
        console.log(`[coach-engine] ${done}/${jobs.length} ${top}`);
        snapshot();
      }
    }
  } finally {
    try {
      engine.proc.stdin.end();
    } catch {
      /* closed */
    }
    try {
      engine.proc.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
}

const started = Date.now();
await Promise.all(Array.from({ length: WORKERS }, () => worker()));
snapshot();
await write;

const start = byFen.get(new Chess().fen());
const topStart = start?.moves?.[0]?.san;
if (topStart && !["e4", "d4", "Nf3", "c4"].includes(topStart)) {
  console.warn(`[coach-engine] unexpected start move ${topStart}`);
}

for (const line of lines) {
  const rows = line.fens.map((fen) => byFen.get(fen));
  if (rows.some((row) => !row)) throw new Error(`Missing ply for ${line.id}`);
}

console.log(`[coach-engine] wrote ${outPath} in ${Math.round((Date.now() - started) / 1000)}s`);
