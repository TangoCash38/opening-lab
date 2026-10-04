import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const src = (rel) => readFileSync(join(root, rel), "utf8");

const FEN = "6k1/5ppp/4pb2/8/r7/6Q1/2b1qPPP/4R1K1 w - - 0 1";

async function loadLabPuzzle(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const js = ts.transpileModule(src("src/lib/lab-puzzle.ts"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-lab-puzzle");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "lab-puzzle.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

test("starter mate in 2 is Qb8+ Bd8 Qxd8# and not mate in 1", async (t) => {
  const mod = await loadLabPuzzle(t);
  if (!mod) return;

  const puzzles = mod.labPuzzles();
  assert.equal(puzzles.length, 1);
  const puzzle = mod.starterPuzzle();
  assert.equal(puzzle.fen, FEN);
  assert.equal(puzzle.side, "w");
  assert.equal(puzzle.mateIn, 2);
  assert.deepEqual(puzzle.line, ["Qb8+", "Bd8", "Qxd8#"]);
  assert.equal(puzzle.label, "Mate in 2");
  assert.equal(mod.verifyLabPuzzle(puzzle), null);
  assert.deepEqual(mod.legalRepliesAfter(FEN, "Qb8+"), ["Bd8"]);

  const game = new Chess(FEN);
  assert.equal(game.move("Qb8+")?.san, "Qb8+");
  assert.deepEqual(game.moves(), ["Bd8"]);
  assert.equal(game.move("Bd8")?.san, "Bd8");
  assert.equal(game.move("Qxd8#")?.san, "Qxd8#");
  assert.equal(game.isCheckmate(), true);

  const start = new Chess(FEN);
  const mateInOne = start.moves({ verbose: true }).some((move) => {
    const next = new Chess(FEN);
    next.move(move);
    return next.isCheckmate();
  });
  assert.equal(mateInOne, false);
});

test("website no longer links to or routes the daily puzzle", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const menu = src("src/components/opening-lab/landing-menu.tsx");
  const homeMenu = src("src/components/opening-lab/home-menu.tsx");
  const routes = src("src/routes/index.tsx");

  assert.equal(landing.indexOf("data-landing-puzzle"), -1);
  assert.doesNotMatch(landing, /Today's puzzle|onOpenPuzzle|showPuzzle|White to move · Mate in 2/);
  assert.doesNotMatch(shell, /PuzzleView|onOpenPuzzle|setView\("puzzle"\)|view === "puzzle"/);
  assert.doesNotMatch(menu, /Today's puzzle|Daily Puzzle|onOpenPuzzle|data-menu-puzzle/);
  assert.doesNotMatch(homeMenu, /Today's puzzle|Daily Puzzle|onOpenPuzzle|data-menu-puzzle/);
  assert.doesNotMatch(routes, /puzzle-view|Today's puzzle|Daily Puzzle/);
  assert.match(landing, /data-landing-square-memory/);
  assert.match(landing, /data-landing-recall/);
  assert.doesNotMatch(landing, /data-landing-classic|Fischer vs Sherwin/);
});
