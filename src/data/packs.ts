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
    blurb: "10 lines · 4…Nf6 main, declines & Bxf7+ punish",
    lines: [
      {
        id: "s1",
        name: "Line 1 · 4…Nf6 (main)",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Nf6", "e5", "d5", "Bb5",
          "Ne4", "Nxd4", "Bc5", "Be3", "O-O",
        ],
        side: "w",
      },
      {
        id: "s2",
        name: "Line 2 · 4…Bc5 solid …Nf6",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "Nf6", "cxd4",
          "Bb4+", "Bd2", "Bxd2+", "Nbxd2", "d5",
        ],
        side: "w",
      },
      {
        id: "s3",
        name: "Line 3 · If …dxc3 (Bxf7+)",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "c3", "dxc3", "Bxf7+",
          "Kxf7", "Qd5+", "Ke8", "Qh5+", "g6", "Qxc5",
        ],
        side: "w",
      },
      {
        id: "s4",
        name: "Line 4 · If …d3",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "d3", "O-O", "dxc2", "Qxc2",
          "Bc5", "Nc3", "d6",
        ],
        side: "w",
      },
      {
        id: "s5",
        name: "Line 5 · If 4…Bb4+",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bb4+", "c3", "dxc3", "O-O",
          "cxb2", "Bxb2", "Nf6",
        ],
        side: "w",
      },
      {
        id: "s6",
        name: "Line 6 · If 4…Be7",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Be7", "c3", "Nf6", "e5",
          "Ne4", "cxd4", "d5",
        ],
        side: "w",
      },
      {
        id: "s7",
        name: "Line 7 · If 4…d6",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "d6", "Nxd4", "Nf6", "Nc3",
          "Be7", "O-O", "O-O",
        ],
        side: "w",
      },
      {
        id: "s8",
        name: "Line 8 · Max Lange path",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "O-O", "Nf6", "e5",
          "d5", "exf6", "dxc4", "Re1+", "Be6",
        ],
        side: "w",
      },
      {
        id: "s9",
        name: "Line 9 · 4…Bc5 Ng5 attack",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Bc5", "Ng5", "Nh6", "Nxf7",
          "Nxf7", "Bxf7+", "Kxf7", "Qh5+", "g6",
        ],
        side: "w",
      },
      {
        id: "s10",
        name: "Line 10 · If …Nxe4 after O-O",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "d4", "exd4", "Bc4", "Nf6", "O-O", "Nxe4", "Re1",
          "d5", "Bxd5", "Qxd5", "Nc3",
        ],
        side: "w",
      },
    ],
  },
];
