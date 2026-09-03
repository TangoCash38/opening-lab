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
const train = readFileSync(
  join(root, "src/components/opening-lab/train-view.tsx"),
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

test("Don't show again only on gym step (step 1), not on opening/Start step", () => {
  assert.match(modal, /Don't show again/);
  const continueIdx = modal.indexOf("Continue");
  const skipIdx = modal.indexOf("Don't show again");
  const startLabelIdx = modal.indexOf("{startLabel}");
  assert.ok(continueIdx > 0 && skipIdx > continueIdx, "Don't show again follows Continue on step 1");
  assert.ok(startLabelIdx > skipIdx, "Start is on the later opening step");
  const openingBranch = modal.slice(startLabelIdx);
  assert.doesNotMatch(openingBranch, /Don't show again/);
  const gymBranch = modal.slice(modal.indexOf("step === 1"), startLabelIdx);
  assert.match(gymBranch, /Don't show again/);
  assert.match(gymBranch, /Continue/);
});

test("Don't show again calls skipPackIntroThisSession then advances to step 2", () => {
  const skipBtn = modal.slice(
    modal.lastIndexOf("onClick", modal.indexOf("Don't show again")),
    modal.indexOf("Don't show again"),
  );
  assert.match(skipBtn, /skipPackIntroThisSession\(\)/);
  assert.match(skipBtn, /setStep\(2\)/);
  assert.doesNotMatch(skipBtn, /onStart\(/);
  assert.doesNotMatch(skipBtn, /\bstart\(\)/);
});

test("Start on opening does not require Don't show again", () => {
  const startFn = modal.slice(modal.indexOf("const start"), modal.indexOf("return ("));
  assert.match(startFn, /onStart/);
  assert.doesNotMatch(startFn, /skipPackIntroThisSession/);
  assert.match(modal, /\{startLabel\}/);
});

test("Modal initial step uses shouldSkipPackIntro to land on opening when skipped", () => {
  assert.match(modal, /shouldSkipPackIntro/);
  assert.match(modal, /useState<1 \| 2>/);
  assert.match(modal, /shouldSkipPackIntro\(\)\s*\?\s*2\s*:\s*1/);
});

test("Hero always opens about for Tap to practice when about exists", () => {
  assert.match(hero, /openIntroThenPractice/);
  assert.doesNotMatch(hero, /shouldSkipPackIntro/);
  assert.doesNotMatch(hero, /if \(shouldSkipPackIntro\(\)\) startAdvance/);
  assert.match(hero, /if \(pack\?\.about\) setAboutOpen\(true\)/);
  assert.match(hero, /else startAdvance\(\)/);
  // See 18 lines only toggles the line list; line taps open the intro separately
  assert.match(hero, /onClick=\{\(\) => setLinesOpen\(\(v\) => !v\)\}/);
  // TrainView must not auto-open intro on mount
  assert.match(train, /const \[aboutOpen, setAboutOpen\] = useState\(false\)/);
  assert.doesNotMatch(train, /hasSeenPackIntro/);
});

test("hero and pack-list line taps show opening info then Start that line", () => {
  assert.match(hero, /pendingLine/);
  assert.match(hero, /setPendingLine\(item\)/);
  assert.match(hero, /setAboutOpen\(true\)/);
  assert.match(list, /PackAboutModal/);
  assert.match(list, /setAboutOpen\(true\)/);
  assert.match(list, /pendingLine/);
  assert.match(list, /onClick=\{\(\) => setOpen\(\(v\) => !v\)\}/);
  assert.doesNotMatch(list, /!shouldSkipPackIntro\(\)/);
});
