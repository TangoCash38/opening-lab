import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGS = ["en", "es", "zh", "fr", "de", "pt", "ru", "it", "hi", "ja", "ar", "tr"];
const LIVE = [
  "scotch",
  "opening-traps",
  "caro-kann-black",
  "london",
  "italian-white",
  "qg-white",
  "french-black",
  "ruy-lopez-white",
  "sicilian-black",
  "qgd-black",
  "slav-defence",
  "nimzo-indian-black",
  "kings-indian-black",
];

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function liveLineIds() {
  const packs = src("src/data/packs.ts");
  const ids = [];
  for (const packId of LIVE) {
    const start = packs.indexOf(`id: "${packId}"`);
    assert.ok(start >= 0, packId);
    const next = packs.indexOf('\n  {\n    id: "', start + 1);
    const block = next >= 0 ? packs.slice(start, next) : packs.slice(start);
    const found = [...block.matchAll(/\n        id: "([^"]+)"/g)].map((match) => match[1]);
    assert.equal(found.length, 10, packId);
    ids.push(...found);
  }
  return ids;
}

function sentences(text, lang) {
  if (lang === "hi") return text.split("।").map((part) => part.trim()).filter(Boolean);
  if (lang === "zh" || lang === "ja") return text.split("。").map((part) => part.trim()).filter(Boolean);
  if (lang === "ar") return text.split(/[.!?؟]/).map((part) => part.trim()).filter(Boolean);
  return text.split(/[.!?]/).map((part) => part.trim()).filter(Boolean);
}

test("every on-sale line has a unique welcome blurb in every locale", () => {
  const blurbs = JSON.parse(src("src/data/line-welcome-blurbs.json"));
  const ids = liveLineIds();
  assert.equal(ids.length, 130);
  assert.deepEqual(Object.keys(blurbs).sort(), [...ids].sort());
  const seen = Object.fromEntries(LANGS.map((lang) => [lang, new Set()]));
  for (const id of ids) {
    const row = blurbs[id];
    assert.deepEqual(Object.keys(row).sort(), [...LANGS].sort(), id);
    for (const lang of LANGS) {
      const text = row[lang];
      assert.equal(typeof text, "string", `${id} ${lang}`);
      const count = sentences(text, lang).length;
      assert.ok(count === 2 || count === 3, `${id} ${lang} has ${count}: ${text}`);
      assert.equal(text.includes("—") || text.includes("–"), false, `${id} ${lang}`);
      assert.doesNotMatch(text, /engine|eval|centipawn|stockfish/i, `${id} ${lang}`);
      assert.equal(seen[lang].has(text), false, `${id} ${lang} repeats`);
      seen[lang].add(text);
      if (lang !== "en") assert.notEqual(text, row.en, `${id} ${lang}`);
    }
    assert.doesNotMatch(row.en, /worth learning|you will meet it/i, id);
    assert.doesNotMatch(row.en, /^This line|^In this line|^Welcome|^Line /);
  }
});

test("the line card shows the blurb without changing the board size", () => {
  const notice = src("src/components/opening-lab/slav-pack-notice.tsx");
  const train = src("src/components/opening-lab/train-view.tsx");
  const css = src("src/styles.css");
  const about = notice.indexOf("data-line-about");
  const how = notice.indexOf("data-line-how-to");
  const title = notice.indexOf("data-line-welcome");
  assert.ok(title >= 0 && about > title && how > about);
  assert.match(train, /about: lineWelcomeBlurb\(line\.id, lang\)/);
  assert.match(css, /\.slav-notice\[data-slav-notice\] \.slav-intro-board \{\s*width: min\(100% - 0\.75rem, 36rem\);/);
  assert.match(css, /\.slav-intro-board \{\s*flex: 0 0 auto;\s*width: min\(100% - 1\.5rem, 14rem\);/);
  assert.match(notice, /\{copy\.lead\}/);
  assert.doesNotMatch(notice, /How to play/);
});
