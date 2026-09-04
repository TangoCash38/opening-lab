import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "src/components/opening-lab/pack-lines.tsx"),
  "utf8",
);
const hero = readFileSync(
  join(root, "src/components/opening-lab/home-hero.tsx"),
  "utf8",
);
const list = readFileSync(
  join(root, "src/components/opening-lab/pack-list.tsx"),
  "utf8",
);
const i18n = readFileSync(join(root, "src/lib/i18n.ts"), "utf8");

test("locked lines are red, unfinished are natural, Test-passed are green", () => {
  assert.match(src, /border-danger bg-danger-soft text-fg/);
  assert.match(src, /bg-danger text-white/);
  assert.match(src, /border-success\/35 bg-success-soft\/55/);
  assert.match(src, /border-border bg-bg-elevated active:scale-\[0\.99\]/);
  assert.match(src, /bg-bg-subtle text-fg/);
  assert.doesNotMatch(src, /red until a clean Test/);
});

test("locked rows still fire onClick so a tap can open unlock", () => {
  assert.doesNotMatch(src, /if \(locked\) return/);
  assert.doesNotMatch(src, /aria-disabled=\{locked\}/);
  assert.match(src, /onClick=\{onClick\}/);
});

test("LineRow shows Test percent badge when testPercent is passed", () => {
  assert.match(src, /testPercent\?: number \| null/);
  assert.match(src, /showPct = !locked && testPercent != null/);
  assert.match(src, /t\("\{pct\}%", \{ pct: testPercent \}\)/);
  assert.match(hero, /testPercent=\{unlocked \? testPercentOf\(item\.id, item\.plies\.length\) : null\}/);
  assert.match(list, /testPercent=\{rowLocked \? null : testPercentOf\(line\.id, line\.plies\.length\)\}/);
  assert.equal(i18n.split('"{pct}%":').length - 1, 12);
});
