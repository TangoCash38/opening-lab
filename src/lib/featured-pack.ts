import { isPackVisible } from "@/lib/catalog";

/** Persist which pack is promoted into the home hero. */
export const FEATURED_PACK_STORAGE_KEY = "opening-lab:featured-pack";
export const DEFAULT_FEATURED_PACK_ID = "caro-kann-black";

/** Short chess-correct label for button copy (Caro-Kann, not "caro Kan"). */
export function packShortLabel(pack: { id: string; name: string }): string {
  const known: Record<string, string> = {
    "caro-kann-black": "Caro-Kann",
    "opening-traps": "Opening Traps",
    scotch: "Scotch",
    "qgd-black": "Queen’s Gambit Declined",
    "london-black": "London System",
    "queens-gambit-white": "Queen’s Gambit",
    "italian-white": "Italian Game",
    "ruy-white": "Ruy Lopez",
    "french-white": "French Defence",
    "alapin-white": "Alapin",
    "nimzo-larsen-white": "Nimzo-Larsen",
    "english-black": "Symmetrical English",
    "kg-black": "King’s Gambit",
    "scandinavian-white": "Scandinavian",
    "pirc-150-white": "150 Attack",
    "dutch-fianchetto-white": "Dutch Fianchetto",
    "caro-advance-panov-white": "Caro-Kann Advance",
    "evans-black": "Evans Gambit",
    "englund-white": "Englund Gambit",
    "budapest-white": "Budapest Gambit",
    "bdg-black": "Blackmar–Diemer",
    "d4-sidelines-black": "1.d4 Sidelines",
    "anti-sicilian-black": "Anti-Sicilian",
    "english-white": "English Opening",
    "catalan-white": "Catalan Opening",
    "nimzo-indian-black": "Nimzo-Indian",
    "grunfeld-black": "Grünfeld",
    "petroff-black": "Petroff",
  };
  if (known[pack.id]) return known[pack.id];

  let name = pack.name.trim();
  if (name.length <= 22) return name;

  name = name
    .replace(/^How to (Meet|Defend Against) (the )?/i, "")
    .replace(/\s+for (White|Black)$/i, "")
    .replace(/\s*:\s*.*$/, "")
    .trim();

  if (name.length <= 28) return name || pack.name;
  const cut = name.slice(0, 28);
  const sp = cut.lastIndexOf(" ");
  return (sp > 12 ? cut.slice(0, sp) : cut).trim() || pack.name;
}

export function readFeaturedPackId(): string {
  if (typeof localStorage === "undefined") return DEFAULT_FEATURED_PACK_ID;
  try {
    const raw = localStorage.getItem(FEATURED_PACK_STORAGE_KEY);
    if (raw && isPackVisible(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_FEATURED_PACK_ID;
}

export function writeFeaturedPackId(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(FEATURED_PACK_STORAGE_KEY, id);
  } catch {
    /* ignore quota / private mode */
  }
}
