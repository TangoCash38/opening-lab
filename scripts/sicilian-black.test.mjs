import assert from "node:assert/strict";
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
  "sib1": [
    "e4",
    "c5",
    "Nf3",
    "d6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "a6",
    "Be3",
    "e5",
    "Nb3",
    "Be6",
    "f3",
    "Be7",
    "Qd2",
    "O-O",
    "O-O-O",
    "Nbd7",
    "g4",
    "b5"
  ],
  "sib2": [
    "e4",
    "c5",
    "Nf3",
    "d6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "g6",
    "Be3",
    "Bg7",
    "f3",
    "O-O",
    "Qd2",
    "Nc6",
    "O-O-O",
    "d5",
    "exd5",
    "Nxd5",
    "Nxc6",
    "bxc6",
    "Bd4",
    "Bxd4",
    "Qxd4",
    "Qb6",
    "Na4",
    "Qa5"
  ],
  "sib3": [
    "e4",
    "c5",
    "Nf3",
    "d6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "Nc6",
    "Bg5",
    "e6",
    "Qd2",
    "Be7",
    "O-O-O",
    "O-O",
    "f4",
    "Nxd4",
    "Qxd4",
    "Qa5",
    "Kb1",
    "Rd8"
  ],
  "sib4": [
    "e4",
    "c5",
    "Nf3",
    "Nc6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "e5",
    "Ndb5",
    "d6",
    "Bg5",
    "a6",
    "Na3",
    "b5",
    "Nd5",
    "Be7",
    "Bxf6",
    "Bxf6",
    "c3",
    "Bg5"
  ],
  "sib5": [
    "e4",
    "c5",
    "Nf3",
    "e6",
    "d4",
    "cxd4",
    "Nxd4",
    "Nf6",
    "Nc3",
    "Nc6",
    "Nxc6",
    "bxc6",
    "e5",
    "Nd5",
    "Ne4",
    "Qc7",
    "f4",
    "Qb6",
    "c4",
    "Bb4+",
    "Ke2",
    "f5"
  ],
  "sib6": [
    "e4",
    "c5",
    "c3",
    "d5",
    "exd5",
    "Qxd5",
    "d4",
    "Nf6",
    "Nf3",
    "e6",
    "Bd3",
    "cxd4",
    "cxd4",
    "Nc6",
    "O-O",
    "Be7",
    "Nc3",
    "Qd6",
    "Nb5",
    "Qd8"
  ],
  "sib7": [
    "e4",
    "c5",
    "d4",
    "cxd4",
    "c3",
    "dxc3",
    "Nxc3",
    "Nc6",
    "Nf3",
    "d6",
    "Bc4",
    "e6",
    "O-O",
    "Nf6",
    "Qe2",
    "a6",
    "Rd1",
    "Qc7",
    "Bf4",
    "Be7"
  ],
  "sib8": [
    "e4",
    "c5",
    "Nc3",
    "Nc6",
    "f4",
    "g6",
    "Nf3",
    "Bg7",
    "Bb5",
    "Nd4",
    "O-O",
    "Nxb5",
    "Nxb5",
    "d5",
    "exd5",
    "a6",
    "Nc3",
    "Nf6",
    "d4",
    "Nxd5"
  ],
  "sib9": [
    "e4",
    "c5",
    "Nf3",
    "Nc6",
    "Bb5",
    "g6",
    "O-O",
    "Bg7",
    "Re1",
    "e5",
    "Bxc6",
    "dxc6",
    "d3",
    "Ne7",
    "Be3",
    "b6",
    "Nbd2",
    "O-O",
    "a4",
    "a5"
  ],
  "sib10": [
    "e4",
    "c5",
    "Nc3",
    "Nc6",
    "g3",
    "g6",
    "Bg2",
    "Bg7",
    "d3",
    "d6",
    "Be3",
    "e6",
    "Qd2",
    "Nge7",
    "Nge2",
    "Nd4",
    "O-O",
    "O-O",
    "Nd1",
    "d5"
  ]
};

const IDEAS = {
  "sib1": "Najdorf English Attack: after …a6 and …e5 Nb3 Be6, Black castles short and meets White’s long castle with …Nbd7–…b5.",
  "sib2": "Dragon Yugoslav: after opposite castling Black breaks with …d5; mass exchanges on d5/c6/d4 leave a playable queen ending with …Qa5.",
  "sib3": "Classical Richter-Rauzer: …Nc6 and …e6, castle opposite, trade on d4, and plant …Qa5 with the rook on d8.",
  "sib4": "Sveshnikov: …e5 drives Nb5–a3–d5; Black takes on f6 with the bishop and activates …Bg5.",
  "sib5": "Four Knights: after …e6/…Nf6/…Nc6, White’s Nxc6 main; Black meets e5–Ne4–f4 with …Qc7–…Qb6, then …Bb4+ and …f5 against the uncastled king.",
  "sib6": "Alapin main with …d5: queen comes out, Black develops …Nf6–…e6–…Nc6 and tucks the queen after Nb5.",
  "sib7": "Smith-Morra Accepted: Black returns development tempo with …Nc6–…d6–…e6–…Nf6 and completes …Be7.",
  "sib8": "Grand Prix: Black meets Bb5 with …Nd4, trades, then …d5 and recaptures on d5 with the knight.",
  "sib9": "Rossolimo …g6: after Bxc6 dxc6 and …e5, Black develops …Ne7–…b6 and castles short.",
  "sib10": "Closed Sicilian: Black fianchettos, parks …Nd4, castles, then breaks with …d5."
};

