import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function packBlock(packs, id) {
  const start = packs.indexOf(`id: "${id}"`);
  assert.ok(start >= 0, `${id} missing`);
  const next = packs.indexOf('\n  {\n    id: "', start + 1);
  return next >= 0 ? packs.slice(start, next) : packs.slice(start);
}

function lineBlock(pack, id) {
  const from = pack.indexOf(`id: "${id}"`);
  assert.ok(from >= 0, `${id} missing`);
  const to = pack.indexOf('id: "', from + 10);
  return pack.slice(from, to >= 0 ? to : undefined);
}

function linePlies(pack, id) {
  const line = lineBlock(pack, id);
  const m = line.match(/plies: \[([^\]]+)\]/);
  assert.ok(m, `${id} plies missing`);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

const EXPECTED = {
  "rlw1": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "b5",
    "Bb3",
    "d6",
    "c3",
    "O-O",
    "h3",
    "Nb8",
    "d4",
    "Nbd7",
    "Nbd2",
    "Bb7",
    "Bc2",
    "Re8",
    "Nf1"
  ],
  "rlw2": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "b5",
    "Bb3",
    "Bb7",
    "d3",
    "Be7",
    "a4",
    "O-O",
    "Re1",
    "d6",
    "Nbd2",
    "Na5",
    "Ba2"
  ],
  "rlw3": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Nf6",
    "O-O",
    "Nxe4",
    "d4",
    "Nd6",
    "Bxc6",
    "dxc6",
    "dxe5",
    "Nf5",
    "Qxd8+",
    "Kxd8",
    "Nc3",
    "Ke8",
    "h3",
    "Be6",
    "Rd1",
    "Be7",
    "Ne4"
  ],
  "rlw4": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Nxe4",
    "d4",
    "b5",
    "Bb3",
    "d5",
    "dxe5",
    "Be6",
    "c3",
    "Bc5",
    "Nbd2",
    "O-O",
    "Bc2",
    "Nxd2",
    "Qxd2"
  ],
  "rlw5": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Bxc6",
    "dxc6",
    "O-O",
    "f6",
    "d4",
    "Bg4",
    "dxe5",
    "Qxd1",
    "Rxd1",
    "fxe5",
    "Rd3",
    "Bd6",
    "Nbd2",
    "Nf6",
    "Nc4"
  ],
  "rlw6": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "f5",
    "Nc3",
    "fxe4",
    "Nxe4",
    "Nf6",
    "Qe2",
    "d5",
    "Nxf6+",
    "gxf6",
    "d4",
    "Bg7",
    "dxe5",
    "O-O",
    "Bxc6",
    "bxc6",
    "O-O"
  ],
  "rlw7": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Bc5",
    "c3",
    "Nf6",
    "O-O",
    "O-O",
    "d4",
    "Bb6",
    "dxe5",
    "Nxe4",
    "Qd5",
    "Nc5",
    "Bg5",
    "Ne7",
    "Qd1"
  ],
  "rlw8": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "d6",
    "d4",
    "Bd7",
    "Nc3",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "exd4",
    "Nxd4",
    "O-O",
    "Bf1",
    "Re8",
    "Nf3"
  ],
  "rlw9": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "Nd4",
    "Nxd4",
    "exd4",
    "O-O",
    "c6",
    "Bc4",
    "Nf6",
    "Re1",
    "d6",
    "c3",
    "Be7",
    "cxd4",
    "O-O",
    "Nc3"
  ],
  "rlw10": [
    "e4",
    "e5",
    "Nf3",
    "Nc6",
    "Bb5",
    "a6",
    "Ba4",
    "Nf6",
    "O-O",
    "Be7",
    "Re1",
    "b5",
    "Bb3",
    "O-O",
    "c3",
    "d5",
    "exd5",
    "Nxd5",
    "Nxe5",
    "Nxe5",
    "Rxe5",
    "c6",
    "d4",
    "Bd6",
    "Re1",
    "Qh4",
    "g3",
    "Qh3",
    "Be3",
    "Bg4",
    "Qd3",
    "Rae8",
    "Nbd2"
  ]
};

const NAMES = {
  "rlw1": "Line 1",
  "rlw2": "Line 2",
  "rlw3": "Line 3",
  "rlw4": "Line 4",
  "rlw5": "Line 5",
  "rlw6": "Line 6",
  "rlw7": "Line 7",
  "rlw8": "Line 8",
  "rlw9": "Line 9",
  "rlw10": "Line 10"
};

const LIVE = '["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white"]';

