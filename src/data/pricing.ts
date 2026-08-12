import type { Pack } from "./packs";

/** All-Access Pass — unlocks every pack and future content. */
export const ALL_ACCESS_PRICE = "£9.99";
export const ALL_ACCESS_LABEL = "All-Access Pass";

/** 5-line packs */
export const PRICE_5 = "£1";
/** 8–10+ line packs */
export const PRICE_10 = "£1.99";

/** Packs that ship free (Scotch Gambit only). */
export const FREE_PACK_IDS = new Set(["scotch"]);

export function packPrice(pack: Pack): string | null {
  if (FREE_PACK_IDS.has(pack.id) || pack.isFree) return null;
  if (pack.price) return pack.price;
  return pack.lines.length <= 5 ? PRICE_5 : PRICE_10;
}

export function isPackFree(pack: Pack): boolean {
  return FREE_PACK_IDS.has(pack.id) || pack.isFree === true;
}

export function isPackPremium(pack: Pack): boolean {
  return !isPackFree(pack);
}
