import type { Pack } from "./packs";

/** Opening Lab+ — all packs while the plan is active. */
export const LAB_PLUS_LABEL = "Opening Lab+";
export const PRICE_MONTHLY = "£4.99";
export const PRICE_YEARLY = "£29.99";
export const PRICE_MONTHLY_NOTE = "a month · cancel anytime";
export const PRICE_YEARLY_NOTE = "a year · best value";

/** 3–6 line packs */
export const PRICE_FOCUSED = "£1";
/** 8–10+ line packs */
export const PRICE_FULL = "£1.99";
/** Classic Games bundle */
export const PRICE_BUNDLE = "£3.99";

export const FREE_PACK_IDS = new Set(["scotch"]);

export function packPrice(pack: Pack): string | null {
  if (FREE_PACK_IDS.has(pack.id) || pack.isFree) return null;
  if (pack.price) return pack.price;
  const n = pack.lines.length;
  if (n <= 6) return PRICE_FOCUSED;
  return PRICE_FULL;
}

export function isPackFree(pack: Pack): boolean {
  return FREE_PACK_IDS.has(pack.id) || pack.isFree === true;
}

export function isPackPremium(pack: Pack): boolean {
  return !isPackFree(pack);
}

export function isPayAsYouGoPack(pack: Pack): boolean {
  return isPackPremium(pack);
}

/** Parse a display price like £1 or £1.99 into Stripe pence. */
export function priceToPence(price: string): number | null {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

