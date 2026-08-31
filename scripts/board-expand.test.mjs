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

test("trainer has Expand that opens a full-screen board overlay", () => {
  assert.match(train, /Expand/);
  assert.match(train, /boardExpanded/);
  assert.match(train, /board-fs-overlay/);
  assert.match(train, /Close full screen/);
  assert.match(train, /Escape/);
  assert.match(board, /expanded\?: boolean/);
  assert.match(css, /\.board-fs-overlay/);
  assert.match(css, /position: fixed/);
});
