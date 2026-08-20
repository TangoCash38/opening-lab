import type { Pack } from "@/data/packs";

/** Only these packs appear in the catalog while we check the rest. */
export const VISIBLE_PACK_IDS = ["scotch"] as const;

export type VisiblePackId = (typeof VISIBLE_PACK_IDS)[number];

export function isPackVisible(pack: Pick<Pack, "id"> | string): boolean {
  const id = typeof pack === "string" ? pack : pack.id;
  return (VISIBLE_PACK_IDS as readonly string[]).includes(id);
}

export function visiblePacks<T extends Pick<Pack, "id">>(packs: readonly T[]): T[] {
  return packs.filter((pack) => isPackVisible(pack));
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
