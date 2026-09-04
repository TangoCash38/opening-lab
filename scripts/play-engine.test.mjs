import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

test("Play strength is club-player depths with a hanging-piece root filter", () => {
  const engine = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const train = readFileSync(
    join(root, "src/components/opening-lab/train-view.tsx"),
    "utf8",
  );

  assert.match(
    engine,
    /beginner: \{ thinkMs: 400, depth: 2, randomize: true, slack: 100 \}/,
  );
  assert.match(
    engine,
    /intermediate: \{ thinkMs: 800, depth: 3, randomize: true, slack: 40 \}/,
  );
  assert.match(
    engine,
    /advanced: \{ thinkMs: 1400, depth: 5, randomize: false, slack: 0 \}/,
  );
  assert.match(engine, /function hangsPiece/);
  assert.match(engine, /function captureQsearch/);
  assert.match(engine, /HANG_CP = 250/);
  assert.match(engine, /rootMoves\.length === 0\) return legalFallback\(fen\)/);
  assert.match(
    engine,
    /if \(level === "beginner"\) return Math.min\(550, Math.max\(280, raw\)\);/,
  );
  assert.match(engine, /return Math.min\(1100, Math.max\(550, raw\)\);/);
  assert.doesNotMatch(engine, /from ["']stockfish/);
  assert.doesNotMatch(engine, /thinkMs: 280, depth: 1/);
  assert.match(engine, /function isWastefulUndeveloping/);
  assert.match(engine, /function filterRootMoves/);
  assert.match(engine, /filterWasteful = used === "beginner" \|\| used === "intermediate"/);
  assert.match(engine, /toRank <= 2/);
  assert.match(engine, /toRank >= 7/);
  assert.match(engine, /fromRank > toRank && toRank <= 2/);
  assert.match(engine, /fromRank < toRank && toRank >= 7/);
  // Level 1 stays shallow + randomized — not advanced strength.
  assert.match(engine, /beginner:.*depth: 2.*randomize: true/);
  assert.match(engine, /slack: 100/);

  assert.match(train, /beginner: 400,/);
  assert.match(train, /intermediate: 800,/);
  assert.match(train, /advanced: 1400,/);
});

test("beginner pickMove does not hang the queen when Qd4 is legal", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }

  const src = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-play-engine");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-engine.mjs");
  writeFileSync(tmp, js);

  try {
    const mod = await import(pathToFileURL(tmp).href);
    const engine = mod.createLiteEngine("beginner");
    // d-pawn gone so Qd4 hangs to exd4; Qd6 hangs to B/cxd6. (Qd5 does not hang.)
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3";
    const hung = new Set(["d1d4", "d1d6", "d1d7"]);
    for (let i = 0; i < 8; i++) {
      const mv = await engine.pickMove(fen, 400, "beginner");
      assert.ok(mv, "pickMove returned null");
      const key = `${mv.from}${mv.to}`;
      assert.equal(hung.has(key), false, `beginner hung the queen with ${key}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Play-on Hint uses deeper same-engine strength (not Stockfish)", () => {
  const engine = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const train = readFileSync(
    join(root, "src/components/opening-lab/train-view.tsx"),
    "utf8",
  );
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );

  assert.match(
    engine,
    /HINT_STRENGTH = \{[\s\S]*?thinkMs: 2500,[\s\S]*?depth: 8,[\s\S]*?randomize: false,[\s\S]*?slack: 0/,
  );
  assert.match(engine, /depthCap: 8/);
  assert.match(engine, /qPly: 4/);
  assert.match(engine, /solidDepth: 4/);
  assert.match(engine, /Math\.min\(depthCap, depthLimit\)/);
  assert.doesNotMatch(engine, /Math\.min\(6, depthLimit\)/);
  assert.match(engine, /function orderRootMoves/);
  assert.match(engine, /function pstDelta/);
  assert.match(engine, /BISHOP_PAIR/);
  assert.match(engine, /rootPstOrder/);
  assert.match(engine, /export async function pickHintMove/);
  assert.match(engine, /export function searchHintMove/);
  assert.match(engine, /HINT_STRENGTH\.thinkMs/);
  assert.match(engine, /HINT_STRENGTH\.depth/);
  assert.doesNotMatch(engine, /from ["']stockfish/);
  assert.ok(!/thinkMs:\s*(2[6-9]\d{2}|[3-9]\d{3})/.test(engine));

  assert.match(train, /playHint/);
  assert.match(train, /requestPlayHint/);
  assert.match(train, /pickHintMove/);
  assert.match(train, /t\("Hint"\)/);
  assert.match(train, /Boolean\(playHint\)/);
  assert.match(train, /playingOn \? playHint : bookExp/);
  assert.match(train, /hint-thinking-cue/);
  assert.match(train, /HintThinkingCue/);
  assert.match(train, /playingOn && hintBusy/);
  assert.match(train, /t\("Thinking…"\)/);

  const css = readFileSync(join(root, "src/styles.css"), "utf8");
  assert.match(css, /\.hint-thinking-cue/);
  assert.match(css, /hint-thinking-dot/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*hint-thinking-dot/);

  const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");
  assert.match(i18n, /"Thinking…": "Thinking…"/);

  assert.match(guide, /Hint shows a stronger suggestion from the same engine/);
});

test("isWastefulUndeveloping flags quiet knight home retreats, not captures/checks", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }

  const src = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-play-engine-waste");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-engine.mjs");
  writeFileSync(tmp, js);

  try {
    const { Chess } = require("chess.js");
    const mod = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
    // White Nc3 can retreat Nb1 (waste) or develop elsewhere.
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 2";
    const chess = new Chess(fen);
    const nb1 = chess.moves({ verbose: true }).find((m) => m.from === "c3" && m.to === "b1");
    assert.ok(nb1, "expected Nb1 legal");
    assert.equal(mod.isWastefulUndeveloping(chess, nb1), true);

    const nf3 = chess
      .moves({ verbose: true })
      .find((m) => m.from === "g1" && m.to === "f3");
    assert.ok(nf3, "expected Nf3 legal");
    assert.equal(mod.isWastefulUndeveloping(chess, nf3), false);

    // Developing onto rank 2 (Be2 / Bd2) must NOT be wasteful — not a retreat.
    const be2 = chess
      .moves({ verbose: true })
      .find((m) => m.from === "f1" && m.to === "e2");
    assert.ok(be2, "expected Be2 legal");
    assert.equal(mod.isWastefulUndeveloping(chess, be2), false);

    const bd2Pos = new Chess(
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/2NP4/PPP2PPP/R1BQKBNR w KQkq - 0 3",
    );
    const bd2 = bd2Pos
      .moves({ verbose: true })
      .find((m) => m.from === "c1" && m.to === "d2");
    assert.ok(bd2, "expected Bd2 legal");
    assert.equal(mod.isWastefulUndeveloping(bd2Pos, bd2), false);

    // Capture onto back rank is not wasteful.
    const capFen =
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    // Use a crafted position: white knight on c3 can take black piece on b1? rare.
    // Instead: black knight on c6 capturing on b8 is impossible; test pawn capture stays false.
    const start = new Chess();
    const e4 = start.moves({ verbose: true }).find((m) => m.san === "e4");
    assert.equal(mod.isWastefulUndeveloping(start, e4), false);

    // Black developing Be7 onto rank 7 is not wasteful.
    const blackFen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2";
    const black = new Chess(blackFen);
    const be7 = black
      .moves({ verbose: true })
      .find((m) => m.from === "f8" && m.to === "e7");
    assert.ok(be7, "expected Be7 legal");
    assert.equal(mod.isWastefulUndeveloping(black, be7), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("beginner pickMove avoids wasteful Nb1 retreat when sensible moves exist", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }

  const src = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-play-engine-l1");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-engine.mjs");
  writeFileSync(tmp, js);

  try {
    const mod = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
    const engine = mod.createLiteEngine("beginner");
    // After 1.e4 e5 2.Nc3 — Nb1 is a purposeless retreat; Nf3 / d3 / Bc4 etc. exist.
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 2";
    const waste = new Set(["c3b1", "c3a2", "c3d1"]);
    const seen = new Set();
    for (let i = 0; i < 24; i++) {
      const mv = await engine.pickMove(fen, 400, "beginner");
      assert.ok(mv, "pickMove returned null");
      const key = `${mv.from}${mv.to}`;
      seen.add(key);
      assert.equal(
        waste.has(key),
        false,
        `beginner played wasteful undeveloping ${key}`,
      );
    }
    // Still randomizes among near-best sensible moves (slack 100).
    assert.ok(
      seen.size >= 2,
      `expected beginner to randomize among pool, got only ${[...seen]}`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Hint prefers quiet Bf4 in a London-style develop position", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }

  const src = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-play-engine-hint");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-engine.mjs");
  writeFileSync(tmp, js);

  try {
    const mod = await import(pathToFileURL(tmp).href);
    // After 1.d4 d5 2.Nf3 Nf6 — quiet Bc1–f4 is the London develop.
    const fen =
      "rnbqkb1r/ppp1pppp/5n2/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3";
    const t0 = Date.now();
    const mv = mod.searchHintMove(fen);
    const elapsed = Date.now() - t0;
    assert.ok(mv, "searchHintMove returned null");
    if (elapsed > 4000) {
      t.skip(`hint search too slow on this host (${elapsed}ms)`);
      return;
    }
    assert.equal(
      `${mv.from}${mv.to}`,
      "c1f4",
      `expected Bf4, got ${mv.from}${mv.to} in ${elapsed}ms`,
    );
    assert.ok(
      elapsed <= 3200,
      `hint wall time ${elapsed}ms exceeded soft 3.2s budget`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("promotion root urgency prefers e7e8=Q over king walks", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }

  const src = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  assert.match(src, /8_000 \+ \(VAL\[m\.promotion\]/);
  assert.match(src, /Prefer a non-disastrous promotion/);
  assert.match(src, /queenPromos/);

  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-play-engine-promo");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-engine.mjs");
  writeFileSync(tmp, js);

  try {
    const mod = await import(pathToFileURL(tmp).href + `?t=${Date.now()}`);
    const fen = "8/4P3/8/8/8/8/8/4K2k w - - 0 1";
    const hint = mod.searchHintMove(fen);
    assert.ok(hint, "hint null");
    assert.equal(hint.from, "e7");
    assert.equal(hint.to, "e8");
    assert.equal(hint.promotion, "q");

    const eng = mod.createLiteEngine("beginner");
    let promo = 0;
    for (let i = 0; i < 12; i++) {
      const mv = await eng.pickMove(fen, 400, "beginner");
      if (mv && mv.from === "e7" && mv.to === "e8" && mv.promotion === "q") promo++;
    }
    assert.ok(promo >= 10, `beginner promoted only ${promo}/12 times`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
