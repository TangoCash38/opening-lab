import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog shows Caro-Kann for Black, QGD for Black, London for Black, 1.d4 sidelines for Black, Anti-Sicilian for Black, Nimzo-Larsen for White, Italian for White, Ruy Lopez for White, French Defence for White, and Alapin for White while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["caro-kann-black", "qgd-black", "london-black", "d4-sidelines-black", "anti-sicilian-black", "nimzo-larsen-white", "italian-white", "ruy-white", "french-white", "alapin-white"]);
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

test("Help and home name the free packs and do not pitch Lab+", () => {
  const guide = readFileSync(
    join(root, "src/components/opening-lab/guide-view.tsx"),
    "utf8",
  );
  const hero = readFileSync(
    join(root, "src/components/opening-lab/home-hero.tsx"),
    "utf8",
  );

  assert.match(guide, /<Block title="Caro-Kann for Black">/);
  assert.match(guide, /The Caro-Kann is Black's answer to 1\.e4/);
  assert.match(
    guide,
    /Practice the main book moves with the yellow hint/,
  );
  assert.match(guide, /Then Test with none to prove you/);
  assert.match(guide, /Play on from the setup if you want/);
  assert.match(guide, /Play on from the setup and see where the game goes/);
  assert.match(guide, /Free sample:\s+Advance,/);
  assert.match(guide, /Classical, Exchange/);
  assert.match(guide, /Other Caro lines are in the full pack/);
  assert.match(
    guide,
    /<Block title="Queen\u2019s Gambit Declined for Black">/,
  );
  assert.match(guide, /solid answer to 1\.d4/);
  assert.match(guide, /18\s+book lines/);
  assert.match(guide, /<Block title="Stop the London System">/);
  assert.match(guide, /Black vs the London/);
  assert.match(guide, /solid d4 setup with Bf4/);
  assert.match(guide, /<Block title="1\.d4 Sideline Survival Kit">/);
  assert.match(guide, /18 lines\. Free\./);
  assert.match(guide, /<Block title="Anti-Sicilian Survival Kit">/);
  assert.match(guide, /anti-Sicilians as Black/);
  assert.match(guide, /<Block title="Nimzo-Larsen Attack for White">/);
  assert.match(guide, /1\.b3, Bb2/);
  assert.match(guide, /<Block title="Italian Game Mastery for White">/);
  assert.match(guide, /Play the Italian as White/);
  assert.match(guide, /<Block title="Ruy Lopez Mastery for White">/);
  assert.match(guide, /Play the Ruy Lopez as White/);
  assert.match(guide, /<Block title="French Defence for White: Advance & Tarrasch">/);
  assert.match(guide, /Meet the French as White/);
  assert.match(guide, /<Block title="How to Meet the Sicilian: The Alapin for White">/);
  assert.match(guide, /Meet the Sicilian as White with the Alapin/);
  assert.doesNotMatch(guide, /setups/);
  assert.doesNotMatch(guide, /follow-ups/);
  assert.doesNotMatch(guide, /<Block title="Free openings">/);
  assert.doesNotMatch(guide, /Lab\+/);
  assert.doesNotMatch(guide, /£4\.99/);
  assert.doesNotMatch(guide, /£29\.99/);
  assert.doesNotMatch(guide, /Pay as you go/);
  assert.doesNotMatch(guide, /Premium packs/);
  assert.doesNotMatch(guide, /Scotch Gambit/);
  assert.doesNotMatch(guide, /All eight are free/);
  assert.doesNotMatch(guide, /All nine are free/);
  assert.doesNotMatch(guide, /All ten are free/);
  assert.doesNotMatch(guide, /£1\.99/);

  assert.match(guide, /<Block title="Play on">/);
  assert.match(guide, /After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup\. A clean Test still turns the line green\. Play on does not complete the line\./);
  assert.match(guide, /800/);
  assert.match(guide, /1200/);
  assert.match(guide, /1800/);

  assert.match(hero, /Train openings the strict way/);
  assert.match(hero, /How to play/);
  assert.match(hero, /rounded-full/);
  assert.match(hero, /border-border/);
  assert.match(hero, /min-h-11/);
  assert.match(hero, /bg-bg-elevated/);
  assert.match(hero, /Tap to practice/);
  assert.match(hero, /See 18 lines/);
  assert.match(hero, /aria-expanded=\{linesOpen\}/);
  assert.match(hero, /Free sample/);
  assert.match(hero, /Advance, Classical, Exchange/);
  assert.match(hero, /PackAboutModal/);
  assert.match(hero, /aboutOpen/);
  assert.match(hero, /pack\?\.about/);
  assert.doesNotMatch(hero, /The Caro-Kann is Black's answer to 1\.e4/);
  assert.match(hero, /id === "ckb1"/);
  assert.match(hero, /onStartLine\(pack, line, "learn"\)/);
  assert.match(hero, /isLineUnlocked/);
  assert.match(hero, /pack\.lines\.map/);
  assert.doesNotMatch(hero, /See 3 lines/);
  assert.doesNotMatch(hero, /setups/);
  assert.doesNotMatch(hero, /follow-ups/);
  assert.doesNotMatch(hero, /Free pack · ready to train/);
  assert.doesNotMatch(
    hero,
    /Caro-Kann for Black is free\. You play Black\. Follow the yellow hint\. Wrong moves are rejected\./,
  );
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
  assert.match(packList, /isLineUnlocked\(pack, line\.id\)/);
  assert.match(packList, /pack\.lines\.map/);
  assert.match(packList, /pack\.about/);
  assert.match(packList, /PackAboutModal/);
  assert.match(packList, /aboutOpen/);
  const aboutModal = readFileSync(
    join(root, "src/components/opening-lab/pack-about-modal.tsx"),
    "utf8",
  );
  assert.match(aboutModal, /aria-label="Close"/);
  assert.match(aboutModal, /role="dialog"/);
  assert.doesNotMatch(packList, /£1\.99/);
  assert.match(
    packList,
    /p\.section === "black" && p\.id !== "vs-london" && p\.id !== "caro-kann-black"/,
  );
  assert.doesNotMatch(packList, /london-black/);
  assert.doesNotMatch(packList, /d4-sidelines-black/);
  assert.doesNotMatch(packList, /anti-sicilian-black/);
  assert.doesNotMatch(packList, /nimzo-larsen-white/);
  assert.doesNotMatch(packList, /italian-white/);
  assert.doesNotMatch(packList, /ruy-white/);
  assert.doesNotMatch(packList, /french-white/);
  assert.doesNotMatch(packList, /alapin-white/);
});

test("Play listing copy is unchanged", () => {
  const playApp = readFileSync(join(root, "src/lib/play-app.ts"), "utf8");
  assert.match(
    playApp,
    /export const PLAY_STORE_NOTICE =\s*"Scotch is free\. Lab\+ yearly is billed by Google Play\."/,
  );
});

test("Caro-Kann for Black is a 3-line free sample; 18 lines stay in packs.ts, N1e2 on ckb9", () => {
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
  assert.match(ck, /blurb: "Advance, Classical, Exchange"/);
  assert.match(ck, /closedLabel: "Free · 3 lines"/);
  assert.match(ck, /The Caro-Kann is Black's answer to 1\.e4/);
  assert.match(ck, /Practice the main book moves with the yellow hint/);
  assert.match(ck, /Then Test with none to prove you remember them/);
  assert.match(ck, /Play on from the setup if you want/);
  assert.match(ck, /eco: "B10–B19"/);
  assert.doesNotMatch(ck, /setups/);
  assert.doesNotMatch(ck, /follow-ups/);
  assert.doesNotMatch(ck, /Core \d+ ·/);
  assert.doesNotMatch(ck, /Follow-up \d+ ·/);

  const lineIds = [...ck.matchAll(/id: "(ckb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `ckb${i + 1}`),
  );

  const sides = [...ck.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const names = Object.fromEntries(
    [...ck.matchAll(/id: "(ckb\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.ckb1, "Advance");
  assert.equal(names.ckb3, "Classical");
  assert.equal(names.ckb5, "Exchange");
  assert.equal(names.ckb9, "Classical, N1e2");

  const ckb9Start = ck.indexOf('id: "ckb9"');
  assert.ok(ckb9Start >= 0, "ckb9 missing");
  const ckb9Next = ck.indexOf('id: "ckb10"', ckb9Start);
  const ckb9 = ck.slice(ckb9Start, ckb9Next >= 0 ? ckb9Next : undefined);
  assert.match(ckb9, /"N1e2"/);
  assert.doesNotMatch(ckb9, /"Ne2"/);
  assert.doesNotMatch(ckb9, /"Nge2"/);
});

test("Queen’s Gambit Declined for Black stays fully visible with chess names", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "qgd-black"');
  assert.ok(start >= 0, "qgd-black pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const qgd = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(qgd, /name: "Queen\u2019s Gambit Declined for Black"/);
  assert.match(qgd, /side: "Black"/);
  assert.match(qgd, /section: "black"/);
  assert.match(qgd, /isFree: true/);
  assert.match(qgd, /isPremium: false/);
  assert.match(qgd, /price: null/);
  assert.match(qgd, /blurb: "Black vs 1\.d4"/);
  assert.match(qgd, /closedLabel: "Free · 18 lines"/);
  assert.match(qgd, /solid answer to 1\.d4/);
  assert.match(qgd, /Practice the main book moves with the yellow hint/);
  assert.match(qgd, /Then Test with none to prove you remember them/);
  assert.match(qgd, /Play on from the setup and see where the game goes/);
  assert.match(qgd, /eco: "D30–D69"/);
  assert.doesNotMatch(qgd, /setups/);
  assert.doesNotMatch(qgd, /follow-ups/);
  assert.doesNotMatch(qgd, /Core \d+ ·/);
  assert.doesNotMatch(qgd, /Follow-up \d+ ·/);

  const lineIds = [...qgd.matchAll(/id: "(qgdb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `qgdb${i + 1}`),
  );

  const sides = [...qgd.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const qgdb1Start = qgd.indexOf('id: "qgdb1"');
  assert.ok(qgdb1Start >= 0, "qgdb1 missing");
  const qgdb1Next = qgd.indexOf('id: "qgdb2"', qgdb1Start);
  const qgdb1 = qgd.slice(qgdb1Start, qgdb1Next >= 0 ? qgdb1Next : undefined);
  assert.match(qgdb1, /plies: \["d4"/);
  assert.match(qgdb1, /name: "Exchange, …Be7"/);
});

test("Stop the London System is a third visible free Black pack: 18 lonb lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "london-black"');
  assert.ok(start >= 0, "london-black pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const lon = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(lon, /name: "Stop the London System"/);
  assert.match(lon, /side: "Black"/);
  assert.match(lon, /section: "black"/);
  assert.match(lon, /isFree: true/);
  assert.match(lon, /isPremium: false/);
  assert.match(lon, /price: null/);
  assert.match(lon, /blurb: "Black vs the London"/);
  assert.match(lon, /closedLabel: "Free · 18 lines"/);
  assert.match(lon, /The London is White's solid d4 setup with Bf4/);
  assert.match(lon, /Practice the main book moves with the yellow hint/);
  assert.match(lon, /Then Test with none to prove you remember them/);
  assert.match(lon, /Play on from the setup if you want/);
  assert.match(lon, /eco: "D00–D02"/);
  assert.doesNotMatch(lon, /setups/);
  assert.doesNotMatch(lon, /follow-ups/);
  assert.doesNotMatch(lon, /Core \d+ ·/);
  assert.doesNotMatch(lon, /Follow-up \d+ ·/);
  assert.doesNotMatch(lon, /Lab\+/);
  assert.doesNotMatch(lon, /£/);

  const lineIds = [...lon.matchAll(/id: "(lonb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `lonb${i + 1}`),
  );

  const sides = [...lon.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  function linePlies(id) {
    const from = lon.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = lon.indexOf('id: "', from + 10);
    const line = lon.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  const lonb1 = linePlies("lonb1");
  const lonb2 = linePlies("lonb2");
  assert.deepEqual(lonb1, lonb2);
  assert.deepEqual(lonb1, ["d4", "d5", "Nf3", "Nf6", "Bf4", "c5", "e3", "Nc6", "c3", "Qb6"]);

  const lonb11 = linePlies("lonb11");
  assert.ok(lonb11.includes("Qxf5"), "lonb11 needs Qxf5");
  assert.ok(lonb11.includes("Qxb2"), "lonb11 needs Qxb2");

  const names = Object.fromEntries(
    [...lon.matchAll(/id: "(lonb\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.lonb1, "Early …c5");
  assert.equal(names.lonb2, "Pressure b2");
  assert.equal(names.lonb11, "Qc2, …Qxb2");
  assert.equal(names.lonb18, "Qb3, …Bf5");
});


test("1.d4 Sideline Survival Kit is a fourth visible free Black pack: 18 d4s lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "d4-sidelines-black"');
  assert.ok(start >= 0, "d4-sidelines-black pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const d4s = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(d4s, /name: "1\.d4 Sideline Survival Kit"/);
  assert.match(d4s, /side: "Black"/);
  assert.match(d4s, /section: "black"/);
  assert.match(d4s, /isFree: true/);
  assert.match(d4s, /isPremium: false/);
  assert.match(d4s, /price: null/);
  assert.match(d4s, /blurb: "Black vs Colle, Torre, Trompowsky, Veresov, Blackmar-Diemer"/);
  assert.match(d4s, /closedLabel: "Free · 18 lines"/);
  assert.match(d4s, /Meet White's 1\.d4 sidelines as Black/);
  assert.match(d4s, /Practice the main book moves with the yellow hint/);
  assert.match(d4s, /Then Test with none to prove you remember them/);
  assert.match(d4s, /Play on from the setup if you want/);
  assert.match(d4s, /eco: "D00–D05"/);
  assert.doesNotMatch(d4s, /setups/);
  assert.doesNotMatch(d4s, /follow-ups/);
  assert.doesNotMatch(d4s, /Core \d+ ·/);
  assert.doesNotMatch(d4s, /Follow-up \d+ ·/);
  assert.doesNotMatch(d4s, /Lab\+/);
  assert.doesNotMatch(d4s, /£/);

  const lineIds = [...d4s.matchAll(/id: "(d4s\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `d4s${i + 1}`),
  );

  const sides = [...d4s.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  function linePlies(id) {
    const from = d4s.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = d4s.indexOf('id: "', from + 10);
    const line = d4s.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  assert.deepEqual(linePlies("d4s1"), ["d4", "d5", "Nf3", "Nf6", "e3", "e6", "Bd3", "c5", "c3", "Nc6"]);
  assert.deepEqual(linePlies("d4s10"), ["d4", "d5", "e4", "dxe4", "Nc3", "Nf6", "f3", "exf3", "Nxf3", "Bg4", "h3", "Bxf3", "Qxf3", "c6"]);

  const names = Object.fromEntries(
    [...d4s.matchAll(/id: "(d4s\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.d4s1, "Colle: challenge the centre");
  assert.equal(names.d4s10, "Blackmar-Diemer: Teichmann defence");
  assert.equal(names.d4s18, "Blackmar-Diemer: Bogoljubov setup");
});


test("Anti-Sicilian Survival Kit is a fifth visible free Black pack: 18 as lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "anti-sicilian-black"');
  assert.ok(start >= 0, "anti-sicilian-black pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const asb = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(asb, /name: "Anti-Sicilian Survival Kit"/);
  assert.match(asb, /side: "Black"/);
  assert.match(asb, /section: "black"/);
  assert.match(asb, /isFree: true/);
  assert.match(asb, /isPremium: false/);
  assert.match(asb, /price: null/);
  assert.match(asb, /blurb: "Black vs Alapin, Grand Prix, Closed, Smith-Morra, Rossolimo, Wing Gambit"/);
  assert.match(asb, /closedLabel: "Free · 18 lines"/);
  assert.match(asb, /Meet White's anti-Sicilians as Black/);
  assert.match(asb, /Practice the main book moves with the yellow hint/);
  assert.match(asb, /Then Test with none to prove you remember them/);
  assert.match(asb, /Play on from the setup if you want/);
  assert.match(asb, /eco: "B20–B30"/);
  assert.doesNotMatch(asb, /setups/);
  assert.doesNotMatch(asb, /follow-ups/);
  assert.doesNotMatch(asb, /Core \d+ ·/);
  assert.doesNotMatch(asb, /Follow-up \d+ ·/);
  assert.doesNotMatch(asb, /Lab\+/);
  assert.doesNotMatch(asb, /£/);

  const lineIds = [...asb.matchAll(/id: "(as\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `as${i + 1}`),
  );

  const sides = [...asb.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  function linePlies(id) {
    const from = asb.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = asb.indexOf('id: "', from + 10);
    const line = asb.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  assert.deepEqual(linePlies("as1"), ["e4", "c5", "c3", "d5", "exd5", "Qxd5", "d4", "Nf6", "Nf3", "e6"]);
  assert.deepEqual(linePlies("as10"), ["e4", "c5", "f4", "d5", "exd5", "Nf6", "Nf3", "Nxd5", "Bb5+", "Bd7"]);
  assert.deepEqual(linePlies("as18"), ["e4", "c5", "b4", "cxb4", "a3", "bxa3", "Nxa3", "Nc6", "d4", "g6", "Nf3", "Bg7", "Bc4", "d6"]);

  const names = Object.fromEntries(
    [...asb.matchAll(/id: "(as\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.as1, "Alapin: central challenge");
  assert.equal(names.as10, "2.f4: immediate central break");
  assert.equal(names.as18, "Wing Gambit: finish development");
});


test("Nimzo-Larsen Attack for White is a sixth visible free White pack: 18 nl lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "nimzo-larsen-white"');
  assert.ok(start >= 0, "nimzo-larsen-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const nl = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(nl, /name: "Nimzo-Larsen Attack for White"/);
  assert.match(nl, /side: "White"/);
  assert.match(nl, /section: "white"/);
  assert.match(nl, /isFree: true/);
  assert.match(nl, /isPremium: false/);
  assert.match(nl, /price: null/);
  assert.match(nl, /blurb: "White · 1\.b3 Bb2"/);
  assert.match(nl, /closedLabel: "Free · 18 lines"/);
  assert.match(nl, /Play the Nimzo-Larsen as White/);
  assert.match(nl, /Practice the main book moves with the yellow hint/);
  assert.match(nl, /Then Test with none to prove you remember them/);
  assert.match(nl, /Play on from the setup if you want/);
  assert.match(nl, /eco: "A01"/);
  assert.doesNotMatch(nl, /setups/);
  assert.doesNotMatch(nl, /follow-ups/);
  assert.doesNotMatch(nl, /Core \d+ ·/);
  assert.doesNotMatch(nl, /Follow-up \d+ ·/);
  assert.doesNotMatch(nl, /Lab\+/);
  assert.doesNotMatch(nl, /£/);
  assert.doesNotMatch(nl, /trap:\s*true/);

  const lineIds = [...nl.matchAll(/id: "(nl\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `nl${i + 1}`),
  );

  const sides = [...nl.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  function linePlies(id) {
    const from = nl.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = nl.indexOf('id: "', from + 10);
    const line = nl.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  for (let i = 1; i <= 18; i++) {
    const plies = linePlies(`nl${i}`);
    assert.equal(plies[0], "b3", `nl${i} must start with b3`);
  }

  assert.deepEqual(linePlies("nl1"), ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Bb5", "Bd6", "Ne2", "O-O", "O-O", "Re8", "d4", "e4", "Ng3", "Bf8", "d5"]);
  assert.deepEqual(linePlies("nl11"), ["b3", "e5", "Bb2", "Nc6", "e3", "Nf6", "Bb5", "a6", "Bxc6", "dxc6", "Bxe5"]);

  const names = Object.fromEntries(
    [...nl.matchAll(/id: "(nl\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.nl1, "Nimzo-Larsen: …e5 central lock");
  assert.equal(names.nl11, "Nimzo-Larsen: …a6 and Bxe5");
  assert.equal(names.nl18, "Nimzo-Larsen: after …cxd4");
});


test("Italian Game Mastery for White is a seventh visible free White pack: 18 it lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "italian-white"');
  assert.ok(start >= 0, "italian-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const it = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(it, /name: "Italian Game Mastery for White"/);
  assert.match(it, /side: "White"/);
  assert.match(it, /section: "white"/);
  assert.match(it, /isFree: true/);
  assert.match(it, /isPremium: false/);
  assert.match(it, /price: null/);
  assert.match(it, /blurb: "White · quiet Italian, Giuoco Piano, Two Knights, Evans, Hungarian"/);
  assert.match(it, /closedLabel: "Free · 18 lines"/);
  assert.match(it, /Play the Italian as White/);
  assert.match(it, /Practice the main book moves with the yellow hint/);
  assert.match(it, /Then Test with none to prove you remember them/);
  assert.match(it, /Play on from the setup if you want/);
  assert.match(it, /eco: "C50"/);
  assert.doesNotMatch(it, /setups/);
  assert.doesNotMatch(it, /follow-ups/);
  assert.doesNotMatch(it, /Core \d+ ·/);
  assert.doesNotMatch(it, /Follow-up \d+ ·/);
  assert.doesNotMatch(it, /Lab\+/);
  assert.doesNotMatch(it, /£/);
  assert.doesNotMatch(it, /trap:\s*true/);

  const lineIds = [...it.matchAll(/id: "(it\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `it${i + 1}`),
  );

  const sides = [...it.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  function linePlies(id) {
    const from = it.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = it.indexOf('id: "', from + 10);
    const line = it.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  for (let i = 1; i <= 18; i++) {
    const plies = linePlies(`it${i}`);
    assert.deepEqual(plies.slice(0, 5), ["e4", "e5", "Nf3", "Nc6", "Bc4"], `it${i} must start e4 e5 Nf3 Nc6 Bc4`);
  }

  assert.deepEqual(linePlies("it1"), ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6", "c3", "d6", "O-O", "O-O", "Re1", "a6"]);
  assert.deepEqual(linePlies("it5"), ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5", "Bb5+", "c6", "dxc6", "bxc6", "Be2"]);

  const names = Object.fromEntries(
    [...it.matchAll(/id: "(it\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.it1, "Quiet Italian: classical entry");
  assert.equal(names.it5, "Two Knights: meet …d5");
  assert.equal(names.it9, "Rousseau Gambit awareness");
});



test("Ruy Lopez Mastery for White is an eighth visible free White pack: 18 rl lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "ruy-white"');
  assert.ok(start >= 0, "ruy-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const rl = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(rl, /name: "Ruy Lopez Mastery for White"/);
  assert.match(rl, /side: "White"/);
  assert.match(rl, /section: "white"/);
  assert.match(rl, /isFree: true/);
  assert.match(rl, /isPremium: false/);
  assert.match(rl, /price: null/);
  assert.match(rl, /blurb: "White · Closed, Berlin, Exchange, Open, Marshall, Schliemann"/);
  assert.match(rl, /closedLabel: "Free · 18 lines"/);
  assert.match(rl, /Play the Ruy Lopez as White/);
  assert.match(rl, /Practice the main book moves with the yellow hint/);
  assert.match(rl, /Then Test with none to prove you remember them/);
  assert.match(rl, /Play on from the setup if you want/);
  assert.match(rl, /eco: "C60"/);
  assert.doesNotMatch(rl, /setups/);
  assert.doesNotMatch(rl, /follow-ups/);
  assert.doesNotMatch(rl, /Core \d+ ·/);
  assert.doesNotMatch(rl, /Follow-up \d+ ·/);
  assert.doesNotMatch(rl, /Lab\+/);
  assert.doesNotMatch(rl, /£/);
  assert.doesNotMatch(rl, /trap:\s*true/);

  const lineIds = [...rl.matchAll(/id: "(rl\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `rl${i + 1}`),
  );

  const sides = [...rl.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  function linePlies(id) {
    const from = rl.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = rl.indexOf('id: "', from + 10);
    const line = rl.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  for (let i = 1; i <= 18; i++) {
    const plies = linePlies(`rl${i}`);
    assert.deepEqual(plies.slice(0, 5), ["e4", "e5", "Nf3", "Nc6", "Bb5"], `rl${i} must start e4 e5 Nf3 Nc6 Bb5`);
  }

  assert.deepEqual(linePlies("rl1"), ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O", "h3"]);
  assert.deepEqual(linePlies("rl18"), ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "d6", "d4", "b5", "Bb3", "Nxd4", "Nxd4", "exd4", "c3"]);

  const names = Object.fromEntries(
    [...rl.matchAll(/id: "(rl\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.rl1, "Closed Ruy: basic shell");
  assert.equal(names.rl18, "Noah’s Ark warning");
});


test("French Defence for White is a ninth visible free White pack: 18 fr lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "french-white"');
  assert.ok(start >= 0, "french-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const fr = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(fr, /name: "French Defence for White: Advance & Tarrasch"/);
  assert.match(fr, /side: "White"/);
  assert.match(fr, /section: "white"/);
  assert.match(fr, /isFree: true/);
  assert.match(fr, /isPremium: false/);
  assert.match(fr, /price: null/);
  assert.match(fr, /blurb: "White · Advance, Tarrasch, Classical, Winawer, Exchange"/);
  assert.match(fr, /closedLabel: "Free · 18 lines"/);
  assert.match(fr, /Meet the French as White/);
  assert.match(fr, /Practice the main book moves with the yellow hint/);
  assert.match(fr, /Then Test with none to prove you remember them/);
  assert.match(fr, /Play on from the setup if you want/);
  assert.match(fr, /eco: "C00"/);
  assert.doesNotMatch(fr, /setups/);
  assert.doesNotMatch(fr, /follow-ups/);
  assert.doesNotMatch(fr, /Core \d+ ·/);
  assert.doesNotMatch(fr, /Follow-up \d+ ·/);
  assert.doesNotMatch(fr, /Lab\+/);
  assert.doesNotMatch(fr, /£/);
  assert.doesNotMatch(fr, /trap:\s*true/);

  const lineIds = [...fr.matchAll(/id: "(fr\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `fr${i + 1}`),
  );

  const sides = [...fr.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  function linePlies(id) {
    const from = fr.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = fr.indexOf('id: "', from + 10);
    const line = fr.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  for (let i = 1; i <= 18; i++) {
    const plies = linePlies(`fr${i}`);
    assert.deepEqual(plies.slice(0, 4), ["e4", "e6", "d4", "d5"], `fr${i} must start e4 e6 d4 d5`);
  }

  assert.deepEqual(linePlies("fr1"), ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "Bd3", "cxd4"]);
  assert.deepEqual(linePlies("fr13"), ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "h4", "O-O", "Bd3", "c5", "Qh5"]);

  const names = Object.fromEntries(
    [...fr.matchAll(/id: "(fr\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.fr1, "Advance: main centre");
  assert.equal(names.fr13, "Classical: Qh5 pressure");
});


test("How to Meet the Sicilian: The Alapin for White is a tenth visible free White pack: 18 al lines, all playable", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "alapin-white"');
  assert.ok(start >= 0, "alapin-white pack missing");
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const al = next >= 0 ? packs.slice(start, next) : packs.slice(start);

  assert.match(al, /name: "How to Meet the Sicilian: The Alapin for White"/);
  assert.match(al, /side: "White"/);
  assert.match(al, /section: "white"/);
  assert.match(al, /isFree: true/);
  assert.match(al, /isPremium: false/);
  assert.match(al, /price: null/);
  assert.match(al, /blurb: "White · 2\.c3 vs …Nc6, …d5, …Nf6, …e6, …d6, …g6"/);
  assert.match(al, /closedLabel: "Free · 18 lines"/);
  assert.match(al, /Meet the Sicilian as White with the Alapin/);
  assert.match(al, /Practice the main book moves with the yellow hint/);
  assert.match(al, /Then Test with none to prove you remember them/);
  assert.match(al, /Play on from the setup if you want/);
  assert.match(al, /eco: "B22"/);
  assert.doesNotMatch(al, /setups/);
  assert.doesNotMatch(al, /follow-ups/);
  assert.doesNotMatch(al, /Core \d+ ·/);
  assert.doesNotMatch(al, /Follow-up \d+ ·/);
  assert.doesNotMatch(al, /Lab\+/);
  assert.doesNotMatch(al, /£/);
  assert.doesNotMatch(al, /trap:\s*true/);

  const lineIds = [...al.matchAll(/id: "(al\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(
    lineIds,
    Array.from({ length: 18 }, (_, i) => `al${i + 1}`),
  );

  const sides = [...al.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.ok(sides.length >= 18, "expected line sides");
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  function linePlies(id) {
    const from = al.indexOf(`id: "${id}"`);
    assert.ok(from >= 0, `${id} missing`);
    const to = al.indexOf('id: "', from + 10);
    const line = al.slice(from, to >= 0 ? to : undefined);
    const m = line.match(/plies: \[([^\]]+)\]/);
    assert.ok(m, `${id} plies missing`);
    return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }

  for (let i = 1; i <= 18; i++) {
    const plies = linePlies(`al${i}`);
    assert.deepEqual(plies.slice(0, 3), ["e4", "c5", "c3"], `al${i} must start e4 c5 c3`);
  }

  assert.deepEqual(linePlies("al1"), ["e4", "c5", "c3", "Nc6", "d4", "cxd4", "cxd4", "d5", "exd5", "Qxd5", "Nf3"]);
  assert.deepEqual(linePlies("al18"), ["e4", "c5", "c3", "Nc6", "d4", "cxd4", "cxd4", "g6", "d5", "Ne5", "f4"]);

  const names = Object.fromEntries(
    [...al.matchAll(/id: "(al\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [
      m[1],
      m[2],
    ]),
  );
  assert.equal(names.al1, "Alapin: natural …Nc6");
  assert.equal(names.al17, "Alapin: …Nf6 recapture in the centre");
  assert.equal(names.al18, "Alapin: greedy …g6 knight-space");
});


test("FREE_SAMPLE_LINE_IDS / playableLines returns exactly ckb1, ckb3, ckb5 for Caro", () => {
  assert.match(src, /export const FREE_SAMPLE_LINE_IDS/);
  assert.match(src, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  const sampleBlock = src.slice(
    src.indexOf("FREE_SAMPLE_LINE_IDS"),
    src.indexOf("export function playableLines"),
  );
  assert.doesNotMatch(sampleBlock, /london-black/);
  assert.doesNotMatch(sampleBlock, /qgd-black/);
  assert.doesNotMatch(sampleBlock, /d4-sidelines-black/);
  assert.doesNotMatch(sampleBlock, /anti-sicilian-black/);
  assert.doesNotMatch(sampleBlock, /nimzo-larsen-white/);
  assert.doesNotMatch(sampleBlock, /italian-white/);
  assert.doesNotMatch(sampleBlock, /ruy-white/);
  assert.doesNotMatch(sampleBlock, /french-white/);
  assert.doesNotMatch(sampleBlock, /alapin-white/);
  assert.match(src, /export function playableLines\(pack: Pack\): OpeningLine\[\]/);
  assert.match(src, /if \(!ids\) return pack\.lines;/);
  assert.match(src, /return pack\.lines\.filter\(\(l\) => ids\.includes\(l\.id\)\);/);
  assert.match(src, /export function isLineUnlocked/);
  assert.match(src, /if \(!ids\) return true;/);
  assert.match(src, /return ids\.includes\(lineId\)/);

  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const start = packs.indexOf('id: "caro-kann-black"');
  const next = packs.indexOf("\n  {\n    id: \"", start + 1);
  const ck = next >= 0 ? packs.slice(start, next) : packs.slice(start);
  const lineIds = [...ck.matchAll(/id: "(ckb\d+)"/g)].map((m) => m[1]);
  const sample = ["ckb1", "ckb3", "ckb5"];
  assert.deepEqual(
    lineIds.filter((id) => sample.includes(id)),
    sample,
  );
  assert.equal(lineIds.length, 18);

  const hero = readFileSync(
    join(root, "src/components/opening-lab/home-hero.tsx"),
    "utf8",
  );
  const packList = readFileSync(
    join(root, "src/components/opening-lab/pack-list.tsx"),
    "utf8",
  );
  const rows = readFileSync(
    join(root, "src/components/opening-lab/pack-lines.tsx"),
    "utf8",
  );
  assert.match(hero, /isLineUnlocked\(pack, item\.id\)/);
  assert.match(hero, /pack\.lines\.map/);
  assert.match(packList, /pack\.lines\.map/);
  assert.match(packList, /isLineUnlocked\(pack, line\.id\)/);
  assert.match(rows, /from "lucide-react"/);
  assert.match(rows, /Lock/);
  assert.match(rows, /Locked/);
  assert.match(rows, /Test with no mistakes to complete/);
  assert.doesNotMatch(rows, /£1\.99/);
  assert.doesNotMatch(hero, /£1\.99/);
  assert.doesNotMatch(hero, /Lab\+/);
  assert.doesNotMatch(rows, /Lab\+/);
});

test("every ckb1–18, qgdb1–18, lonb1–18, d4s1–18, as1–18, nl1–18, it1–18, rl1–18, fr1–18, and al1–18 has a non-empty idea; train-view renders line.idea", () => {
  const packs = readFileSync(join(root, "src/data/packs.ts"), "utf8");
  const train = readFileSync(
    join(root, "src/components/opening-lab/train-view.tsx"),
    "utf8",
  );
  const feedback = readFileSync(
    join(root, "src/components/opening-lab/line-feedback.tsx"),
    "utf8",
  );

  function packBlock(id) {
    const start = packs.indexOf(`id: "${id}"`);
    assert.ok(start >= 0, `${id} missing`);
    const next = packs.indexOf("\n  {\n    id: \"", start + 1);
    return next >= 0 ? packs.slice(start, next) : packs.slice(start);
  }

  function assertIdeas(block, prefix, n) {
    for (let i = 1; i <= n; i++) {
      const id = `${prefix}${i}`;
      const from = block.indexOf(`id: "${id}"`);
      assert.ok(from >= 0, `${id} missing`);
      const to = block.indexOf(`id: "${prefix}${i + 1}"`, from);
      const line = block.slice(from, to >= 0 ? to : undefined);
      const m = line.match(/idea: "([^"]+)"/);
      assert.ok(m && m[1].trim().length > 0, `${id} needs a non-empty idea`);
    }
  }

  const ck = packBlock("caro-kann-black");
  const qgd = packBlock("qgd-black");
  const lon = packBlock("london-black");
  const d4s = packBlock("d4-sidelines-black");
  const asb = packBlock("anti-sicilian-black");
  const nl = packBlock("nimzo-larsen-white");
  const it = packBlock("italian-white");
  const rl = packBlock("ruy-white");
  const frw = packBlock("french-white");
  const alw = packBlock("alapin-white");
  assertIdeas(ck, "ckb", 18);
  assertIdeas(qgd, "qgdb", 18);
  assertIdeas(lon, "lonb", 18);
  assertIdeas(d4s, "d4s", 18);
  assertIdeas(asb, "as", 18);
  assertIdeas(nl, "nl", 18);
  assertIdeas(it, "it", 18);
  assertIdeas(rl, "rl", 18);
  assertIdeas(frw, "fr", 18);
  assertIdeas(alw, "al", 18);
  assert.match(
    ck,
    /idea: "White has locked the centre\. Develop the light bishop before …e6, then challenge d4 with …c5\."/,
  );
  assert.match(
    qgd,
    /idea: "White chose the Exchange early\. Recapture with …exd5 and establish the standard Queen's Gambit Declined centre\."/,
  );

  assert.match(train, /\{line\.idea\}/);
  assert.match(train, /text-\[0\.88rem\]/);
  assert.match(train, /text-fg-muted/);
  assert.doesNotMatch(feedback, /line\.idea/);
  assert.match(feedback, /Wrong move\?/);
});

test("Play on chips are 800 / 1200 / 1800 after Practice or Test; green still needs a clean Test", () => {
  const train = readFileSync(
    join(root, "src/components/opening-lab/train-view.tsx"),
    "utf8",
  );
  const engine = readFileSync(join(root, "src/lib/play-engine.ts"), "utf8");
  const css = readFileSync(join(root, "src/styles.css"), "utf8");

  assert.match(train, /showPlayOn = bookDone;/);
  assert.doesNotMatch(train, /showPlayOn = bookDone && mode === "practice"/);
  assert.match(train, /Pick strength, then Play on/);
  assert.match(train, /Practice done — Play on, or Test with no hints/);
  assert.match(train, /Finished, but you missed a move — Play on, or Test again to go green/);
  assert.match(train, /Line complete — well done!/);
  assert.match(train, /if \(practiceMissedRef\.current\)/);
  assert.match(train, /onLineComplete\?\.\(\)/);
  assert.doesNotMatch(train, /bookDone && mode === "practice" && !showPlayOn/);
  assert.match(train, /beginner: "800"/);
  assert.match(train, /intermediate: "1200"/);
  assert.match(train, /advanced: "1800"/);
  assert.match(train, /Beginner, about 800\./);
  assert.match(train, /useState<PlayLevel \| null>\("beginner"\)/);
  assert.doesNotMatch(train, /cyclePlayLevel/);
  assert.doesNotMatch(train, /strength-cycle/);
  assert.match(train, /play-level-chip/);

  assert.match(train, /beginner: 400,/);
  assert.match(train, /intermediate: 800,/);
  assert.match(train, /advanced: 1400,/);

  assert.match(engine, /beginner: \{ thinkMs: 400, depth: 2, randomize: true, slack: 80 \}/);
  assert.match(engine, /intermediate: \{ thinkMs: 800, depth: 3, randomize: true, slack: 40 \}/);
  assert.match(engine, /advanced: \{ thinkMs: 1400, depth: 5, randomize: false, slack: 0 \}/);

  assert.match(engine, /function hangsPiece/);
  assert.match(engine, /HANG_CP = 250/);

  assert.match(css, /\.play-level-chip/);
  assert.match(css, /\.play-level-chip\.is-on/);
  assert.match(css, /\.play-on-caption/);
  assert.doesNotMatch(css, /\.strength-cycle/);
});
