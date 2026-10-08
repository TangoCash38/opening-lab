import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

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

function sentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
}

const explains = src("src/data/line-explains.ts");
const catalog = src("src/lib/catalog.ts");
const packs = src("src/data/packs.ts");
const train = src("src/components/opening-lab/train-view.tsx");
const card = src("src/components/opening-lab/line-finish-note.tsx");
const intro = src("src/lib/pack-study-intro.ts");

const visible = [...catalog.match(/VISIBLE_PACK_IDS = \[([^\]]+)\]/)[1].matchAll(/"([^"]+)"/g)].map(
  (match) => match[1],
);

const block = explains.slice(
  explains.indexOf("export const LINE_EXPLAINS"),
  explains.indexOf("export function lineFinishNote"),
);
const notes = Object.fromEntries(
  [...block.matchAll(/"([^"]+)":\s*\n\s*"([^"]+)"/g)].map((match) => [match[1], match[2]]),
);

test("every visible drill pack line 1 has a short finish note", () => {
  assert.equal(visible.length, 38);
  const keys = new Set();
  for (const packId of visible) {
    const body = packBlock(packs, packId);
    const linesAt = body.indexOf("lines:");
    assert.ok(linesAt >= 0, `${packId} lines missing`);
    const lineBody = body.slice(linesAt);
    const lineId = lineBody.match(/id: "([^"]+)"/)[1];
    const key = `${packId}:${lineId}`;
    keys.add(key);
    const text = notes[key];
    assert.ok(text, `${key} missing finish note`);
    const count = sentences(text).length;
    assert.ok(count >= 3 && count <= 5, `${key} has ${count} sentences`);
    assert.doesNotMatch(text, /—|–|forever|lifetime|blunder|engine/i);
    if (key === "stafford-black:stb1") {
      assert.match(text, /risky/i);
      assert.match(text, /trap/i);
    } else {
      assert.doesNotMatch(text, /trap/i);
    }
    assert.equal(text.includes("\u2014"), false);
  }
  assert.equal(Object.keys(notes).length, keys.size);
  for (const key of Object.keys(notes)) assert.ok(keys.has(key), `${key} is not a visible line 1`);
});

test("a line with no note shows no card, and later lines only need text", () => {
  assert.match(packs, /explain\?: string/);
  assert.match(explains, /const own = line\.explain\?\.trim\(\)/);
  assert.match(explains, /if \(own\) return own/);
  assert.match(explains, /if \(!packId\) return undefined/);
  assert.match(explains, /LINE_EXPLAINS\[`\$\{packId\}:\$\{line\.id\}`\]/);
  assert.doesNotMatch(explains, /LINE_EXPLAINS\[line\.id\]/);
  assert.match(explains, /return keyed \|\| undefined/);
  assert.doesNotMatch(notes["french-white:fr1"] ? "ok" : "", /^$/);
  assert.equal(notes["french-as-white:fr1"], undefined);
});

test("finish card matches the intro shell and sits in front of the end sheet", () => {
  assert.match(card, /className="slav-notice"/);
  assert.match(card, /className="slav-intro-board"/);
  assert.match(card, /className="slav-notice-card"/);
  assert.match(card, /className="slav-notice-primary"/);
  assert.match(card, /data-line-finish-note/);
  assert.match(card, /data-line-finish-got-it/);
  assert.match(card, />\s*Got it\s*</);
  assert.match(card, /Where the line ends/);
  assert.match(card, /lastMove=\{null\}/);
  assert.match(card, /interactive=\{false\}/);
  assert.doesNotMatch(card, /Play on/);
  assert.doesNotMatch(card, /data-slav-opening/);
  assert.doesNotMatch(card, /SlavLineNotes/);

  assert.match(train, /LineFinishNote/);
  assert.match(train, /lineFinishNote\(line, pack\.id\)/);
  assert.match(train, /warmup \|\| freeTry \? undefined : lineFinishNote/);
  assert.match(train, /data-line-finish-got-it|dismissFinishNote/);
  assert.doesNotMatch(train, /SlavLineNotes/);
  assert.doesNotMatch(train, /data-slav-line-notes/);
  assert.doesNotMatch(train, /Play on/);
  assert.doesNotMatch(intro, /Read each line's notes/);

  const learnAt = train.indexOf('t("Practice done")');
  const learnCall = train.slice(train.lastIndexOf("showLineFinish", learnAt), train.indexOf(");", learnAt) + 2);
  assert.match(learnCall, /"testYourself"/);
  assert.doesNotMatch(learnCall, /practiceNext/);

  const progress = src("src/lib/progress.ts");
  const warmup = src("src/lib/london-warmup.ts");
  assert.match(progress, /Math\.min\(99/);
  assert.match(warmup, /testBestPly < line\.plies\.length/);
  assert.match(train, /Math\.min\(Math\.floor\(startPly\) \|\| 0, line\.plies\.length\)/);

  assert.match(train, /t\("Book solid"\),\n          t,\n          "practiceNext"/);
  const cleanAt = train.indexOf('t("Book solid"),\n          t,\n          "practiceNext"');
  const cleanCall = train.slice(train.lastIndexOf("showLineFinish", cleanAt), train.indexOf(");", cleanAt) + 2);
  assert.match(cleanCall, /"practiceNext"/);
  assert.match(cleanCall, /true/);
});
