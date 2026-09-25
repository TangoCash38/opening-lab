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
  assert.match(unlocks, /isPlayBilledBuyAll/);
  assert.match(unlocks, /playWrapAccountUnlocks/);
  assert.match(unlocks, /playBilled/);

  const hook = src("src/hooks/use-unlocks.ts");
  assert.match(hook, /playWrapAccountUnlocks/);
  assert.match(hook, /isPlayBilledUnlockActive/);
  assert.match(hook, /isPlayBilledBuyAll/);

  const play = src("src/lib/play-app.ts");
  assert.match(play, /OpeningLabPlay/);
  assert.match(play, /export function playWrapAccountUnlocks/);
  assert.match(play, /export function isPlayBilledUnlockActive/);
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
  assert.match(hero, /const shownLines = pack\.lines/);
  assert.match(hero, /shownLines\.map/);
  assert.match(hero, /See \{n\} \{pack\} lines/);
  assert.doesNotMatch(hero, /playableLines\(pack\)/);
  assert.doesNotMatch(hero, /See 3 lines/);
  assert.match(hero, /else onRequestUnlock\?\.\(pack\)/);
  assert.match(hero, /if \(unlocked\) \{/);

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
  const payGuard = packList.slice(payStart, packList.indexOf("setPayError(null);", payStart + 1));
  assert.match(payGuard, /if \(playApp \|\| isPlayWrap\(\)\) \{/);
  assert.match(payGuard, /kind === "monthly" \|\| kind === "yearly"/);
  assert.doesNotMatch(payGuard, /startCheckout/);
  assert.doesNotMatch(packList, /Card via Stripe/);
  assert.match(packList, /startPlayPackBuy/);
  assert.match(packList, /startPlayBuyAll/);
  assert.match(packList, /restorePlayPacks/);
  assert.doesNotMatch(packList, /startPlayLabPlusYearly/);
  const wrapPay = packList.slice(payStart, packList.indexOf("setPayError(null);", payStart + 80));
  assert.doesNotMatch(wrapPay, /startCheckout/);

  const modal = src("src/components/opening-lab/unlock-modal.tsx");
  assert.match(modal, /const wrap = playApp \|\| isPlayWrap\(\)/);
  assert.match(modal, /\{wrap \? \(/);
  assert.match(modal, /Card via Stripe/);
  assert.doesNotMatch(modal, /Yours to keep/);
  assert.doesNotMatch(modal, /lifetime/i);
  assert.match(modal, /Billed by Google Play/);
  assert.match(modal, /Pay as you go/);
  const wrapStart = modal.indexOf("{wrap ? (");
  const websiteStart = modal.indexOf('t("Card via Stripe.")');
  const footerStart = modal.indexOf("{error ? (");
  const wrapBranch = modal.slice(wrapStart, websiteStart);
  const websiteBranch = modal.slice(websiteStart, footerStart);
  assert.doesNotMatch(wrapBranch, /Card via Stripe/);
  assert.match(wrapBranch, /onUnlockPack/);
  assert.match(wrapBranch, /onBuyAll/);
  assert.match(wrapBranch, /Restore purchases/);
  assert.doesNotMatch(wrapBranch, /Please wait/);
  assert.doesNotMatch(wrapBranch, /sold on the website/i);
  assert.doesNotMatch(wrapBranch, /buy on the website/i);
  assert.match(wrapBranch, /\{price\}/);
  assert.match(wrapBranch, /Billed by Google Play/);
  assert.match(websiteBranch, /Card via Stripe/);
  assert.doesNotMatch(websiteBranch, /Yours to keep/);
  assert.doesNotMatch(websiteBranch, /Billed by Google Play/);

  const i18n = src("src/lib/i18n.ts");
  assert.equal(i18n.split('"Card via Stripe.":').length - 1, 12);
  assert.match(i18n, /"Card via Stripe.": "Card via Stripe."/);
  assert.doesNotMatch(i18n, /Yours to keep/);

  const checkout = src("src/lib/checkout.ts");
  assert.match(checkout, /if \(isPlayApp\(\) \|\| isPlayWrap\(\)\)/);
  assert.doesNotMatch(checkout, /Google Play checkout/);
  assert.match(checkout, /Pack billing is not on sale in this build/);

  const catalog = src("src/lib/catalog.ts");
  assert.match(catalog, /const PLAY_PACK_SKUS: Readonly<Record<string, string>>/);
  assert.match(catalog, /playPackSkuMap/);
  assert.match(catalog, /PLAY_PATH_B_PACK_IDS/);
  assert.match(catalog, /@\/lib\/play-skus/);
  assert.match(catalog, /export function catalogOffersLabPlus/);
  assert.match(catalog, /return false/);

  const playSkus = src("src/lib/play-skus.ts");
  assert.match(playSkus, /PLAY_SKU_BUY_ALL = "buy_all_packs"/);
  assert.match(playSkus, /caro-kann-black/);
  assert.match(playSkus, /"opening-traps"/);
});

test("website does not show the app coming soon / continue on the web overlay", () => {
  const packList = src("src/components/opening-lab/pack-list.tsx");
  const hero = src("src/components/opening-lab/home-hero.tsx");
  const landing = src("src/components/opening-lab/home-intro.tsx");
  const shell = src("src/components/opening-lab/app-shell.tsx");
  assert.doesNotMatch(packList, /WebsiteAppPrompt/);
  assert.doesNotMatch(hero, /WebsiteAppPrompt/);
  assert.doesNotMatch(landing, /WebsiteAppPrompt/);
  assert.doesNotMatch(shell, /WebsiteAppPrompt/);
  assert.doesNotMatch(hero, /isPlayWrap\(\)/);
  for (const file of [packList, hero, landing, shell]) {
    assert.doesNotMatch(file, /App coming soon/);
    assert.doesNotMatch(file, /Continue on the web/);
  }
  assert.doesNotMatch(packList, /play\.google\.com\/store\/apps\/details/);
  assert.doesNotMatch(landing, /play\.google\.com\/store\/apps\/details/);
});

test("pack unlock sheet Stripe line has no Yours to keep", () => {
  const modal = src("src/components/opening-lab/unlock-modal.tsx");
  const i18n = src("src/lib/i18n.ts");
  assert.match(modal, /t\("Unlock this pack"\)/);
  assert.match(modal, /t\("Card via Stripe\."\)/);
  assert.doesNotMatch(modal, /Yours to keep/);
  assert.equal(i18n.split('"Card via Stripe.":').length - 1, 12);
  assert.match(i18n, /"Card via Stripe.": "Card via Stripe."/);
  assert.doesNotMatch(i18n, /Yours to keep/);
  assert.match(i18n, /"You will pay securely with Stripe.": "You will pay securely with Stripe."/);
});
