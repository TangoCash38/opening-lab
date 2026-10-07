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
  frb1: ["e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3", "Ne7", "Nf3", "Bd7", "a4", "Qa5", "Bd2", "Nbc6", "Bd3", "c4", "Be2", "f6", "O-O", "O-O-O"],
  frb2: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "Be2", "cxd4", "cxd4", "Nh6", "Bd3", "Bd7", "Bc2", "Nf5", "Bxf5", "exf5", "O-O", "Be6"],
  frb3: ["e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Bd7", "Be2", "Nge7", "O-O", "Ng6", "g3", "Be7", "h4", "O-O", "h5", "Nh8", "Bf4", "f5", "exf6", "Bxf6"],
  frb4: ["e4", "e6", "d4", "d5", "Nd2", "c5", "exd5", "exd5", "Ngf3", "Nc6", "Bb5", "Bd6", "dxc5", "Bxc5", "O-O", "Ne7", "Nb3", "Bd6", "Re1", "O-O", "Bg5", "Bg4"],
  frb5: ["e4", "e6", "d4", "d5", "Nd2", "Nf6", "e5", "Nfd7", "Bd3", "c5", "c3", "Nc6", "Ne2", "cxd4", "cxd4", "f6", "exf6", "Nxf6", "Nf3", "Bd6", "O-O", "O-O", "Bf4", "Bxf4", "Nxf4", "Ne4"],
  frb6: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7", "Bxe7", "Qxe7", "f4", "a6", "Nf3", "c5", "Qd2", "Nc6", "dxc5", "Nxc5", "Bd3", "b5", "O-O", "Bb7"],
  frb7: ["e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5", "Nfd7", "f4", "c5", "Nf3", "Nc6", "Be3", "cxd4", "Nxd4", "Bc5", "Qd2", "O-O", "O-O-O", "a6", "h4", "Nxd4", "Bxd4", "b5"],
  frb8: ["e4", "e6", "d4", "d5", "exd5", "exd5", "Bd3", "Nc6", "c3", "Bd6", "Nf3", "Nge7", "O-O", "Bg4", "h3", "Bf5", "Bxf5", "Nxf5", "Re1+", "Nfe7", "a4", "O-O"],
  frb9: ["e4", "e6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7", "Nf3", "Ngf6", "Nxf6+", "Nxf6", "Bd3", "c5", "dxc5", "Bxc5", "Qe2", "O-O", "Bg5", "h6", "Bh4", "Qa5+"],
  frb10: ["e4", "e6", "d3", "d5", "Nd2", "Nf6", "Ngf3", "c5", "g3", "Nc6", "Bg2", "Be7", "O-O", "O-O", "Re1", "b5", "e5", "Nd7", "Nf1", "a5", "Bf4", "b4"],
};

const NAMES = {
  frb1: "Line 1 · Winawer main",
  frb2: "Line 2 · Advance · …Qb6",
  frb3: "Line 3 · Advance · …Bd7",
  frb4: "Line 4 · Tarrasch open · …c5",
  frb5: "Line 5 · Tarrasch closed · …Nf6",
  frb6: "Line 6 · Classical · 4.Bg5 Be7",
  frb7: "Line 7 · Steinitz · 4.e5",
  frb8: "Line 8 · Exchange",
  frb9: "Line 9 · Rubinstein",
  frb10: "Line 10 · King’s Indian Attack",
};

test("French Defence for Black is the signed french-black pack: frb1–frb10 book, £1.99, locked until purchase", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const skus = src("src/lib/play-skus.ts");
  const intro = src("src/lib/pack-intro.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const frb = packBlock(packs, "french-black");

  assert.equal(packs.includes('id: "french",'), false);
  assert.equal(packs.includes('id: "f1"'), false);
  assert.equal(packs.includes('id: "f8"'), false);

  assert.match(frb, /name: "French Defence for Black"/);
  assert.match(frb, /side: "Black"/);
  assert.match(frb, /section: "black"/);
  assert.match(frb, /isFree: false/);
  assert.match(frb, /isPremium: true/);
  assert.match(frb, /price: "£1\.99"/);
  assert.match(frb, /blurb: "10 lines from Opening Lab"/);
  assert.match(frb, /10 lines from Opening Lab/);
  assert.match(frb, /Practice the book moves with the green hint/);
  assert.match(frb, /Then Test with none to prove you remember them/);
  assert.match(frb, /eco: "C00–C19"/);
  assert.doesNotMatch(frb, /5 book/);
  assert.doesNotMatch(frb, /punish/i);
  assert.doesNotMatch(frb, /Play on/);
  assert.doesNotMatch(frb, /vs computer|versus the computer/i);
  assert.doesNotMatch(frb, /trap:\s*true/);
  assert.doesNotMatch(frb, /id: "frb11"/);

  assert.match(catalog, /"french-black"/);
  assert.match(
    catalog,
    /LIVE_PACK_IDS = \["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black", "slav-defence", "nimzo-indian-black", "kings-indian-black"\]/,
  );
  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function playableLines"),
  );
  assert.match(sampleBlock, /"french-black": \["frb1"\]/);
  assert.doesNotMatch(sampleBlock, /frb2/);

  const playList = skus.slice(
    skus.indexOf("PLAY_PATH_B_PACK_IDS"),
    skus.indexOf("export type PlayProduct"),
  );
  assert.equal(playList.includes('"french-black"'), false);

  const pathB = billing.slice(
    billing.indexOf("PATH_B_PACK_IDS"),
    billing.indexOf("LIVE_SALE_PACK_IDS"),
  );
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(pathB.includes('"french-black"'), false);
  assert.equal(liveSale.includes('"french-black"'), false);

  const opening = intro.slice(intro.indexOf('"french-black"'), intro.indexOf("};"));
  assert.match(opening, /10 lines from Opening Lab\. Practice with the green hint, then Test with none\./);
  assert.doesNotMatch(opening, /punish/i);
  assert.doesNotMatch(opening, /5 book/);

  const lineIds = [...frb.matchAll(/id: "(frb\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  const sides = [...frb.matchAll(/side: "([wb])"/g)].map((m) => m[1]);
  assert.equal(sides.length, 10);
  assert.ok(sides.every((s) => s === "b"), "every line side must be b");

  const names = Object.fromEntries(
    [...frb.matchAll(/id: "(frb\d+)",\s*\n\s*name: "([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );

  for (const id of lineIds) {
    const plies = linePlies(frb, id);
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.equal(names[id], NAMES[id], id);
    assert.equal(plies.length % 2, 0, `${id} must end after a Black move`);
    assert.equal(lineBlock(frb, id).includes('side: "b"'), true);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san}`);
    }
    assert.equal(game.turn(), "w", `${id} must end after Black`);
  }

  assert.equal(linePlies(frb, "frb2").includes("Qxb2"), false);
  assert.equal(linePlies(frb, "frb2").includes("Bxh6"), false);
  assert.deepEqual(linePlies(frb, "frb2").slice(-6), ["Bc2", "Nf5", "Bxf5", "exf5", "O-O", "Be6"]);
  assert.deepEqual(linePlies(frb, "frb8").slice(-6), ["Bf5", "Bxf5", "Nxf5", "Re1+", "Nfe7", "a4", "O-O"].slice(-6));
  assert.equal(linePlies(frb, "frb8").at(-1), "O-O");

  const allPlies = lineIds.map((id) => ({ id, plies: linePlies(frb, id) }));
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
