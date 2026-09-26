import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const i18n = src("src/lib/i18n.ts");
const hero = src("src/components/opening-lab/home-hero.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const css = src("src/styles.css");
const intro = src("src/components/opening-lab/home-intro.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");
const lines = src("src/components/opening-lab/pack-lines.tsx");
const unlock = src("src/components/opening-lab/unlock-modal.tsx");
const about = src("src/components/opening-lab/pack-about-modal.tsx");
const train = src("src/components/opening-lab/train-view.tsx");
const guide = src("src/components/opening-lab/guide-view.tsx");

const REQUIRED = [
  "Train openings the strict way",
  "How to play",
  "Download the app",
  "Continue on the web",
  "Tap to practice",
  "See 18 lines",
  "Free sample",
  "Guided practice · memory tests",
  "Menu",
  "Report incorrect line",
  "Six Opening Traps are free. Unlock all 10 traps for £1.99. Three Caro lines are free. Unlock the rest for £1.99. More packs are coming with Professor Potato Pie.",
  "Unlock all 10 traps for £1.99",
  "Some packs are available now. More are coming with Professor Potato Pie.",
  "How the gym works",
  "Continue",
  "Don't show again",
  "The book move is {san}.",
  "Try again",
  "Packs are not for sale in this Play test. The three free Caro lines still train here.",
  "Free",
  "Locked",
  "{pct}%",
];

test("home heading sits on one row with Menu as a real button", () => {
  assert.match(list, /home-heading-row/);
  assert.match(css, /\.home-heading-row/);
  assert.match(css, /align-items:\s*center/);
  assert.doesNotMatch(list, /Learn Drill Know/);
  assert.doesNotMatch(list, /<h1[\s\S]*Learn Drill Know/);
  assert.match(list, /<HomeMenu/);
  assert.match(list, /onHelp=\{onHowToPlay\}/);
  const menu = src("src/components/opening-lab/home-menu.tsx");
  assert.match(menu, /type="button"/);
  assert.match(menu, /rounded-full/);
  assert.match(menu, /min-h-11/);
  assert.match(menu, /t\("Menu"\)/);
  assert.doesNotMatch(menu, /Find the mate/);
  assert.doesNotMatch(menu, /More games/);
  assert.doesNotMatch(list, /Find the mate/);
  assert.doesNotMatch(hero, /Find the mate/);
  assert.doesNotMatch(hero, /More games/);
  const start = list.indexOf("home-heading-row");
  const row = list.slice(start, list.indexOf("</div>", start) + 6);
  assert.doesNotMatch(row, /<h1/);
  assert.match(row, /HomeMenu/);
});

test("languages are EN, ES, Simplified Chinese, FR, DE, PT, RU, IT, HI, JA, AR, TR and persist", () => {
  assert.match(i18n, /LANG_STORAGE_KEY = "opening-lab:lang"/);
  assert.match(i18n, /localStorage/);
  assert.match(i18n, /\["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"\]/);
  assert.match(i18n, /Chinese \(Simplified\)/);
  assert.match(i18n, /训练/);
  assert.doesNotMatch(i18n, /訓練/);
  assert.match(shell, /LangToggle/);
  assert.match(shell, /from "\.\/lang-picker"/);
  assert.doesNotMatch(shell, /<select/);
  assert.match(css, /\.lang-toggle/);
  assert.match(css, /max-width:\s*6rem/);
  assert.match(shell, /header-icon-btn/);
  for (const key of REQUIRED) {
    assert.match(i18n, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), key);
  }
  assert.equal(i18n.split("£1.99").length - 1, 72);
  assert.equal(i18n.split("£2.99").length - 1, 0);
  assert.doesNotMatch(i18n, /99p/);
  assert.match(i18n, /short: "DE"/);
  assert.match(i18n, /short: "PT"/);
  assert.match(i18n, /short: "RU"/);
  assert.match(i18n, /short: "IT"/);
  assert.match(i18n, /short: "हिंदी"/);
  assert.match(i18n, /short: "日本語"/);
  assert.match(i18n, /short: "العربية"/);
  assert.match(i18n, /short: "TR"/);
  assert.match(i18n, /document\.documentElement\.dir = lang === "ar" \? "rtl" : "ltr"/);
});

test("UI chrome is translated; chess names stay English in the product", () => {
  assert.match(hero, /Caro-Kann for Black/);
  assert.match(hero, /Advance, Classical, Exchange/);
  assert.match(hero, /id === "ckb1"/);
  assert.doesNotMatch(i18n, /"Advance":/);
  assert.doesNotMatch(i18n, /"Classical":/);
  assert.doesNotMatch(i18n, /"Exchange":/);
  assert.doesNotMatch(i18n, /"Caro-Kann for Black":/);
  assert.match(guide, /developed by a hobbyist with a strong technical curiosity/);
  assert.doesNotMatch(shell, /AppSplash/);
  assert.doesNotMatch(list, /Learn Drill Know/);
  assert.doesNotMatch(list, /WebsiteAppPrompt/);
  assert.doesNotMatch(list, /App coming soon/);
  assert.doesNotMatch(list, /Continue on the web/);
  assert.doesNotMatch(intro, /App coming soon/);
  assert.doesNotMatch(intro, /Continue on the web/);
  assert.doesNotMatch(i18n, /search Opening Lab/i);
  assert.match(lines, /t\("Locked"\)/);
  assert.match(lines, /t\("Free"\)/);
  assert.match(unlock, /Billed by Google Play/);
  assert.match(unlock, /onUnlockPack/);
  assert.match(about, /Don't show again/);
  assert.match(about, /t\(GAME_INTRO_TITLE\)/);
  assert.match(train, /The book move is \{san\}\./);
  assert.doesNotMatch(guide, /<Block title="Caro-Kann for Black">/);
  assert.doesNotMatch(guide, /Nimzo-Larsen/);
  assert.match(guide, /t\("Practice mode"\)/);
  assert.match(guide, /t\("Test mode"\)/);
  assert.match(guide, /t\("User guide"\)/);
});

test("home board still only starts from Tap to practice", () => {
  assert.match(hero, /Tap to practice/);
  assert.match(hero, /interactive=\{false\}/);
  assert.match(hero, /pointer-events-none/);
  assert.doesNotMatch(hero, /g\.move\("e4"\)/);
});

test("language picker stays in the header; AppSplash does not gate open", () => {
  assert.match(shell, /LangToggle/);
  assert.match(shell, /from "\.\/lang-picker"/);
  assert.doesNotMatch(shell, /<select/);
  assert.doesNotMatch(shell, /AppSplash/);
  assert.doesNotMatch(shell, /opening-lab:splash:v4/);
  assert.doesNotMatch(intro, /t\("Play"\)/);
  assert.match(css, /\.lang-toggle/);
});
