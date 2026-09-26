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

test("website home shows the puzzle card only outside the Play wrap", () => {
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const view = src("src/components/opening-lab/puzzle-view.tsx");
  const copy = src("src/lib/puzzle-copy.ts");
  const joined = [landing, shell, view, src("src/lib/lab-puzzle.ts")].join("\n");

  assert.match(landing, /data-landing-puzzle/);
  assert.match(landing, /setShowPuzzle\(!isPlayApp\(\)\)/);
  assert.match(landing, /showPuzzle \?/);
  assert.match(landing, /t\("Today's puzzle"\)/);
  assert.match(landing, /t\("White to move · Mate in 2"\)/);
  assert.match(shell, /view === "puzzle" && !playSurface/);
  assert.match(shell, /onOpenPuzzle/);
  assert.doesNotMatch(shell, /FindMate/);
  assert.doesNotMatch(shell, /onOpenMate/);
  assert.match(view, /data-puzzle-retry/);
  assert.match(view, /data-puzzle-hint/);
  assert.doesNotMatch(view, /chesspuzzles/i);
  assert.doesNotMatch(joined, /chesspuzzles/i);
  assert.doesNotMatch(joined, /Play on|versus the computer|vs computer/i);
  assert.doesNotMatch(view, /stripe|play-billing|Play Billing/i);

  for (const lang of ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"]) {
    assert.match(copy, new RegExp(`\\n  ${lang}:`));
  }
  assert.equal(copy.split('"Today\'s puzzle":').length - 1, 12);
  assert.equal(copy.split('"Mate in 2":').length - 1, 12);
});
