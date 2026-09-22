import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");
const board = src("src/components/opening-lab/chess-board.tsx");
const css = src("src/styles.css");
const train = src("src/components/opening-lab/train-view.tsx");

test("piece layer remounts on a position jump and clips sprites", () => {
  assert.match(board, /const \[pieceEpoch, setPieceEpoch\] = useState\(0\)/);
  assert.match(board, /if \(jumped\) setPieceEpoch\(\(n\) => n \+ 1\)/);
  assert.match(board, /key=\{pieceEpoch\}/);
  assert.match(
    board,
    /className="piece-layer pointer-events-none absolute inset-0 z-10 overflow-hidden"/,
  );
  assert.match(board, /transition: isMover[\s\S]*: "none"/);
  assert.doesNotMatch(board, /releasePieceSprites/);
  // Same-type pieces must not keep a DOM node from another square.
  assert.doesNotMatch(board, /const fallback = prev\.find/);
});

test("dark mode does not promote piece compositor layers", () => {
  assert.match(css, /html\[data-color-scheme="dark"\] \.piece-abs-inner/);
  assert.match(
    css,
    /html\[data-color-scheme="dark"\] \.piece-abs,[\s\S]*?filter:\s*none\s*!important/,
  );
  assert.match(css, /will-change:\s*auto\s*!important/);
  assert.match(css, /color-scheme:\s*only light/);
  assert.match(css, /\.piece-layer\s*\{[^}]*overflow:\s*hidden/s);
  assert.doesNotMatch(css, /\.board-wrong-dim\s*\{[^}]*filter:/s);
  assert.match(css, /\.board-wrong-dim\s*\{[^}]*pointer-events:\s*none/s);
});

test("wrong-square wash is an overlay, not a filter on the piece parent", () => {
  assert.doesNotMatch(board, /board-wrong-dim" : ""/);
  assert.match(board, /wrongUntil \? <div className="board-wrong-dim"/);
});

test("Practice/Test reset cancels in-flight slide and wrong flash", () => {
  assert.match(train, /animGen\.current \+= 1/);
  assert.match(train, /slideGen\.current = animGen\.current/);
  assert.match(train, /if \(slideGen\.current !== animGen\.current\)/);
  assert.match(train, /if \(wrongGen !== animGen\.current\) return/);
  assert.match(train, /setSlide\(null\)/);
  assert.match(train, /setWrongUntil\(null\)/);
  assert.match(train, /key=\{session\}/);
});
