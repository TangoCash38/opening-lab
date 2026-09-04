import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const train = readFileSync(
  join(root, "src/components/opening-lab/train-view.tsx"),
  "utf8",
);

test("trainer move strip is a single-row horizontal scroller", () => {
  assert.match(train, /notationStripRef/);
  assert.match(train, /flex-nowrap/);
  assert.match(train, /overflow-x-auto/);
  assert.doesNotMatch(
    train,
    /notationStripRef[\s\S]{0,200}flex-wrap/,
  );
  // Hide the strip scrollbar (Firefox + IE/legacy + WebKit)
  assert.match(train, /scrollbar-width:none/);
  assert.match(train, /::-webkit-scrollbar/);
});

test("active move scrolls the strip only — never page scrollIntoView on the chip", () => {
  assert.match(train, /notationStripRef\.current/);
  assert.match(train, /\.scrollTo\(\{\s*left:/);
  assert.doesNotMatch(train, /activeMoveRef\.current\?\.scrollIntoView/);
  // Finish sheet is fixed — do not scroll the board wrap into view.
  assert.doesNotMatch(train, /boardWrapRef/);
  assert.doesNotMatch(train, /scrollIntoView/);
});

test("hint row and % complete still reserve height", () => {
  assert.match(train, /min-h-\[1\.2em\]/);
  assert.match(train, /hint \|\| "\\u00a0"/);
  assert.match(train, /\{pct\}% complete/);
  assert.match(train, /!playingOn \? \(/);
});