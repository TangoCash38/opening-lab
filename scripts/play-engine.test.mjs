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
    /beginner: \{ thinkMs: 400, depth: 2, randomize: true, slack: 80 \}/,
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
    // d-pawn gone so Qd4 / Qd5 are legal and hang the queen to the e5 pawn.
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPP2PPP/RNBQKBNR w KQkq - 0 3";
    const hung = new Set(["d1d4", "d1d5", "d1d6", "d1d7"]);
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
