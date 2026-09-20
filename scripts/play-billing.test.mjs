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

function packIdsFromCatalog() {
  const packs = src("src/data/packs.ts");
  return [...packs.matchAll(/^    id: "([^"]+)",$/gm)].map((m) => m[1]);
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

test("Play SKU mapping is pack_<underscores> and buy_all", async (t) => {
  const mod = await loadTs(t, "src/lib/play-skus.ts", ".generated-play-skus");
  if (!mod) return;

  const ids = packIdsFromCatalog();
  assert.ok(ids.includes("italian-white"));
  assert.ok(ids.includes("caro-kann-black"));
  assert.ok(ids.includes("opening-traps"));
  assert.ok(ids.length >= 30, `expected catalog pack ids, got ${ids.length}`);

  assert.equal(mod.playSkuForPackId("italian-white"), "pack_italian_white");
  assert.equal(mod.playSkuForPackId("caro-kann-black"), "pack_caro_kann_black");
  assert.equal(mod.PLAY_SKU_BUY_ALL, "buy_all");
  assert.equal(mod.PLAY_SKU_YEARLY, "lab_plus_yearly");

  const known = new Set(ids);
  const skus = new Set();
  for (const id of ids) {
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

  assert.deepEqual(mod.resolvePlayProduct("buy_all"), {
    kind: "buy_all",
    productId: "buy_all",
  });
  assert.deepEqual(mod.resolvePlayProduct("lab_plus_yearly"), {
    kind: "yearly",
    productId: "lab_plus_yearly",
  });
  assert.equal(mod.resolvePlayProduct("not_a_sku"), null);
  assert.equal(mod.packIdFromPlaySku("pack_not_in_catalog", known), null);
  assert.equal(mod.packIdFromPlaySku("buy_all"), null);
});

test("Play confirm verifies products API and applyPurchase kinds", () => {
  const server = src("src/lib/play-billing.server.ts");
  assert.match(server, /purchases\/products\//);
  assert.match(server, /kind: "pack"/);
  assert.match(server, /kind: "buy_all"/);
  assert.match(server, /kind: "yearly"/);
  assert.match(server, /GOOGLE_PLAY_SERVICE_ACCOUNT_JSON/);
  assert.match(server, /not_connected/);
  assert.match(server, /savePlayPurchaseToken/);
  assert.match(server, /playPurchaseResponse/);
  assert.match(server, /subscriptionsv2/);

  const notConnected = server.slice(
    server.indexOf("async function notConnectedResponse"),
    server.indexOf("async function applyVerifiedGrant"),
  );
  assert.match(notConnected, /savePlayPurchaseToken/);
  assert.doesNotMatch(notConnected, /applyPurchase/);
  assert.match(notConnected, /503/);

  const client = src("src/lib/play-billing.ts");
  assert.match(client, /\/api\/play\/confirm/);
  assert.match(client, /confirmPlayPurchase/);

  const confirm = src("src/routes/api/play.confirm.ts");
  assert.match(confirm, /playPurchaseResponse/);

  const purchases = src("src/lib/purchases.server.ts");
  assert.match(purchases, /play_billed/);
  assert.match(purchases, /Boolean\(input\.playPurchaseToken\)/);

  const playApp = src("src/lib/play-app.ts");
  assert.match(playApp, /export const PLAY_SKU_YEARLY = "lab_plus_yearly"/);
  assert.match(src("src/lib/play-skus.ts"), /export const PLAY_SKU_YEARLY = "lab_plus_yearly"/);
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
  assert.equal(legacyYearly.plan, "yearly");
  assert.equal(legacyYearly.playBilled, true);

  const tokenOnly = playWrapAccountUnlocks({
    packs: [],
    plan: null,
    expiresAt: null,
    playBilled: false,
  });
  assert.deepEqual(tokenOnly.packs, []);
  assert.equal(tokenOnly.plan, null);
});
