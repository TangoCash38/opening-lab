import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

async function loadFindMate(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }

  const src = readFileSync(join(root, "src/lib/find-mate.ts"), "utf8");
  const js = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  const dir = join(root, "scripts", ".generated-find-mate");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "find-mate.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

test("Find the mate bank has 10 puzzles and every one passes the strengthened gate", async (t) => {
  const mod = await loadFindMate(t);
  if (!mod) return;

  const bank = mod.matePuzzleBank();
  assert.equal(bank.length, 10);
  assert.equal(mod.MATE_SET_SIZE, 10);
  assert.equal(mod.MATE_BATCH_SIZE, 5);

  for (const puzzle of bank) {
    assert.equal(
      mod.isUniqueMateInOne(puzzle),
      true,
      `${puzzle.id} must pass isUniqueMateInOne`,
    );
  }

  const pool = mod.matePuzzles();
  assert.equal(pool.length, 10, "filtered pool must keep all bank puzzles");

  const sides = new Set(bank.map((p) => p.side));
  assert.ok(sides.has("w") && sides.has("b"), "bank must mix White and Black");
});

test("strengthened gate rejects opponent-already-in-check (illegal Boden-style)", async (t) => {
  const mod = await loadFindMate(t);
  if (!mod) return;

  // Historical illegal boden-b: Bf4 already checks Kc1 on Black's turn.
  const illegal = {
    id: "boden-b-illegal",
    fen: "2kr1b1r/pp3ppp/2p5/8/2b2b2/8/P1P2PPP/1NK5 b - - 0 1",
    san: "Ba3#",
    side: "b",
  };
  assert.equal(mod.opponentIsInCheck(illegal.fen), true);
  assert.equal(mod.isUniqueMateInOne(illegal), false);

  const illegalW = {
    id: "boden-w-illegal",
    fen: "1nkr4/p1p2ppp/2p5/5B2/8/8/PPP2PPP/2K2B2 w - - 0 1",
    san: "Ba6#",
    side: "w",
  };
  assert.equal(mod.opponentIsInCheck(illegalW.fen), true);
  assert.equal(mod.isUniqueMateInOne(illegalW), false);
});

test("5-a-day / 24h lock constants and reminder helpers remain exported", async (t) => {
  const mod = await loadFindMate(t);
  if (!mod) return;

  assert.equal(mod.MATE_LOCK_MS, 24 * 60 * 60 * 1000);
  assert.equal(typeof mod.loadMateSession, "function");
  assert.equal(typeof mod.saveMateProgress, "function");
  assert.equal(typeof mod.markMateReminderAsked, "function");
  assert.equal(typeof mod.readMateReminderState, "function");
  assert.equal(typeof mod.formatUnlockRemaining, "function");
});
