/**
 * Google Play one-time product IDs for Path B (packs + Buy all).
 *
 * Package: uk.co.openinglab
 * Play Console product IDs may only use [a-z0-9._] — no hyphens.
 * Catalog pack ids use hyphens (`qgd-black`), so the on-sale SKU is
 * `pack_` + packId with `-` → `_` (`pack_qgd_black`).
 *
 * Official Console SKUs:
 *   pack_<id> for 32 paid visible packs + pack_caro_kann_black
 *   buy_all_packs  →  applyPurchase({ kind: "buy_all" })
 *
 * No Lab+ / no lab_plus_yearly / no subscriptions.
 * Do not invent pack titles — ids match VISIBLE_PACK_IDS (except opening-traps).
 */

export const PLAY_SKU_BUY_ALL = "buy_all_packs";
export const PLAY_SKU_PACK_PREFIX = "pack_";

/**
 * 32 paid visible packs + caro-kann-black (Caro rest is on sale as
 * pack_caro_kann_black). opening-traps is not a Path B IAP.
 */
export const PLAY_PATH_B_PACK_IDS = [
  "caro-kann-black",
  "qgd-black",
  "london-black",
  "d4-sidelines-black",
  "anti-sicilian-black",
  "nimzo-larsen-white",
  "italian-white",
  "ruy-white",
  "french-white",
  "alapin-white",
  "english-black",
  "kg-black",
  "scandinavian-white",
  "pirc-150-white",
  "dutch-fianchetto-white",
  "caro-advance-panov-white",
  "evans-black",
  "englund-white",
  "budapest-white",
  "bdg-black",
  "queens-gambit-white",
  "scotch",
  "english-white",
  "catalan-white",
  "nimzo-indian-black",
  "grunfeld-black",
  "petroff-black",
  "berlin-black",
  "kings-indian-black",
  "old-indian-black",
  "stafford-black",
  "ponziani-white",
  "alekhine-black",
] as const;

export type PlayProduct =
  | { kind: "buy_all"; productId: string }
  | { kind: "pack"; productId: string; packId: string };

/** Play product ID for a catalog pack id (`qgd-black` → `pack_qgd_black`). */
export function playSkuForPackId(packId: string): string {
  return `${PLAY_SKU_PACK_PREFIX}${packId.replace(/-/g, "_")}`;
}

/**
 * Catalog pack id from a `pack_*` SKU.
 * strip `pack_`, underscores → hyphens. If `knownPackIds` is given, only a
 * matching catalog id is returned (hyphenated first, then the raw suffix).
 */
export function packIdFromPlaySku(
  productId: string,
  knownPackIds?: ReadonlySet<string>,
): string | null {
  if (!productId.startsWith(PLAY_SKU_PACK_PREFIX)) return null;
  const suffix = productId.slice(PLAY_SKU_PACK_PREFIX.length);
  if (!suffix) return null;
  const hyphenated = suffix.replace(/_/g, "-");
  const candidates = hyphenated === suffix ? [suffix] : [hyphenated, suffix];
  if (!knownPackIds) return candidates[0] ?? null;
  return candidates.find((id) => knownPackIds.has(id)) ?? null;
}

/** Classify a Play productId. Pack catalog membership is the caller's job. */
export function resolvePlayProduct(productId: string): PlayProduct | null {
  const sku = productId.trim();
  if (!sku) return null;
  if (sku === PLAY_SKU_BUY_ALL) return { kind: "buy_all", productId: sku };
  if (!sku.startsWith(PLAY_SKU_PACK_PREFIX)) return null;
  const packId = packIdFromPlaySku(sku);
  if (!packId) return null;
  return { kind: "pack", productId: sku, packId };
}

/** Unique Play SKU → pack id for the given catalog ids. */
export function playPackSkuMap(
  packIds: readonly string[],
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const id of packIds) {
    if (!id) continue;
    out[id] = playSkuForPackId(id);
  }
  return out;
}
