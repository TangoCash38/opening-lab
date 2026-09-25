import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hero = readFileSync(
  join(root, "src/components/opening-lab/home-hero.tsx"),
  "utf8",
);
const packs = readFileSync(join(root, "src/lib/coach-packs.ts"), "utf8");

test("Practice open auto-starts Potato Pie pack intro once per session", () => {
  assert.match(hero, /Potato Pie jumps out as soon as this pack's Practice screen opens/);
  assert.match(hero, /scotchCoachApplies\(\{ packId: pack\.id, practiceEntry: true \}\)/);
  assert.match(hero, /!scotchCoachAlreadySeen\(\)/);
  assert.match(hero, /coachPackIntroApplies\(pack\.id\)/);
  assert.match(hero, /!coachIntroAlreadySeen\(pack\.id\)/);
  assert.match(hero, /const asPracticeEntry = true/);
  assert.match(hero, /launchLine\(line, undefined, asPracticeEntry\)/);
  assert.match(hero, /\}, \[pack\.id, purchased, subscribed\]\);/);
});

test("Line taps during pack intro queue and do not skip Potato Pie", () => {
  assert.match(hero, /queuedLineRef/);
  assert.match(hero, /coachRef\.current\?\.talk === "intro"/);
  assert.match(hero, /queuedLineRef\.current = item/);
  assert.match(hero, /if \(queued\) current\.line = queued/);
});

test("Caro pack intro names e4 c6 on the board stem clock", () => {
  const stem = readFileSync(join(root, "src/lib/caro-intro-stem.ts"), "utf8");
  assert.match(stem, /CARO_INTRO_STEM = \["e4", "c6"\]/);
  assert.match(stem, /CARO_INTRO_STEM_AT_SEC = \[18\.5, 19\.7\]/);
  assert.match(packs, /introStem: CARO_INTRO_STEM/);
  assert.match(packs, /introStemAtSec: CARO_INTRO_STEM_AT_SEC/);
  assert.match(hero, /stemSans=\{coachPack\(pack\.id\)\?\.introStem\}/);
  assert.match(hero, /stemAtSec=\{coachPack\(pack\.id\)\?\.introStemAtSec\}/);
  assert.match(hero, /flip=\{pack\.side === "Black"\}/);
});
