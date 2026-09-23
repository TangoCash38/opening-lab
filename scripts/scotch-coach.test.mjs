import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const lib = src("src/lib/scotch-coach.ts");
const hero = src("src/components/opening-lab/home-hero.tsx");
const intro = src("src/components/opening-lab/scotch-coach-intro.tsx");
const css = src("src/styles.css");
const train = src("src/components/opening-lab/train-view.tsx");

test("scotch coach is flag- and pack-gated to website desktop practice", () => {
  assert.match(lib, /SCOTCH_PACK_ID = "scotch"/);
  assert.match(lib, /SCOTCH_COACH_ENABLED = true/);
  assert.match(lib, /if \(!SCOTCH_COACH_ENABLED\) return false/);
  assert.match(lib, /input\.packId !== SCOTCH_PACK_ID/);
  assert.match(lib, /if \(input\.playApp\) return false/);
  assert.match(lib, /if \(!input\.websiteDesktop\) return false/);
  assert.match(hero, /scotchCoachApplies\(\{/);
  assert.match(hero, /playApp: Boolean\(playApp\)/);
  assert.match(hero, /websiteDesktop: websiteDesktopFrame\(\)/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
});

test("coach narrates the scotch gambit then starts book practice", () => {
  assert.match(lib, /1\.e4 e5 2\.Nf3 Nc6 3\.d4/);
  assert.match(lib, /Bc4, aiming at f7/);
  assert.match(lib, /hobbyist favourite/);
  assert.match(lib, /Let’s practice the book moves\./);
  assert.match(intro, /data-scotch-coach-skip/);
  assert.match(intro, /data-scotch-coach-next/);
  assert.match(intro, /onDone/);
  assert.match(hero, /finishCoach/);
  assert.match(hero, /mode: "learn"/);
  assert.match(intro, /coach-seated\.png/);
  assert.match(css, /scotch-coach-emerge/);
  assert.match(css, /#fbf6ea/);
  assert.doesNotMatch(intro, /vs-computer|playComputer|Play on/i);
  assert.match(train, /Test/);
});
