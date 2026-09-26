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

test("Android wrap is Billing 9.1.0 + versionCode 11 / 1.0.10 INAPP Path B", () => {
  const gradle = src("android/app/build.gradle");
  const manifest = src("android/twa-manifest.json");
  const billing = src("android/app/src/main/java/uk/co/openinglab/PlayBilling.java");
  const androidManifest = src("android/app/src/main/AndroidManifest.xml");

  assert.match(gradle, /com\.android\.billingclient:billing:9\.1\.0/);
  assert.match(gradle, /versionCode 11/);
  assert.match(gradle, /versionName "1\.0\.10"/);
  assert.match(manifest, /"appVersionCode": 11/);
  assert.match(manifest, /"appVersion": "1\.0\.10"/);
  assert.match(manifest, /"enableNotifications": false/);

  assert.match(billing, /ProductType\.INAPP/);
  assert.match(billing, /PendingPurchasesParams/);
  assert.match(billing, /enableOneTimeProducts/);
  assert.match(billing, /buyPack\(String packId\)/);
  assert.match(billing, /buyAll\(\)/);
  assert.match(billing, /restorePurchases\(\)/);
  assert.match(billing, /buy_all_packs/);
  assert.match(billing, /PATH_B_PACK_IDS/);
  assert.match(billing, /caro-kann-black/);
  assert.match(billing, /alekhine-black/);
  assert.match(billing, /old-indian-black/);
  assert.match(billing, /"opening-traps"/);
  assert.match(billing, /LIVE_SALE_PACK_IDS/);
  assert.match(billing, /"scotch"/);
  assert.match(billing, /"opening-traps"/);
  assert.match(billing, /"caro-kann-black"/);
  assert.match(billing, /"london"/);
  assert.match(billing, /"italian-white"/);
  assert.match(billing, /"qg-white"/);
  assert.match(billing, /Set its Play Console price to £1\.99/);
  assert.doesNotMatch(billing, /£0\.99/);
  assert.match(billing, /!BUY_ALL_SKU\.equals\(productId\) && !isLiveSaleSku\(productId\)/);
  assert.doesNotMatch(billing, /ProductType\.SUBS/);
  assert.doesNotMatch(billing, /buyLabPlusYearly/);
  assert.doesNotMatch(billing, /lab_plus_yearly/);
  assert.doesNotMatch(billing, /\.enablePendingPurchases\(\)/);

  assert.match(androidManifest, /android\.permission\.INTERNET/);
  assert.match(androidManifest, /com\.android\.vending\.BILLING/);
  assert.doesNotMatch(androidManifest, /POST_NOTIFICATIONS/);
});

test("PLAY_PACK_SKUS follows PLAY_PATH_B_PACK_IDS (35 packs, including opening-traps and london)", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  const dir = join(root, "scripts", ".generated-play-skus");
  mkdirSync(dir, { recursive: true });
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const skusJs = ts.transpileModule(src("src/lib/play-skus.ts"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const skusTmp = join(dir, "play-skus.mjs");
  writeFileSync(skusTmp, skusJs);
  const {
    PLAY_PATH_B_PACK_IDS,
    PLAY_SKU_BUY_ALL,
    playSkuForPackId,
    playPackSkuMap,
    packIdFromPlaySku,
  } = await import(pathToFileURL(skusTmp).href);

  assert.equal(PLAY_SKU_BUY_ALL, "buy_all_packs");
  assert.equal(PLAY_PATH_B_PACK_IDS.length, 35);
  assert.ok(PLAY_PATH_B_PACK_IDS.includes("london"));
  assert.equal(playSkuForPackId("london"), "pack_london");
  assert.ok(PLAY_PATH_B_PACK_IDS.includes("old-indian-black"));
  assert.equal(playSkuForPackId("old-indian-black"), "pack_old_indian_black");
  assert.ok(PLAY_PATH_B_PACK_IDS.includes("caro-kann-black"));
  assert.equal(PLAY_PATH_B_PACK_IDS.includes("opening-traps"), true);
  assert.equal(playSkuForPackId("opening-traps"), "pack_opening_traps");
  assert.equal(playSkuForPackId("qgd-black"), "pack_qgd_black");
  assert.equal(playSkuForPackId("d4-sidelines-black"), "pack_d4_sidelines_black");
  assert.equal(playSkuForPackId("caro-kann-black"), "pack_caro_kann_black");
  assert.equal(packIdFromPlaySku("pack_qgd_black"), "qgd-black");
  assert.equal(packIdFromPlaySku("buy_all_packs"), null);

  const map = playPackSkuMap(PLAY_PATH_B_PACK_IDS);
  assert.equal(Object.keys(map).length, 35);
  assert.equal(map.london, "pack_london");
  assert.equal(map["old-indian-black"], "pack_old_indian_black");
  assert.equal(map["caro-kann-black"], "pack_caro_kann_black");
  assert.equal(map["qgd-black"], "pack_qgd_black");
  assert.equal(map["opening-traps"], "pack_opening_traps");

  const catalog = src("src/lib/catalog.ts");
  assert.match(catalog, /playPackSkuMap\(\s*PLAY_PATH_B_PACK_IDS/);
  assert.match(catalog, /export function catalogOffersLabPlus/);
});

test("web Play client calls Path B bridge and existing confirm endpoint", () => {
  const client = src("src/lib/play-billing.ts");
  assert.match(client, /export async function startPlayPackBuy/);
  assert.match(client, /export async function startPlayBuyAll/);
  assert.match(client, /export async function restorePlayPacks/);
  assert.match(client, /@\/lib\/play-skus/);
  assert.match(client, /PLAY_PATH_B_PACK_IDS/);
  assert.match(client, /playSkuForPackId/);
  assert.match(client, /buyPack/);
  assert.match(client, /buyAll/);
  assert.match(client, /restorePurchases/);
  assert.match(client, /\/api\/play\/subscribe/);
  assert.doesNotMatch(client, /\/api\/play\/confirm/);
  assert.doesNotMatch(client, /startCheckout/);
  assert.doesNotMatch(client, /lab_plus_yearly/);
});