const NAMES = {
  "sib1": "Line 1",
  "sib2": "Line 2",
  "sib3": "Line 3",
  "sib4": "Line 4",
  "sib5": "Line 5",
  "sib6": "Line 6",
  "sib7": "Line 7",
  "sib8": "Line 8",
  "sib9": "Line 9",
  "sib10": "Line 10"
};

const LIVE = '["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black"]';

test("Sicilian for Black is the signed sicilian-black pack: sib1–sib10 book, £1.99, locked until purchase", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const skus = src("src/lib/play-skus.ts");
  const intro = src("src/lib/pack-intro.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const coach = src("src/lib/coach-packs.ts");
  const sib = packBlock(packs, "sicilian-black");

  assert.equal(packs.includes('id: "sicilian",'), false);
  assert.equal((packs.match(/id: "sicilian-black"/g) ?? []).length, 1);

  assert.match(sib, /name: "Sicilian for Black"/);
  assert.match(sib, /side: "Black"/);
  assert.match(sib, /section: "black"/);
  assert.match(sib, /isFree: false/);
  assert.match(sib, /isPremium: true/);
  assert.match(sib, /price: "£1\.99"/);
  assert.match(sib, /blurb: "10 lines from Opening Lab"/);
  assert.match(sib, /10 lines from Opening Lab/);
  assert.match(sib, /Practice the book moves with the green hint/);
  assert.match(sib, /Then Test with none to prove you remember them/);
  assert.match(sib, /eco: "B20–B99"/);
  assert.doesNotMatch(sib, /5 book/);
  assert.doesNotMatch(sib, /punish/i);
  assert.doesNotMatch(sib, /Play on/);
  assert.doesNotMatch(sib, /vs computer|versus the computer/i);
  assert.doesNotMatch(sib, /trap:\s*true/);
  assert.doesNotMatch(sib, /id: "sib11"/);

  assert.match(catalog, /"sicilian-black"/);
  assert.match(catalog, new RegExp("LIVE_PACK_IDS = " + LIVE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(catalog, /VISIBLE_PACK_IDS = \[[^\]]*"sicilian-black"/);
  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function playableLines"),
  );
  assert.doesNotMatch(sampleBlock, /sicilian-black/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"sicilian-black"'), false);
  assert.doesNotMatch(playList, /pack_sicilian_black/);

  const pathB = billing.slice(
    billing.indexOf("PATH_B_PACK_IDS"),
    billing.indexOf("LIVE_SALE_PACK_IDS"),
  );
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(pathB.includes('"sicilian-black"'), false);
  assert.equal(liveSale.includes('"sicilian-black"'), false);
  assert.doesNotMatch(billing, /pack_sicilian_black/);

  const opening = intro.slice(intro.indexOf('"sicilian-black"'), intro.indexOf("};"));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  assert.doesNotMatch(opening, /punish/i);
  assert.doesNotMatch(opening, /5 book/);

  assert.match(coach, /SICILIAN_BLACK_PACK_ID = "sicilian-black"/);

  const lineIds = [...sib.matchAll(/id: "(sib\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  const sides = [...sib.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.equal(sides.length, 10);
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const names = Object.fromEntries(
    [...sib.matchAll(/id: "(sib\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const ideas = Object.fromEntries(
    [...sib.matchAll(/id: "(sib\d+)"[\s\S]*?idea: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  for (const id of lineIds) {
    const plies = linePlies(sib, id);
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.equal(names[id], NAMES[id], id);
    assert.equal(names[id], `Line ${Number(id.slice(3))}`);
    assert.doesNotMatch(names[id], /·|Najdorf|Dragon|Sveshnikov|Taimanov|Four Knights|Alapin|Morra|Grand Prix|Rossolimo|Closed/);
    assert.equal(ideas[id], IDEAS[id], id);
    assert.equal(plies.length % 2, 0, `${id} must end after a Black move`);
    assert.equal(lineBlock(sib, id).includes('side: "b"'), true);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san}`);
    }
    assert.equal(game.turn(), "w", `${id} must end after Black`);
  }

  assert.equal(linePlies(sib, "sib8")[4], "f4");

  const allPlies = lineIds.map((id) => ({ id, plies: linePlies(sib, id) }));
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
