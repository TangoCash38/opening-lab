import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog shows only Caro-Kann for Black while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["caro-kann-black"]);
  assert.match(src, /export function isPackVisible/);
  assert.match(src, /export function visiblePacks/);

  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  for (const hidden of [
    "scotch",
    "italian",
    "ruy",
    "kings-gambit",
    "vienna-game",
    "scotch-game",
    "open-sicilian",
    "french-as-white",
  ]) {
    assert.match(packs, new RegExp(`id: "${hidden}"`), `${hidden} should stay in packs.ts`);
    assert.equal(ids.includes(hidden), false, `${hidden} must not be visible`);
  }
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

test("Help and home name the one free pack and do not pitch Lab+", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const hero = readFileSync(
    join(root, "src/components/opening-lab/home-hero.tsx"),
    "utf8",
  );

  assert.match(
    guide,
    /<strong>Caro-Kann for Black<\/strong> — 10 setups \+ 8 follow-ups\. This pack is free\./,
  );
  assert.doesNotMatch(guide, /Lab\+/);
  assert.doesNotMatch(guide, /£4\.99/);
  assert.doesNotMatch(guide, /£29\.99/);
  assert.doesNotMatch(guide, /Pay as you go/);
  assert.doesNotMatch(guide, /Premium packs/);
  assert.doesNotMatch(guide, /Scotch Gambit/);
  assert.doesNotMatch(guide, /All eight are free/);

  assert.match(hero, /Train openings the strict way/);
  assert.match(hero, /How to play/);
  assert.doesNotMatch(
    hero,
    /Caro-Kann for Black is free\. You play Black\. Follow the yellow hint\. Wrong moves are rejected\./,
  );
  assert.match(hero, /See 18 lines/);
  assert.doesNotMatch(hero, /Start free Caro-Kann Core 1/);
  assert.match(hero, /id === "caro-kann-black"/);
  assert.match(hero, /flip=\{true\}/);
  assert.doesNotMatch(hero, /Lab\+/);

  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );
  assert.match(
    packList,
    /These packs are on while we check the rest\. If a move is wrong, tell us on that line\./,
  );
});

test("Play listing copy is unchanged", () => {
  const playApp = readFileSync(join(root, "src/lib/play-app.ts"), "utf8");
  assert.match(
    playApp,
    /export const PLAY_STORE_NOTICE =\s*"Scotch is free\. Lab\+ yearly is billed by Google Play\."/,
  );
});

test("Caro-Kann for Black is the free Black pack: 10 setups + 8 follow-ups, N1e2 on ckb9", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "caro-kann-black"');
  assert.ok(start >= 0, "caro-kann-black pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const ck = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(ck, /name: "Caro-Kann for Black"/);
  assert.match(ck, /side: "Black"/);
  assert.match(ck, /section: "black"/);
  assert.match(ck, /isFree: true/);
  assert.match(ck, /isPremium: false/);
  assert.match(ck, /price: null/);
  assert.match(ck, /blurb: "10 setups \+ 8 follow-ups"/);
  assert.match(ck, /closedLabel: "Free · 18 drills"/);
  assert.match(ck, /eco: "B10–B19"/);

  const lineIds = [...ck.matchAll(/id: "(ckb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `ckb${i + 1}`),
  );

  const sides = [...ck.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const ckb9Start = ck.indexOf('id: "ckb9"');
  assert.ok(ckb9Start >= 0, "ckb9 missing");
  const ckb9Next = ck.indexOf('id: "ckb10"', ckb9Start);
  const ckb9 = ck.slice(ckb9Start, ckb9Next >= 0 ? ckb9Next : undefined);
  assert.match(ckb9, /"N1e2"/);
  assert.doesNotMatch(ckb9, /"Ne2"/);
  assert.doesNotMatch(ckb9, /"Nge2"/);
});
