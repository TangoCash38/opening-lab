import type { Pack } from "@/data/packs";

/** Case-insensitive match on pack name and blurb (v1 home list search). */
export function packMatchesQuery(
  pack: Pick<Pack, "name" | "blurb">,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return pack.name.toLowerCase().includes(q) || pack.blurb.toLowerCase().includes(q);
}
