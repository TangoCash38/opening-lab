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
  eco: "B12–B19",
  side: "Black",
  lines: [{ name: "Line 1 · Advance 4.h4" }, { name: "Line 2 · Classical" }],
};

test("packMatchesQuery is case-insensitive on name, blurb, eco, side, and line names", () => {
  assert.equal(packMatchesQuery(sample, ""), true);
  assert.equal(packMatchesQuery(sample, "   "), true);
  assert.equal(packMatchesQuery(sample, "caro"), true);
  assert.equal(packMatchesQuery(sample, "CARO-KANN"), true);
  assert.equal(packMatchesQuery(sample, "classical"), true);
  assert.equal(packMatchesQuery(sample, "b12"), true);
  assert.equal(packMatchesQuery(sample, "black"), true);
  assert.equal(packMatchesQuery(sample, "4.h4"), true);
  assert.equal(packMatchesQuery(sample, "sicilian"), false);
  assert.equal(packMatchesQuery(sample, "white"), false);
});

test("search field sits under More opening packs and filters the more-pack lists", () => {
  const headingAt = list.indexOf('t("More opening packs")');
  const searchAt = list.indexOf("<PackSearchField");
  const trapsAt = list.indexOf("{openingTraps ? (");
  assert.ok(headingAt > -1, "More opening packs heading");
  assert.ok(searchAt > headingAt, "search sits after More opening packs");
  assert.ok(trapsAt > searchAt, "pack lists sit after the search field");
  assert.match(list, /from "@\/lib\/pack-search"/);
  assert.match(list, /packMatchesQuery/);
  assert.match(list, /t\("Search openings"\)/);
  assert.match(list, /t\("Clear search"\)/);
  assert.match(list, /t\("No openings match\."\)/);
  assert.match(list, /pack-list-full pack-search/);
  assert.match(list, /type="search"/);
  assert.match(list, /placeholder=\{t\("Search openings"\)\}/);
  assert.match(list, /onSelectPack=\{promotePack\}/);
  assert.match(list, /setFeaturedId\(pack\.id\)/);
  assert.match(list, /<HomeHero/);
  const heroAt = list.indexOf("<HomeHero");
  assert.ok(heroAt > -1 && heroAt < searchAt, "hero stays above the search lists");
  assert.doesNotMatch(list, /searching && !featuredPack/);
  assert.match(css, /\.pack-search-input::-webkit-search-cancel-button/);
});

test("search copy is translated; required home-row English keys stay intact", () => {
  assert.match(i18n, /"Search openings": "Search openings"/);
  assert.match(i18n, /"Clear search": "Clear search"/);
  assert.match(i18n, /"No openings match\.": "No openings match\."/);
  assert.match(i18n, /"Search openings": "Buscar aperturas"/);
  assert.match(i18n, /"Search openings": "搜索开局"/);
  for (const key of [
    "Train openings the strict way",
    "How to play",
    "Download the app",
    "Continue on the web",
    "Tap to practice",
    "See 18 lines",
    "Free sample",
    "Strict lines · memory training",
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
