/**
 * Home pack discovery. Matches the display name, id tokens, closed label,
 * and section — never line SAN. Aliases are exact query phrases so "kid"
 * cannot land on Old Indian, and "old indian" cannot land on the King's Indian.
 */

export type PackSearchFields = {
  id: string;
  name: string;
  side?: string;
  section?: string;
  closedLabel?: string;
};

/**
 * Phrase → pack ids. A full query that equals one of these phrases returns
 * only those packs (still narrowed by a white/black side token).
 * Spelling variants that are already covered by normalisation stay out.
 */
const ALIAS_PHRASES: Readonly<Record<string, readonly string[]>> = {
  kid: ["kings-indian-black", "kings-indian"],
  "kings indian": ["kings-indian-black", "kings-indian"],
  "kings indian defence": ["kings-indian-black", "kings-indian"],
  oid: ["old-indian", "old-indian-black", "old-indian-defence"],
  "old indian": ["old-indian", "old-indian-black", "old-indian-defence"],
  "old indian defence": ["old-indian", "old-indian-black", "old-indian-defence"],
  kia: ["kings-indian-attack"],
  "kings indian attack": ["kings-indian-attack"],
  nimzo: ["nimzo-indian-black", "nimzo-indian"],
  "nimzo indian": ["nimzo-indian-black", "nimzo-indian"],
  nimzoindian: ["nimzo-indian-black", "nimzo-indian"],
  caro: ["caro-kann-black", "caro-advance-panov-white", "caro-as-white", "caro"],
  "caro kann": ["caro-kann-black", "caro-advance-panov-white", "caro-as-white", "caro"],
  carokann: ["caro-kann-black", "caro-advance-panov-white", "caro-as-white", "caro"],
  scotch: ["scotch"],
  "scotch game": ["scotch"],
  "scotch gambit": ["scotch"],
  stafford: ["stafford-black"],
  "stafford gambit": ["stafford-black"],
  alekhine: ["alekhine-black"],
  alekhines: ["alekhine-black"],
  "alekhine defence": ["alekhine-black"],
  "alekhines defence": ["alekhine-black"],
  traps: ["opening-traps"],
  trap: ["opening-traps"],
  "opening traps": ["opening-traps"],
  "opening trap": ["opening-traps"],
  petrov: ["petroff-black"],
  gruenfeld: ["grunfeld-black"],
  qgd: ["qgd-black"],
  spanish: ["ruy-white", "ruy"],
  "ruy lopez": ["ruy-white", "ruy"],
  bdg: ["bdg-black"],
  "kings gambit": ["kg-black", "kings-gambit"],
  kg: ["kg-black", "kings-gambit"],
};

const SIDE_TOKENS = new Set(["white", "black"]);

const EXACT_NAME = 1000;
const ALIAS_HIT = 500;
const NAME_MATCH = 220;
const SUBSTRING_MATCH = 140;
const OTHER_MATCH = 60;

