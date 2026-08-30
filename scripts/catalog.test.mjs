import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");

test("catalog shows Caro-Kann for Black and QGD for Black while other packs stay in packs.ts", () => {
  const match = src.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/);
  assert.ok(match, "VISIBLE_PACK_IDS missing");
  const ids = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["caro-kann-black", "qgd-black"]);
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

test("Help and home name both free packs and do not pitch Lab+", () => {
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
    /This pack drills the\s+main book moves against White's usual tries/,
  );
  assert.match(guide, /Play on from the setup and see where the game goes/);
  assert.match(guide, /Free sample: Advance,/);
  assert.match(guide, /Classical, Exchange/);
  assert.match(
    guide,
    /<Block title="Queen\u2019s Gambit Declined for Black">/,
  );
  assert.match(guide, /solid answer to 1\.d4/);
  assert.match(guide, /18\s+book lines/);
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
  assert.match(hero, /See 3 lines/);
  assert.match(hero, /Free sample/);
  assert.match(hero, /Advance, Classical, Exchange/);
  assert.match(hero, /The Caro-Kann is Black's answer to 1\.e4/);
  assert.match(
    hero,
    /This pack drills the\s+main book moves against White's usual tries/,
  );
  assert.match(hero, /playableLines/);
  assert.doesNotMatch(hero, /See 18 lines/);
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
  assert.match(packList, /playableLines\(pack\)/);
  assert.match(packList, /pack\.about/);
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

test("FREE_SAMPLE_LINE_IDS / playableLines returns exactly ckb1, ckb3, ckb5 for Caro", () => {
  assert.match(src, /export const FREE_SAMPLE_LINE_IDS/);
  assert.match(src, /"caro-kann-black": \["ckb1", "ckb3", "ckb5"\]/);
  assert.match(src, /export function playableLines\(pack: Pack\): OpeningLine\[\]/);
  assert.match(src, /if \(!ids\) return pack\.lines;/);
  assert.match(src, /return pack\.lines\.filter\(\(l\) => ids\.includes\(l\.id\)\);/);

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
  assert.match(hero, /playableLines\(pack\)/);
  assert.match(packList, /playableLines\(pack\)\.map/);
});

test("every ckb1–18 and qgdb1–18 has a non-empty idea; train-view renders line.idea", () => {
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
  assertIdeas(ck, "ckb", 18);
  assertIdeas(qgd, "qgdb", 18);
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
