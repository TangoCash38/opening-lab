import type { Pack } from "./packs";

/** Opening Lab+ — hidden. Not on sale. */
export const LAB_PLUS_LABEL = "Opening Lab+";
export const PRICE_MONTHLY = "£4.99";
export const PRICE_YEARLY = "£29.99";
export const PRICE_MONTHLY_NOTE = "a month · cancel anytime";
export const PRICE_YEARLY_NOTE = "a year · best value";

/** Rest of Caro-Kann for Black (3 sample lines stay free). */
export const PRICE_CARO_REST = "£1.99";
/**
 * Full Opening Traps unlock. The first six lines stay free.
 * Restored to the pre-#285 price (£1.99, previously PRICE_CARO_REST).
 */
export const PRICE_OPENING_TRAPS = "£1.99";
/** Paid drill packs that do not set their own price. Lessons stay PRICE_LESSON_SCOTCH. */
export const PRICE_PACK = "£1.99";
/** Scotch Gambit lessons (`lesson-scotch`). Separate from the Scotch drill pack. */
export const PRICE_LESSON_SCOTCH = "£2.99";
/**
 * One-time Buy all. Unlocks every drill pack available now and any future
 * drill packs. Not Lessons. Not a subscription. Not lifetime access.
 * Matches the 26 September 2026 terms.
 */
export const PRICE_BUY_ALL = "£10.99";
export const BUY_ALL_NAME = "Buy all packs";
export const BUY_ALL_STRIPE_DESCRIPTION =
  "One-time purchase. Unlocks every drill pack available now and any future drill packs. Not Lessons. Not a subscription. Not lifetime access.";

export const FREE_PACK_IDS = new Set(["caro-kann-black", "opening-traps"]);

export function packPrice(pack: Pack): string | null {
  if (pack.id === "caro-kann-black") return PRICE_CARO_REST;
  if (pack.id === "opening-traps") return PRICE_OPENING_TRAPS;
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
  return isPackPremium(pack) || pack.id === "caro-kann-black" || pack.id === "opening-traps";
}

/** Parse a display price like £1 or £1.99 into Stripe pence. */
export function priceToPence(price: string): number | null {
  const n = Number(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
