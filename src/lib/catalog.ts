import type { Pack } from "@/data/packs";

/** Only these packs appear in the catalog while we check the rest. */
export const VISIBLE_PACK_IDS = ["scotch", "italian"] as const;

export type VisiblePackId = (typeof VISIBLE_PACK_IDS)[number];

export function isPackVisible(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return (VISIBLE_PACK_IDS as readonly string[]).includes(id);
}

export function visiblePacks<T extends Pick<Pack, "id">>(packs: readonly T[]): T[] {
  return packs.filter((pack) => isPackVisible(pack));
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
 * Play SKU path. A second visible free pack must not unhide Lab+.
 * A locked pack with no Play buy path is not a path (Path A).
 */
export function catalogOffersLabPlus(
  packs: readonly Pick<Pack, "id" | "isFree">[],
): boolean {
  return packs.some(hasPaidPlaySkuPath);
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
