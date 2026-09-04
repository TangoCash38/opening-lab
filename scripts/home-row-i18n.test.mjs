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
const splash = src("src/components/opening-lab/app-splash.tsx");
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
  "Strict lines · memory training",
  "Three Caro lines are free. Unlock the rest of that pack for £1.99. Other packs are £2.99.",
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

test("home heading sits on one row with How to play as a real button", () => {
  assert.match(hero, /home-heading-row/);
  assert.match(css, /\.home-heading-row/);
  assert.match(css, /align-items:\s*center/);
  assert.match(hero, /<h1[\s\S]*Train openings the strict way/);
  assert.match(hero, /<button[\s\S]*How to play/);
  assert.match(hero, /type="button"/);
  assert.match(hero, /onClick=\{onHowToPlay\}/);
  assert.match(hero, /rounded-full/);
  assert.match(hero, /min-h-11/);
  const start = hero.indexOf("home-heading-row");
  const row = hero.slice(start, hero.indexOf("</div>", start) + 6);
  assert.match(row, /<h1/);
  assert.match(row, /<button/);
  assert.match(row, /How to play/);
  assert.doesNotMatch(hero, /mb-1\.5 font-display text-\[1\.65rem\]/);
});

test("languages are EN, ES, Simplified Chinese, FR, DE, PT, RU, IT, HI, JA, AR, TR and persist", () => {
  assert.match(i18n, /LANG_STORAGE_KEY = "opening-lab:lang"/);
  assert.match(i18n, /localStorage/);
  assert.match(i18n, /\["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"\]/);
  assert.match(i18n, /Chinese \(Simplified\)/);
  assert.match(i18n, /训练/);
  assert.doesNotMatch(i18n, /訓練/);
  assert.match(shell, /LangToggle/);
  assert.match(shell, /className="lang-toggle"/);
  assert.match(css, /\.lang-toggle/);
  assert.match(css, /max-width:\s*6rem/);
  assert.match(shell, /header-icon-btn/);
  for (const key of REQUIRED) {
    assert.match(i18n, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), key);
  }
  assert.equal(i18n.split("£1.99").length - 1, 24);
  assert.equal(i18n.split("£2.99").length - 1, 24);
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
  assert.match(splash, /Most people dive into opening theory/);
  assert.match(list, /Three Caro lines are free/);
  assert.match(list, /WebsiteAppPrompt/);
  const prompt = src("src/components/opening-lab/website-app-prompt.tsx");
  assert.match(prompt, /Download the app/);
  assert.match(prompt, /Continue on the web/);
  assert.match(prompt, /isPlayWrap\(\)/);
  assert.match(prompt, /sessionStorage/);
  assert.match(prompt, /play\.google\.com\/apps\/testing\/uk\.co\.openinglab/);
  assert.doesNotMatch(prompt, /store\/apps\/details/);
  assert.doesNotMatch(prompt, /search Opening Lab/i);
  assert.doesNotMatch(i18n, /search Opening Lab/i);
  assert.match(lines, /t\("Locked"\)/);
  assert.match(lines, /t\("Free"\)/);
  assert.match(unlock, /Packs are not for sale in this Play test/);
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

test("splash has Language select before Play and persists via setLang", () => {
  assert.match(splash, /useI18n\(\)/);
  assert.match(splash, /LANG_OPTIONS/);
  assert.match(splash, /isLang/);
  assert.match(splash, /setLang/);
  assert.match(splash, /<select[\s\S]*className="lang-toggle"/);
  assert.match(splash, /sr-only[\s\S]*t\("Language"\)/);
  assert.match(splash, /splash-lang/);
  const selectAt = splash.indexOf("<select");
  const playAt = splash.indexOf('{t("Play")}');
  assert.ok(selectAt > -1 && playAt > selectAt, "Language select sits before Play");
  assert.match(splash, /SESSION_KEY = "opening-lab:splash:v4"/);
  assert.match(css, /\.splash-lang/);
});
