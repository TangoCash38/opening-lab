import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const board = src("src/components/opening-lab/chess-board.tsx");
const css = src("src/styles.css");
const mini = src("src/components/opening-lab/mini-board.tsx");

test("ChessBoard uses dedicated sq-coord classes (no faint opacity colours)", () => {
  assert.match(board, /sq-coord/);
  assert.match(board, /sq-coord--on-light/);
  assert.match(board, /sq-coord--on-dark/);
  assert.match(board, /text-\[0\.72rem\]/);
  assert.match(board, /font-bold/);
  assert.doesNotMatch(board, /text-dark-sq\/70/);
  assert.doesNotMatch(board, /text-light-sq\/80/);
  assert.doesNotMatch(board, /text-\[0\.62rem\]/);
});

test("styles.css defines high-contrast sq-coord colours for every theme", () => {
  assert.match(css, /\.sq-coord--on-light\s*\{[^}]*#4a2f1c/s);
  assert.match(css, /\.sq-coord--on-dark\s*\{[^}]*#f3e5c8/s);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-coord--on-light/);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-coord--on-dark/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-coord--on-light/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-coord--on-dark/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-coord--on-light/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-coord--on-dark/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-coord--on-light\s*\{[^}]*#111/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-coord--on-light\s*\{[^}]*#1e2936/s);
});

test("mini-board has no coordinates", () => {
  assert.doesNotMatch(mini, /sq-coord/);
  assert.doesNotMatch(mini, /text-dark-sq\/70/);
});
