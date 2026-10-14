import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hero = readFileSync(
  join(root, "src/components/opening-lab/home-hero.tsx"),
  "utf8",
);
const css = readFileSync(join(root, "src/styles.css"), "utf8");

test("home Caro board does not start practice; a line from the list does", () => {
  assert.doesNotMatch(hero, /Tap to practice/);
  assert.doesNotMatch(hero, /onClick=\{openIntroThenPractice\}/);
  assert.match(hero, /interactive=\{false\}/);
  assert.match(hero, /onSquare=\{\(\) => \{\}\}/);
  assert.match(hero, /pointer-events-none/);
  assert.match(hero, /launchLine\(item\)/);
});

test("home board lets the page scroll", () => {
  assert.match(css, /\.home-board[\s\S]*touch-action: pan-y !important/);
  assert.match(css, /\.home-board[\s\S]*pointer-events: none/);
});
