import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog shows Scotch, Italian, Ruy, and King’s Gambit while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["scotch", "italian", "ruy", "kings-gambit"]);
  assert.match(src, /export function isPackVisible/);
  assert.match(src, /export function visiblePacks/);
});

test("Lab+ offer gate is a paid Play SKU path, not visible pack count", () => {
  assert.match(src, /export function catalogOffersLabPlus/);
  assert.match(src, /export function hasPaidPlaySkuPath/);
  assert.match(src, /export function playVisiblePacks/);
  assert.match(src, /packs\.some\(hasPaidPlaySkuPath\)/);
  assert.doesNotMatch(src, /packs\.length > 1/);
  assert.match(src, /PLAY_PACK_SKUS: Readonly<Record<string, string>> = \{\}/);

  const packList = readFileSync(join(root, "src/components/opening-lab/pack-list.tsx"), "utf8");
  const hero = readFileSync(join(root, "src/components/opening-lab/home-hero.tsx"), "utf8");
  const playApp = readFileSync(join(root, "src/lib/play-app.ts"), "utf8");
  assert.match(packList, /catalogOffersLabPlus/);
  assert.match(packList, /playVisiblePacks/);
  assert.doesNotMatch(hero, /catalogOffersLabPlus/);
  assert.doesNotMatch(hero, /LAB_PLUS_LABEL/);
  assert.doesNotMatch(hero, /Lab\+ is on/);
  assert.match(playApp, /export function isPlayWrap/);
});

test("Help and home name all four free openings and do not pitch Lab+", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const hero = readFileSync(
    join(root, "src/components/opening-lab/home-hero.tsx"),
    "utf8",
  );

  assert.match(guide, /Scotch Gambit/);
  assert.match(guide, /Italian Game/);
  assert.match(guide, /Ruy Lopez/);
  assert.match(guide, /King’s Gambit/);
  assert.match(guide, /All four are free/);
  assert.doesNotMatch(guide, /Lab\+/);
  assert.doesNotMatch(guide, /£4\.99/);
  assert.doesNotMatch(guide, /£29\.99/);
  assert.doesNotMatch(guide, /Pay as you go/);
  assert.doesNotMatch(guide, /Premium packs/);

  assert.match(hero, /Scotch Gambit, Italian Game, Ruy Lopez, and King’s Gambit are free/);
  assert.doesNotMatch(hero, /Lab\+/);
});

test("King’s Gambit Help/card is 5 book lines + 1 trap — Quaade only, no Allgaier, no Muzio", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );

  assert.match(guide, /<strong>King’s Gambit<\/strong> — 5 book lines \+ 1 trap\./);
  assert.doesNotMatch(guide, /King’s Gambit.*\+ 2 traps/);
  assert.doesNotMatch(guide, /Allgaier/);
  assert.doesNotMatch(guide, /Muzio/);

  const start = packs.indexOf('id: "kings-gambit"');
  assert.ok(start >= 0, "kings-gambit pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const kg = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  assert.match(kg, /blurb: "5 book lines \+ 1 trap"/);
  assert.match(kg, /closedLabel: "Free · 5 book lines \+ 1 trap"/);
  assert.doesNotMatch(kg, /\+ 2 traps/);
  assert.doesNotMatch(kg, /Allgaier/);
  assert.doesNotMatch(kg, /Muzio/);
  assert.match(kg, /id: "kg6"/);
  assert.match(kg, /name: "Trap · Quaade 9\.Qh5"/);
  assert.doesNotMatch(kg, /id: "kg7"/);
  const lineIds = [...kg.matchAll(/id: "(kg\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, ["kg1", "kg2", "kg3", "kg4", "kg5", "kg6"]);

  assert.doesNotMatch(packList, /King’s Gambit.*\+ 2 traps/);
  assert.doesNotMatch(packList, /Allgaier/);
  assert.doesNotMatch(packList, /Muzio/);
});
