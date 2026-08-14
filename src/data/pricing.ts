import type { Pack } from "./packs";

/** All-Access Pass — unlocks every pack and future content. */
export const ALL_ACCESS_PRICE = "£9.99";
export const ALL_ACCESS_LABEL = "All-Access Pass";

/** 3–4 line packs (short / focused) */
export const PRICE_SHORT = "£0.99";
/** 5–6 line packs (standard mid-size) */
export const PRICE_MID = "£1.49";
/** 8–10+ line packs (full repertoire) */
export const PRICE_FULL = "£1.99";

/** Packs that ship free (Scotch Gambit only). */
export const FREE_PACK_IDS = new Set(["scotch"]);

/**
 * Tiered pricing by line count:
 * - Free: designated starter packs (Scotch)
 * - 3–4 lines → £0.99
 * - 5–6 lines → £1.49
 * - 8–10+ lines → £1.99
 * Explicit pack.price overrides when set.
 */
export function packPrice(pack: Pack): string | null {
  if (FREE_PACK_IDS.has(pack.id) || pack.isFree) return null;
  if (pack.price) return pack.price;
  const n = pack.lines.length;
  if (n <= 4) return PRICE_SHORT;
  if (n <= 6) return PRICE_MID;
  return PRICE_FULL;
}

export function isPackFree(pack: Pack): boolean {
  return FREE_PACK_IDS.has(pack.id) || pack.isFree === true;
}

export function isPackPremium(pack: Pack): boolean {
  return !isPackFree(pack);
}
