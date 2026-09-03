import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pricing = readFileSync(join(root, "src/data/pricing.ts"), "utf8");
const catalog = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");
const review = readFileSync(join(root, "src/lib/review-free.ts"), "utf8");
const require = createRequire(join(root, "package.json"));

test("Caro rest is £1.99 and other packs are £2.99", () => {
  assert.match(pricing, /PRICE_CARO_REST = "£1\.99"/);
  assert.match(pricing, /PRICE_PACK = "£2\.99"/);
  assert.match(pricing, /caro-kann-black"\) return PRICE_CARO_REST/);
});

test("website is not all-free; extra Caro lines need a purchase", () => {
  assert.match(review, /return false/);
  assert.match(catalog, /purchasedPackIds/);
  assert.match(catalog, /catalogOffersLabPlus/);
  assert.match(catalog, /if \(!ids\) return \[\];/);
  assert.doesNotMatch(catalog, /if \(!ids\) return true;/);
  assert.doesNotMatch(catalog, /if \(!ids\) return pack\.lines;/);
  const unlockFn = catalog.slice(
    catalog.indexOf("export function isLineUnlocked"),
    catalog.indexOf("export function nextUnlockedLine"),
  );
  assert.doesNotMatch(unlockFn, /isPackFree/);
  assert.match(unlockFn, /purchasedPackIds.includes\(pack.id\)/);
});

test("isLineUnlocked(nimzo) is locked until Stripe purchase", async (t) => {
  let ts;
  try {
    ts = require("typescript");
  } catch {
    t.skip("typescript not installed");
    return;
  }
  const js = ts.transpileModule(catalog, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const dir = join(root, "scripts", ".generated-pack-price");
  mkdirSync(dir, { recursive: true });
  const tmp = join(dir, "catalog.mjs");
  writeFileSync(tmp, js);
  t.after(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const { isLineUnlocked, playableLines } = await import(pathToFileURL(tmp).href);

  const nimzo = { id: "nimzo-larsen-white", lines: [{ id: "nl1" }, { id: "nl7" }] };
  const caro = {
    id: "caro-kann-black",
    lines: ["ckb1", "ckb2", "ckb3", "ckb5", "ckb18"].map((id) => ({ id })),
  };

  assert.equal(isLineUnlocked(nimzo, "nl1", []), false);
  assert.equal(isLineUnlocked(nimzo, "nl7", []), false);
  assert.equal(isLineUnlocked(nimzo, "nl1", ["nimzo-larsen-white"]), true);
  assert.equal(isLineUnlocked(caro, "ckb1", []), true);
  assert.equal(isLineUnlocked(caro, "ckb3", []), true);
  assert.equal(isLineUnlocked(caro, "ckb5", []), true);
  assert.equal(isLineUnlocked(caro, "ckb2", []), false);
  assert.equal(isLineUnlocked(caro, "ckb18", []), false);
  assert.equal(isLineUnlocked(caro, "ckb2", ["caro-kann-black"]), true);
  assert.equal(isLineUnlocked(caro, "ckb18", ["caro-kann-black"]), true);
  assert.deepEqual(playableLines(nimzo), []);
});
