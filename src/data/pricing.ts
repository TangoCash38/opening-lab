import type { Pack } from "./packs";

/** Opening Lab+ — hidden. Not on sale. */
export const LAB_PLUS_LABEL = "Opening Lab+";
export const PRICE_MONTHLY = "£4.99";
export const PRICE_YEARLY = "£29.99";
export const PRICE_MONTHLY_NOTE = "a month · cancel anytime";
export const PRICE_YEARLY_NOTE = "a year · best value";

/** Rest of Caro-Kann for Black (3 sample lines stay free). */
export const PRICE_CARO_REST = "£1.99";
/** Any other visible pack. */
export const PRICE_PACK = "£2.99";

export const FREE_PACK_IDS = new Set(["caro-kann-black"]);

export function packPrice(pack: Pack): string | null {
  if (pack.id === "caro-kann-black") return PRICE_CARO_REST;
  if (FREE_PACK_IDS.has(pack.id) || pack.isFree) return null;
  if (pack.price) return pack.price;
  return PRICE_PACK;
}

export function isPackFree(pack: Pack): boolean {
  return FREE_PACK_IDS.has(pack.id) || pack.isFree === true;
}

export function isPackPremium(pack: Pack): boolean {
  return !isPackFree(pack);
}

export function isPayAsYouGoPack(pack: Pack): boolean {
  return isPackPremium(pack) || pack.id === "caro-kann-black";
}

/** Parse a display price like £1 or £1.99 into Stripe pence. */
export function priceToPence(price: string): number | null {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
