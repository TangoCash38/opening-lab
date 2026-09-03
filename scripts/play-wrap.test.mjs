import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
}

async function loadPlayApp(t) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const js = ts.transpileModule(src("src/lib/play-app.ts"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-play-app");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "play-app.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

test("Play wrap gate ignores website Stripe packs and website Lab+", () => {
  const unlocks = src("src/lib/unlocks.ts");
  assert.match(unlocks, /isPlayApp\(\)/);
  assert.match(unlocks, /isPlayBilledLabPlusActive/);
  assert.match(unlocks, /playBilled/);

  const hook = src("src/hooks/use-unlocks.ts");
  assert.match(hook, /playWrapAccountUnlocks/);
  assert.match(hook, /isPlayBilledLabPlusActive\(state\)/);

  const play = src("src/lib/play-app.ts");
  assert.match(play, /OpeningLabPlay/);
  assert.match(play, /export function playWrapAccountUnlocks/);
  assert.doesNotMatch(play, /sold on the website/i);
  assert.doesNotMatch(play, /stay on the website/i);
});

test("Play-wrap copy does not send users to buy packs on the website", () => {
  const files = [
    "src/lib/play-app.ts",
    "src/components/opening-lab/unlock-modal.tsx",
    "src/components/opening-lab/subscribe-modal.tsx",
    "src/components/opening-lab/pack-list.tsx",
    "src/routes/terms.tsx",
  ];
  for (const rel of files) {
    const text = src(rel);
    assert.doesNotMatch(text, /sold on the website/i, rel);
    assert.doesNotMatch(text, /buy on the website/i, rel);
    assert.doesNotMatch(text, /Find the crush/i, rel);
  }
});

test("detectPlayApp is OpeningLabPlay UA or android-app referrer only", async (t) => {
  const mod = await loadPlayApp(t);
  if (!mod) return;
  const { detectPlayApp } = mod;

  assert.equal(detectPlayApp({ userAgent: "Mozilla/5.0 OpeningLabPlay wv" }), true);
  assert.equal(detectPlayApp({ referrer: "android-app://uk.co.openinglab" }), true);
  assert.equal(detectPlayApp({ androidStandalone: true }), false);
  assert.equal(detectPlayApp({ hasDigitalGoods: true }), false);
  assert.equal(detectPlayApp({ remembered: true }), false);
  assert.equal(
    detectPlayApp({ remembered: true, userAgent: "Mozilla/5.0 OpeningLabPlay" }),
    true,
  );
  assert.equal(
    detectPlayApp({ remembered: true, referrer: "android-app://uk.co.openinglab" }),
    true,
  );
  assert.equal(
    detectPlayApp({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
      androidStandalone: true,
      hasDigitalGoods: true,
      remembered: true,
    }),
    false,
  );
});

test("isPlayApp remembers only a hard UA/referrer hit and clears leftover session", () => {
  const play = src("src/lib/play-app.ts");
  const detectFn = play.slice(
    play.indexOf("export function detectPlayApp"),
    play.indexOf("function rememberPlayApp"),
  );
  assert.match(detectFn, /Ignore remembered AND androidStandalone AND hasDigitalGoods/);
  assert.match(detectFn, /isPlayUserAgent\(input\.userAgent/);
  assert.match(detectFn, /isPlayReferrer\(input\.referrer/);
  assert.doesNotMatch(detectFn, /input\.remembered/);
  assert.doesNotMatch(detectFn, /input\.hasDigitalGoods/);
  assert.doesNotMatch(detectFn, /input\.androidStandalone/);

  const isPlay = play.slice(play.indexOf("export function isPlayApp"));
  assert.doesNotMatch(isPlay, /remembered:/);
  assert.doesNotMatch(isPlay, /hasDigitalGoods:/);
  assert.doesNotMatch(isPlay, /androidStandalone:/);
  assert.match(play, /function forgetPlayApp/);
  assert.match(play, /sessionStorage\.removeItem\(SESSION_KEY\)/);
  assert.match(isPlay, /if \(hit\) \{/);
  assert.match(isPlay, /rememberPlayApp\(\)/);
  assert.match(isPlay, /forgetPlayApp\(\)/);
});

test("Play wrap shows locked packs with prices and never starts Stripe", () => {
  const hero = src("src/components/opening-lab/home-hero.tsx");
  assert.match(hero, /pack \? pack\.lines : \[\]/);
  assert.match(hero, /shownLines\.map/);
  assert.match(hero, /See 18 lines/);
  assert.doesNotMatch(hero, /playableLines\(pack\)/);
  assert.doesNotMatch(hero, /See 3 lines/);
  assert.match(hero, /else onRequestUnlock\?\.\(pack\)/);
  assert.match(hero, /if \(unlocked\) onStartLine\(pack, item, "learn"\)/);

  const packList = src("src/components/opening-lab/pack-list.tsx");
  assert.match(packList, /useState\(\(\) => isPlayWrap\(\)\)/);
  assert.match(packList, /const wrap = playApp \|\| isPlayWrap\(\)/);
  assert.match(packList, /const catalog = visiblePacks\(PACKS\)/);
  assert.doesNotMatch(packList, /playVisiblePacks/);
  const unlockStart = packList.indexOf("const requestUnlock");
  const unlockFn = packList.slice(unlockStart, packList.indexOf("const goToSignIn", unlockStart));
  assert.match(unlockFn, /setModal\(\{ pack, price \}\)/);
  assert.doesNotMatch(unlockFn, /startCheckout/);
  assert.doesNotMatch(unlockFn, /\/api\/checkout/);
  assert.doesNotMatch(unlockFn, /fetch\(/);
  const payStart = packList.indexOf("const pay = async");
  const payGuard = packList.slice(payStart, packList.indexOf("setPayError(null);", payStart));
  assert.match(payGuard, /if \(playApp \|\| isPlayWrap\(\)\) \{/);
  assert.match(payGuard, /setShowSub\(false\)/);
  assert.match(payGuard, /setPayBusy\(false\)/);
  assert.match(payGuard, /return;/);
  assert.doesNotMatch(payGuard, /startCheckout/);
  assert.doesNotMatch(payGuard, /fetch\(/);
  assert.doesNotMatch(payGuard, /Please wait/);
  assert.doesNotMatch(packList, /Card via Stripe/);

  const modal = src("src/components/opening-lab/unlock-modal.tsx");
  assert.match(modal, /const wrap = playApp \|\| isPlayWrap\(\)/);
  assert.match(modal, /\{wrap \? \(/);
  assert.match(modal, /Card via Stripe/);
  assert.match(modal, /Packs are not for sale in this Play test/);
  assert.match(modal, /three free Caro lines still train/i);
  assert.match(modal, /Pay as you go/);
  const wrapBranch = modal.slice(modal.indexOf("{wrap ? ("), modal.indexOf(") : ("));
  const websiteBranch = modal.slice(modal.indexOf(") : ("));
  assert.doesNotMatch(wrapBranch, /Card via Stripe/);
  assert.doesNotMatch(wrapBranch, /onUnlockPack/);
  assert.doesNotMatch(wrapBranch, /Please wait/);
  assert.doesNotMatch(wrapBranch, /Google will bill/i);
  assert.doesNotMatch(wrapBranch, /Google Play Billing/i);
  assert.match(wrapBranch, /\{price\}/);
  assert.match(wrapBranch, /Packs are not for sale in this Play test/);
  assert.match(websiteBranch, /Card via Stripe/);
  assert.doesNotMatch(websiteBranch, /Packs are not for sale in this Play test/);

  const checkout = src("src/lib/checkout.ts");
  assert.match(checkout, /if \(isPlayApp\(\) \|\| isPlayWrap\(\)\)/);
  assert.doesNotMatch(checkout, /Google Play checkout/);
  assert.match(checkout, /Pack billing is not on sale in this build/);

  const catalog = src("src/lib/catalog.ts");
  assert.match(catalog, /PLAY_PACK_SKUS: Readonly<Record<string, string>> = \{\}/);
  assert.match(catalog, /export function catalogOffersLabPlus/);
  assert.match(catalog, /return false/);
});

test("website app prompt is website-only and uses closed testing, not a store page", () => {
  const prompt = src("src/components/opening-lab/website-app-prompt.tsx");
  const packList = src("src/components/opening-lab/pack-list.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  assert.match(packList, /WebsiteAppPrompt/);
  assert.doesNotMatch(hero, /WebsiteAppPrompt/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
  assert.match(prompt, /isPlayWrap\(\)/);
  assert.match(prompt, /if \(isPlayWrap\(\)\) return;/);
  assert.match(prompt, /sessionStorage\.setItem\(WEBSITE_APP_PROMPT_KEY, "1"\)/);
  assert.match(prompt, /https:\/\/play\.google\.com\/apps\/testing\/uk\.co\.openinglab/);
  assert.doesNotMatch(prompt, /play\.google\.com\/store\/apps\/details/);
  assert.doesNotMatch(prompt, /search Opening Lab/i);
  assert.doesNotMatch(prompt, /How to play/);
  assert.match(prompt, /t\("Download the app"\)/);
  assert.match(prompt, /t\("Continue on the web"\)/);
});
