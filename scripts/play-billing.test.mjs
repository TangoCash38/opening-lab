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

async function loadTs(t, rel, dirName) {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return null;
  }
  const js = ts.transpileModule(src(rel), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", dirName);
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, `${dirName}.mjs`);
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  return import(pathToFileURL(tmp).href);
}

test("Play SKU mapping is pack_<underscores> and buy_all_packs", async (t) => {
  const mod = await loadTs(t, "src/lib/play-skus.ts", ".generated-play-skus");
  if (!mod) return;

  assert.equal(mod.PLAY_SKU_BUY_ALL, "buy_all_packs");
  assert.equal(mod.playSkuForPackId("qgd-black"), "pack_qgd_black");
  assert.equal(mod.playSkuForPackId("caro-kann-black"), "pack_caro_kann_black");
  assert.equal(mod.PLAY_PATH_B_PACK_IDS.length, 33);
  assert.ok(mod.PLAY_PATH_B_PACK_IDS.includes("caro-kann-black"));
  assert.ok(mod.PLAY_PATH_B_PACK_IDS.includes("old-indian-black"));
  assert.equal(mod.playSkuForPackId("old-indian-black"), "pack_old_indian_black");
  assert.equal(mod.PLAY_PATH_B_PACK_IDS.includes("opening-traps"), false);
  assert.equal(mod.PLAY_PATH_B_PACK_IDS.length - 1, 32);

  const known = new Set(mod.PLAY_PATH_B_PACK_IDS);
  const skus = new Set();
  for (const id of mod.PLAY_PATH_B_PACK_IDS) {
    const sku = mod.playSkuForPackId(id);
    assert.match(sku, /^pack_[a-z0-9_]+$/);
    assert.doesNotMatch(sku, /-/);
    assert.equal(skus.has(sku), false, `duplicate Play SKU ${sku}`);
    skus.add(sku);
    assert.equal(mod.packIdFromPlaySku(sku, known), id);
    const resolved = mod.resolvePlayProduct(sku);
    assert.equal(resolved?.kind, "pack");
    assert.equal(mod.packIdFromPlaySku(resolved.productId, known), id);
  }

  assert.deepEqual(mod.resolvePlayProduct("buy_all_packs"), {
    kind: "buy_all",
    productId: "buy_all_packs",
  });
  assert.equal(mod.resolvePlayProduct("buy_all"), null);
  assert.equal(mod.resolvePlayProduct("lab_plus_yearly"), null);
  assert.equal(mod.resolvePlayProduct("not_a_sku"), null);
  assert.equal(mod.packIdFromPlaySku("pack_not_in_catalog", known), null);
});

test("Play subscribe verifies products API and applyPurchase kinds", () => {
  const server = src("src/lib/play-billing.server.ts");
  assert.match(server, /purchases\/products\//);
  assert.match(server, /kind: "pack"/);
  assert.match(server, /kind: "buy_all"/);
  assert.match(server, /GOOGLE_PLAY_SERVICE_ACCOUNT_JSON/);
  assert.match(server, /not_connected/);
  assert.match(server, /savePlayPurchaseToken/);
  assert.match(server, /playSubscribeResponse/);
  assert.doesNotMatch(server, /purchases\/subscriptionsv2/);
  assert.doesNotMatch(server, /kind: "yearly"/);

  const notConnected = server.slice(
    server.indexOf("async function notConnectedResponse"),
    server.indexOf("async function applyVerifiedGrant"),
  );
  assert.match(notConnected, /savePlayPurchaseToken/);
  assert.doesNotMatch(notConnected, /applyPurchase/);
  assert.match(notConnected, /503/);

  const client = src("src/lib/play-billing.ts");
  assert.match(client, /\/api\/play\/subscribe/);
  assert.doesNotMatch(client, /\/api\/play\/confirm/);
  assert.match(client, /confirmPlayPurchase/);

  const route = src("src/routes/api/play.subscribe.ts");
  assert.match(route, /playSubscribeResponse/);

  const purchases = src("src/lib/purchases.server.ts");
  assert.match(purchases, /play_billed/);
  assert.match(purchases, /Boolean\(input\.playPurchaseToken\)/);
});

test("playWrapAccountUnlocks keeps Play packs/buy_all and zeros Stripe", async (t) => {
  const mod = await loadTs(t, "src/lib/play-app.ts", ".generated-play-app-billing");
  if (!mod) return;
  const { playWrapAccountUnlocks, isPlayBilledUnlockActive } = mod;

  const stripeOnly = playWrapAccountUnlocks({
    packs: ["italian-white", "ruy-white"],
    plan: "yearly",
    expiresAt: Date.now() + 86_400_000,
    playBilled: false,
  });
  assert.deepEqual(stripeOnly.packs, []);
  assert.equal(stripeOnly.plan, null);
  assert.equal(stripeOnly.playBilled, false);
  assert.equal(isPlayBilledUnlockActive(stripeOnly), false);

  const playPack = playWrapAccountUnlocks({
    packs: ["italian-white"],
    plan: "yearly",
    expiresAt: Date.now() + 86_400_000,
    playBilled: true,
  });
  assert.deepEqual(playPack.packs, ["italian-white"]);
  assert.equal(playPack.plan, null);
  assert.equal(playPack.playBilled, true);
  assert.equal(isPlayBilledUnlockActive(playPack), true);

  const playBuyAll = playWrapAccountUnlocks({
    packs: ["italian-white"],
    plan: "buy_all",
    expiresAt: Date.now() + 86_400_000,
    playBilled: true,
  });
  assert.equal(playBuyAll.plan, "buy_all");
  assert.deepEqual(playBuyAll.packs, ["italian-white"]);
  assert.equal(playBuyAll.playBilled, true);

  const legacyYearly = playWrapAccountUnlocks({
    packs: [],
    plan: "yearly",
    expiresAt: Date.now() + 86_400_000,
    playBilled: true,
  });
  assert.deepEqual(legacyYearly.packs, []);
  assert.equal(legacyYearly.plan, null);
  assert.equal(legacyYearly.playBilled, false);

  const tokenOnly = playWrapAccountUnlocks({
    packs: [],
    plan: null,
    expiresAt: null,
    playBilled: false,
  });
  assert.deepEqual(tokenOnly.packs, []);
  assert.equal(tokenOnly.plan, null);
});
