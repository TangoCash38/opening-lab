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
  assert.match(author, /locked as your gym line/);
  assert.match(author, /Curated packs stay in the store/);
  assert.match(author, /data-create-own/);
  assert.match(author, /data-create-own-remembered/);
  assert.match(author, /data-board-theme="book"/);
  assert.match(author, /olOverlay: "gym-remember"/);
  assert.doesNotMatch(author, /useOverlayHistory\(/);
  assert.doesNotMatch(author, /SF cloud/i);
  assert.doesNotMatch(author, /Stockfish/i);
  assert.doesNotMatch(author, /Lichess/i);
  assert.match(i18n, /"Create your own": "Create your own"/);
  assert.match(i18n, /"Engine · suggesting…": "Engine · suggesting…"/);
  assert.match(css, /\.create-own-remember-sheet/);
  assert.match(readme, /Create your own \(web\)/);
});

test("Practice/Test gym chrome has no Engine badge; Test stays locked until Practice", () => {
  assert.match(train, /gym\?: boolean/);
  assert.match(train, /testLocked\?: boolean/);
  assert.match(train, /Yours · remembered/);
  assert.match(train, /My line · Black/);
  assert.match(train, /if \(m === "practice" && testLocked\) return/);
  assert.match(train, /disabled=\{testLocked\}/);
  assert.doesNotMatch(train, /Engine · suggesting/);
  assert.doesNotMatch(train, /SF cloud/i);
  assert.doesNotMatch(train, /fetchPracticeReviewEval/);
  assert.match(shell, /gym=\{isGymPack\(active\.pack\)\}/);
  assert.match(shell, /testLocked=/);
  assert.match(shell, /CreateOwnView/);
  assert.match(shell, /playSurface && view === "create"/);
  assert.match(list, /CreateOwnEntry/);
  assert.match(list, /!wrap && onCreateOwn/);
  assert.doesNotMatch(list, /onCreateOwn=\{/);
});
