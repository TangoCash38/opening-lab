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
    "a6",
    "Bg5",
    "e6",
    "f4",
    "Be7",
    "Qf3",
    "Qc7",
    "O-O-O",
    "Nbd7",
    "Bd3",
    "b5",
    "Rhe1",
    "Bb7"
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
    "a6",
    "Be2",
    "e5",
    "Nb3",
    "Be7",
    "O-O",
    "O-O",
    "Be3",
    "Be6",
    "f4",
    "exf4",
    "Rxf4",
    "Nbd7"
  ],
  "sib4": [
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
    "Bc4",
    "e6",
    "Bb3",
    "Be7",
    "O-O",
    "O-O",
    "f4",
    "b5",
    "a3",
    "Bb7"
  ],
  "sib5": [
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
    "h3",
    "e5",
    "Nde2",
    "h5",
    "g3",
    "Be6",
    "Bg2",
    "Nbd7",
    "O-O",
    "Be7"
  ],
  "sib6": [
    "e4",
    "c5",
    "Nf3",
    "d6",
    "Bb5+",
    "Bd7",
    "Bxd7+",
    "Qxd7",
    "O-O",
    "Nf6",
    "Re1",
    "Nc6",
    "c3",
    "e6",
    "d4",
    "cxd4",
    "cxd4",
    "Be7",
    "Nc3",
    "O-O"
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
    "d6",
    "f4",
    "Nf6",
    "Nf3",
    "Nc6",
    "Bb5",
    "Bd7",
    "O-O",
    "e6",
    "d3",
    "Be7",
    "Bxc6",
    "Bxc6",
    "Qe1",
    "O-O"
  ],
  "sib9": [
    "e4",
    "c5",
    "c3",
    "Nf6",
    "e5",
    "Nd5",
    "d4",
    "cxd4",
    "Nf3",
    "Nc6",
    "cxd4",
    "d6",
    "Bc4",
    "e6",
    "O-O",
    "Be7",
    "Re1",
    "O-O"
  ],
  "sib10": [
    "e4",
    "c5",
    "Nc3",
    "d6",
    "g3",
    "Nc6",
    "Bg2",
    "Nf6",
    "d3",
    "e6",
    "Nge2",
    "Be7",
    "O-O",
    "O-O",
    "f4",
    "a6",
    "Be3",
    "Qc7"
  ]
};

const IDEAS = {
  "sib1": "Najdorf English Attack: after …a6 and …e5 Nb3 Be6, Black castles short and meets White’s long castle with …Nbd7–…b5.",
  "sib2": "Najdorf against 6.Bg5. ...e6 and ...Be7, the queen to c7, White castles long, then ...b5 and the light-squared bishop to b7.",
  "sib3": "Najdorf against 6.Be2. ...e5 sends the knight to b3, both sides castle short, and ...Be6 meets the f-pawn by taking on f4.",
  "sib4": "Najdorf against 6.Bc4. The bishop drops to b3, both sides castle, and ...b5 with ...Bb7 meets the f-pawn.",
  "sib5": "Najdorf against 6.h3. ...e5 and ...h5 slow the kingside pawns, then ...Be6, ...Nbd7 and ...Be7.",
  "sib6": "3.Bb5+ against ...d6. Trade the light-squared bishops, put the queen on d7, open the centre, and castle.",
  "sib7": "Smith-Morra Accepted: Black returns development tempo with …Nc6–…d6–…e6–…Nf6 and completes …Be7.",
  "sib8": "Grand Prix against ...d6. Meet Bb5 by developing, trade on c6 with the bishop, and castle.",
  "sib9": "Alapin against a ...d6 setup. The knight goes to d5, ...d6 challenges the pawn on e5, and Black castles.",
  "sib10": "Closed Sicilian against ...d6. No kingside fianchetto: ...e6, ...Be7 and ...a6, with the queen on c7."
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

const LIVE = '["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black", "slav-defence", "nimzo-indian-black", "kings-indian-black"]';

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
  assert.match(sampleBlock, /"sicilian-black": \["sib1"\]/);
  assert.doesNotMatch(sampleBlock, /sib2/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"sicilian-black"'), true);
  assert.match(playList, /pack_sicilian_black|sicilian-black/);

  const pathB = billing.slice(
    billing.indexOf("PATH_B_PACK_IDS"),
    billing.indexOf("LIVE_SALE_PACK_IDS"),
  );
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(pathB.includes('"sicilian-black"'), true);
  assert.equal(liveSale.includes('"sicilian-black"'), true);
  assert.match(billing, /pack_sicilian_black|sicilian-black/);

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
