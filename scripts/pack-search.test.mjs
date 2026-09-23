import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const list = src("src/components/opening-lab/pack-list.tsx");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const intro = src("src/lib/pack-intro.ts");

test("home list has no search field, sticky strip, or pack-query filter", () => {
  assert.ok(
    !existsSync(join(root, "src/lib/pack-search.ts")),
    "pack-search helper is removed",
  );
  assert.doesNotMatch(list, /PackSearchField/);
  assert.doesNotMatch(list, /packMatchesQuery/);
  assert.doesNotMatch(list, /pack-search/);
  assert.doesNotMatch(list, /packQuery/);
  assert.doesNotMatch(list, /type="search"/);
  assert.doesNotMatch(list, /Search openings/);
  assert.doesNotMatch(list, /Clear search/);
  assert.doesNotMatch(list, /No packs match/);
  assert.doesNotMatch(css, /\.pack-search-sticky/);
  assert.doesNotMatch(css, /\.pack-search-input/);
  assert.doesNotMatch(i18n, /"Search openings"/);
  assert.doesNotMatch(i18n, /"Clear search"/);
  assert.doesNotMatch(i18n, /"No packs match"/);

  const headingAt = list.indexOf("home-heading-row");
  const gridAt = list.indexOf("pack-list-grid");
  const trapsAt = list.indexOf('["opening-traps", "caro-kann-black"]');
  assert.ok(headingAt > -1, "Menu row stays on the page");
  assert.ok(gridAt > headingAt, "pack grid sits under the Menu row");
  assert.ok(trapsAt > -1, "Opening Traps and Caro lead the catalog");
  assert.doesNotMatch(list, /Learn Drill Know/);
  assert.doesNotMatch(list, /QuietLabel/);
  assert.match(list, /onToggle=\{togglePack\}/);
  assert.doesNotMatch(list, /setFeaturedId\(pack\.id\)/);
});

test("required home-row English keys stay intact", () => {
  for (const key of [
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
