import type { OpeningLine, Pack } from "@/data/packs";
import {
  PLAY_PATH_B_PACK_IDS,
  PLAY_SKU_BUY_ALL,
  packIdFromPlaySku as packIdFromEnginePlaySku,
  playPackSkuMap,
} from "@/lib/play-skus";

export {
  PLAY_PATH_B_PACK_IDS,
  playSkuForPackId,
} from "@/lib/play-skus";

/** Only these packs appear in the catalog while we check the rest. */
export const VISIBLE_PACK_IDS = ["caro-kann-black", "qgd-black", "slav-defence", "london-black", "d4-sidelines-black", "anti-sicilian-black", "nimzo-larsen-white", "italian-white", "french-white", "alapin-white", "english-black", "kg-black", "scandinavian-white", "pirc-150-white", "dutch-fianchetto-white", "caro-advance-panov-white", "evans-black", "englund-white", "budapest-white", "bdg-black", "qg-white", "opening-traps", "scotch", "london", "english-white", "catalan-white", "nimzo-indian-black", "grunfeld-black", "petroff-black", "berlin-black", "kings-indian-black", "old-indian-black", "stafford-black", "ponziani-white", "alekhine-black", "french-black", "ruy-lopez-white", "sicilian-black"] as const;

export type VisiblePackId = (typeof VISIBLE_PACK_IDS)[number];

/**
 * Packs that stay fully live (buy, Practice, Test, coach).
 * Every other pack id is coming soon.
 * Relaunch a pack by adding its id here — one line.
 */
export const LIVE_PACK_IDS = ["scotch", "opening-traps", "caro-kann-black", "london", "italian-white", "qg-white", "french-black", "ruy-lopez-white", "sicilian-black", "qgd-black", "slav-defence", "nimzo-indian-black"] as const;

export type LivePackId = (typeof LIVE_PACK_IDS)[number];

/**
 * Website-only free Classic GM sample (Fischer vs Sherwin, 1957).
 * Not a VISIBLE_PACK_IDS entry and not a Play SKU.
 */
export const WEBSITE_CLASSIC_SAMPLE_PACK_ID = "classic-fischer-sherwin-1957";
export const WEBSITE_CLASSIC_SAMPLE_LINE_ID = "fs1957";

export function isWebsiteClassicSample(id: string): boolean {
  return id === WEBSITE_CLASSIC_SAMPLE_PACK_ID;
}

export function isPackComingSoon(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  // Live on the website gym, but still absent from the visible catalog.
  if (isWebsiteClassicSample(id)) return false;
  return !(LIVE_PACK_IDS as readonly string[]).includes(id);
}

/** Visible catalog packs that are not live. Derived from LIVE_PACK_IDS. */
export const COMING_SOON_PACK_IDS: readonly VisiblePackId[] = VISIBLE_PACK_IDS.filter(
  (id) => isPackComingSoon(id),
);

/** New purchases only. Existing unlocks are not touched. */
export function canPurchasePack(packId: string): boolean {
  // Free Classic sample. Not for sale on the website or in Play.
  if (isWebsiteClassicSample(packId)) return false;
  return !isPackComingSoon(packId);
}

/**
 * Single switch for offering Buy all (website and Play wrap share this).
 * false hides every buy button, banner, upsell, and sales mention.
 * Existing plan === "buy_all" entitlements are not affected.
 * true offers the one-time £10.99 drill-pack unlock again.
 */
export const BUY_ALL_FOR_SALE = true;

/** New Buy all checkouts only. Owners keep access either way. */
export function canPurchaseBuyAll(): boolean {
  return BUY_ALL_FOR_SALE;
}

/**
 * Coming-soon gate for people who do not already own the pack.
 * Ownership is a pack id on the unlock list, or an active buy-all / subscription
 * passed in by the caller (`subscribed`).
 */
export function isComingSoonClosed(
  pack: Pick<Pack, "id"> | string,
  purchasedPackIds: readonly string[] = [],
  subscribed = false,
): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  if (!isPackComingSoon(id)) return false;
  if (subscribed) return false;
  return !purchasedPackIds.includes(id);
}

