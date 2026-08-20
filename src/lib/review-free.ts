/**
 * Temporary website review mode: visible packs are playable on the website
 * while we check the rest. Hidden packs stay out of the catalog even here.
 * The Play app wrap stays paid (Scotch still free).
 * Do not flip isFree on packs.ts — that would unlock Play too.
 */
import type { Pack } from "@/data/packs";
import { isPackFree } from "@/data/pricing";
import { isPackVisible } from "@/lib/catalog";
import { isPlayApp } from "@/lib/play-app";

export function isWebsiteReviewFree(): boolean {
  if (typeof window === "undefined") return true;
  return !isPlayApp();
}

export function packLooksFree(pack: Pack): boolean {
  return isPackVisible(pack) && (isWebsiteReviewFree() || isPackFree(pack));
}
