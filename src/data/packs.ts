export type Side = "w" | "b";

export type OpeningLine = {
  id: string;
  name: string;
  plies: string[];
  side: Side;
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
  {
    id: "italian",
    name: "Italian Game",
    eco: "C50–C54",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "10 lines · Giuoco, Evans, Two Knights, Fried Liver",
    lines: [
      {
        id: "i1",
        name: "Line 1 · Giuoco Piano (main)",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "cxd4",
          "Bb4+", "Nc3", "Nxe4", "O-O", "Bxc3",
        ],
        side: "w",
      },
      {
        id: "i2",
        name: "Line 2 · Giuoco Pianissimo",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6", "O-O", "d6", "c3", "a6",
          "Bb3", "Ba7",
        ],
        side: "w",
      },
      {
        id: "i3",
        name: "Line 3 · Two Knights …Na5",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Na5", "Bb5+",
          "c6", "dxc6", "bxc6", "Be2", "h6",
        ],
        side: "w",
      },
      {
        id: "i4",
        name: "Line 4 · Evans Gambit",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5", "d4",
          "exd4", "O-O", "d6",
        ],
        side: "w",
      },
      {
        id: "i5",
        name: "Line 5 · Hungarian …Be7",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Be7", "d4", "d6", "dxe5", "dxe5", "Qxd8+",
          "Bxd8", "Nc3", "Nf6",
        ],
        side: "w",
      },
      {
        id: "i6",
        name: "Line 6 · Fried Liver",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5", "Nxd5", "Nxf7",
          "Kxf7", "Qf3+", "Ke6", "Nc3",
        ],
        side: "w",
      },
      {
        id: "i7",
        name: "Line 7 · Traxler / Wilkes-Barre",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "Bc5", "Nxf7", "Bxf2+", "Kf1",
          "Qe7", "Nxh8", "d5",
        ],
        side: "w",
      },
      {
        id: "i8",
        name: "Line 8 · Quiet Italian …h6",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "d3", "Nf6", "c3", "d6", "O-O", "h6",
          "Nbd2", "O-O",
        ],
        side: "w",
      },
      {
        id: "i9",
        name: "Line 9 · Centre Attack",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4", "e5", "d5",
          "Bb5", "Ne4",
        ],
        side: "w",
      },
      {
        id: "i10",
        name: "Line 10 · Two Knights main path",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Be7", "O-O", "O-O", "Re1", "d6",
          "a4", "a5",
        ],
        side: "w",
      },
    ],
  },
  {
    id: "ruy",
    name: "Ruy Lopez",
    eco: "C60–C99",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "10 lines · Closed, Berlin, Open, Marshall ideas",
    lines: [
      {
        id: "r1",
        name: "Line 1 · Closed Spanish main",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5",
          "Bb3", "d6", "c3", "O-O",
        ],
        side: "w",
      },
      {
        id: "r2",
        name: "Line 2 · Berlin Defence",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "Nf6", "O-O", "Nxe4", "d4", "Nd6", "Bxc6",
          "dxc6", "dxe5", "Nf5",
        ],
        side: "w",
      },
      {
        id: "r3",
        name: "Line 3 · Exchange Variation",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6", "O-O", "f6", "d4",
          "exd4", "Nxd4", "c5",
        ],
        side: "w",
      },
      {
        id: "r4",
        name: "Line 4 · Open Spanish",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Nxe4", "d4", "b5",
          "Bb3", "d5",
        ],
        side: "w",
      },
      {
        id: "r5",
        name: "Line 5 · Marshall Attack ideas",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7", "Re1", "b5",
          "Bb3", "O-O", "c3", "d5",
        ],
        side: "w",
      },
      {
        id: "r6",
        name: "Line 6 · Schliemann",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "f5", "Nc3", "fxe4", "Nxe4", "d5", "Nxe5",
          "dxe4", "Nxc6", "Qd5",
        ],
        side: "w",
      },
      {
        id: "r7",
        name: "Line 7 · Classical …Bc5",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "Bc5", "c3", "Nf6", "d4", "exd4", "e5", "Ne4",
          "O-O", "d5",
        ],
        side: "w",
      },
      {
        id: "r8",
        name: "Line 8 · Steinitz Deferred",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "d6", "c3", "Bd7", "d4", "Nf6",
          "O-O", "Be7",
        ],
        side: "w",
      },
      {
        id: "r9",
        name: "Line 9 · Bird’s Defence",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "Nd4", "Nxd4", "exd4", "O-O", "c6", "Bc4",
          "Nf6", "Re1", "d6",
        ],
        side: "w",
      },
      {
        id: "r10",
        name: "Line 10 · Arkhangelsk ideas",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "b5", "Bb3",
          "Bb7", "d3", "Be7",
        ],
        side: "w",
      },
    ],
  },

  // —— New White packs (train vs popular Black replies / 1.d4 systems) ——
  {
    id: "open-sicilian",
    name: "Open Sicilian",
    eco: "B20–B99",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1",
    blurb: "5 lines · Najdorf, Dragon, Classical, Scheveningen, Sveshnikov",
    lines: [
      {
        id: "os1",
        name: "Line 1 · Najdorf Variation",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6",
        ],
        side: "w",
      },
      {
        id: "os2",
        name: "Line 2 · Dragon Variation",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6",
        ],
        side: "w",
      },
      {
        id: "os3",
        name: "Line 3 · Classical Variation",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "Nc6",
        ],
        side: "w",
      },
      {
        id: "os4",
        name: "Line 4 · Scheveningen Variation",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6",
        ],
        side: "w",
      },
      {
        id: "os5",
        name: "Line 5 · Sveshnikov Variation",
        plies: [
          "e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e5",
        ],
        side: "w",
      },
    ],
  },
  {
    id: "french-as-white",
    name: "French Defense (as White)",
    eco: "C00–C19",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1",
    blurb: "5 lines · Advance, Milner-Barry, Winawer, Tarrasch, Exchange",
    lines: [
      {
        id: "fw1",
        name: "Line 1 · Main Line Advance",
        plies: [
          "e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3",
        ],
        side: "w",
      },
      {
        id: "fw2",
        name: "Line 2 · Milner-Barry Gambit",
        plies: [
          "e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "Bd3",
        ],
        side: "w",
      },
      {
        id: "fw3",
        name: "Line 3 · Winawer Variation",
        plies: [
          "e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3",
        ],
        side: "w",
      },
      {
        id: "fw4",
        name: "Line 4 · Tarrasch Variation",
        plies: [
          "e4", "e6", "d4", "d5", "Nd2", "c5", "exd5", "exd5",
        ],
        side: "w",
      },
      {
        id: "fw5",
        name: "Line 5 · Exchange Variation",
        plies: [
          "e4", "e6", "d4", "d5", "exd5", "exd5", "Nf3", "Bd6",
        ],
        side: "w",
      },
    ],
  },
  {
    id: "caro-as-white",
    name: "Caro-Kann (as White)",
    eco: "B10–B19",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1",
    blurb: "5 lines · Advance, Tal, Classical, Two Knights, Fantasy",
    lines: [
      {
        id: "caw1",
        name: "Line 1 · Advance Variation",
        plies: [
          "e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6",
        ],
        side: "w",
      },
      {
        id: "caw2",
        name: "Line 2 · Advance Tal Variation",
        plies: [
          "e4", "c6", "d4", "d5", "e5", "Bf5", "h4", "h6", "g4",
        ],
        side: "w",
      },
      {
        id: "caw3",
        name: "Line 3 · Classical Variation",
        plies: [
          "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6",
        ],
        side: "w",
      },
      {
        id: "caw4",
        name: "Line 4 · Two Knights Variation",
        plies: [
          "e4", "c6", "Nc3", "d5", "Nf3", "Bg4", "h3", "Bxf3",
        ],
        side: "w",
      },
      {
        id: "caw5",
        name: "Line 5 · Fantasy Variation",
        plies: [
          "e4", "c6", "d4", "d5", "f3", "dxe4", "fxe4", "e5",
        ],
        side: "w",
      },
    ],
  },
  {
    id: "queens-gambit",
    name: "Queen’s Gambit",
    eco: "D06–D69",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1",
    blurb: "5 lines · QGA, QGD, Slav, Semi-Slav, Exchange",
    lines: [
      {
        id: "qg1",
        name: "Line 1 · Accepted (QGA)",
        plies: [
          "d4", "d5", "c4", "dxc4", "Nf3", "Nf6", "e3", "e6",
        ],
        side: "w",
      },
      {
        id: "qg2",
        name: "Line 2 · Declined (QGD) Main",
        plies: [
          "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7",
        ],
        side: "w",
      },
      {
        id: "qg3",
        name: "Line 3 · Slav Defense",
        plies: [
          "d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4",
        ],
        side: "w",
      },
      {
        id: "qg4",
        name: "Line 4 · Semi-Slav Defense",
        plies: [
          "d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "e6",
        ],
        side: "w",
      },
      {
        id: "qg5",
        name: "Line 5 · Exchange Variation",
        plies: [
          "d4", "d5", "c4", "e6", "Nc3", "Nf6", "cxd5", "exd5",
        ],
        side: "w",
      },
    ],
  },
  {
    id: "london",
    name: "London System",
    eco: "D00 / A45–A48",
    side: "White",
    section: "white",
    isFree: false,
    isPremium: true,
    price: "£1",
    blurb: "5 lines · Pyramid, Jobava, vs …c5, KID setup, Dutch",
    lines: [
      {
        id: "lon1",
        name: "Line 1 · Standard Pyramid Setup",
        plies: [
          "d4", "d5", "Bf4", "Nf6", "e3", "c5", "c3", "Nc6", "Nf3",
        ],
        side: "w",
      },
      {
        id: "lon2",
        name: "Line 2 · Jobava London",
        plies: [
          "d4", "d5", "Nc3", "Nf6", "Bf4", "c5", "e3", "a6",
        ],
        side: "w",
      },
      {
        id: "lon3",
        name: "Line 3 · Vs. Early …c5",
        plies: [
          "d4", "Nf6", "Bf4", "c5", "e3", "Qb6", "Nc3",
        ],
        side: "w",
      },
      {
        id: "lon4",
        name: "Line 4 · Vs. King’s Indian Setup",
        plies: [
          "d4", "Nf6", "Bf4", "g6", "e3", "Bg7", "Nf3", "O-O",
        ],
        side: "w",
      },
      {
        id: "lon5",
        name: "Line 5 · Vs. Dutch Defense",
        plies: [
          "d4", "f5", "Bf4", "Nf6", "e3", "e6", "Nf3", "b6",
        ],
        side: "w",
      },
    ],
  },

  {
    id: "sicilian",
    name: "Sicilian Defence",
    eco: "B20–B99",
    side: "Black",
    section: "black",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "10 lines · Najdorf, Dragon, Taimanov, Alapin",
    lines: [
      {
        id: "si1",
        name: "Line 1 · Najdorf …e5",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be2",
          "e5", "Nb3", "Be7",
        ],
        side: "b",
      },
      {
        id: "si2",
        name: "Line 2 · Najdorf vs 6.Bg5",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Bg5",
          "e6", "f4", "Qb6",
        ],
        side: "b",
      },
      {
        id: "si3",
        name: "Line 3 · Najdorf Classical",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6", "Be3",
          "e5", "Nb3", "Be6",
        ],
        side: "b",
      },
      {
        id: "si4",
        name: "Line 4 · Accelerated Dragon",
        plies: [
          "e4", "c5", "Nf3", "Nc6", "d4", "cxd4", "Nxd4", "g6", "Nc3", "Bg7", "Be3",
          "Nf6", "Bc4", "O-O",
        ],
        side: "b",
      },
      {
        id: "si5",
        name: "Line 5 · Taimanov",
        plies: [
          "e4", "c5", "Nf3", "e6", "d4", "cxd4", "Nxd4", "Nc6", "Nc3", "Qc7", "Be2",
          "a6", "O-O", "Nf6",
        ],
        side: "b",
      },
      {
        id: "si6",
        name: "Line 6 · Moscow 3.Bb5+",
        plies: [
          "e4", "c5", "Nf3", "d6", "Bb5+", "Bd7", "Bxd7+", "Qxd7", "c4", "Nc6", "d4",
          "cxd4", "Nxd4", "Nf6",
        ],
        side: "b",
      },
      {
        id: "si7",
        name: "Line 7 · Dragon Yugoslav setup",
        plies: [
          "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6", "Be3",
          "Bg7", "f3", "O-O",
        ],
        side: "b",
      },
      {
        id: "si8",
        name: "Line 8 · Alapin …d5",
        plies: [
          "e4", "c5", "c3", "d5", "exd5", "Qxd5", "d4", "Nf6", "Nf3", "Bg4", "Be2",
          "e6", "O-O", "Nc6",
        ],
        side: "b",
      },
      {
        id: "si9",
        name: "Line 9 · Grand Prix as Black",
        plies: [
          "e4", "c5", "Nc3", "Nc6", "f4", "g6", "Nf3", "Bg7", "Bb5", "Nd4",
        ],
        side: "b",
      },
      {
        id: "si10",
        name: "Line 10 · Rossolimo …g6",
        plies: [
          "e4", "c5", "Nf3", "Nc6", "Bb5", "g6", "O-O", "Bg7", "Re1", "e5", "Bxc6",
          "dxc6", "d3", "Qe7",
        ],
        side: "b",
      },
    ],
  },
  {
    id: "french",
    name: "French Defence",
    eco: "C00–C19",
    side: "Black",
    section: "black",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "8 lines · Winawer, Tarrasch, Advance, Classical",
    lines: [
      {
        id: "f1",
        name: "Line 1 · Winawer main",
        plies: [
          "e4", "e6", "d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3",
          "Ne7", "Qg4", "Qc7",
        ],
        side: "b",
      },
      {
        id: "f2",
        name: "Line 2 · Tarrasch …c5",
        plies: [
          "e4", "e6", "d4", "d5", "Nd2", "c5", "exd5", "Qxd5", "Ngf3", "cxd4",
        ],
        side: "b",
      },
      {
        id: "f3",
        name: "Line 3 · Advance …Qb6",
        plies: [
          "e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6",
        ],
        side: "b",
      },
      {
        id: "f4",
        name: "Line 4 · Classical 4.Bg5",
        plies: [
          "e4", "e6", "d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7",
        ],
        side: "b",
      },
      {
        id: "f5",
        name: "Line 5 · Steinitz 5.f4",
        plies: [
          "e4", "e6", "d4", "d5", "Nc3", "Nf6", "e5", "Nfd7", "f4", "c5",
        ],
        side: "b",
      },
      {
        id: "f6",
        name: "Line 6 · Exchange",
        plies: [
          "e4", "e6", "d4", "d5", "exd5", "exd5", "Nf3", "Bd6", "Bd3", "Ne7",
        ],
        side: "b",
      },
      {
        id: "f7",
        name: "Line 7 · Rubinstein",
        plies: [
          "e4", "e6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7", "Nf3", "Ngf6",
        ],
        side: "b",
      },
      {
        id: "f8",
        name: "Line 8 · Tarrasch Closed",
        plies: [
          "e4", "e6", "d4", "d5", "Nd2", "Nf6", "e5", "Nfd7", "Bd3", "c5", "c3",
          "Nc6",
        ],
        side: "b",
      },
    ],
  },
  {
    id: "caro",
    name: "Caro-Kann",
    eco: "B10–B19",
    side: "Black",
    section: "black",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "8 lines · Classical, Advance, Panov, Two Knights",
    lines: [
      {
        id: "ck1",
        name: "Line 1 · Classical 4…Bf5",
        plies: [
          "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6",
        ],
        side: "b",
      },
      {
        id: "ck2",
        name: "Line 2 · Advance 3…Bf5",
        plies: [
          "e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5",
        ],
        side: "b",
      },
      {
        id: "ck3",
        name: "Line 3 · Panov-Botvinnik",
        plies: [
          "e4", "c6", "d4", "d5", "exd5", "cxd5", "c4", "Nf6", "Nc3", "e6",
        ],
        side: "b",
      },
      {
        id: "ck4",
        name: "Line 4 · 4…Nd7 system",
        plies: [
          "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7", "Ng5", "Ngf6",
        ],
        side: "b",
      },
      {
        id: "ck5",
        name: "Line 5 · 4…Nf6 Exchange",
        plies: [
          "e4", "c6", "d4", "d5", "exd5", "cxd5", "Bd3", "Nc6", "c3", "Nf6",
        ],
        side: "b",
      },
      {
        id: "ck6",
        name: "Line 6 · Two Knights …Bg4",
        plies: [
          "e4", "c6", "Nc3", "d5", "Nf3", "Bg4", "h3", "Bxf3", "Qxf3", "e6",
        ],
        side: "b",
      },
      {
        id: "ck7",
        name: "Line 7 · Advance …c5",
        plies: [
          "e4", "c6", "d4", "d5", "e5", "c5", "dxc5", "e6", "Nf3", "Bxc5",
        ],
        side: "b",
      },
      {
        id: "ck8",
        name: "Line 8 · Classical 5.Bc4",
        plies: [
          "e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Bc4", "e6",
        ],
        side: "b",
      },
    ],
  },
  {
    id: "kings-indian",
    name: "King’s Indian",
    eco: "E60–E99",
    side: "Black",
    section: "black",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "8 lines · Classical, Sämisch, Fianchetto, Grünfeld",
    lines: [
      {
        id: "ki1",
        name: "Line 1 · Classical main",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2",
          "e5", "O-O", "Nc6",
        ],
        side: "b",
      },
      {
        id: "ki2",
        name: "Line 2 · Sämisch",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f3", "O-O",
        ],
        side: "b",
      },
      {
        id: "ki3",
        name: "Line 3 · Fianchetto",
        plies: [
          "d4", "Nf6", "c4", "g6", "g3", "Bg7", "Bg2", "O-O", "Nc3", "d6", "Nf3",
          "Nbd7",
        ],
        side: "b",
      },
      {
        id: "ki4",
        name: "Line 4 · Averbakh ideas",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Be2", "O-O", "Bg5",
          "c5",
        ],
        side: "b",
      },
      {
        id: "ki5",
        name: "Line 5 · Grünfeld Exchange",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "d5", "cxd5", "Nxd5", "e4", "Nxc3",
          "bxc3", "Bg7",
        ],
        side: "b",
      },
      {
        id: "ki6",
        name: "Line 6 · Classical 6…e5",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2",
          "e5", "d5", "a5",
        ],
        side: "b",
      },
      {
        id: "ki7",
        name: "Line 7 · Fianchetto …Nbd7",
        plies: [
          "d4", "Nf6", "c4", "g6", "g3", "Bg7", "Bg2", "O-O", "Nc3", "d6", "Nf3",
          "Nbd7", "O-O", "e5",
        ],
        side: "b",
      },
      {
        id: "ki8",
        name: "Line 8 · Four Pawns setup",
        plies: [
          "d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "f4", "O-O", "Nf3",
          "c5",
        ],
        side: "b",
      },
    ],
  },
  {
    id: "club-weapons",
    name: "Club Weapons",
    eco: "Various",
    side: "Mixed",
    section: "special",
    isFree: false,
    isPremium: true,
    price: "£1.99",
    blurb: "10 lines · London, Jobava, gambits & club systems",
    lines: [
      {
        id: "cw1",
        name: "Line 1 · London System",
        plies: [
          "d4", "d5", "Nf3", "Nf6", "Bf4", "c5", "e3", "Nc6", "c3", "e6",
        ],
        side: "w",
      },
      {
        id: "cw2",
        name: "Line 2 · Jobava London",
        plies: ["d4", "d5", "Nc3", "Nf6", "Bf4", "c5", "e3", "Nc6"],
        side: "w",
      },
      {
        id: "cw3",
        name: "Line 3 · Grand Prix Attack",
        plies: [
          "e4", "c5", "Nc3", "Nc6", "f4", "g6", "Nf3", "Bg7", "Bb5", "Nd4",
        ],
        side: "w",
      },
      {
        id: "cw4",
        name: "Line 4 · Danish Gambit",
        plies: [
          "e4", "e5", "d4", "exd4", "c3", "dxc3", "Bc4", "cxb2", "Bxb2",
        ],
        side: "w",
      },
      {
        id: "cw5",
        name: "Line 5 · Blackmar-Diemer",
        plies: [
          "d4", "d5", "e4", "dxe4", "Nc3", "Nf6", "f3", "exf3", "Nxf3",
        ],
        side: "w",
      },
      {
        id: "cw6",
        name: "Line 6 · Advance vs Caro",
        plies: [
          "e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5",
        ],
        side: "w",
      },
      {
        id: "cw7",
        name: "Line 7 · English Four Knights",
        plies: [
          "c4", "e5", "Nc3", "Nf6", "g3", "d5", "cxd5", "Nxd5", "Bg2", "Nb6",
        ],
        side: "w",
      },
      {
        id: "cw8",
        name: "Line 8 · French Advance",
        plies: [
          "e4", "e6", "d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6", "a3",
        ],
        side: "w",
      },
      {
        id: "cw9",
        name: "Line 9 · Trompowsky",
        plies: ["d4", "Nf6", "Bg5", "Ne4", "Bf4", "c5", "f3", "Qa5+"],
        side: "w",
      },
      {
        id: "cw10",
        name: "Line 10 · Four Knights Scotch",
        plies: [
          "e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "d4", "exd4", "Nxd4",
        ],
        side: "w",
      },
    ],
  },
];

export const COMING: ComingSoon[] = [
  { name: "Classic Games", blurb: "Legendary master games as strict lines" },
  { name: "Longer Games", blurb: "Deep middlegame continuations" },
  { name: "Spot the Mate", blurb: "Mate patterns from set positions" },
];
