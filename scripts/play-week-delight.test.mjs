import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (rel) => readFileSync(join(root, rel), "utf8");

const train = src("src/components/opening-lab/train-view.tsx");
const hero = src("src/components/opening-lab/home-hero.tsx");
const list = src("src/components/opening-lab/pack-list.tsx");
const chip = src("src/components/opening-lab/london-warmup-chip.tsx");
const shell = src("src/components/opening-lab/app-shell.tsx");
const lines = src("src/components/opening-lab/pack-lines.tsx");
const i18n = src("src/lib/i18n.ts");
const css = src("src/styles.css");
const sounds = src("src/lib/sounds.ts");
const warmup = src("src/lib/london-warmup.ts");
const packs = src("src/data/packs.ts");
const featured = src("src/lib/featured-pack.ts");

test("Practice near-miss is a cream toast above the action row; Test never shows it", () => {
  const tryPlay = train.slice(train.indexOf("const tryPlay"), train.indexOf("const onSquare"));
  assert.match(tryPlay, /setNearMissSan\(exp\.san\)/);
  assert.match(tryPlay, /setResultCard\(null\)/);
  assert.match(train, /data-near-miss-toast/);
  assert.match(train, /data-near-miss-retry/);
  assert.match(train, /data-near-miss-san/);
  assert.match(train, /t\("Try again from here"\)/);
  assert.match(train, /t\("The book move is \{san\}\."/);
  assert.match(train, /const retryFromHere = /);
  assert.match(train, /if \(wrongUntil \|\| status\.cls === "bad" \|\| nearMissSan\)/);
  assert.match(train, /retryFromHere\(\)/);
  assert.match(train, /setTimeout\(\(\) => setNearMissSan\(null\), 3000\)/);
  assert.match(css, /\.near-miss-toast/);
  assert.match(css, /\.near-miss-san-chip/);
  assert.match(css, /\.near-miss-toast-cta/);
  assert.match(css, /background: var\(--color-bg-elevated\)/);
  assert.doesNotMatch(css, /\.near-miss-toast[\s\S]{0,400}--color-danger/);
  assert.doesNotMatch(tryPlay, /MultiPV/);
  assert.doesNotMatch(tryPlay, /why this move/i);
  assert.doesNotMatch(tryPlay, /engine eval/i);

  const toastAt = train.lastIndexOf("NearMissToast", train.indexOf('className="trainer-actions"'));
  const actionsAt = train.indexOf('className="trainer-actions"');
  assert.ok(toastAt > 0 && toastAt < actionsAt, "toast sits above trainer actions");
  assert.ok(
    train.indexOf("data-near-miss-toast") > train.indexOf("<ChessBoard"),
    "toast is not over the diagram markup",
  );

  const testMiss = tryPlay.slice(
    tryPlay.indexOf('if (mode === "practice")'),
    tryPlay.indexOf("practiceMissedRef"),
  );
  assert.doesNotMatch(testMiss, /setNearMissSan\(exp/);
  assert.match(testMiss, /Inaccurate move/);
  assert.match(train, /nearMissSan && mode === "learn" && !playingOn && !resultCard/);
});

test("clean Test is a quiet Book solid win — one-tone chime, no burst", () => {
  const iClean = train.indexOf('t("Book solid")');
  const cleanDone = train.slice(iClean, train.indexOf("pending.userMove", iClean));
  assert.match(cleanDone, /soundWin\(\)/);
  assert.doesNotMatch(cleanDone, /setCelebratePiece/);
  assert.doesNotMatch(cleanDone, /confetti/i);
  assert.match(train, /text: t\("Book solid"\)/);
  const soundWinBody = sounds.slice(sounds.lastIndexOf("/**", sounds.indexOf("export function soundWin")));
  assert.match(soundWinBody, /one-tone/);
  assert.match(soundWinBody, /0\.026/);
  assert.match(soundWinBody, /0\.32/);
  assert.doesNotMatch(soundWinBody, /notes = \[/);
  assert.doesNotMatch(soundWinBody, /soundMoveArcade/);
  assert.match(lines, /data-book-solid/);
  assert.match(lines, /aria-label=\{t\("Book solid"\)\}/);
  assert.doesNotMatch(lines, />\s*\{t\("Book solid"\)\}/);
});

test("London warm-up chip sits on the Fight the London card", () => {
  assert.match(warmup, /LONDON_PACK_ID = "london-black"/);
  assert.match(warmup, /LONDON_WARMUP_PLIES = 3/);
  assert.match(warmup, /export function pickLondonWarmup/);
  assert.match(featured, /"london-black": "Fight the London"/);
  assert.match(packs, /id: "london-black"/);
  assert.match(packs, /name: "Fight the London"/);
  assert.match(packs, /id: "alb1"/);
  assert.match(chip, /data-london-warmup/);
  assert.match(chip, /t\("London warm-up · \{n\} moves"/);
  assert.match(chip, /pickLondonWarmup/);
  assert.match(chip, /plyLimit: warmup\.plyLimit/);
  assert.match(chip, /startPly: warmup\.startPly/);
  assert.match(chip, /onStartLine\(pack, warmup\.line, "learn"/);
  assert.doesNotMatch(chip, /startCheckout/);
  assert.doesNotMatch(chip, /Lab\+/);
  assert.match(hero, /LondonWarmupChip/);
  assert.doesNotMatch(hero, /min-h-11 w-full[\s\S]{0,120}London warm-up/);
  assert.match(list, /pack\.id === LONDON_PACK_ID/);
  assert.match(list, /LondonWarmupChip/);
  assert.match(shell, /plyLimit=\{active\.plyLimit\}/);
  assert.match(shell, /startPly=\{active\.startPly\}/);
  assert.match(train, /warmupEndPly/);
  assert.match(train, /t\("Warm-up done"\)/);
  const warmupDone = train.slice(
    train.indexOf("if (warmup && mode === \"learn\")"),
    train.indexOf("if (mode === \"learn\") {", train.indexOf("if (warmup && mode === \"learn\")")),
  );
  assert.match(warmupDone, /Warm-up done/);
  assert.doesNotMatch(warmupDone, /onLearnDone/);
  assert.doesNotMatch(warmupDone, /onLineComplete/);
});

test("delight strings exist in all 12 language dicts", () => {
  for (const key of [
    "Try again from here",
    "London warm-up · {n} moves",
    "Book solid",
    "Warm-up done",
  ]) {
    assert.equal(i18n.split(`"${key}":`).length - 1, 12, key);
  }
  assert.match(i18n, /"Try again from here": "Try again from here"/);
  assert.match(i18n, /"Book solid": "Book solid"/);
  assert.match(i18n, /"Warm-up done": "Warm-up done"/);
  assert.match(i18n, /"London warm-up · \{n\} moves": "London warm-up · \{n\} moves"/);
});
