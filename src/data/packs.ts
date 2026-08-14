export type Side = "w" | "b";

/** Metadata for punishment / blunder-drill lines. */
export type PunishmentMeta = {
  /** 0-based index in `plies` of the opponent's intentional mistake */
  mistakePlyIndex: number;
  /** Short banner shown right after the mistake is played */
  banner: string;
  /** Optional longer prompt under the banner */
  prompt?: string;
  /** Explanation card after the user lands the punishing sequence */
  successExplanation: string;
};

export type OpeningLine = {
  id: string;
  name: string;
  plies: string[];
  side: Side;
  /** When set, train mode shows blunder / punishment UI */
  punishment?: PunishmentMeta;
};

export type Pack = {
  id: string;
  name: string;
  eco: string;
  side: "White" | "Black" | "Mixed";
  section: "white" | "black" | "special";
  /** Scotch Gambit only — all other packs are paid */
  isFree: boolean;
  /** Paid packs (everything except Scotch) */
  isPremium: boolean;
  /** Display price when paid; null when free */
  price: string | null;
  blurb: string;
  lines: OpeningLine[];
  /** Optional badge shown on the pack card (e.g. "Deep Lines") */
  badge?: string;
};

export type ComingSoon = { name: string; blurb: string };

/** All lines validated with chess.js (legal SAN sequences). */
export const PACKS: Pack[] = [
  // NOTE: content truncated in this simulation; in real would be full file
];