export function isPackVisible(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return (VISIBLE_PACK_IDS as readonly string[]).includes(id);
}

export function visiblePacks<T extends Pick<Pack, "id">>(packs: readonly T[]): T[] {
  return packs.filter((pack) => isPackVisible(pack));
}

/**
 * Line 1 of every drill pack. Lines after line 1 stay locked until that pack
 * is purchased. Buy all and an active subscription are the caller's
 * `subscribed` flag (`subscribed || isLineUnlocked`). The website Classic
 * sample and Scotch Lessons are not in this list.
 */
export const FREE_SAMPLE_LINE_IDS: Readonly<Record<string, readonly string[]>> = {
  "caro-kann-black": ["ckb1"],
  "qgd-black": ["qgdb1"],
  "slav-defence": ["sd1"],
  "london-black": ["alb1"],
  "d4-sidelines-black": ["d4s1"],
  "anti-sicilian-black": ["as1"],
  "nimzo-larsen-white": ["nl1"],
  "italian-white": ["it1"],
  "french-white": ["fr1"],
  "alapin-white": ["al1"],
  "english-black": ["en1"],
  "kg-black": ["kg1"],
  "scandinavian-white": ["sc1"],
  "pirc-150-white": ["pm1"],
  "dutch-fianchetto-white": ["du1"],
  "caro-advance-panov-white": ["ckw1"],
  "evans-black": ["evb1"],
  "englund-white": ["eg1"],
  "budapest-white": ["bp1"],
  "bdg-black": ["bdg1"],
  "qg-white": ["qg1"],
  "opening-traps": ["ot1"],
  "scotch": ["sg1"],
  "london": ["lon1"],
  "english-white": ["engw1"],
  "catalan-white": ["catw1"],
  "nimzo-indian-black": ["nib1"],
  "grunfeld-black": ["gfb1"],
  "petroff-black": ["peb1"],
  "berlin-black": ["berb1"],
  "kings-indian-black": ["kidb1"],
  "old-indian-black": ["oib1"],
  "stafford-black": ["stb1"],
  "ponziani-white": ["pw1"],
  "alekhine-black": ["ab1"],
  "french-black": ["frb1"],
  "ruy-lopez-white": ["rlw1"],
  "sicilian-black": ["sib1"],
};

/**
 * Packs a visitor can actually play a drill line of without paying.
 * Every live pack's intro is free; that does not count. Sample ids must
 * exist on the pack. The website Classic sample is the other free line.
 */
export function packHasPlayableFreeLines(
  pack: Pick<Pack, "id"> & { lines?: readonly Pick<OpeningLine, "id">[] },
): boolean {
  if (isWebsiteClassicSample(pack.id)) return true;
  // Coming-soon packs stay closed. Their line 1 is listed above for when they open.
  if (isPackComingSoon(pack.id)) return false;
  const ids = FREE_SAMPLE_LINE_IDS[pack.id];
  if (!ids?.length) return false;
  const present = new Set((pack.lines ?? []).map((line) => line.id));
  return ids.some((id) => present.has(id));
}

export function playableLines(pack: Pack): OpeningLine[] {
  if (isPackComingSoon(pack.id)) return [];
  const ids = FREE_SAMPLE_LINE_IDS[pack.id];
  if (!ids) return [];
  return pack.lines.filter((l) => ids.includes(l.id));
}

/**
 * Pack-purchase / free-sample gate only. Lab+ / active subscription is the
 * caller's job (use `subscribed || isLineUnlocked(...)`).
 * Line 1 stays free on a live pack. Later lines need that pack in purchasedPackIds.
 * A coming-soon pack stays locked until the viewer owns it or is subscribed.
 * Never treat a missing sample list as unlocked, and do not use isPackFree
 * (Caro isFree but extras are paid).
 */
