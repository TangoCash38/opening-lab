import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const BLACK_FEN =
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2";

const train = src("src/components/opening-lab/train-view.tsx");
const modal = src("src/components/opening-lab/line-result-modal.tsx");
const client = src("src/lib/practice-review-eval.ts");
const author = src("src/components/opening-lab/create-own-view.tsx");
const i18n = src("src/lib/i18n.ts");
const server = src("src/lib/practice-review-eval.server.ts");

function loadClient() {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    return null;
  }
  const js = ts.transpileModule(client, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-practice-review-sheet");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "practice-review-eval.mjs");
  writeFileSync(tmp, js);
  return { dir, href: pathToFileURL(tmp).href };
}

test("Why this move and Practice review sheet are gone from the product", () => {
  assert.doesNotMatch(train, /PracticeReviewSheet/);
  assert.doesNotMatch(train, /whyThisMoveLabel/);
  assert.doesNotMatch(train, /onWhyThisMove/);
  assert.doesNotMatch(train, /setPracticeReview/);
  assert.doesNotMatch(train, /Why this move/);
  assert.doesNotMatch(modal, /whyThisMoveLabel/);
  assert.doesNotMatch(modal, /onWhyThisMove/);
  assert.doesNotMatch(modal, /data-why-this-move/);
  assert.doesNotMatch(modal, /reviewOpen/);
  assert.doesNotMatch(src("src/styles.css"), /\.practice-review-sheet/);
  assert.doesNotMatch(src("src/styles.css"), /\.line-result-why-btn/);
  try {
    readFileSync(join(root, "src/components/opening-lab/practice-review-sheet.tsx"));
    assert.fail("practice-review-sheet.tsx should be removed");
  } catch (err) {
    assert.equal(err.code, "ENOENT");
  }
});

test("authoring reuses POST /api/practice-review-eval at depth 12; fail-soft hides hints", () => {
  assert.match(author, /fetchPracticeReviewEval\(fen, \{ depth: GYM_AUTHOR_DEPTH \}\)/);
  assert.match(author, /GYM_AUTHOR_DEPTH/);
  assert.match(author, /GYM_AUTHOR_DEBOUNCE_MS/);
  assert.match(author, /t\("Engine · suggesting…"\)/);
  assert.match(author, /result\.ok/);
  assert.match(author, /setSuggest\(null\)/);
  assert.doesNotMatch(author, /SF cloud/i);
  assert.doesNotMatch(author, /Stockfish cloud/i);
  assert.doesNotMatch(author, /Lichess/i);
  assert.doesNotMatch(author, /stockfish\.wasm/i);
  assert.doesNotMatch(author, /from ["']@\/lib\/play-engine/);
  assert.doesNotMatch(train, /fetchPracticeReviewEval/);
  assert.doesNotMatch(train, /Engine · suggesting/);
  assert.doesNotMatch(train, /t\("Engine/);
  assert.doesNotMatch(train, /SF cloud|Stockfish cloud|Lichess/i);
  assert.doesNotMatch(train, /data-create-own-engine/);
});

test("client Engine path is POST /api/practice-review-eval; no WASM / play-engine", () => {
  assert.match(client, /PRACTICE_REVIEW_EVAL_PATH = "\/api\/practice-review-eval"/);
  assert.match(client, /method: "POST"/);
  assert.match(client, /JSON.stringify\(payload\)/);
  assert.match(client, /Product copy: "Engine"/);
  assert.doesNotMatch(client, /from ["']@\/lib\/play-engine/);
  assert.doesNotMatch(client, /from ["']stockfish/);
  assert.doesNotMatch(client, /stockfish\.wasm/i);
  assert.doesNotMatch(client, /lichess\.org\/api/);
  assert.doesNotMatch(client, /child_process/);
  assert.doesNotMatch(server, /from ["']@\/lib\/practice-review-eval["']/);
  assert.match(i18n, /"Engine · suggesting…": "Engine · suggesting…"/);
});

test("eval formatters and fail-soft parse (client)", async (t) => {
  const loaded = loadClient();
  if (!loaded) {
    t.skip("typescript not installed");
    return;
  }
  try {
    const mod = await import(loaded.href);
    assert.equal(mod.formatEvalLabel(32, null, START_FEN), "+0.3");
    assert.equal(mod.formatEvalLabel(30, null, BLACK_FEN), "-0.3");
    assert.equal(mod.formatEvalLabel(null, 2, START_FEN), "M2");
    assert.equal(mod.formatPvLine(BLACK_FEN, ["Bd6", "Bg3", "O-O"]), "2...Bd6 3.Bg3 O-O");
    const arrow = mod.firstMoveSquares(START_FEN, "e4");
    assert.deepEqual(arrow, { from: "e2", to: "e4" });
    const arrows = mod.arrowsFromPvs(START_FEN, [
      { multipv: 1, scoreCp: 32, mate: null, san: ["e4", "e5"] },
      { multipv: 2, scoreCp: 28, mate: null, san: ["d4"] },
    ]);
    assert.deepEqual(arrows, [
      { from: "e2", to: "e4", kind: "pv1" },
      { from: "d2", to: "d4", kind: "pv2" },
    ]);

    assert.deepEqual(mod.parsePracticeReviewJson({ ok: false, error: "Engine unavailable" }), {
      ok: false,
      error: "Engine unavailable",
    });
    assert.equal(mod.parsePracticeReviewJson({ ok: true, pvs: [] }).ok, false);
    const ok = mod.parsePracticeReviewJson({
      ok: true,
      evalCp: 32,
      mate: null,
      pvs: [
        { multipv: 1, scoreCp: 32, mate: null, san: ["e4"] },
        { multipv: 2, scoreCp: 28, mate: null, san: ["d4"] },
      ],
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.evalCp, 32);
    assert.equal(ok.pvs.length, 2);

    const pct = mod.evalBarWhitePct(30);
    assert.ok(pct > 50 && pct < 70);

    const origFetch = globalThis.fetch;
    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(String(init.body));
      assert.equal(body.fen, START_FEN);
      assert.equal(body.depth, 12);
      throw new Error("network");
    };
    const netFail = await mod.fetchPracticeReviewEval(START_FEN, { depth: 12 });
    globalThis.fetch = origFetch;
    assert.deepEqual(netFail, { ok: false, error: "Engine unavailable" });
  } finally {
    rmSync(loaded.dir, { recursive: true, force: true });
  }
});
