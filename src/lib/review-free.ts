/**
 * Website review mode is off. Packs follow isFree / purchases.
 * The Play wrap still must not start Stripe.
 */
import type { Pack } from "@/data/packs";
import { isPackFree } from "@/data/pricing";

export function isWebsiteReviewFree(): boolean {
  return false;
}

export function packLooksFree(pack: Pack): boolean {
  return isPackFree(pack);
}
