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
  qgdb1: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6", "Qc2", "Re8"],
  qgdb2: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "Rc1", "c6", "Bd3", "dxc4", "Bxc4", "Nd5"],
  qgdb3: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "O-O", "Bd3", "c6", "h3", "Nbd7"],
  qgdb4: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "O-O", "Bd3", "c6", "Nf3", "Nbd7", "O-O", "Re8"],
  qgdb5: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5", "Bg5", "Be7", "e3", "O-O", "Bd3", "c6", "Qc2", "Nbd7", "Nge2", "Re8"],
  qgdb6: ["d4", "d5", "c4", "e6", "Nf3", "Nf6", "Nc3", "Be7", "Bg5", "O-O", "e3", "Nbd7", "Rc1", "c6"],
  qgdb7: ["d4", "d5", "c4", "e6", "Nf3", "Nf6", "Nc3", "Be7", "e3", "O-O", "Bd3", "c5", "O-O", "Nc6"],
  qgdb8: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7", "cxd5", "exd5", "Bd3", "c6", "O-O", "Re8"],
  qgdb9: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "Ne4", "Bxe7", "Qxe7", "Bd3", "Nxc3"],
  qgdb10: ["d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6", "Bd3", "Bb7", "O-O", "Nbd7"],
};

const NAMES = {
  qgdb1: "Orthodox setup",
  qgdb2: "Freeing with ...dxc4 and ...Nd5",
  qgdb3: "Early Exchange",
  qgdb4: "Exchange development",
  qgdb5: "Exchange with Nge2",
  qgdb6: "Nf3-first Orthodox",
  qgdb7: "Quiet Bd3 and ...c5",
  qgdb8: "Late Exchange",
  qgdb9: "Lasker Defence",
  qgdb10: "Tartakower",
};

test("Queen's Gambit Declined is the signed qgd-black pack: 10 book lines, £1.99, qgdb1 free", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const skus = src("src/lib/play-skus.ts");
  const intro = src("src/lib/pack-intro.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const qgd = packBlock(packs, "qgd-black");
  const qgWhite = packBlock(packs, "qg-white");

  assert.match(qgd, /name: "Queen's Gambit Declined"/);
  assert.match(qgd, /side: "Black"/);
  assert.match(qgd, /section: "black"/);
  assert.match(qgd, /isFree: false/);
  assert.match(qgd, /isPremium: true/);
  assert.match(qgd, /price: "£1\.99"/);
  assert.match(qgd, /blurb: "10 lines from Opening Lab"/);
  assert.match(qgd, /10 lines from Opening Lab/);
  assert.match(qgd, /Practice the book moves with the green hint/);
  assert.match(qgd, /Then Test with none to prove you remember them/);
  assert.match(qgd, /eco: "D30–D69"/);
  assert.doesNotMatch(qgd, /5 book/);
  assert.doesNotMatch(qgd, /punish/i);
  assert.doesNotMatch(qgd, /Play on/);
  assert.doesNotMatch(qgd, /vs computer|versus the computer/i);
  assert.doesNotMatch(qgd, /trap:\s*true/);
  assert.doesNotMatch(qgd, /id: "qgdb11"/);
  assert.doesNotMatch(qgd, /Potato|Big Red|King Cedar|my loves/i);

  assert.match(qgWhite, /name: "Queen’s Gambit for White"/);
  assert.match(qgWhite, /id: "qg1"/);
  assert.equal(packs.includes('id: "qg-white"'), true);

  assert.match(catalog, /"qgd-black"/);
  assert.match(
    catalog,
    /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black", "slav-defence", "nimzo-indian-black"\]/,
  );
  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function playableLines"),
  );
  assert.match(sampleBlock, /"qgd-black": \["qgdb1"\]/);
  assert.doesNotMatch(sampleBlock, /qgdb2/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"qgd-black"'), true);

  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(liveSale.includes('"qgd-black"'), false);

  const opening = intro.slice(intro.indexOf('"qgd-black"'), intro.indexOf("london:"));
  assert.match(opening, /The Queen's Gambit Declined is 1\.d4 d5 2\.c4 e6/);
  assert.match(opening, /Black keeps the pawn on d5 instead of taking on c4/);
  assert.match(opening, /one of the oldest and most trusted replies to 1\.d4/);
  assert.match(opening, /world championship staple/);
  assert.match(opening, /The 10 lines in this pack are the Orthodox setup/);
  assert.match(opening, /Early Exchange, Exchange development, Exchange with Nge2/);
  assert.match(opening, /Lasker Defence, and the Tartakower/);
  assert.doesNotMatch(opening, /5 book/);
  assert.doesNotMatch(opening, /punish/i);
  assert.doesNotMatch(opening, /Catalan/);
  assert.doesNotMatch(qgd, /drill:/);

  const lineIds = [...qgd.matchAll(/id: "(qgdb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  const sides = [...qgd.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.equal(sides.length, 10);
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const names = Object.fromEntries(
    [...qgd.matchAll(/id: "(qgdb\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  for (const id of lineIds) {
    const plies = linePlies(qgd, id);
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.equal(names[id], NAMES[id], id);
    assert.equal(plies.length % 2, 0, `${id} must end after a Black move`);
    assert.equal(lineBlock(qgd, id).includes('side: "b"'), true);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san}`);
    }
    assert.equal(game.turn(), "w", `${id} must end after Black`);
  }

  const allPlies = lineIds.map((id) => ({ id, plies: linePlies(qgd, id) }));
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