export function isLineUnlocked(
  pack: Pick<Pack, "id">,
  lineId: string,
  purchasedPackIds: readonly string[] = [],
): boolean {
  // The one website Classic sample is free. It is not a Play SKU and has no
  // paid extras, so it does not go through FREE_SAMPLE_LINE_IDS.
  if (isWebsiteClassicSample(pack.id)) return lineId === WEBSITE_CLASSIC_SAMPLE_LINE_ID;
  if (isComingSoonClosed(pack.id, purchasedPackIds)) return false;
  const ids = FREE_SAMPLE_LINE_IDS[pack.id];
  if (ids) {
    if (ids.includes(lineId)) return true;
    return purchasedPackIds.includes(pack.id);
  }
  return purchasedPackIds.includes(pack.id);
}

/**
 * Later unlocked line in the same pack (pack-purchase / samples only).
 * Callers with Lab+ should pass the pack id in purchasedPackIds (or treat all
 * lines as unlocked). Skips locked lines after the free line 1.
 */
export function nextUnlockedLine(
  pack: Pack,
  currentLineId: string,
  purchasedPackIds: readonly string[] = [],
): OpeningLine | undefined {
  const idx = pack.lines.findIndex((l) => l.id === currentLineId);
  if (idx < 0) return undefined;
  return pack.lines
    .slice(idx + 1)
    .find((l) => isLineUnlocked(pack, l.id, purchasedPackIds));
}

/** Play Console one-time Buy all SKU. Not a lifetime licence. */
export const PLAY_BUY_ALL_SKU = PLAY_SKU_BUY_ALL;

/**
 * Path B Play INAPP map — same pack ids as PLAY_PATH_B_PACK_IDS
 * (includes caro-kann-black extras and opening-traps).
 * Lab+ yearly is not a pack SKU path.
 */
const PLAY_PACK_SKUS: Readonly<Record<string, string>> = playPackSkuMap(
  PLAY_PATH_B_PACK_IDS,
);

/** Pack catalog id for a Path B Play product id, or null for buy-all / unknown. */
export function packIdFromPlaySku(productId: string): string | null {
  const sku = productId.trim();
  if (!sku || sku === PLAY_BUY_ALL_SKU) return null;
  return packIdFromEnginePlaySku(sku, new Set(PLAY_PATH_B_PACK_IDS));
}

export function playSkuForVisiblePack(packId: string): string | null {
  return PLAY_PACK_SKUS[packId] ?? null;
}

/** True when this pack has a Play-billed INAPP SKU (including paid extras on sample packs). */
export function hasPaidPlaySkuPath(
  pack: Pick<Pack, "id" | "isFree">,
): boolean {
  return pack.id in PLAY_PACK_SKUS;
}

/**
 * Lab+ stays hidden while the Play catalog is free — no paid/locked
 * Play SKU path. An eleventh visible free pack must not unhide Lab+.
 * A locked pack with no Play buy path is not a path (Path A).
 */
export function catalogOffersLabPlus(
  _packs: readonly Pick<Pack, "id" | "isFree">[] = [],
): boolean {
  return false;
}

/** Play wrap: free visible packs only, unless a Play pack SKU exists. */
export function playVisiblePacks<T extends Pick<Pack, "id" | "isFree">>(
  packs: readonly T[],
): T[] {
  return visiblePacks(packs).filter(
    (pack) => pack.isFree || hasPaidPlaySkuPath(pack),
  );
}

/** Deep-link pack id from ?pack= / ?packId= or #pack/ / #train/. */
export function readRequestedPackId(
  search = typeof window === "undefined" ? "" : window.location.search,
  hash = typeof window === "undefined" ? "" : window.location.hash,
): string | null {
  const query = new URLSearchParams(search);
  const fromQuery = query.get("pack") ?? query.get("packId");
  if (fromQuery) return fromQuery;

  const raw = hash.replace(/^#\/?/, "");
  if (!raw) return null;
  const [head, next] = raw.split(/[/?&]/);
  if ((head === "pack" || head === "train") && next) return next;

  const hashParams = new URLSearchParams(raw.includes("=") ? raw : "");
  return hashParams.get("pack") ?? hashParams.get("packId");
}

/** Square Memory celebration opens the pack list, not one pack. */
export function readRequestedGym(
  hash = typeof window === "undefined" ? "" : window.location.hash,
): boolean {
  const raw = hash.replace(/^#\/?/, "").split(/[/?&]/)[0] ?? "";
  return raw === "gym";
}
