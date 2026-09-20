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
const board = readFileSync(
  join(root, "src/components/opening-lab/chess-board.tsx"),
  "utf8",
);
const css = readFileSync(join(root, "src/styles.css"), "utf8");

test("Book Practice/Test auto-queen; trainer has no Play-on promo picker", () => {
  assert.match(
    train,
    /promotion:\s*exp\.promotion \|\| promotion \|\| "q"/,
  );
  assert.doesNotMatch(train, /pendingPromo/);
  assert.doesNotMatch(train, /playingOn/);
  assert.doesNotMatch(train, /setPendingPromo/);
  assert.doesNotMatch(train, /Play on/);
});

test("ChessBoard still has a promotion picker API", () => {
  assert.match(board, /promotion\?: PromotionPrompt \| null/);
  assert.match(board, /className="promo-picker"/);
  assert.match(board, /onPick/);
});

test("promo-picker is centered inside .board-play above pieces", () => {
  const play = board.match(
    /className=\{`board-play[\s\S]*?\n\s*<\/div>\s*\n\s*<\/div>\s*\n\s*<\/div>/,
  );
  assert.ok(play, "board-play block present");
  assert.match(play[0], /className="promo-picker"/);
  assert.match(play[0], /pointer-events-none absolute inset-0 z-10/);

  assert.match(css, /\.promo-picker\s*\{[^}]*z-index:\s*70/);
  assert.match(css, /\.promo-picker\s*\{[^}]*pointer-events:\s*auto/);
  assert.match(css, /\.promo-picker-btn\s*\{[^}]*pointer-events:\s*auto/);
});

test("drag-end resolves squares from board geometry (WebView-safe)", () => {
  assert.match(board, /function squareFromBoardPoint/);
  assert.match(board, /squareFromBoardPoint\(/);
  assert.match(
    board,
    /squareFromBoardPoint\([\s\S]*?\)\s*\?\?\s*squareFromPoint/,
  );
});

test("promo backdrop cancels on pointerdown target===currentTarget (no click-through)", () => {
  assert.match(board, /e\.target === e\.currentTarget/);
  assert.doesNotMatch(
    board,
    /className="promo-picker"[\s\S]{0,280}onClick=\{\(\) => promotion\.onCancel/,
  );
});
