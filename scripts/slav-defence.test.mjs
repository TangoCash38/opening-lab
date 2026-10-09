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

const EXPECTED = {
  sd1: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "Ne5", "Na6"],
  sd2: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6", "Bxc4", "Bb4", "O-O", "O-O"],
  sd3: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "Nh4", "e6", "Nxf5", "exf5", "e3"],
  sd4: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "e3", "b5", "a4", "b4", "Na2", "e6", "Bxc4"],
  sd5: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "e3", "Bf5", "Nc3", "e6", "Bd3"],
  sd6: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "e3", "Bf5", "Nc3", "e6", "Nh4", "Bg6", "Nxg6", "hxg6", "g3", "Nbd7", "Bg2", "Bd6"],
  sd7: ["d4", "d5", "c4", "c6", "cxd5", "cxd5", "Nf3", "Nf6", "Nc3", "Nc6", "Bf4", "Bf5"],
  sd8: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "e3", "Bf5", "cxd5", "cxd5", "Qb3", "Qc7"],
  sd9: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "a6", "c5", "Bf5", "Bf4", "Nbd7", "e3", "Nh5"],
  sd10: ["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "Ne5", "Nbd7", "Nxc4", "Qc7", "g3", "e5"],
};

test("Slav Defence is a listed live pack: 10 educational lines, free sample sd1", () => {
  const packs = src("src/data/packs.ts");
  const catalog = src("src/lib/catalog.ts");
  const notice = src("src/components/opening-lab/slav-pack-notice.tsx");
  const intro = src("src/lib/slav-preview.ts");
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const memory = src("src/components/opening-lab/square-memory.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  const list = src("src/components/opening-lab/pack-list.tsx");
  const skus = src("src/lib/play-skus.ts");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const slav = packBlock(packs, "slav-defence");

  assert.equal(packs.match(/id: "slav-defence"/g)?.length, 1);
  assert.match(slav, /name: "Slav Defence for Black"/);
  assert.match(slav, /side: "Black"/);
  assert.match(slav, /price: "£1\.99"/);
  assert.match(slav, /blurb: "10 lines from Opening Lab"/);
  assert.match(slav, /isFree: false/);
  assert.match(slav, /isPremium: true/);
  assert.doesNotMatch(slav, /5 book/);
  assert.doesNotMatch(slav, /punish/i);
  assert.doesNotMatch(slav, /Play on/);
  assert.doesNotMatch(slav, /Trap/);
  assert.doesNotMatch(slav, /id: "sd11"/);
  assert.doesNotMatch(slav, /3-line survey/);

  const visible = catalog.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/)?.[1] ?? "";
  const live = catalog.match(/LIVE_PACK_IDS = \[([^\]]+)\]/)?.[1] ?? "";
  assert.equal(visible.includes("slav-defence"), true);
  assert.equal(live.includes("slav-defence"), true);
  assert.match(catalog, /"slav-defence": \["sd1"\]/);
  assert.doesNotMatch(catalog, /id === "slav-defence"/);

  const sampleBlock = catalog.slice(
    catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
    catalog.indexOf("export function packHasPlayableFreeLines"),
  );
  assert.match(sampleBlock, /"slav-defence": \["sd1"\]/);
  assert.doesNotMatch(sampleBlock, /"sd2"/);

  assert.match(intro, /SLAV DEFENCE FOR BLACK/);
  assert.match(intro, /An introduction and ten educational drills/);
  assert.match(intro, /Starting position: 1\.d4 d5 2\.c4 c6/);
  assert.match(intro, /A solid centre\. An active bishop\. A clear plan\./);
  assert.match(intro, /The Slav Defence begins with 1\.d4 d5 2\.c4 c6\./);
  assert.match(intro, /About the opening/);
  assert.match(intro, /Welcome to the start of your Slav Defence for Black learning pack/);
  assert.match(notice, /data-slav-next/);
  assert.match(notice, />\s*Next\s*</);
  assert.match(notice, /data-slav-start/);
  assert.match(notice, />\s*Start\s*</);
  assert.doesNotMatch(notice, /Start first line|Begin line 1|How to play/);
  assert.doesNotMatch(notice, /coach-seated|potato|big-red|portrait|<img/i);
  assert.match(intro, /You play Black\./);
  assert.match(intro, /Practice shows a green hint\./);
  assert.match(intro, /Test has no hints\./);
  assert.doesNotMatch(intro, /Read each line's notes/);
  assert.match(intro, /Line 1 is free\./);
  assert.match(notice, /\{copy\.lead\}/);
  assert.match(notice, /\{copy\.rest\}/);
  assert.doesNotMatch(notice, /Read the rest/);
  assert.doesNotMatch(notice, /data-slav-intro-expand/);
  assert.match(notice, /What the moves teach/);
  assert.match(notice, /Next plan/);
  assert.match(notice, /Watch out/);
  assert.match(notice, /Checkpoint/);
  assert.match(notice, /Suggested answer/);
  const train = src("src/components/opening-lab/train-view.tsx");
  assert.doesNotMatch(train, /SlavLineNotes/);
  assert.doesNotMatch(train, /data-slav-line-notes/);
  assert.match(notice, /interactive=\{false\}/);
  assert.doesNotMatch(notice, /Play on/);
  assert.doesNotMatch(`${intro}\n${notice}\n${slav}`, /5 book \+ 5 punish/);

  assert.equal(landing.includes("slav-defence"), false);
  assert.match(landing, /Square Memory/);
  assert.match(landing, /Position Recall/);
  assert.equal(memory.includes("slav-defence"), false);
  assert.doesNotMatch(shell, /isSlavPreviewPack/);
  assert.doesNotMatch(list, /SLAV_PREVIEW_PACK_ID/);
  assert.match(skus, /"slav-defence"/);
  assert.match(billing, /"slav-defence"/);
  const liveSale = billing.slice(
    billing.indexOf("LIVE_SALE_PACK_IDS"),
    billing.indexOf("private static final Set"),
  );
  assert.equal(liveSale.includes('"slav-defence"'), false);

  const lineIds = [...slav.matchAll(/id: "(sd\d+)"/g)].map((m) => m[1]);
  assert.deepEqual(lineIds, Object.keys(EXPECTED));

  for (const id of lineIds) {
    const from = slav.indexOf(`id: "${id}"`);
    const to = slav.indexOf('id: "', from + 8);
    const block = slav.slice(from, to >= 0 ? to : undefined);
    const plies = [...block.matchAll(/plies: \[([^\]]+)\]/g)].flatMap((m) =>
      [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]),
    );
    assert.deepEqual(plies, EXPECTED[id], id);
    assert.match(block, /teach:/);
    assert.match(block, /watch:/);
    assert.match(block, /checkpoint:/);
    assert.match(block, /answer:/);
    assert.match(block, /side: "b"/);
    const game = new Chess();
    for (const san of plies) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal SAN ${san} after ${game.fen()}`);
    }
  }
});
