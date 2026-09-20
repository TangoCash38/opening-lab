/**
 * Google Play one-time product IDs for Path B (packs + Buy all).
 *
 * Play Console product IDs may only use [a-z0-9._] — no hyphens.
 * Catalog pack ids use hyphens (`italian-white`), so the on-sale SKU is
 * `pack_` + packId with `-` → `_` (`pack_italian_white`).
 *
 * Console must create one managed (non-consumable) in-app product per SKU:
 *   pack_<pack_id_with_underscores>  ↔  PACKS[].id
 *   buy_all                          ↔  PurchaseApply kind "buy_all"
 *
 * `lab_plus_yearly` stays a subscription SKU for restore compatibility only.
 * Do not invent pack titles here — ids come from src/data/packs.ts.
 */

/** Play Console subscription product ID. Yearly base plan only, GBP. Legacy restore. */
export const PLAY_SKU_YEARLY = "lab_plus_yearly";
export const PLAY_SKU_BUY_ALL = "buy_all";
export const PLAY_SKU_PACK_PREFIX = "pack_";

export type PlayProduct =
  | { kind: "yearly"; productId: string }
  | { kind: "buy_all"; productId: string }
  | { kind: "pack"; productId: string; packId: string };

/** Play product ID for a catalog pack id (`italian-white` → `pack_italian_white`). */
export function playSkuForPackId(packId: string): string {
  return `${PLAY_SKU_PACK_PREFIX}${packId.replace(/-/g, "_")}`;
}

/**
 * Catalog pack id from a `pack_*` SKU.
 * Prefers the hyphenated catalog form; if `knownPackIds` is given, only a
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
  if (sku === PLAY_SKU_YEARLY) return { kind: "yearly", productId: sku };
  if (sku === PLAY_SKU_BUY_ALL) return { kind: "buy_all", productId: sku };
  if (!sku.startsWith(PLAY_SKU_PACK_PREFIX)) return null;
  const packId = packIdFromPlaySku(sku);
  if (!packId) return null;
  return { kind: "pack", productId: sku, packId };
}

/** Unique Play SKU → pack id for the given catalog ids (usually PACKS[].id). */
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
