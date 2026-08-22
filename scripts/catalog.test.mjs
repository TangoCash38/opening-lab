import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog shows Scotch, Italian, Ruy, King’s Gambit, Vienna Game, Scotch Game, Open Sicilian, and French Defence while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["scotch", "italian", "ruy", "kings-gambit", "vienna-game", "scotch-game", "open-sicilian", "french-as-white"]);
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

test("Help and home name all eight free openings and do not pitch Lab+", () => {
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
  assert.match(guide, /Vienna Game/);
  assert.match(guide, /Scotch Game/);
  assert.match(guide, /All eight are free/);
  assert.doesNotMatch(guide, /Lab\+/);
  assert.doesNotMatch(guide, /£4\.99/);
  assert.doesNotMatch(guide, /£29\.99/);
  assert.doesNotMatch(guide, /Pay as you go/);
  assert.doesNotMatch(guide, /Premium packs/);

  assert.match(hero, /Scotch Gambit, Italian Game, Ruy Lopez, King’s Gambit, Vienna Game, Scotch Game, Open Sicilian, and French Defence are free/);
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

test("Vienna Game Help/card is 5 book lines + 1 trap — Würzburger only, no Hamppe-Muzio, no GM, no 3-line leftovers", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );

  assert.match(guide, /<strong>Vienna Game<\/strong> — 5 book lines \+ 1 trap\./);
  assert.match(guide, /All eight are free/);
  assert.doesNotMatch(guide, /All five are free/);
  assert.doesNotMatch(guide, /Hamppe/);
  assert.doesNotMatch(guide, /Muzio/);
  assert.doesNotMatch(guide, /All four are free/);

  const start = packs.indexOf('id: "vienna-game"');
  assert.ok(start >= 0, "vienna-game pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const vg = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  assert.match(vg, /name: "Vienna Game"/);
  assert.match(vg, /isFree: true/);
  assert.match(vg, /isPremium: false/);
  assert.match(vg, /price: null/);
  assert.match(vg, /blurb: "5 book lines \+ 1 trap"/);
  assert.match(vg, /closedLabel: "Free · 5 book lines \+ 1 trap"/);
  assert.doesNotMatch(vg, /Vienna Game & Gambit/);
  assert.doesNotMatch(vg, /3 lines ·/);
  assert.doesNotMatch(vg, /Hamppe/);
  assert.doesNotMatch(vg, /Muzio/);
  assert.doesNotMatch(vg, /Model ·/);
  assert.match(vg, /id: "vg6"/);
  assert.match(vg, /name: "Trap · Würzburger 12\.b3"/);
  assert.doesNotMatch(vg, /id: "vg7"/);
  const lineIds = [...vg.matchAll(/id: "(vg\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, ["vg1", "vg2", "vg3", "vg4", "vg5", "vg6"]);

  assert.doesNotMatch(packList, /Hamppe/);
  assert.doesNotMatch(packList, /Muzio/);
});

test("Scotch Game Help/card is 5 book lines + 1 trap — Steinitz trap only, no GM, no Lolli, no 4.Bc4 gambit leftovers", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );

  assert.match(guide, /<strong>Scotch Game<\/strong> — 5 book lines \+ 1 trap\./);
  assert.match(guide, /All eight are free/);
  assert.doesNotMatch(guide, /All five are free/);
  assert.doesNotMatch(guide, /Lolli/);

  const start = packs.indexOf('id: "scotch-game"');
  assert.ok(start >= 0, "scotch-game pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const sg = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  assert.match(sg, /name: "Scotch Game"/);
  assert.match(sg, /isFree: true/);
  assert.match(sg, /isPremium: false/);
  assert.match(sg, /price: null/);
  assert.match(sg, /blurb: "5 book lines \+ 1 trap"/);
  assert.match(sg, /closedLabel: "Free · 5 book lines \+ 1 trap"/);
  assert.doesNotMatch(sg, /8 lines ·/);
  assert.doesNotMatch(sg, /Lolli/);
  assert.doesNotMatch(sg, /Model ·/);
  assert.doesNotMatch(sg, /id: "sg7"/);
  assert.doesNotMatch(sg, /id: "sg8"/);
  assert.match(sg, /id: "sg6"/);
  assert.match(sg, /name: "Trap · Steinitz 7\.Nb5"/);
  const lineIds = [...sg.matchAll(/id: "(sg\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, ["sg1", "sg2", "sg3", "sg4", "sg5", "sg6"]);

  assert.doesNotMatch(packList, /Lolli/);
});

test("Open Sicilian Help/card is 5 book lines + 1 trap — Magnus Smith only, Ndb5 on si3, no Alapin, no GM", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );

  assert.match(guide, /<strong>Open Sicilian<\/strong> — 5 book lines \+ 1 trap\./);
  assert.match(guide, /All eight are free/);
  assert.doesNotMatch(guide, /All six are free/);
  assert.doesNotMatch(guide, /Alapin/);

  const start = packs.indexOf('id: "open-sicilian"');
  assert.ok(start >= 0, "open-sicilian pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const os = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  assert.match(os, /name: "Open Sicilian"/);
  assert.match(os, /isFree: true/);
  assert.match(os, /isPremium: false/);
  assert.match(os, /price: null/);
  assert.match(os, /blurb: "5 book lines \+ 1 trap"/);
  assert.match(os, /closedLabel: "Free · 5 book lines \+ 1 trap"/);
  assert.doesNotMatch(os, /Alapin/);
  assert.doesNotMatch(os, /Model ·/);
  assert.doesNotMatch(os, /id: "os1"/);
  assert.doesNotMatch(os, /id: "si7"/);
  assert.match(os, /id: "si3"/);
  assert.match(os, /"Ndb5"/);
  assert.doesNotMatch(os, /"Nb5"/);
  assert.match(os, /name: "Trap · Magnus Smith 9\.Bxf7\+"/);
  const lineIds = [...os.matchAll(/id: "(si\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, ["si1", "si2", "si3", "si4", "si5", "si6"]);

  assert.doesNotMatch(packList, /Alapin/);
});

test("French Defence Help/card is 5 book lines + 1 trap — Advance trap only, no Chatard, no GM, no old fw survey", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );

  assert.match(guide, /<strong>French Defence<\/strong> — 5 book lines \+ 1 trap\./);
  assert.match(guide, /All eight are free/);
  assert.doesNotMatch(guide, /All seven are free/);
  assert.doesNotMatch(guide, /Chatard/);

  const start = packs.indexOf('id: "french-as-white"');
  assert.ok(start >= 0, "french-as-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const fr = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  assert.match(fr, /name: "French Defence"/);
  assert.match(fr, /isFree: true/);
  assert.match(fr, /isPremium: false/);
  assert.match(fr, /price: null/);
  assert.match(fr, /blurb: "5 book lines \+ 1 trap"/);
  assert.match(fr, /closedLabel: "Free · 5 book lines \+ 1 trap"/);
  assert.doesNotMatch(fr, /French Defense \(as White\)/);
  assert.doesNotMatch(fr, /Milner-Barry/);
  assert.doesNotMatch(fr, /Chatard/);
  assert.doesNotMatch(fr, /Model ·/);
  assert.doesNotMatch(fr, /id: "fw1"/);
  assert.doesNotMatch(fr, /id: "fr7"/);
  assert.match(fr, /id: "fr6"/);
  assert.match(fr, /name: "Trap · Advance 10\.Bb5\+"/);
  const lineIds = [...fr.matchAll(/id: "(fr\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, ["fr1", "fr2", "fr3", "fr4", "fr5", "fr6"]);

  assert.doesNotMatch(packList, /Chatard/);
});
