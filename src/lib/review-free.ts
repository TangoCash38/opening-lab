/**
 * Temporary website review mode: every pack is playable on the website
 * while we check lines. The Play app wrap stays paid (Scotch still free).
 * Do not flip isFree on packs.ts — that would unlock Play too.
 */
import type { Pack } from "@/data/packs";
import { isPackFree } from "@/data/pricing";
import { isPlayApp } from "@/lib/play-app";

export function isWebsiteReviewFree(): boolean {
  if (typeof window === "undefined") return true;
  return !isPlayApp();
}

export function packLooksFree(pack: Pack): boolean {
  return isWebsiteReviewFree() || isPackFree(pack);
}
