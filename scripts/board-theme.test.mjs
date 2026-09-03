import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const theme = src("src/lib/board-theme.ts");
const css = src("src/styles.css");
const guide = src("src/components/opening-lab/guide-view.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const i18n = src("src/lib/i18n.ts");

test("board-theme helper validates unknown → book and persists", () => {
  assert.match(theme, /BOARD_THEMES = \["book", "paper", "future"\]/);
  assert.match(theme, /BOARD_THEME_STORAGE_KEY = "opening-lab:board-theme"/);
  assert.match(theme, /DEFAULT_BOARD_THEME/);
  assert.match(theme, /normalizeBoardTheme/);
  assert.match(theme, /getBoardTheme/);
  assert.match(theme, /setBoardTheme/);
  assert.match(theme, /subscribeBoardTheme/);
  assert.match(theme, /applyBoardTheme/);
  assert.match(theme, /dataset\.boardTheme/);
  assert.match(theme, /isBoardTheme/);
  // unknown → book
  assert.match(
    theme,
    /return isBoardTheme\(value\) \? value : DEFAULT_BOARD_THEME/,
  );
});

test("CSS keeps book defaults and has paper + future data-board-theme blocks", () => {
  assert.match(css, /\.sq-light\s*\{\s*background-color:\s*#f3e5c8/);
  assert.match(css, /\.sq-dark\s*\{\s*background-color:\s*#a97850/);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-light/);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-dark/);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.board-frame/);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.mini-sq-light/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-light/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-dark/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.board-frame/);
  assert.match(css, /\[data-board-theme="future"\]\s*\.mini-sq-dark/);
  assert.match(css, /#f7f2e6/);
  assert.match(css, /#b7b0a4/);
  assert.match(css, /#d8e2ea/);
  assert.match(css, /#3a4a5c/);
  assert.match(css, /#1e2936/);
  assert.match(css, /#0f1720/);
  assert.match(css, /#5c564c/);
});

test("yellow hints stay yellow (book + paper + future)", () => {
  assert.match(css, /\.sq-hint-from\s*\{[^}]*#ecec4a/s);
  assert.match(css, /\.sq-hint-to\s*\{[^}]*#f7f769/s);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-hint-from[^}]*#ecec4a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-from[^}]*#ecec4a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-to[^}]*#f7f769/s);
  assert.doesNotMatch(css, /\[data-board-theme="future"\]\s*\.sq-hint-[^{]*\{[^}]*#00ff/s);
});

test("guide has Board picker; app shell inits theme; i18n labels", () => {
  assert.match(guide, /t\("Board"\)/);
  assert.match(guide, /board-theme-picker/);
  assert.match(guide, /setBoardTheme/);
  assert.match(guide, /t\("Book"\)/);
  assert.match(guide, /t\("Paper"\)/);
  assert.match(guide, /t\("Future"\)/);
  assert.match(guide, /board-theme-card-selected/);
  assert.match(shell, /initBoardTheme/);
  assert.match(i18n, /Board: "Board"/);
  assert.match(i18n, /Board: "Tablero"/);
  assert.match(i18n, /Board: "棋盘"/);
  assert.match(i18n, /Board: "Échiquier"/);
  assert.match(i18n, /Book: "Libro"/);
  assert.match(i18n, /Paper: "Papel"/);
  assert.match(i18n, /Future: "Futuro"/);
  assert.match(i18n, /Book: "书谱"/);
  assert.match(i18n, /Paper: "纸面"/);
  assert.match(i18n, /Future: "未来"/);
  assert.match(i18n, /Book: "Livre"/);
  assert.match(i18n, /Paper: "Papier"/);
  assert.match(i18n, /Future: "Futur"/);
});

test("default theme is book", () => {
  assert.match(theme, /DEFAULT_BOARD_THEME:\s*BoardTheme\s*=\s*"book"/);
  assert.match(css, /\.sq-light\s*\{\s*background-color:\s*#f3e5c8/);
  assert.doesNotMatch(css, /\[data-board-theme="book"\]/);
});
