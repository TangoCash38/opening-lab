import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pricing = readFileSync(join(root, "src/data/pricing.ts"), "utf8");
const catalog = readFileSync(join(root, "src/lib/catalog.ts"), "utf8");
const review = readFileSync(join(root, "src/lib/review-free.ts"), "utf8");

test("Caro rest is £1.99 and other packs are £2.99", () => {
  assert.match(pricing, /PRICE_CARO_REST = "£1\.99"/);
  assert.match(pricing, /PRICE_PACK = "£2\.99"/);
  assert.match(pricing, /caro-kann-black"\) return PRICE_CARO_REST/);
});

test("website is not all-free; extra Caro lines need a purchase", () => {
  assert.match(review, /return false/);
  assert.match(catalog, /purchasedPackIds/);
  assert.match(catalog, /catalogOffersLabPlus/);
});
