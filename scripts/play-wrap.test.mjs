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

test("Play wrap only lists the three free Caro lines and never starts Stripe", () => {
  const hero = src("src/components/opening-lab/home-hero.tsx");
  assert.match(hero, /playableLines\(pack\)/);
  assert.match(hero, /shownLines\.map/);
  assert.match(hero, /wrap \? "See 3 lines" : "See 18 lines"/);
  assert.match(hero, /else if \(!wrap\) onRequestUnlock\?\.\(pack\)/);
  assert.match(hero, /playApp \|\| isPlayWrap\(\)/);

  const packList = src("src/components/opening-lab/pack-list.tsx");
  assert.match(packList, /useState\(\(\) => isPlayWrap\(\)\)/);
  assert.match(packList, /const wrap = playApp \|\| isPlayWrap\(\)/);
  assert.match(packList, /const requestUnlock = \(pack: Pack\) => \{[\s\S]*?if \(playApp \|\| isPlayWrap\(\)\) return;/);
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
  // Stripe CTA is in the website branch only
  const wrapBranch = modal.slice(modal.indexOf("{wrap ? ("), modal.indexOf(") : ("));
  assert.doesNotMatch(wrapBranch, /Card via Stripe/);
  assert.doesNotMatch(wrapBranch, /onUnlockPack/);

  const checkout = src("src/lib/checkout.ts");
  assert.match(checkout, /if \(isPlayApp\(\) \|\| isPlayWrap\(\)\)/);
  assert.doesNotMatch(checkout, /Google Play checkout/);
  assert.match(checkout, /Pack billing is not on sale in this build/);
});
