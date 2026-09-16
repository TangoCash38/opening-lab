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
const sheet = src("src/components/opening-lab/practice-review-sheet.tsx");
const client = src("src/lib/practice-review-eval.ts");
const board = src("src/components/opening-lab/chess-board.tsx");
const css = src("src/styles.css");
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

test("Practice-only Why this move entry; Test never opens the review sheet", () => {
  assert.match(train, /PracticeReviewSheet/);
  assert.match(train, /whyThisMoveLabel=\{mode === "learn" \? t\("Why this move\?"\) : undefined\}/);
  assert.match(train, /onWhyThisMove=\{\s*mode === "learn"/);
  assert.match(train, /setPracticeReview/);
  assert.match(train, /practiceReview && mode === "learn"/);
  assert.doesNotMatch(train, /mode === "practice"[\s\S]{0,80}Why this move/);
  assert.doesNotMatch(train, /playingOn[\s\S]{0,40}PracticeReviewSheet/);

  const modalCall = train.slice(
    train.indexOf("<LineResultModal"),
    train.indexOf("</LineResultModal>"),
  );
  assert.match(modalCall, /mode === "learn"/);
  assert.doesNotMatch(modalCall, /mode === "practice" \? t\("Why this move\?"\)/);

  const wrongs = [];
  let from = 0;
  while (true) {
    const start = train.indexOf('kind: "wrong",', from);
    if (start < 0) break;
    const end = train.indexOf("});", start);
    wrongs.push(train.slice(start, end + 3));
    from = start + 1;
  }
  assert.equal(wrongs.length, 2);
  for (const w of wrongs) {
    assert.doesNotMatch(w, /Why this move/);
    assert.doesNotMatch(w, /practiceReview/);
  }

  assert.match(modal, /whyThisMoveLabel\?/);
  assert.match(modal, /onWhyThisMove\?/);
  assert.match(modal, /data-why-this-move/);
  assert.match(modal, /Practice-only opt-in Engine review/);
  assert.match(modal, /Never passed from Test/);
});

test("review sheet matches Practice UI mock and fail-softs Engine miss", () => {
  assert.match(sheet, /data-practice-review-sheet/);
  assert.match(sheet, /Practice · review/);
  assert.match(sheet, /Why this move\?/);
  assert.match(sheet, /data-practice-review-why/);
  assert.match(sheet, /data-practice-review-eval-bar/);
  assert.match(sheet, /data-practice-review-pvs/);
  assert.match(sheet, /data-practice-review-back/);
  assert.match(sheet, /data-practice-review-close/);
  assert.match(sheet, /Back to Practice/);
  assert.match(sheet, /t\("Close"\)/);
  assert.match(sheet, /fetchPracticeReviewEval/);
  assert.match(sheet, /setEvalOk\(result\.ok \? result : null\)/);
  assert.match(sheet, /data-practice-review-eval=\{showEval \? "ok" : ready \? "hidden" : "loading"\}/);
  assert.match(sheet, /showEval \? \(/);
  assert.match(sheet, /t\("Engine"\)/);
  assert.match(sheet, /useOverlayHistory\(true, onClose, "practice-review"\)/);
  assert.match(sheet, /data-board-theme="book"/);
  assert.match(sheet, /arrows=\{arrows\}/);
  assert.doesNotMatch(sheet, /Stockfish cloud/i);
  assert.doesNotMatch(sheet, /Lichess Analysis/i);
  assert.doesNotMatch(sheet, /stockfish\.wasm/i);
  assert.doesNotMatch(sheet, /from ["']@\/lib\/play-engine/);
  assert.doesNotMatch(sheet, /from ["']@\/lib\/practice-review-eval\.server/);

  assert.match(css, /\.practice-review-overlay/);
  assert.match(css, /\.practice-review-sheet/);
  assert.match(css, /\.practice-review-eval-track/);
  assert.match(css, /\.practice-review-pv\.is-pv1/);
  assert.match(css, /--color-accent/);
  assert.match(css, /\.board-arrow--pv1/);
  assert.match(css, /\.board-arrow--pv2/);
  assert.match(css, /#f3e5c8/);
  assert.doesNotMatch(sheet, /bg-neutral-900/);
  assert.doesNotMatch(css, /\.practice-review-sheet[\s\S]{0,80}#111/);

  assert.match(board, /arrows\?: BoardArrow\[\]/);
  assert.match(board, /data-board-arrows/);
  assert.match(board, /board-arrow--pv1/);
});

test("client Engine path is POST /api/practice-review-eval; no WASM / play-engine", () => {
  assert.match(client, /PRACTICE_REVIEW_EVAL_PATH = "\/api\/practice-review-eval"/);
  assert.match(client, /method: "POST"/);
  assert.match(client, /JSON\.stringify\(\{ fen \}\)/);
  assert.match(client, /Product copy: "Engine"/);
  assert.doesNotMatch(client, /from ["']@\/lib\/play-engine/);
  assert.doesNotMatch(client, /from ["']stockfish/);
  assert.doesNotMatch(client, /stockfish\.wasm/i);
  assert.doesNotMatch(client, /lichess\.org\/api/);
  assert.doesNotMatch(client, /child_process/);
  assert.doesNotMatch(server, /from ["']@\/lib\/practice-review-eval["']/);
  assert.match(i18n, /"Why this move\?": "Why this move\?"/);
  assert.equal(i18n.split('"Why this move?":').length - 1, 12);
  assert.equal(i18n.split('"Practice · review":').length - 1, 12);
  assert.equal(i18n.split('"Back to Practice":').length - 1, 12);
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
    globalThis.fetch = async () => {
      throw new Error("network");
    };
    const netFail = await mod.fetchPracticeReviewEval(START_FEN);
    globalThis.fetch = origFetch;
    assert.deepEqual(netFail, { ok: false, error: "Engine unavailable" });
  } finally {
    rmSync(loaded.dir, { recursive: true, force: true });
  }
});
