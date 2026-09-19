import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

const gymSrc = src("src/lib/gym-line.ts");
const author = src("src/components/opening-lab/create-own-view.tsx");
const train = src("src/components/opening-lab/train-view.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");
const catalog = src("src/lib/catalog.ts");
const packs = src("src/data/packs.ts");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const readme = src("README.md");

function loadGym() {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    return null;
  }
  const js = ts.transpileModule(gymSrc, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-gym-line");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "gym-line.mjs");
  writeFileSync(tmp, js);
  return { dir, href: pathToFileURL(tmp).href };
}

test("gym line storage helpers format SAN chips and stay off the catalog", async (t) => {
  assert.match(gymSrc, /GYM_PACK_ID = "gym-line"/);
  assert.match(gymSrc, /GYM_STORAGE_KEY = "opening-lab:gym-line"/);
  assert.match(gymSrc, /GYM_AUTHOR_DEPTH = 12/);
  assert.match(gymSrc, /GYM_AUTHOR_DEBOUNCE_MS = 400/);
  assert.match(gymSrc, /export function undoAuthorPlies/);
  assert.match(gymSrc, /export function hasUnsavedAuthorPlies/);
  assert.doesNotMatch(catalog, /gym-line/);
  assert.doesNotMatch(packs, /id: "gym-line"/);
  assert.match(catalog, /VISIBLE_PACK_IDS = \[/);

  const loaded = loadGym();
  if (!loaded) {
    t.skip("typescript not installed");
    return;
  }
  try {
    const mod = await import(loaded.href);
    assert.equal(mod.formatGymSan(["e4", "e5", "Nf3", "Nc6"]), "1.e4 e5 2.Nf3 Nc6");
    assert.deepEqual(
      mod.gymSanChips(["e4", "e5", "Nf3", "Nc6"]).map((c) => c.label),
      ["1.e4", "e5", "2.Nf3", "Nc6"],
    );
    const parsed = mod.parseGymLine({
      plies: ["e4", "e5"],
      side: "b",
      rememberedAt: 1,
    });
    assert.equal(parsed.side, "b");
    assert.deepEqual(parsed.plies, ["e4", "e5"]);
    assert.equal(mod.parseGymLine({ plies: [], side: "w" }), null);
    const pack = mod.gymPackFromLine(parsed);
    assert.equal(pack.id, "gym-line");
    assert.equal(pack.lines[0].id, "gym-1");
    assert.equal(pack.lines[0].side, "b");
    assert.equal(mod.isGymPack(pack), true);
    assert.equal(mod.isGymPack("scotch"), false);
    assert.deepEqual(mod.undoAuthorPlies(["e4", "e5", "Nf3"]), ["e4", "e5"]);
    assert.deepEqual(mod.undoAuthorPlies(["e4"]), []);
    assert.deepEqual(mod.undoAuthorPlies([]), []);
    assert.equal(mod.hasUnsavedAuthorPlies([], null), false);
    assert.equal(mod.hasUnsavedAuthorPlies(["e4"], null), true);
    assert.equal(mod.hasUnsavedAuthorPlies(["e4", "e5"], parsed), false);
    assert.equal(mod.hasUnsavedAuthorPlies(["e4"], parsed), true);
    assert.equal(mod.hasUnsavedAuthorPlies(["e4", "e5", "Nf3"], parsed), true);
    assert.equal(mod.hasUnsavedAuthorPlies([], parsed), false);
  } finally {
    rmSync(loaded.dir, { recursive: true, force: true });
  }
});

test("Create-your-own author / remember copy matches the shipped mocks", () => {
  assert.match(author, /Create your own/);
  assert.match(author, /Build a line, then train it\./);
  assert.match(author, /Remember this line/);
  assert.match(author, /Keep editing/);
  assert.match(author, /Practice this line/);
  assert.match(author, /Test unlocks after a clean Practice\./);
  assert.match(author, /formatGymSan\(line\.plies\)/);
  assert.match(
    author,
    /Remembered — \{san\} — locked as your gym line\. Train it like a pack\./,
  );
  assert.match(author, /data-create-own-remembered-san=\{san\}/);
  assert.match(author, /Curated packs stay in the store/);
  assert.match(author, /data-create-own/);
  assert.match(author, /data-create-own-remembered/);
  assert.match(author, /data-create-own-identity/);
  assert.match(author, /data-create-own-eval-bar/);
  assert.match(author, /data-create-own-pvs/);
  assert.match(author, /lookupOpeningIdentityPrefix/);
  assert.match(author, /formatOpeningIdentity/);
  assert.match(author, /formatEvalLabel/);
  assert.match(author, /evalBarWhitePct/);
  assert.match(author, /formatPvLine/);
  assert.match(author, /arrowsFromPvs/);
  assert.match(author, /Opening…/);
  assert.match(author, /MultiPV · Top lines/);
  assert.match(author, /Your line · build move by move/);
  assert.match(author, /data-board-theme="book"/);
  assert.match(author, /olOverlay: "gym-remember"/);
  assert.match(author, /onHome/);
  assert.match(author, /data-create-own-home/);
  assert.match(author, /data-create-own-back/);
  assert.match(author, /data-create-own-leave/);
  assert.match(author, /t\("Home"\)/);
  assert.match(author, /t\("Back"\)/);
  assert.match(author, /t\("Discard unsaved moves\?"\)/);
  assert.match(author, /disabled=\{plies\.length === 0\}/);
  assert.match(author, /undoAuthorPlies/);
  assert.match(author, /hasUnsavedAuthorPlies/);
  assert.match(author, /stepBack/);
  assert.match(author, /requestHome/);
  assert.doesNotMatch(author, /useOverlayHistory\(/);
  assert.doesNotMatch(author, /SF cloud/i);
  assert.doesNotMatch(author, /Stockfish/i);
  assert.doesNotMatch(author, /Lichess/i);
  assert.match(i18n, /"Create your own": "Create your own"/);
  assert.match(i18n, /"Engine · suggesting…": "Engine · suggesting…"/);
  assert.match(i18n, /"Opening…": "Opening…"/);
  assert.match(i18n, /"MultiPV · Top lines": "MultiPV · Top lines"/);
  assert.match(
    i18n,
    /"Remembered — \{san\} — locked as your gym line\. Train it like a pack\.":\s*"Remembered — \{san\} — locked as your gym line\. Train it like a pack\."/,
  );
  assert.doesNotMatch(i18n, /SF cloud|Stockfish cloud|Lichess/i);
  assert.match(css, /\.create-own-remember-sheet/);
  assert.match(css, /\.create-own-identity/);
  assert.match(css, /\.create-own-eval-track/);
  assert.match(css, /\.create-own-pvs/);
  assert.match(css, /\.create-own-home/);
  assert.match(css, /\.create-own-back/);
  assert.match(readme, /Create your own \(web\)/);
  assert.match(readme, /opening-identity/);
});

test("authoring Back / Home exist in all 12 language dicts", () => {
  assert.equal(i18n.split("\n  Home: ").length - 1, 12);
  assert.equal(i18n.split("\n  Discard: ").length - 1, 12);
  assert.equal(i18n.split('"Discard unsaved moves?":').length - 1, 12);
  for (const lang of [
    "en",
    "es",
    "zh",
    "fr",
    "de",
    "pt",
    "ru",
    "it",
    "hi",
    "ja",
    "ar",
    "tr",
  ]) {
    assert.match(i18n, new RegExp(`const ${lang}: Dict`));
  }
});

test("Practice/Test gym chrome has no Engine badge; Test stays locked until Practice", () => {
  assert.match(train, /gym\?: boolean/);
  assert.match(train, /testLocked\?: boolean/);
  assert.match(train, /Yours · remembered/);
  assert.match(train, /My line · Black/);
  assert.match(train, /if \(m === "practice" && lockTest\) return/);
  assert.match(train, /disabled=\{lockTest\}/);
  assert.doesNotMatch(train, /Engine · suggesting/);
  assert.doesNotMatch(train, /t\("Engine/);
  assert.doesNotMatch(train, /SF cloud|Stockfish cloud|Lichess/i);
  assert.doesNotMatch(train, /fetchPracticeReviewEval/);
  assert.doesNotMatch(train, /data-create-own-engine/);
  assert.doesNotMatch(train, /data-create-own-eval-bar/);
  assert.doesNotMatch(train, /data-create-own-pvs/);
  assert.doesNotMatch(train, /MultiPV · Top lines/);
  assert.doesNotMatch(train, /evalBarWhitePct/);
  assert.match(train, /lookupOpeningIdentityPrefix/);
  assert.match(train, /data-create-own-train-identity/);
  assert.match(shell, /gym=\{isGymPack\(active\.pack\)\}/);
  assert.match(shell, /testLocked=/);
  assert.match(shell, /CreateOwnView/);
  assert.match(shell, /onHome=\{goHome\}/);
  assert.match(shell, /playSurface && view === "create"/);
  assert.match(list, /CreateOwnEntry/);
  assert.match(list, /!wrap && onCreateOwn/);
  assert.doesNotMatch(list, /onCreateOwn=\{/);
});
