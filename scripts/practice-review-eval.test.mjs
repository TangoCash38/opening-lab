import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { PassThrough } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const serverSrc = readFileSync(
  join(root, "src/lib/practice-review-eval.server.ts"),
  "utf8",
);
const routeSrc = readFileSync(
  join(root, "src/routes/api/practice-review-eval.ts"),
  "utf8",
);

function loadModule() {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    return null;
  }
  const js = ts.transpileModule(serverSrc, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-practice-review-eval");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "practice-review-eval.server.mjs");
  writeFileSync(tmp, js);
  return { dir, href: pathToFileURL(tmp).href };
}

function mockSpawn({ lines = [], hang = false, failSpawn = false } = {}) {
  return function spawnImpl() {
    const stdout = new PassThrough();
    const stdin = new PassThrough();
    const proc = new EventEmitter();
    proc.stdin = stdin;
    proc.stdout = stdout;
    proc.killed = false;
    proc.exitCode = null;
    proc.kill = () => {
      proc.killed = true;
      proc.exitCode = 0;
      try {
        stdout.end();
      } catch {
        /* already closed */
      }
      queueMicrotask(() => proc.emit("close", 0));
    };

    if (failSpawn) {
      queueMicrotask(() =>
        proc.emit("error", Object.assign(new Error("ENOENT"), { code: "ENOENT" })),
      );
      return proc;
    }

    stdin.on("data", (chunk) => {
      const text = String(chunk);
      if (text.includes("go depth") && !hang) {
        queueMicrotask(() => {
          for (const line of lines) stdout.write(`${line}\n`);
          stdout.write("bestmove e2e4\n");
        });
      }
    });
    return proc;
  };
}

