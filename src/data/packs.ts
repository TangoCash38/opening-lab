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
  {
    id: "scotch",
    name: "Scotch Gambit",
    eco: "C44",
    side: "White",
    section: "white",
    isFree: true,
    isPremium: false,
    price: null,
    blurb: "Aggressive Scottish with the gambit pawn sacrifice",
    lines: [
      {
        id: "sc1",
        name: "Main Line",
        plies: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "dxc3", "Bxf7+", "Kxf7", "Qd5+", "Kf8", "Qxc5+", "d6", "Qxc3"],
        side: "w",
      },
      {
        id: "sc2",
        name: "Dubois-Reti",
        plies: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Nf6", "e5", "d5", "Bb5", "Ne4", "Nxd4", "Bd7", "Bxc6", "bxc6", "O-O"],
        side: "w",
      },
      {
        id: "sc3",
        name: "Classical",
        plies: ["e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "Nf6", "cxd4", "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5", "exd5", "Nxd5"],
        side: "w",
      },
    ],
  },
];
