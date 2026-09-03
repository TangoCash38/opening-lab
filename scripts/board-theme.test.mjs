import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const theme = src("src/lib/board-theme.ts");
const css = src("src/styles.css");
const picker = src("src/components/opening-lab/board-theme-picker.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const train = src("src/components/opening-lab/train-view.tsx");
const guide = src("src/components/opening-lab/guide-view.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const i18n = src("src/lib/i18n.ts");

test("board-theme helper validates unknown → book and persists", () => {
  assert.match(
    theme,
    /BOARD_THEMES = \["book", "paper", "future", "newspaper"\]/,
  );
  assert.match(theme, /BOARD_THEME_STORAGE_KEY = "opening-lab:board-theme"/);
  assert.match(theme, /DEFAULT_BOARD_THEME/);
  assert.match(theme, /normalizeBoardTheme/);
  assert.match(theme, /getBoardTheme/);
  assert.match(theme, /setBoardTheme/);
  assert.match(theme, /subscribeBoardTheme/);
  assert.match(theme, /applyBoardTheme/);
  assert.match(theme, /dataset\.boardTheme/);
  assert.match(theme, /isBoardTheme/);
  assert.match(theme, /"newspaper"/);
  // unknown → book
  assert.match(
    theme,
    /return isBoardTheme\(value\) \? value : DEFAULT_BOARD_THEME/,
  );
});

test("initBoardTheme always forces Book on every launch (not only unknown→book)", () => {
  assert.match(theme, /DEFAULT_BOARD_THEME:\s*BoardTheme\s*=\s*"book"/);
  assert.match(theme, /export function initBoardTheme/);
  assert.match(
    theme,
    /export function initBoardTheme\(\): \(\) => void \{\s*setBoardTheme\(DEFAULT_BOARD_THEME\);/,
  );
  assert.doesNotMatch(
    theme,
    /export function initBoardTheme\(\)[^{]*\{\s*applyBoardTheme\(getBoardTheme\(\)\)/,
  );
});

test("CSS keeps book defaults and has paper + future + newspaper data-board-theme blocks", () => {
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
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-light/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-dark/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-selected/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.sq-last-from/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.legal-dot/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.mini-sq-light/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.mini-sq-dark/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.board-frame/);
  assert.match(css, /\[data-board-theme="newspaper"\]\s*\.piece-abs-inner/);
  assert.match(css, /#f7f2e6/);
  assert.match(css, /#c4bdb0/);
  assert.match(css, /#e2eaf0/);
  assert.match(css, /#5c6f84/);
  assert.match(css, /#1e2936/);
  assert.match(css, /#0f1720/);
  assert.match(css, /#5c564c/);
  assert.match(css, /#ead9a0/);
  assert.match(css, /#6e6c64/);
  assert.doesNotMatch(css, /#b7b0a4/);
  assert.doesNotMatch(css, /#3a4a5c/);
  assert.doesNotMatch(css, /#454540/);
});

test("yellow hints stay yellow (book + paper + future + newspaper)", () => {
  assert.match(css, /\.sq-hint-from\s*\{[^}]*#ecec4a/s);
  assert.match(css, /\.sq-hint-to\s*\{[^}]*#f7f769/s);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-hint-from[^}]*#ecec4a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-from[^}]*#ecec4a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-to[^}]*#f7f769/s);
  assert.match(
    css,
    /\[data-board-theme="newspaper"\]\s*\.sq-hint-from[^}]*#ecec4a/s,
  );
  assert.match(
    css,
    /\[data-board-theme="newspaper"\]\s*\.sq-hint-to[^}]*#f7f769/s,
  );
  assert.doesNotMatch(css, /\[data-board-theme="future"\]\s*\.sq-hint-[^{]*\{[^}]*#00ff/s);
});

test("picker sits near the board on home only, not trainer or guide", () => {
  assert.match(picker, /export function BoardThemePicker/);
  assert.match(picker, /compact\?: boolean/);
  assert.match(picker, /className\?: string/);
  assert.match(picker, /getBoardTheme/);
  assert.match(picker, /setBoardTheme/);
  assert.match(picker, /subscribeBoardTheme/);
  assert.match(picker, /pointer-events-auto/);
  assert.match(picker, /t\("Newspaper"\)/);
  assert.match(hero, /BoardThemePicker/);
  assert.match(hero, /from "\.\/board-theme-picker"/);
  assert.match(hero, /pointer-events-auto/);
  assert.doesNotMatch(train, /BoardThemePicker/);
  assert.doesNotMatch(train, /board-theme-picker/);
  assert.match(train, /!boardExpanded/);
  assert.doesNotMatch(guide, /board-theme-picker/);
  assert.doesNotMatch(guide, /BoardThemePicker/);
  assert.doesNotMatch(guide, /setBoardTheme/);
  assert.match(shell, /initBoardTheme/);
  assert.match(i18n, /Board: "Board"/);
  assert.match(i18n, /Board: "Tablero"/);
  assert.match(i18n, /Board: "棋盘"/);
  assert.match(i18n, /Board: "Échiquier"/);
  assert.match(i18n, /Book: "Libro"/);
  assert.match(i18n, /Paper: "Papel"/);
  assert.match(i18n, /Future: "Futuro"/);
  assert.match(i18n, /Newspaper: "Periódico"/);
  assert.match(i18n, /Book: "书谱"/);
  assert.match(i18n, /Paper: "纸面"/);
  assert.match(i18n, /Future: "未来"/);
  assert.match(i18n, /Newspaper: "报纸"/);
  assert.match(i18n, /Book: "Livre"/);
  assert.match(i18n, /Paper: "Papier"/);
  assert.match(i18n, /Future: "Futur"/);
  assert.match(i18n, /Newspaper: "Journal"/);
  assert.match(i18n, /Newspaper: "Newspaper"/);
});

test("default theme is book", () => {
  assert.match(theme, /DEFAULT_BOARD_THEME:\s*BoardTheme\s*=\s*"book"/);
  assert.match(css, /\.sq-light\s*\{\s*background-color:\s*#f3e5c8/);
  assert.doesNotMatch(css, /\[data-board-theme="book"\]/);
});