test("Practice-review Engine stays server-side (no WASM / play-engine / product Stockfish copy)", () => {
  assert.match(serverSrc, /STOCKFISH_PATH/);
  assert.match(serverSrc, /MultiPV/);
  assert.match(serverSrc, /child_process/);
  assert.match(serverSrc, /Do not\s*\n\s*\* ship WASM Stockfish/s);
  assert.match(serverSrc, /never imports play-engine/);
  assert.match(serverSrc, /UI copy\s*\n\s*\* should say "Engine"/s);
  assert.match(serverSrc, /WALL_MS = 2500/);
  assert.match(serverSrc, /DEFAULT_DEPTH = 14/);
  assert.match(serverSrc, /MAX_DEPTH = 16/);
  assert.match(serverSrc, /MIN_DEPTH = 8/);
  assert.doesNotMatch(serverSrc, /from ["']@\/lib\/play-engine/);
  assert.doesNotMatch(serverSrc, /from ["']stockfish/);
  assert.doesNotMatch(serverSrc, /lichess\.org\/api/);
  assert.doesNotMatch(serverSrc, /stockfish\.wasm/i);

  assert.match(routeSrc, /createFileRoute\("\/api\/practice-review-eval"\)/);
  assert.match(routeSrc, /practiceReviewEvalPost/);
  assert.match(routeSrc, /from ["']@\/lib\/practice-review-eval\.server["']/);
  assert.doesNotMatch(routeSrc, /from ["']@\/lib\/play-engine/);

  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(readme, /STOCKFISH_PATH/);
  assert.match(readme, /\/api\/practice-review-eval/);
  assert.match(readme, /Do \*\*not\*\* ship WASM Stockfish/);
  assert.match(readme, /\*\*Engine\*\*/);
});

test("request/response contract: FEN validation, depth clamp, fail-soft, mock MultiPV", async (t) => {
  const loaded = loadModule();
  if (!loaded) {
    t.skip("typescript not installed");
    return;
  }

  try {
    const mod = await import(loaded.href);

    assert.equal(mod.isValidPracticeFen(START_FEN), true);
    assert.equal(mod.isValidPracticeFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1"), true);
    assert.equal(mod.isValidPracticeFen("not-a-fen"), false);
    assert.equal(mod.isValidPracticeFen(""), false);
    assert.equal(mod.isValidPracticeFen("8/8/8/8/8/8/8/8 w - - 0 1"), false);
    assert.equal(mod.isValidPracticeFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"), false);

    assert.equal(mod.clampPracticeReviewDepth(), 14);
    assert.equal(mod.clampPracticeReviewDepth(14), 14);
    assert.equal(mod.clampPracticeReviewDepth(3), 8);
    assert.equal(mod.clampPracticeReviewDepth(99), 16);
    assert.equal(mod.clampPracticeReviewDepth(10.4), 10);

    const badJson = await mod.practiceReviewEvalPost({
      request: new Request("http://local/api/practice-review-eval", {
        method: "POST",
        body: "not-json",
        headers: { "content-type": "application/json" },
      }),
    });
    assert.equal(badJson.status, 400);
    assert.deepEqual(await badJson.json(), { error: "Invalid request" });

    const badFen = await mod.practiceReviewEvalPost({
      request: new Request("http://local/api/practice-review-eval", {
        method: "POST",
        body: JSON.stringify({ fen: "garbage" }),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.equal(badFen.status, 400);
    assert.deepEqual(await badFen.json(), { error: "Invalid FEN" });

    const missingFen = await mod.practiceReviewEvalPost({
      request: new Request("http://local/api/practice-review-eval", {
        method: "POST",
        body: JSON.stringify({ depth: 14 }),
        headers: { "content-type": "application/json" },
      }),
    });
    assert.equal(missingFen.status, 400);
    assert.deepEqual(await missingFen.json(), { error: "Invalid FEN" });

    const noBin = await mod.evaluatePracticeReview(START_FEN, 14, {
      stockfishPath: null,
    });
    assert.equal(noBin.ok, false);
    assert.equal(typeof noBin.error, "string");
    assert.match(noBin.error, /Engine/);

    const prevPath = process.env.STOCKFISH_PATH;
    delete process.env.STOCKFISH_PATH;
    const postNoBin = await mod.practiceReviewEvalPost({
      request: new Request("http://local/api/practice-review-eval", {
        method: "POST",
        body: JSON.stringify({ fen: START_FEN }),
        headers: { "content-type": "application/json" },
      }),
    });
    if (prevPath !== undefined) process.env.STOCKFISH_PATH = prevPath;
    assert.equal(postNoBin.status, 200);
    const postBody = await postNoBin.json();
    if (postBody.ok === true) {
      assert.equal(typeof postBody.evalCp === "number" || postBody.evalCp === null, true);
      assert.ok(Array.isArray(postBody.pvs));
    } else {
      assert.equal(postBody.ok, false);
      assert.equal(typeof postBody.error, "string");
      assert.match(postBody.error, /Engine/);
    }

    const info1 =
      "info depth 14 seldepth 18 multipv 1 score cp 32 time 40 nodes 100 pv e2e4 e7e5 g1f3";
    const info2 =
      "info depth 14 seldepth 16 multipv 2 score cp 28 time 40 nodes 100 pv d2d4 d7d5";
    const parsed1 = mod.parseUciInfoLine(info1);
    const parsed2 = mod.parseUciInfoLine(info2);
    assert.deepEqual(parsed1, {
      multipv: 1,
      scoreCp: 32,
      mate: null,
      uci: ["e2e4", "e7e5", "g1f3"],
    });
    assert.deepEqual(parsed2, {
      multipv: 2,
      scoreCp: 28,
      mate: null,
      uci: ["d2d4", "d7d5"],
    });
    assert.equal(mod.parseUciInfoLine("bestmove e2e4"), null);

    assert.deepEqual(mod.pvUciToSan(START_FEN, ["e2e4", "e7e5", "g1f3"]), [
      "e4",
      "e5",
      "Nf3",
    ]);
    assert.deepEqual(mod.pvUciToSan(START_FEN, ["e2e4", "zzzz", "g1f3"]), ["e4"]);

    const mateLine = mod.parseUciInfoLine(
      "info depth 8 multipv 1 score mate 2 pv f2f7 e8e7 f7e7",
    );
    assert.equal(mateLine.scoreCp, null);
    assert.equal(mateLine.mate, 2);

    const ok = await mod.evaluatePracticeReview(START_FEN, 14, {
      stockfishPath: "/mock/stockfish",
      spawnImpl: mockSpawn({ lines: [info1, info2] }),
      wallMs: 800,
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.evalCp, 32);
    assert.equal(ok.mate, null);
    assert.equal(ok.pvs.length, 2);
    assert.deepEqual(ok.pvs[0], {
      multipv: 1,
      scoreCp: 32,
      mate: null,
      san: ["e4", "e5", "Nf3"],
    });
    assert.deepEqual(ok.pvs[1], {
      multipv: 2,
      scoreCp: 28,
      mate: null,
      san: ["d4", "d5"],
    });

    const spawnFail = await mod.evaluatePracticeReview(START_FEN, 14, {
      stockfishPath: "/missing/stockfish",
      spawnImpl: mockSpawn({ failSpawn: true }),
      wallMs: 400,
    });
    assert.equal(spawnFail.ok, false);
    assert.match(spawnFail.error, /Engine/);

    const timedOut = await mod.evaluatePracticeReview(START_FEN, 14, {
      stockfishPath: "/mock/stockfish",
      spawnImpl: mockSpawn({ hang: true }),
      wallMs: 40,
    });
    assert.equal(timedOut.ok, false);
    assert.match(timedOut.error, /Engine/);
  } finally {
    rmSync(loaded.dir, { recursive: true, force: true });
  }
});

test("live Stockfish smoke (skips if no binary)", async (t) => {
  const loaded = loadModule();
  if (!loaded) {
    t.skip("typescript not installed");
    return;
  }
  try {
    const mod = await import(`${loaded.href}?live=1`);
    const bin = mod.resolveStockfishPath();
    if (!bin) {
      t.skip("no Stockfish binary (set STOCKFISH_PATH)");
      return;
    }
    const result = await mod.evaluatePracticeReview(START_FEN, 8, {
      wallMs: 2500,
    });
    if (!result.ok) {
      t.skip(`Engine fail-soft: ${result.error}`);
      return;
    }
    assert.equal(result.ok, true);
    assert.ok(result.pvs.length >= 1);
    assert.equal(result.pvs[0].multipv, 1);
    assert.ok(
      result.pvs[0].scoreCp !== null || result.pvs[0].mate !== null,
      "PV1 has a score",
    );
    assert.ok(Array.isArray(result.pvs[0].san));
    assert.ok(result.pvs[0].san.length >= 1);
    assert.match(result.pvs[0].san[0], /^[NBRQK]?[a-h]?[1-8]?x?[a-h][1-8]/);
  } finally {
    rmSync(loaded.dir, { recursive: true, force: true });
  }
});
