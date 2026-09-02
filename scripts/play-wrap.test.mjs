import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function src(rel) {
  return readFileSync(join(root, rel), "utf8");
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
  assert.doesNotMatch(wrapBranch, /Card via Stripe/);
  assert.doesNotMatch(wrapBranch, /onUnlockPack/);
  assert.doesNotMatch(wrapBranch, /Please wait/);
  assert.doesNotMatch(wrapBranch, /Google will bill/i);
  assert.doesNotMatch(wrapBranch, /Google Play Billing/i);
  assert.match(wrapBranch, /\{price\}/);

  const checkout = src("src/lib/checkout.ts");
  assert.match(checkout, /if \(isPlayApp\(\) \|\| isPlayWrap\(\)\)/);
  assert.doesNotMatch(checkout, /Google Play checkout/);
  assert.match(checkout, /Pack billing is not on sale in this build/);

  const catalog = src("src/lib/catalog.ts");
  assert.match(catalog, /PLAY_PACK_SKUS: Readonly<Record<string, string>> = \{\}/);
  assert.match(catalog, /export function catalogOffersLabPlus/);
  assert.match(catalog, /return false/);
});
