import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const guide = readFileSync(
  join(root, "src/components/opening-lab/guide-view.tsx"),
  "utf8",
);

test("guide-view has no per-opening titles; still has gym blocks", () => {
  assert.doesNotMatch(guide, /Caro-Kann for Black/);
  assert.doesNotMatch(guide, /Nimzo-Larsen/);
  assert.doesNotMatch(guide, /Queen.s Gambit Declined/);
  assert.doesNotMatch(guide, /Stop the London System/);
  assert.doesNotMatch(guide, /Blackmar/);
  assert.match(guide, /t\("User guide"\)/);
  assert.match(guide, /t\("What is Opening Lab\?"\)/);
  assert.match(guide, /t\("White & Black \/ Special packs"\)/);
  assert.match(guide, /t\("Practice mode"\)/);
  assert.match(guide, /t\("Test mode"\)/);
  assert.match(guide, /t\("Play on"\)/);
  assert.match(guide, /t\("Reviews"\)/);
  assert.match(guide, /t\("Account"\)/);
  assert.match(guide, /LegalFooter/);
  assert.match(guide, /t\("← Back"\)/);
});
