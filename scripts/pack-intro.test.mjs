import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const intro = readFileSync(join(root, "src/lib/pack-intro.ts"), "utf8");
const modal = readFileSync(
  join(root, "src/components/opening-lab/pack-about-modal.tsx"),
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

test("practice intros skip for the rest of the session, not forever", () => {
  assert.match(intro, /opening-lab:intro:skip-v1/);
  assert.match(intro, /sessionStorage/);
  assert.doesNotMatch(intro, /localStorage/);
  assert.match(intro, /export function shouldSkipPackIntro/);
  assert.match(intro, /export function skipPackIntroThisSession/);
  assert.match(intro, /typeof sessionStorage === "undefined"\) return false/);
});

test("Don't show again is on the intro, and Practice honours the skip", () => {
  assert.match(modal, /Don&apos;t show again/);
  assert.match(modal, /skipPackIntroThisSession/);
  assert.match(hero, /shouldSkipPackIntro\(\)/);
  assert.match(list, /!shouldSkipPackIntro\(\)/);
});
