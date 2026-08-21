import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog only shows Scotch while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["scotch"]);
  assert.match(src, /export function isPackVisible/);
  assert.match(src, /export function visiblePacks/);
});

test("Lab+ offer gate is visible pack count or any locked pack, not a forever hide", () => {
  assert.match(src, /export function catalogOffersLabPlus/);
  assert.match(src, /packs\.length > 1/);
  assert.match(src, /packs\.some\(\(pack\) => !pack\.isFree\)/);

  const packList = readFileSync(join(root, "src/components/opening-lab/pack-list.tsx"), "utf8");
  const hero = readFileSync(join(root, "src/components/opening-lab/home-hero.tsx"), "utf8");
  const playApp = readFileSync(join(root, "src/lib/play-app.ts"), "utf8");
  assert.match(packList, /catalogOffersLabPlus/);
  assert.match(hero, /catalogOffersLabPlus/);
  assert.match(playApp, /export function isPlayWrap/);
});
