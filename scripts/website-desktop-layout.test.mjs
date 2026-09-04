import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const shell = src("src/components/opening-lab/app-shell.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const css = src("src/styles.css");
const list = src("src/components/opening-lab/pack-list.tsx");
const prompt = src("src/components/opening-lab/website-app-prompt.tsx");

test("app-shell gates data-surface website vs play via isPlayWrap", () => {
  assert.match(shell, /from "@\/lib\/play-app"/);
  assert.match(shell, /isPlayWrap\(\)/);
  assert.match(shell, /data-surface=\{surface\}/);
  assert.match(shell, /playSurface \? "play" : "website"/);
  assert.match(shell, /app-header-inner/);
  assert.doesNotMatch(shell, /max-w-\[520px\]/);
});

test("Play path keeps max-width 520; website desktop widens", () => {
  assert.match(css, /\.app-header-inner[\s\S]*max-width:\s*520px/);
  assert.match(css, /\[data-surface="website"\][\s\S]*max-width:\s*min\(1100px,\s*100%\)/);
  assert.match(css, /@media\s*\(min-width:\s*960px\)/);
  // Play surface must not get the wide rule
  const wideBlock = css.slice(css.indexOf('[data-surface="website"] .app-header-inner'));
  assert.match(wideBlock, /\[data-surface="website"\] \.app-main/);
  assert.doesNotMatch(css, /\[data-surface="play"\][^{]*\{[^}]*min\(1100px/);
});

test("desktop home split classes and website-only CSS exist", () => {
  assert.match(hero, /home-hero-split/);
  assert.match(hero, /home-hero-board-col/);
  assert.match(hero, /home-hero-copy-col/);
  assert.match(hero, /home-lines-panel/);
  assert.match(hero, /!playApp/);
  assert.match(css, /\[data-surface="website"\] \.home-hero-split/);
  assert.match(css, /home-hero-board-col/);
  assert.match(css, /home-hero-copy-col/);
  assert.match(css, /min\(420px,\s*45vw\)/);
  assert.match(list, /pack-list-grid/);
  assert.match(css, /\[data-surface="website"\] \.pack-list-grid/);
});

test("WebsiteAppPrompt stays website-only download / continue", () => {
  assert.match(prompt, /isPlayWrap\(\)/);
  assert.match(prompt, /Download the app/);
  assert.match(prompt, /Continue on the web/);
  assert.match(prompt, /md:items-center/);
  assert.doesNotMatch(prompt, /Play Billing/i);
  assert.doesNotMatch(prompt, /Google Play bills/i);
});
