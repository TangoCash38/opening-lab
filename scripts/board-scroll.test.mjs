import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync("src/styles.css", "utf8");
const board = fs.readFileSync("src/components/opening-lab/chess-board.tsx", "utf8");

test("board only disables touch actions on draggable pieces", () => {
  assert.doesNotMatch(
    styles,
    /\.board-play,\s*\n?\s*\.board-play button\s*\{\s*\n?\s*touch-action:\s*none/,
  );
  assert.doesNotContain(board, "touch-none");
  assert.match(board, /isDraggablePiece \? \{ touchAction: "none" \} : undefined/);
  assert.match(board, /occPiece\.color === game\.turn\(\)/);
});