function normalize(raw: string): string {
  let s = raw.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  s = s.replace(/[’‘ʼ′`']/g, "");
  s = s.replace(/defense/g, "defence");
  s = s.replace(/[-‐‑‒–—−/·.]/g, " ");
  s = s.replace(/[^\p{L}\p{N}\s]/gu, " ");
  return s.replace(/\s+/g, " ").trim();
}

function words(raw: string): string[] {
  return normalize(raw)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function hyphenJoins(raw: string): string[] {
  const found = raw.matchAll(/[\p{L}\p{N}]+(?:[-‐‑‒–—−][\p{L}\p{N}]+)+/gu);
  return [...found]
    .map((match) => normalize(match[0]).replace(/ /g, ""))
    .filter((token) => token.length >= 4);
}

function stemHit(token: string, vocab: Set<string>): boolean {
  if (token.length >= 5 && token.endsWith("s") && vocab.has(token.slice(0, -1))) return true;
  if (token.length >= 4 && vocab.has(`${token}s`)) return true;
  return false;
}

type Prepared = {
  index: number;
  name: string;
  nameWords: Set<string>;
  extraWords: Set<string>;
  aliasPhrases: Set<string>;
  side: string;
};

function prepare<T extends PackSearchFields>(pack: T, index: number): Prepared {
  const name = normalize(pack.name);
  const nameWords = new Set(words(pack.name));
  for (const join of hyphenJoins(pack.name)) nameWords.add(join);

  const extraWords = new Set<string>([
    ...words(pack.id),
    ...hyphenJoins(pack.id),
    ...words(pack.closedLabel ?? ""),
    ...words(pack.section ?? ""),
  ]);

  const aliasPhrases = new Set<string>();
  for (const [phrase, ids] of Object.entries(ALIAS_PHRASES)) {
    if (ids.includes(pack.id)) aliasPhrases.add(phrase);
  }

  return {
    index,
    name,
    nameWords,
    extraWords,
    aliasPhrases,
    side: normalize(pack.side ?? ""),
  };
}

function prefixHit(token: string, vocab: Set<string>): boolean {
  if (token.length < 4) return false;
  for (const word of vocab) {
    if (word.length > token.length && word.startsWith(token)) return true;
  }
  return false;
}

function tokenMatches(token: string, prep: Prepared): boolean {
  if (prep.aliasPhrases.has(token)) return true;
  if (prep.nameWords.has(token) || prep.extraWords.has(token)) return true;
  if (stemHit(token, prep.nameWords) || stemHit(token, prep.extraWords)) return true;
  if (prefixHit(token, prep.nameWords)) return true;
  return false;
}

function spacelessHit(name: string, query: string): boolean {
  const compactQuery = query.replace(/ /g, "");
  if (compactQuery.length < 6) return false;
  return name.replace(/ /g, "").includes(compactQuery);
}

function nameTokensHit(tokens: string[], prep: Prepared): boolean {
  return tokens.every(
    (token) =>
      prep.nameWords.has(token) ||
      stemHit(token, prep.nameWords) ||
      prefixHit(token, prep.nameWords),
  );
}

function scoreOf(prep: Prepared, tokens: string[], query: string): number {
  let score = 0;
  if (prep.name === query) score += EXACT_NAME;
  if (prep.aliasPhrases.has(query)) score += ALIAS_HIT;
  if (nameTokensHit(tokens, prep)) score += NAME_MATCH;
  else if (spacelessHit(prep.name, query)) score += SUBSTRING_MATCH;
  else score += OTHER_MATCH;
  return score;
}

function sideOk(prep: Prepared, sides: Set<string>): boolean {
  if (sides.size === 0) return true;
  return sides.has(prep.side);
}

/**
 * Filter and rank packs for the home search box.
 * Empty query returns the input order. Equal scores keep that order.
 */
export function rankPacks<T extends PackSearchFields>(packs: readonly T[], query: string): T[] {
  const normalized = normalize(query);
  if (!normalized) return [...packs];

  const sides = new Set<string>();
  const tokens: string[] = [];
  for (const token of normalized.split(" ")) {
    if (token.length < 2) continue;
    if (SIDE_TOKENS.has(token)) sides.add(token);
    else tokens.push(token);
  }

  const prepared = packs.map((pack, index) => ({ pack, prep: prepare(pack, index) }));
  const textQuery = tokens.join(" ");

  const pool = prepared.filter(({ prep }) => sideOk(prep, sides));

  if (textQuery && ALIAS_PHRASES[textQuery]) {
    const aliasHits = pool.filter(({ prep }) => prep.aliasPhrases.has(textQuery));
    if (aliasHits.length > 0) {
      return orderHits(aliasHits, tokens, textQuery);
    }
  }

  if (tokens.length === 0) {
    return pool.sort((a, b) => a.prep.index - b.prep.index).map(({ pack }) => pack);
  }

  const hits = pool.filter(({ prep }) => {
    if (tokens.every((token) => tokenMatches(token, prep))) return true;
    return spacelessHit(prep.name, textQuery);
  });

  return orderHits(hits, tokens, textQuery);
}

function orderHits<T extends PackSearchFields>(
  hits: { pack: T; prep: Prepared }[],
  tokens: string[],
  textQuery: string,
): T[] {
  return hits
    .map(({ pack, prep }) => ({
      pack,
      score: tokens.length === 0 ? 1 : scoreOf(prep, tokens, textQuery),
      index: prep.index,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ pack }) => pack);
}
