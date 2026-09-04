import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const picker = src("src/components/opening-lab/lang-picker.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const splash = src("src/components/opening-lab/app-splash.tsx");
const css = src("src/styles.css");

test("language UI uses custom sheet, not native select", () => {
  assert.doesNotMatch(picker, /<select/);
  assert.doesNotMatch(shell, /<select/);
  assert.doesNotMatch(splash, /<select/);
  assert.match(shell, /from "\.\/lang-picker"/);
  assert.match(splash, /from "\.\/lang-picker"/);
  assert.match(shell, /<LangToggle/);
  assert.match(splash, /<LangToggle/);
});

test("lang picker sheet has Back, dialog a11y, Escape, backdrop close", () => {
  assert.match(picker, /role="dialog"/);
  assert.match(picker, /aria-modal="true"/);
  assert.match(picker, /t\("Language"\)/);
  assert.match(picker, /t\("Back"\)/);
  assert.match(picker, /lang-picker-back/);
  assert.match(picker, /Escape/);
  assert.match(picker, /setLang\(opt\.id\)/);
  assert.match(picker, /LANG_OPTIONS/);
  assert.match(picker, /aria-selected/);
  assert.match(picker, /className="lang-toggle"/);
  assert.match(picker, /current\.short/);
  // Backdrop click closes without setLang
  assert.match(picker, /lang-picker-overlay/);
  assert.match(picker, /onClick=\{close\}/);
  assert.match(css, /\.lang-picker-sheet/);
  assert.match(css, /\.lang-picker-back/);
  assert.match(css, /bg-elevated|color-bg-elevated/);
});

test("lang picker registers history-backed Back via useOverlayHistory", () => {
  assert.match(picker, /useOverlayHistory\(open, close, "lang"\)/);
  assert.match(picker, /from "@\/hooks\/use-overlay-history"/);
});

