import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("nearly there follows the free line for a visitor and stays off for a buyer", () => {
  const train = src("src/components/opening-lab/train-view.tsx");
  const screen = src("src/components/opening-lab/nearly-there.tsx");
  const css = src("src/styles.css");

  assert.match(train, /visitorOnFreeLine/);
  assert.match(train, /FREE_SAMPLE_LINE_IDS/);
  assert.match(train, /!purchased\.includes\(pack\.id\)/);
  assert.match(train, /!subscribed/);
  assert.match(train, /pack\.lines\[0\]\?\.id === line\.id/);
  assert.match(train, /<NearlyThere/);
  assert.match(screen, /data-nearly-there/);
  assert.match(screen, /data-nearly-result/);
  assert.match(screen, /data-nearly-unlock/);
  assert.match(screen, /data-nearly-not-now/);
  assert.match(screen, /data-nearly-locked/);
  assert.match(screen, /pack\.lines\.slice\(1, 10\)/);
  assert.match(screen, /10 lines from Opening Lab\./);
  assert.match(screen, /\{price\} unlocks the whole pack/);
  assert.match(screen, /Not now/);
  assert.match(screen, /startPlayPackBuy/);
  assert.match(screen, /startCheckout/);
  assert.match(screen, /slav-notice/);
  assert.doesNotMatch(screen, /forever|lifetime|Play on/i);
  assert.doesNotMatch(train, /forever|lifetime/);
  assert.match(css, /\.nearly-locked/);
  assert.match(css, /\.nearly-dismiss/);
});

test("Play review asks once per 30 days, at most 3 times, and never on the web", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  const js = ts.transpileModule(src("src/lib/play-review.ts"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dir = join(root, "scripts", ".generated-play-review");
  const { mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const tmp = join(dir, "play-review.mjs");
  writeFileSync(tmp, js);
  const mod = await import(pathToFileURL(tmp).href);
  const day = mod.PLAY_REVIEW_GAP_MS;
  const base = {
    playApp: true,
    hasBridge: true,
    now: 1_000_000,
    state: { asks: 0, lastAskedAt: null },
    completedLineCount: 3,
    packReviewable: false,
    packLineCount: 10,
    packLinesComplete: 1,
  };

  assert.equal(mod.considerPlayReview({ ...base, playApp: false }).ask, false);
  assert.equal(mod.considerPlayReview({ ...base, hasBridge: false }).ask, false);
  assert.equal(mod.considerPlayReview({ ...base, completedLineCount: 2 }).ask, false);
  assert.equal(mod.considerPlayReview(base).ask, true);
  assert.equal(mod.considerPlayReview(base).next.asks, 1);

  const again = mod.considerPlayReview({
    ...base,
    completedLineCount: 4,
    state: { asks: 1, lastAskedAt: base.now },
    now: base.now + day - 1,
  });
  assert.equal(again.ask, false);

  const later = mod.considerPlayReview({
    ...base,
    packReviewable: true,
    packLinesComplete: 10,
    state: { asks: 1, lastAskedAt: base.now },
    now: base.now + day,
  });
  assert.equal(later.ask, true);

  const capped = mod.considerPlayReview({
    ...base,
    state: { asks: 3, lastAskedAt: null },
  });
  assert.equal(capped.ask, false);

  const shell = src("src/components/opening-lab/app-shell.tsx");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  assert.match(shell, /maybeAskForPlayReview/);
  assert.match(shell, /if \(typeof window === "undefined" \|\| !isPlayApp\(\)\) return/);
  assert.match(billing, /void requestReview\(\)/);
  assert.match(billing, /ReviewManagerFactory/);
  assert.doesNotMatch(shell, /do you like/i);
  assert.doesNotMatch(billing, /reward/i);
});
