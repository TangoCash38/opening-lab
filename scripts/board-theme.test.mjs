import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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
const chessBoard = src("src/components/opening-lab/chess-board.tsx");
const i18n = src("src/lib/i18n.ts");

test("board-theme helper validates unknown → book and persists", () => {
  assert.match(
    theme,
    /BOARD_THEMES = \["book", "paper", "future", "tournament", "arcade"\]/,
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
  assert.match(theme, /"tournament"/);
  // legacy newspaper → tournament (crash migration)
  assert.match(
    theme,
    /if \(value === "newspaper"\) return "tournament"/,
  );
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

test("CSS keeps book defaults and has paper + future + tournament data-board-theme blocks", () => {
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
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.sq-light/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.sq-dark/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.sq-selected/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.sq-last-from/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.legal-dot/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.mini-sq-light/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.mini-sq-dark/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.board-frame/);
  assert.match(css, /\[data-board-theme="tournament"\]\s*\.piece-abs-inner/);
  assert.match(css, /\[data-board-theme="arcade"\]\s*\.sq-light/);
  assert.match(css, /\[data-board-theme="arcade"\]\s*\.sq-dark/);
  assert.match(css, /\[data-board-theme="arcade"\]\s*\.board-frame/);
  assert.match(css, /\[data-board-theme="arcade"\]\s*\.piece-abs-inner/);
  assert.match(css, /#f7f2e6/);
  assert.match(css, /#c4bdb0/);
  assert.match(css, /#e2eaf0/);
  assert.match(css, /#5c6f84/);
  assert.match(css, /#1e2936/);
  assert.match(css, /#0f1720/);
  assert.match(css, /#5c564c/);
  assert.match(css, /#eeeed2/);
  assert.match(css, /#769656/);
  assert.match(css, /#2e4a28/);
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-light\s*\{[^}]*#eeeed2/s,
  );
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-dark\s*\{[^}]*#769656/s,
  );
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.piece-abs-inner[^}]*drop-shadow\(0 1px 1px/s,
  );
  // No newspaper texture / heavy halo filters
  assert.doesNotMatch(css, /newspaper/);
  assert.doesNotMatch(css, /board-textures\/newspaper-clippings/);
  assert.doesNotMatch(css, /\[data-piece-color="b"\]\s*\.piece-abs-inner/);
  assert.doesNotMatch(css, /\[data-piece-color="w"\]\s*\.piece-abs-inner/);
  assert.doesNotMatch(css, /#ead9a0/);
  assert.doesNotMatch(css, /#6e6c64/);
  assert.doesNotMatch(css, /#b7b0a4/);
  assert.doesNotMatch(css, /#3a4a5c/);
  assert.doesNotMatch(css, /#454540/);
});

test("ChessBoard marks piece colour for theme CSS hooks (board, ghost, promo)", () => {
  assert.match(chessBoard, /function pieceSide\(code: string\): "w" \| "b"/);
  assert.match(chessBoard, /data-piece-color=\{pieceSide\(p\.code\)\}/);
  assert.match(chessBoard, /data-piece-color=\{pieceSide\(drag\.code\)\}/);
  assert.match(chessBoard, /data-piece-color=\{promotion\.color\}/);
  assert.match(chessBoard, /className="piece-abs"/);
  assert.match(chessBoard, /className="piece-drag-ghost"/);
  // Promo picker pieces wrap ChessPiece in piece-abs-inner
  assert.match(
    chessBoard,
    /promo-picker-btn[\s\S]*?piece-abs-inner[\s\S]*?ChessPiece/,
  );
});

test("green hints stay green (book + paper + future + tournament)", () => {
  assert.match(css, /\.sq-hint-from\s*\{[^}]*#8fd49a/s);
  assert.match(css, /\.sq-hint-to\s*\{[^}]*#9edda8/s);
  assert.match(css, /\[data-board-theme="paper"\]\s*\.sq-hint-from[^}]*#8fd49a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-from[^}]*#8fd49a/s);
  assert.match(css, /\[data-board-theme="future"\]\s*\.sq-hint-to[^}]*#9edda8/s);
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-hint-from[^}]*#8fd49a/s,
  );
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-hint-to[^}]*#9edda8/s,
  );
  // Brighter hints on dark green for contrast
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-dark\.sq-hint-from[^}]*#b4eebb/s,
  );
  assert.match(
    css,
    /\[data-board-theme="tournament"\]\s*\.sq-dark\.sq-hint-to[^}]*#c5f0cc/s,
  );
  assert.doesNotMatch(css, /\[data-board-theme="future"\]\s*\.sq-hint-[^{]*\{[^}]*#00ff/s);
  assert.match(css, /\.sq-last-from[\s\S]*?linear-gradient\(#ecec4a55, #ecec4a55\)/);
});

test("picker sits near the board on home only, not trainer or guide", () => {
  assert.match(picker, /export function BoardThemePicker/);
  assert.match(picker, /compact\?: boolean/);
  assert.match(picker, /className\?: string/);
  assert.match(picker, /getBoardTheme/);
  assert.match(picker, /setBoardTheme/);
  assert.match(picker, /subscribeBoardTheme/);
  assert.match(picker, /pointer-events-auto/);
  assert.match(picker, /t\("Tournament"\)/);
  assert.match(picker, /t\("Arcade"\)/);
  assert.match(picker, /arcade:\s*\{\s*light:/);
  assert.match(picker, /tournament:\s*\{\s*light:\s*"#eeeed2"/);
  assert.match(picker, /dark:\s*"#769656"/);
  assert.match(picker, /frame:\s*"#2e4a28"/);
  assert.doesNotMatch(picker, /newspaper/);
  assert.doesNotMatch(picker, /board-textures\/newspaper-clippings/);

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
  assert.match(i18n, /Tournament: "Torneo"/);
  assert.match(i18n, /Book: "书谱"/);
  assert.match(i18n, /Paper: "纸面"/);
  assert.match(i18n, /Future: "未来"/);
  assert.match(i18n, /Tournament: "锦标赛"/);
  assert.match(i18n, /Book: "Livre"/);
  assert.match(i18n, /Paper: "Papier"/);
  assert.match(i18n, /Future: "Futur"/);
  assert.match(i18n, /Tournament: "Tournoi"/);
  assert.match(i18n, /Tournament: "Tournament"/);
});

test("default theme is book", () => {
  assert.match(theme, /DEFAULT_BOARD_THEME:\s*BoardTheme\s*=\s*"book"/);
  assert.match(css, /\.sq-light\s*\{\s*background-color:\s*#f3e5c8/);
  assert.doesNotMatch(css, /\[data-board-theme="book"\]/);
});

test("newspaper clippings texture is removed (crash surface)", () => {
  const texture = join(root, "public/board-textures/newspaper-clippings.webp");
  assert.equal(existsSync(texture), false);
  assert.doesNotMatch(css, /newspaper-clippings/);
  assert.doesNotMatch(picker, /newspaper-clippings/);
});

test("Arcade-only fun motion and arcade sounds; other themes keep wood", () => {
  const sounds = src("src/lib/sounds.ts");
  assert.match(sounds, /getBoardTheme\(\) === "arcade"/);
  assert.match(sounds, /soundMoveArcade|soundPickupArcade/);
  assert.match(chessBoard, /ARCADE_SLIDE_MS/);
  assert.match(chessBoard, /ARCADE_SLIDE_EASE/);
  assert.match(chessBoard, /boardTheme === "arcade"/);
  assert.match(i18n, /Arcade: "Arcade"/);
});

test("Arcade captures blast the taken piece off the board", () => {
  assert.match(chessBoard, /ArcadeCaptureBlast/);
  assert.match(chessBoard, /data-arcade-blast/);
  assert.match(chessBoard, /slide\?\.captured/);
  assert.match(css, /arcade-capture-blast/);
  const sounds = src("src/lib/sounds.ts");
  assert.match(sounds, /export function soundCapture/);
  assert.match(sounds, /getBoardTheme\(\) !== "arcade"/);
  const train = src("src/components/opening-lab/train-view.tsx");
  assert.match(train, /capturedCodeFromMove/);
  assert.match(train, /soundCapture\(\)/);
});
