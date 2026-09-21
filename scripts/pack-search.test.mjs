import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const helperSrc = src("src/lib/pack-search.ts");
const list = src("src/components/opening-lab/pack-list.tsx");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const intro = src("src/lib/pack-intro.ts");

function toRunnableJs(text) {
  return text
    .replace(/import type \{ Pack \} from "@\/data\/packs";\n*/, "")
    .replace(/: Pick<Pack, [^>]+>/g, "")
    .replace(/: string/g, "")
    .replace(/\): boolean/g, ")");
}

const dir = mkdtempSync(join(tmpdir(), "ol-pack-search-"));
const jsPath = join(dir, "pack-search.mjs");
writeFileSync(jsPath, toRunnableJs(helperSrc));
const { packMatchesQuery } = await import(pathToFileURL(jsPath).href);

const sample = {
  name: "Caro-Kann for Black",
  blurb: "18 lines · Advance, Classical, Exchange",
};

test("packMatchesQuery is case-insensitive on name and blurb only", () => {
  assert.equal(packMatchesQuery(sample, ""), true);
  assert.equal(packMatchesQuery(sample, "   "), true);
  assert.equal(packMatchesQuery(sample, "caro"), true);
  assert.equal(packMatchesQuery(sample, "CARO-KANN"), true);
  assert.equal(packMatchesQuery(sample, "classical"), true);
  assert.equal(packMatchesQuery(sample, "black"), true);
  assert.equal(packMatchesQuery(sample, "b12"), false);
  assert.equal(packMatchesQuery(sample, "4.h4"), false);
  assert.equal(packMatchesQuery(sample, "sicilian"), false);
  assert.doesNotMatch(helperSrc, /pack\.eco/);
  assert.doesNotMatch(helperSrc, /pack\.side/);
  assert.doesNotMatch(helperSrc, /pack\.lines/);
});

test("sticky search strip sits under the heading and above the lead packs", () => {
  const headingAt = list.indexOf('t("Your opening training packs")');
  const searchAt = list.indexOf("<PackSearchField");
  const trapsAt = list.indexOf('["opening-traps", "caro-kann-black"]');
  assert.ok(headingAt > -1, "pack heading stays on the page");
  assert.ok(searchAt > headingAt, "search sits under the heading");
  assert.ok(trapsAt > -1, "Opening Traps and Caro lead the catalog");
  assert.match(list, /from "@\/lib\/pack-search"/);
  assert.match(list, /packMatchesQuery/);
  assert.match(list, /pack-search-sticky/);
  assert.match(list, /t\("Search openings"\)/);
  assert.match(list, /t\("Clear search"\)/);
  assert.match(list, /t\("No packs match"\)/);
  assert.doesNotMatch(list, /t\("No openings match\."\)/);
  assert.match(list, /type="search"/);
  assert.match(list, /placeholder=\{t\("Search openings"\)\}/);
  assert.match(list, /onToggle=\{togglePack\}/);
  assert.doesNotMatch(list, /setFeaturedId\(pack\.id\)/);
  assert.match(css, /\.pack-search-sticky/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /\.pack-search-input::-webkit-search-cancel-button/);
  assert.doesNotMatch(list, /home-heading-row[\s\S]{0,200}PackSearchField/);
});

test("search copy is translated; required home-row English keys stay intact", () => {
  assert.match(i18n, /"Search openings": "Search openings"/);
  assert.match(i18n, /"Clear search": "Clear search"/);
  assert.match(i18n, /"No packs match": "No packs match"/);
  assert.match(i18n, /"Search openings": "Buscar aperturas"/);
  assert.match(i18n, /"Search openings": "搜索开局"/);
  for (const key of [
    "Your opening training packs",
    "How to play",
    "Download the app",
    "Continue on the web",
    "Tap to practice",
    "See 18 lines",
    "Free sample",
    "Guided practice · memory tests",
    "How the gym works",
    "Continue",
    "Don't show again",
    "The book move is {san}.",
    "Try again",
    "Packs are not for sale in this Play test. The three free Caro lines still train here.",
    "Free",
    "Locked",
    "{pct}%",
  ]) {
    assert.match(i18n, new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), key);
  }
  assert.equal(i18n.split("£1.99").length - 1, 24);
  assert.equal(i18n.split("£2.99").length - 1, 24);
  assert.doesNotMatch(i18n, /search Opening Lab/i);
});

test("GAME_INTRO ends at informed and drops the solid-ground sentence", () => {
  assert.match(intro, /makes your early decisions more informed\./);
  assert.doesNotMatch(intro, /solid ground to take your study further/);
  assert.doesNotMatch(intro, /books, games, engines/);
  assert.match(i18n, /makes your early decisions more informed\./);
  assert.doesNotMatch(i18n, /solid ground to take your study further/);
});