test("Ruy Lopez for White is the signed ruy-lopez-white pack: rlw1–rlw10 book, £1.99, locked until purchase", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const skus = src("src/lib/play-skus.ts");
  const intro = src("src/lib/pack-intro.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const rlw = packBlock(packs, "ruy-lopez-white");

  assert.match(rlw, /name: "Ruy Lopez for White"/);
  assert.match(rlw, /side: "White"/);
  assert.match(rlw, /section: "white"/);
  assert.match(rlw, /isFree: false/);
  assert.match(rlw, /isPremium: true/);
  assert.match(rlw, /price: "£1\.99"/);
  assert.match(rlw, /blurb: "10 lines from Opening Lab"/);
  assert.match(rlw, /10 lines from Opening Lab/);
  assert.match(rlw, /Practice the book moves with the green hint/);
  assert.match(rlw, /Then Test with none to prove you remember them/);
  assert.match(rlw, /eco: "C60–C99"/);
  assert.doesNotMatch(rlw, /5 book/);
  assert.doesNotMatch(rlw, /punish/i);
  assert.doesNotMatch(rlw, /Play on/);
  assert.doesNotMatch(rlw, /vs computer|versus the computer/i);
  assert.doesNotMatch(rlw, /trap:\s*true/);
  assert.doesNotMatch(rlw, /id: "rlw11"/);

  assert.match(catalog, /"ruy-lopez-white"/);
  assert.match(catalog, new RegExp("LIVE_PACK_IDS = " + LIVE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function playableLines"),
  );
  assert.doesNotMatch(sampleBlock, /ruy-lopez-white/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"ruy-lopez-white"'), false);

  const pathB = billing.slice(
    billing.indexOf("PATH_B_PACK_IDS"),
    billing.indexOf("LIVE_SALE_PACK_IDS"),
  );
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(pathB.includes('"ruy-lopez-white"'), false);
  assert.equal(liveSale.includes('"ruy-lopez-white"'), false);

  const opening = intro.slice(intro.indexOf('"ruy-lopez-white"'), intro.indexOf("};"));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  assert.doesNotMatch(opening, /punish/i);
  assert.doesNotMatch(opening, /5 book/);

  const lineIds = [...rlw.matchAll(/id: "(rlw\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  const sides = [...rlw.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.equal(sides.length, 10);
  assert.ok(sides.every((s) => s === "w"), "every line side must be w");

  const names = Object.fromEntries(
    [...rlw.matchAll(/id: "(rlw\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  for (const id of lineIds) {
    const plies = linePlies(rlw, id);
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.equal(names[id], NAMES[id], id);
    assert.match(names[id], /^Line \d+$/);
    assert.equal(plies.length % 2, 1, `${id} must end after a White move`);
    assert.equal(lineBlock(rlw, id).includes('side: "w"'), true);
    const idea = lineBlock(rlw, id).match(/idea: "([^"]+)"/);
    assert.ok(idea && idea[1].trim().length > 0, `${id} idea`);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san}`);
    }
    assert.equal(game.turn(), "b", `${id} must end after White`);
  }

  const allPlies = lineIds.map((id) => ({ id, plies: linePlies(rlw, id) }));
  for (let i = 0; i < allPlies.length; i++) {
    for (let j = 0; j < allPlies.length; j++) {
      if (i === j) continue;
      const a = allPlies[i].plies;
      const b = allPlies[j].plies;
      if (a.length < b.length && a.every((p, k) => p === b[k])) {
        assert.fail(`${allPlies[i].id} is a ply-prefix of ${allPlies[j].id}`);
      }
    }
  }
});

test("Big Red introduces Ruy Lopez for White; Potato Pie stays the other packs' portrait", () => {
  const coach = src("src/lib/coach-packs.ts");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const figure = src("src/components/opening-lab/scotch-coach-intro.tsx");
  const wav = "public/coach/ruy-lopez-white/big-red-ruy-intro.wav";
  const portrait = "public/coach/ruy-lopez-white/big-red-portrait.png";
  assert.equal(existsSync(join(root, wav)), true, wav);
  assert.ok(statSync(join(root, wav)).size > 10_000, wav);
  assert.equal(existsSync(join(root, portrait)), true, portrait);

  const start = coach.indexOf('[RUY_LOPEZ_WHITE_PACK_ID]');
  assert.ok(start >= 0, "coach entry missing");
  const entry = coach.slice(start, coach.indexOf("};", start));
  assert.match(entry, /coachName: "Big Red"/);
  assert.match(entry, /portrait: RUY_LOPEZ_PORTRAIT/);
  assert.match(entry, /introTitle: "Big Red · Ruy Lopez"/);
  assert.match(entry, /introAudio: RUY_LOPEZ_INTRO_WAV/);
  assert.match(entry, /introAudioFallbackSec: RUY_LOPEZ_INTRO_SEC/);
  assert.match(entry, /firstLineId: "rlw1"/);
  assert.match(entry, /lineTalkOnTapOnly: true/);
  assert.match(entry, /firstLineBeats: \[\]/);
  assert.doesNotMatch(entry, /firstLineAudio/);
  assert.match(coach, /RUY_LOPEZ_INTRO_SEC = 82\.84/);
  assert.match(coach, /RUY_LOPEZ_INTRO_STEM = \["e4", "e5", "Nf3", "Nc6", "Bb5"\]/);
  assert.match(coach, /RUY_LOPEZ_PORTRAIT = "\/coach\/ruy-lopez-white\/big-red-portrait\.png"/);
  assert.match(coach, /RUY_LOPEZ_INTRO_WAV = "\/coach\/ruy-lopez-white\/big-red-ruy-intro\.wav"/);
  assert.match(coach, /Big Red will see you round/);
  assert.doesNotMatch(entry, /Professor Potato Pie/);
  assert.match(hero, /pack\.id === "ruy-lopez-white"/);
  assert.match(hero, /l\.id === "rlw1"/);
  assert.match(hero, /portrait=\{coachPack\(pack\.id\)\?\.portrait\}/);
  assert.match(figure, /portrait \?\? "\/scotch-coach\/coach-seated-v2\.png"/);
  assert.match(figure, /name \?\? SCOTCH_COACH_NAME/);
  assert.match(coach, /opening-lab:coach-intro:\$\{packId\}/);
});
