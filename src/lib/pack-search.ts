import type { Pack } from "@/data/packs";

/** Case-insensitive match on pack fields used by the home list search. */
export function packMatchesQuery(
  pack: Pick<Pack, "name" | "blurb" | "eco" | "side" | "lines">,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (pack.name.toLowerCase().includes(q)) return true;
  if (pack.blurb.toLowerCase().includes(q)) return true;
  if (pack.eco.toLowerCase().includes(q)) return true;
  if (pack.side.toLowerCase().includes(q)) return true;
  return pack.lines.some((line) => line.name.toLowerCase().includes(q));
}
