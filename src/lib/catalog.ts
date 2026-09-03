import type { OpeningLine, Pack } from "@/data/packs";

/** Only these packs appear in the catalog while we check the rest. */
export const VISIBLE_PACK_IDS = ["caro-kann-black", "qgd-black", "london-black", "d4-sidelines-black", "anti-sicilian-black", "nimzo-larsen-white", "italian-white", "ruy-white", "french-white", "alapin-white", "english-black", "kg-black", "scandinavian-white", "pirc-150-white", "dutch-fianchetto-white", "caro-advance-panov-white", "evans-black", "englund-white", "budapest-white", "bdg-black", "queens-gambit-white"] as const;

export type VisiblePackId = (typeof VISIBLE_PACK_IDS)[number];

export function isPackVisible(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return (VISIBLE_PACK_IDS as readonly string[]).includes(id);
}

export function visiblePacks<T extends Pick<Pack, "id">>(packs: readonly T[]): T[] {
  return packs.filter((pack) => isPackVisible(pack));
}

export const FREE_SAMPLE_LINE_IDS: Readonly<Record<string, readonly string[]>> = {
  "caro-kann-black": ["ckb1", "ckb3", "ckb5"],
};

export function playableLines(pack: Pack): OpeningLine[] {
  const ids = FREE_SAMPLE_LINE_IDS[pack.id];
  if (!ids) return [];
  return pack.lines.filter((l) => ids.includes(l.id));
}

/**
 * Sample ids stay free. Extra Caro lines need that pack in purchasedPackIds.
 * Packs with no sample list stay locked until purchasedPackIds includes pack.id.
 * Never treat a missing sample list as unlocked, and do not use isPackFree
 * (Caro isFree but extras are paid).
 */
export function isLineUnlocked(
  pack: Pick<Pack, "id">,
  lineId: string,
  purchasedPackIds: readonly string[] = [],
): boolean {
  const ids = FREE_SAMPLE_LINE_IDS[pack.id];
  if (ids) {
    if (ids.includes(lineId)) return true;
    return purchasedPackIds.includes(pack.id);
  }
  return purchasedPackIds.includes(pack.id);
}

/** Later unlocked line in the same pack. Skips locked extras (Caro free samples stay ckb1, ckb3, ckb5). */
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

/**
 * Individual pack Play product IDs on sale. Empty until billing returns.
 * Lab+ yearly is not a pack SKU path.
 */
const PLAY_PACK_SKUS: Readonly<Record<string, string>> = {};

/** True only when this pack is paid and has a Play-billed SKU. */
export function hasPaidPlaySkuPath(
  pack: Pick<Pack, "id" | "isFree">,
): boolean {
  return !pack.isFree && pack.id in PLAY_PACK_SKUS;
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
