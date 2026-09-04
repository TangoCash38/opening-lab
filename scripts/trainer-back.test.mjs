import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const train = readFileSync(
  join(root, "src/components/opening-lab/train-view.tsx"),
  "utf8",
);
const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");

test("trainer Back/Forward review the board without a Take back button", () => {
  assert.match(train, /t\("Back"\)/);
  assert.match(train, /t\("Forward"\)/);
  assert.match(train, /aria-label=\{t\("Back"\)\}/);
  assert.match(train, /aria-label=\{t\("Forward"\)\}/);
  assert.match(train, /onClick=\{stepBack\}/);
  assert.match(train, /onClick=\{stepForward\}/);
  assert.doesNotMatch(train, /Take back/);
  assert.doesNotMatch(train, /takeBackPlyCount/);
  assert.doesNotMatch(train, /canTakeBack/);
});

test("trainer shows {pct}% complete through the book line", () => {
  assert.match(train, /t\("\{pct\}% complete"/);
  assert.match(train, /plyIndex \/ bookLen/);
  assert.match(train, /!playingOn \? \(/);
});

test("viewPly is wired as a view-only cursor on the live ply", () => {
  assert.match(train, /const \[viewPly, setViewPly\] = useState\(0\)/);
  assert.match(train, /const livePly = playingOn \? game\.history\(\)\.length : plyIndex/);
  assert.match(train, /setViewPly\(\(v\) => \(livePly > v \|\| livePly === 0 \? livePly : v\)\)/);
  assert.match(train, /replaySans\(line\.plies, viewPly\)/);
  assert.match(train, /const viewingHistory = viewPly !== livePly/);
  assert.match(train, /!viewingHistory/);
  assert.match(train, /game=\{displayGame\}/);
});

test("Back, Forward, and {pct}% complete exist in all 12 language dicts", () => {
  assert.equal(i18n.split("\n  Back: ").length - 1, 12);
  assert.equal(i18n.split("\n  Forward: ").length - 1, 12);
  assert.equal(i18n.split('"{pct}% complete":').length - 1, 12);
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

test("Play on preserves chess.js history (no FEN-rebase commits)", () => {
  const train = read("src/components/opening-lab/train-view.tsx");
  assert.match(train, /function cloneAndMove/);
  assert.match(train, /function safeMove/);
  assert.match(train, /replaySans\(line\.plies, line\.plies\.length\)/);
  assert.doesNotMatch(train, /new Chess\(game\.fen\(\)\)/);
  assert.match(train, /setEngineBusy\(false\)/);
});
