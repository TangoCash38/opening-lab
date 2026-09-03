import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const scheme = src("src/lib/color-scheme.ts");
const css = src("src/styles.css");
const shell = src("src/components/opening-lab/app-shell.tsx");
const i18n = src("src/lib/i18n.ts");
const boardTheme = src("src/lib/board-theme.ts");

test("color-scheme helper validates unknown → light and persists", () => {
  assert.match(scheme, /COLOR_SCHEMES = \["light", "dark"\]/);
  assert.match(scheme, /COLOR_SCHEME_STORAGE_KEY = "opening-lab:color-scheme"/);
  assert.match(scheme, /DEFAULT_COLOR_SCHEME/);
  assert.match(scheme, /normalizeColorScheme/);
  assert.match(scheme, /getColorScheme/);
  assert.match(scheme, /setColorScheme/);
  assert.match(scheme, /subscribeColorScheme/);
  assert.match(scheme, /applyColorScheme/);
  assert.match(scheme, /initColorScheme/);
  assert.match(scheme, /dataset\.colorScheme/);
  assert.match(scheme, /isColorScheme/);
  assert.match(
    scheme,
    /return isColorScheme\(value\) \? value : DEFAULT_COLOR_SCHEME/,
  );
  assert.match(scheme, /DEFAULT_COLOR_SCHEME:\s*ColorScheme\s*=\s*"light"/);
});

test("dark CSS overrides chrome tokens without changing board squares", () => {
  assert.match(css, /html\[data-color-scheme="dark"\]/);
  assert.match(css, /color-scheme:\s*light/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /#141210/);
  assert.match(css, /#1c1916/);
  assert.match(css, /#26221e/);
  assert.match(css, /#f3efe8/);
  assert.match(css, /#b5aea3/);
  assert.match(css, /#3a342e/);
  assert.match(css, /#3d7a68/);
  assert.match(css, /html\[data-color-scheme="dark"\]\s+\.line-result-dim/);
  assert.doesNotMatch(
    css,
    /\[data-color-scheme="dark"\][^{]*\{[^}]*--color-light-sq/s,
  );
  assert.doesNotMatch(
    css,
    /\[data-color-scheme="dark"\][^{]*\{[^}]*--color-dark-sq/s,
  );
  assert.match(css, /\.sq-hint-from\s*\{[^}]*#ecec4a/s);
  assert.match(css, /\.sq-hint-to\s*\{[^}]*#f7f769/s);
});

test("header toggle sits next to language picker and inits with board theme", () => {
  assert.match(shell, /initColorScheme/);
  assert.match(shell, /initBoardTheme/);
  assert.match(shell, /Moon/);
  assert.match(shell, /Sun/);
  assert.match(shell, /from "lucide-react"/);
  assert.match(shell, /header-icon-btn/);
  assert.match(shell, /t\("Dark mode"\)/);
  assert.match(shell, /t\("Light mode"\)/);
  assert.match(shell, /setColorScheme/);
  assert.match(shell, /getColorScheme/);
  assert.match(shell, /subscribeColorScheme/);
  assert.match(shell, /<LangToggle \/>\s*<ColorSchemeToggle \/>/s);
});

test("i18n keys for dark and light mode exist in every language dict", () => {
  assert.match(i18n, /LANGS = \["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja"\]/);
  assert.match(i18n, /"Dark mode": "Dark mode"/);
  assert.match(i18n, /"Light mode": "Light mode"/);
  assert.match(i18n, /"Dark mode": "Modo oscuro"/);
  assert.match(i18n, /"Light mode": "Modo claro"/);
  assert.match(i18n, /"Dark mode": "深色模式"/);
  assert.match(i18n, /"Light mode": "浅色模式"/);
  assert.match(i18n, /"Dark mode": "Mode sombre"/);
  assert.match(i18n, /"Light mode": "Mode clair"/);
  assert.match(i18n, /"Dark mode": "Dunkelmodus"/);
  assert.match(i18n, /"Light mode": "Hellmodus"/);
  assert.match(i18n, /"Dark mode": "Modo escuro"/);
  assert.match(i18n, /"Dark mode": "Тёмный режим"/);
  assert.match(i18n, /"Light mode": "Светлый режим"/);
  assert.match(i18n, /"Dark mode": "Modalità scura"/);
  assert.match(i18n, /"Light mode": "Modalità chiara"/);
  assert.match(i18n, /"Dark mode": "डार्क मोड"/);
  assert.match(i18n, /"Light mode": "लाइट मोड"/);
  assert.match(i18n, /"Dark mode": "ダークモード"/);
  assert.match(i18n, /"Light mode": "ライトモード"/);
});

test("board themes stay independent of chrome color scheme", () => {
  assert.match(boardTheme, /BOARD_THEMES = \["book", "paper", "future", "newspaper"\]/);
  assert.match(boardTheme, /BOARD_THEME_STORAGE_KEY = "opening-lab:board-theme"/);
  assert.doesNotMatch(scheme, /boardTheme/);
  assert.doesNotMatch(scheme, /BOARD_THEME/);
});
