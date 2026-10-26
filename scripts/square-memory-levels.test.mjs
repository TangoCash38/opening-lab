import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

function pieceLetters(fen) {
  const board = fen.split(" ")[0] ?? "";
  return [...board].filter((ch) => /[pnbrqk]/i.test(ch)).length;
}

function readPositions() {
  const text = src("src/lib/square-memory-positions.ts");
  const rows = [];
  const re =
    /id:\s*"([^"]+)"\s*,\s*level:\s*(\d)\s*,\s*name:\s*"([^"]+)"\s*,\s*fen:\s*"([^"]+)"/g;
  for (const match of text.matchAll(re)) {
    rows.push({
      id: match[1],
      level: Number(match[2]),
      name: match[3],
      fen: match[4],
    });
  }
  return rows;
}

async function loadLevels(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const source = src("src/lib/square-memory-levels.ts").replaceAll(
    '@/lib/square-memory-positions',
    "./square-memory-positions.mjs",
  );
  const positions = src("src/lib/square-memory-positions.ts");
  const dir = join(root, "scripts", ".generated-square-memory-levels");
  mkdirSync(dir, { recursive: true });
  const compile = (name, code) => {
    const js = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const file = join(dir, name);
    writeFileSync(file, js);
    return file;
  };
  compile("square-memory-positions.mjs", positions);
  const logic = compile("square-memory-levels.mjs", source);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(logic).href);
}

test("fifty Square Memory positions pass python-chess", () => {
  const rows = readPositions();
  assert.equal(rows.length, 50);
  const ids = new Set(rows.map((row) => row.id));
  const names = new Set(rows.map((row) => row.name));
  assert.equal(ids.size, 50);
  assert.equal(names.size, 50);
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const expect = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 10 };
  for (const row of rows) {
    assert.ok(row.name.trim().length > 0, row.id);
    assert.equal(pieceLetters(row.fen), expect[row.level], row.id);
    counts[row.level] += 1;
  }
  assert.deepEqual(counts, { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10 });

  const script = join(root, "scripts", "square-memory-levels-validate.py");
  const result = spawnSync("python3", [script], {
    input: JSON.stringify(rows),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
});

test("a new puzzle skips the diagram just played", async (t) => {
  const mod = await loadLevels(t);
  if (!mod) return;
  assert.deepEqual(mod.PIECE_COUNTS, { 1: 3, 2: 4, 3: 5, 4: 6, 5: 10 });
  assert.ok(mod.SHOW_MS[1] < mod.SHOW_MS[2]);
  assert.ok(mod.SHOW_MS[2] < mod.SHOW_MS[3]);
  assert.ok(mod.SHOW_MS[3] < mod.SHOW_MS[4]);
  assert.ok(mod.SHOW_MS[4] < mod.SHOW_MS[5]);
  assert.equal(mod.LEVEL_BEST_KEY, undefined);
  assert.equal(mod.rememberLevelBest, undefined);

  for (const level of mod.MEMORY_LEVELS) {
    const pool = mod.positionsForLevel(level);
    assert.equal(pool.length, 10);
    for (const position of pool) {
      assert.equal(mod.pieceCount(position.fen), mod.PIECE_COUNTS[level]);
      const again = mod.pickPosition(level, position.id, () => 0);
      assert.notEqual(again.id, position.id);
      assert.equal(again.level, level);
    }
  }

  const original = { e4: "K", e5: "P", e6: "k" };
  assert.equal(mod.boardsMatch(original, { e6: "k", e4: "K", e5: "P" }), true);
  assert.equal(mod.boardsMatch(original, { e4: "K", e5: "P", e7: "k" }), false);
  assert.equal(mod.boardsMatch(original, { e4: "K", e5: "P", e6: "k", d4: "Q" }), false);
});

test("level mode is the page, and the opening-line game stays a side door", () => {
  const page = src("src/routes/square-memory.tsx");
  const view = src("src/components/opening-lab/square-memory-levels.tsx");
  const lines = src("src/components/opening-lab/square-memory.tsx");
  const css = src("src/styles.css");

  assert.match(page, /<SquareMemoryLevels onOpenLines=/);
  assert.match(page, /<SquareMemory \/>/);
  assert.match(page, /useState\(false\)/);
  assert.doesNotMatch(page, /readSquareMemoryPlayPreview|buyPack|checkout|unlock|stripe/i);
  assert.doesNotMatch(page, /window\.location\.replace/);

  assert.match(view, /Well done/);
  assert.match(view, /Next level/);
  assert.match(view, /New puzzle/);
  assert.match(view, /Retry/);
  assert.match(view, />\s*Exit\s*</);
  assert.match(view, /data-sml-lines/);
  assert.match(view, /data-sml-level=/);
  assert.match(view, /Opening lines/);
  assert.doesNotMatch(view, /data-sml-time|formatClearTime|Best |leaderboard|Save time/);
  assert.match(lines, /Well done, you did it!/);
  assert.match(lines, /Not this time/);
  assert.match(lines, /data-square-memory-next/);
  assert.match(lines, /data-square-memory-retry/);
  assert.match(lines, /data-square-memory-exit/);
  assert.doesNotMatch(lines, /sqmem-cheer|PerfectCheer|sqmem-trace|All times|data-square-memory-time|sqmem-score-form/);
  assert.match(src("src/routes/api/square-memory-scores.ts"), /square_memory_scores/);
  assert.doesNotMatch(css, /\[data-square-memory\] \.sqmem-boards/);
  assert.match(view, /RANKS\.map\(\(rank\) =>/);
  assert.match(view, /FILES\.map\(\(file\) =>/);
  assert.doesNotMatch(view, /Big Red|Professor Potato Pie|big-red|coach-seated/);
  assert.doesNotMatch(lines, /Big Red|Professor Potato Pie|sqmem-cheer/);
  assert.match(css, /\.sml-grid\s*\{[^}]*grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /\.sml-grid\s*\{[^}]*grid-template-rows:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@keyframes sml-pop/);
});
