import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const hero = src("src/components/opening-lab/home-hero.tsx");
const train = src("src/components/opening-lab/train-view.tsx");
const board = src("src/components/opening-lab/chess-board.tsx");
const css = src("src/styles.css");
const shell = src("src/components/opening-lab/app-shell.tsx");

test("website desktop pack card practices in the frame; play still navigates", () => {
  assert.match(hero, /websiteDesktopFrame/);
  assert.match(hero, /min-width:\s*960px/);
  assert.match(hero, /if \(playApp\) return false/);
  assert.match(hero, /setFrame\(/);
  assert.match(hero, /embedded/);
  assert.match(hero, /frameCoords=\{!playApp\}/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
  assert.match(hero, /interactive=\{false\}/);
  assert.match(hero, /pointer-events-none/);
  assert.match(hero, /Tap to practice/);
  assert.match(shell, /setView\("train"\)/);
});

test("in-frame trainer can expand and collapse without leaving the card", () => {
  assert.match(train, /embedded\?: boolean/);
  assert.match(train, /frameCoords\?: boolean/);
  assert.match(train, /data-frame-practice/);
  assert.match(train, /train-embedded/);
  assert.match(train, /Expand/);
  assert.match(train, /setBoardExpanded\(true\)/);
  assert.match(train, /setBoardExpanded\(false\)/);
  assert.match(train, /Close full screen/);
  assert.match(train, /frameCoords=\{frameCoords && !boardExpanded\}/);
  assert.match(train, /if \(embedded\) return/);
});

test("in-frame practice pulls the buttons up under the move prompt", () => {
  assert.match(hero, /home-sample-meta px-4 pb-2 pt-3\.5\$\{frame \? " hidden"/);
  assert.match(train, /train-frame-notation/);
  assert.match(train, /train-frame-status/);
  assert.match(train, /min-h-\[3\.2em\]/);
  assert.match(css, /\.train-frame-below \.train-frame-notation/);
  assert.match(css, /margin-top:\s*0\.3rem/);
  assert.match(css, /\.train-frame-below \.train-frame-status/);
  assert.match(css, /min-height:\s*1\.35em/);
  assert.match(css, /margin-bottom:\s*0\.2rem/);
});

test("pack-frame coordinates sit on the wood margin, not on the squares", () => {
  assert.match(board, /frameCoords\?: boolean/);
  assert.match(board, /board-frame--margin-coords/);
  assert.match(board, /board-margin-ranks/);
  assert.match(board, /board-margin-files/);
  assert.match(board, /!frameCoords && r === 7/);
  assert.match(board, /!frameCoords && c === 0/);
  assert.match(board, /sq-coord--on-light/);
  assert.match(css, /\.board-frame\.board-frame--margin-coords/);
  assert.match(css, /\.board-margin-label/);
  assert.match(css, /grid-template-columns:\s*0\.95rem minmax\(0, 1fr\)/);
});
