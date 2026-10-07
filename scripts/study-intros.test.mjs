import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { Chess } from "chess.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");
const require = createRequire(join(root, "package.json"));

function loadRows(t) {
  const ts = require("typescript");
  const dir = join(root, "scripts", ".generated-study");
  mkdirSync(dir, { recursive: true });
  const options = {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  };
  writeFileSync(
    join(dir, "study-pack-copy.mjs"),
    ts.transpileModule(src("src/lib/study-pack-copy.ts"), options).outputText,
  );
  writeFileSync(
    join(dir, "packs.mjs"),
    ts.transpileModule(src("src/data/packs.ts"), options).outputText,
  );
  writeFileSync(
    join(dir, "study-intro-setup.mjs"),
    ts.transpileModule(src("src/lib/study-intro-setup.ts"), options).outputText,
  );
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return {
    rows: import("./.generated-study/study-pack-copy.mjs"),
    packs: import("./.generated-study/packs.mjs"),
    setups: import("./.generated-study/study-intro-setup.mjs"),
  };
}

test("every visible drill pack has a two-card study intro", async (t) => {
  const loaded = loadRows(t);
  const { STUDY_PACK_ROWS } = await loaded.rows;
  const { PACKS } = await loaded.packs;
  const { STUDY_INTRO_SETUPS } = await loaded.setups;
  const catalog = src("src/lib/catalog.ts");
  const visible = [...catalog.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/)[1].matchAll(/"([^"]+)"/g)].map(
    (m) => m[1],
  );
  const rows = new Map(STUDY_PACK_ROWS.map((row) => [row.packId, row]));
  const study = src("src/lib/pack-study-intro.ts");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  assert.match(study, /SLAV_PREVIEW_PACK_ID/);
  assert.match(study, /qgd-black/);
  assert.match(study, /howTo: SLAV_HOW_TO/);
  assert.match(hero, /studyPackReplacesCoach\(pack\.id\)/);
  assert.match(hero, /isLineUnlocked\(pack, line\.id, purchased\)/);
  assert.match(hero, /<SlavPackNotice[\s\S]*flip=\{pack\.side === "Black"\}/);
  const notice = src("src/components/opening-lab/slav-pack-notice.tsx");
  assert.match(notice, /<ChessBoard[\s\S]*flip=\{flip\}/);
  assert.doesNotMatch(notice, /<ChessBoard[\s\S]{0,240}\n\s+flip\n/);
  assert.match(notice, /plies=\{copy\.setup\}/);
  assert.match(notice, /lastMove=\{null\}/);
  assert.match(notice, /slide=\{null\}/);
  assert.match(notice, /Typical setup/);
  assert.doesNotMatch(notice, /soundMove|setTimeout|MOVE_MS|lastMove=\{lastMove\}/);
  assert.match(study, /formatStart\(row\.stem\)/);
  assert.match(study, /setup: setupFor\(row\.packId\)/);
  assert.deepEqual(
    [...study.matchAll(/stem: SLAV_STEM|stem: \["d4", "d5", "c4", "e6"\]/g)].length,
    2,
  );
  assert.match(src("src/components/opening-lab/train-view.tsx"), /flip=\{line\.side === "b"\}/);
  assert.doesNotMatch(src("src/lib/study-pack-copy.ts"), /—|forever|lifetime|5 book|punish|Read the rest/i);

  for (const id of visible) {
    const pack = PACKS.find((item) => item.id === id);
    assert.ok(pack, id);
    if (pack.side === "White") {
      assert.ok(pack.lines.every((line) => line.side === "w"), id);
    }
    if (pack.side === "Black") {
      assert.ok(pack.lines.every((line) => line.side === "b"), id);
    }
    if (id === "slav-defence" || id === "qgd-black") {
      assert.equal(rows.has(id), false, id);
      continue;
    }
    const row = rows.get(id);
    assert.ok(row, `missing study card for ${id}`);
    assert.equal(row.name, pack.name, id);
    assert.equal(row.lineCount, pack.lines.length, id);
    assert.equal(row.firstLineId, pack.lines[0].id, id);
    assert.equal(row.stem.length > 0, true, id);
    const game = new Chess();
    for (const san of row.stem) {
      const moved = game.move(san);
      assert.ok(moved, `${id} illegal stem ${san} after ${game.fen()}`);
    }
    const sample = catalog.slice(
      catalog.indexOf("FREE_SAMPLE_LINE_IDS"),
      catalog.indexOf("export function packHasPlayableFreeLines"),
    );
    const line1Free = sample.includes(`"${id}"`) && sample.includes(`"${row.firstLineId}"`);
    assert.equal(row.line1Free, line1Free, id);
    if (pack.side === "White") assert.equal(row.side, "w", id);
    if (pack.side === "Black") assert.equal(row.side, "b", id);
    if (pack.side === "Mixed") assert.equal(row.side, "mixed", id);
  }
  assert.equal(rows.size, visible.length - 2);

  const london = rows.get("london");
  assert.deepEqual(london.stem, ["d4", "d5", "Bf4"]);
  const checked = [];
  for (const id of visible) {
    const spec = STUDY_INTRO_SETUPS[id];
    assert.ok(spec, `missing intro setup for ${id}`);
    const pack = PACKS.find((item) => item.id === id);
    const line = pack.lines.find((item) => item.id === spec.lineId);
    assert.ok(line, `${id} missing line ${spec.lineId}`);
    assert.deepEqual(line.plies.slice(0, spec.plies.length), [...spec.plies], id);
    const game = new Chess();
    for (const san of spec.plies) {
      assert.ok(game.move(san), `${id} illegal setup ${san}`);
    }
    if (id === "london") {
      assert.equal(spec.lineId, "lon1");
      assert.equal(spec.plies.at(-1), "Bd3");
      assert.ok(spec.plies.includes("Ngf3"));
      assert.ok(spec.plies.includes("Nd2"));
    }
    if (id === "opening-traps") {
      assert.equal(spec.plies.includes("Nxe5"), false);
      assert.equal(spec.plies.some((san) => san.includes("#")), false);
    }
    checked.push({
      packId: id,
      lineId: spec.lineId,
      plies: spec.plies,
      linePlies: line.plies,
    });
  }
  assert.equal(Object.keys(STUDY_INTRO_SETUPS).length, visible.length);
  const payload = join(root, "scripts", ".generated-study", "intro-setups.json");
  writeFileSync(payload, JSON.stringify(checked));
  const py = spawnSync("python3", [join(root, "scripts", "validate-intro-setups.py"), payload], {
    encoding: "utf8",
  });
  assert.equal(py.status, 0, `${py.stdout}\n${py.stderr}`);
  assert.match(py.stdout, /python-chess ok/);
});
