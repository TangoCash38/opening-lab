/**
 * Square Memory levels. Fifty positions, ten in each level.
 * Piece counts include both kings: 3, 4, 5, 6, then 10.
 * Every diagram is a legal position you might meet in a game:
 * endgames in levels 1–3, then pared-down middlegame structures.
 * Castling and en passant are cleared so the diagram stands on the pieces.
 */

export type SquareMemoryLevel = 1 | 2 | 3 | 4 | 5;

export type SquareMemoryPosition = {
  id: string;
  level: SquareMemoryLevel;
  name: string;
  fen: string;
};

export const SQUARE_MEMORY_POSITIONS: readonly SquareMemoryPosition[] = [
  {
    id: "l1-opposition",
    level: 1,
    name: "King and pawn",
    fen: "8/8/4k3/4P3/4K3/8/8/8 w - - 0 1",
  },
  {
    id: "l1-rook-pawn",
    level: 1,
    name: "Rook pawn",
    fen: "1k6/8/PK6/8/8/8/8/8 w - - 0 1",
  },
  {
    id: "l1-rook-cut",
    level: 1,
    name: "Rook cutoff",
    fen: "8/5k2/8/R7/8/8/8/3K4 w - - 0 1",
  },
  {
    id: "l1-queen",
    level: 1,
    name: "King and queen",
    fen: "8/5k2/8/8/Q7/8/3K4/8 w - - 0 1",
  },
  {
    id: "l1-bishop",
    level: 1,
    name: "King and bishop",
    fen: "8/4k3/8/8/5B2/8/4K3/8 w - - 0 1",
  },
  {
    id: "l1-knight",
    level: 1,
    name: "King and knight",
    fen: "8/4k3/8/8/8/2N5/3K4/8 w - - 0 1",
  },
  {
    id: "l1-blockade",
    level: 1,
    name: "Blocked rook pawn",
    fen: "8/8/8/7k/7P/6K1/8/8 w - - 0 1",
  },
  {
    id: "l1-queen-edge",
    level: 1,
    name: "Queen on the edge",
    fen: "7k/8/1Q6/8/8/8/K7/8 w - - 0 1",
  },
  {
    id: "l1-central",
    level: 1,
    name: "Central pawn",
    fen: "8/8/2k5/8/3P4/3K4/8/8 w - - 0 1",
  },
  {
    id: "l1-seventh",
    level: 1,
    name: "Seventh rank",
    fen: "6k1/R7/8/8/8/8/8/6K1 w - - 0 1",
  },
  {
    id: "l2-saavedra",
    level: 2,
    name: "Saavedra",
    fen: "8/8/1KP5/3r4/8/8/8/k7 w - - 0 1",
  },
  {
    id: "l2-locked",
    level: 2,
    name: "Locked pawns",
    fen: "8/8/4k3/4p3/4P3/4K3/8/8 w - - 0 1",
  },
  {
    id: "l2-rook-pawn",
    level: 2,
    name: "Rook versus pawn",
    fen: "8/8/8/3p3R/3k4/8/5K2/8 w - - 0 1",
  },
  {
    id: "l2-wrong-bishop",
    level: 2,
    name: "Wrong bishop",
    fen: "7k/8/8/8/8/7B/7P/7K w - - 0 1",
  },
  {
    id: "l2-knight-pawn",
    level: 2,
    name: "Knight and pawn",
    fen: "8/4k3/8/8/4P3/3N4/4K3/8 w - - 0 1",
  },
  {
    id: "l2-bishops",
    level: 2,
    name: "Bishop versus bishop",
    fen: "8/3k4/4b3/8/8/3B4/3K4/8 w - - 0 1",
  },
  {
    id: "l2-rook-knight",
    level: 2,
    name: "Rook against knight",
    fen: "4k3/8/6n1/8/R7/8/8/4K3 w - - 0 1",
  },
  {
    id: "l2-queen-pawn",
    level: 2,
    name: "Queen versus pawn",
    fen: "6k1/6p1/6K1/8/8/8/8/6Q1 w - - 0 1",
  },
  {
    id: "l2-race",
    level: 2,
    name: "Pawn race",
    fen: "8/8/8/4k2p/P7/8/2K5/8 w - - 0 1",
  },
  {
    id: "l2-connected",
    level: 2,
    name: "Connected pawns",
    fen: "8/8/3k4/8/2PP4/3K4/8/8 w - - 0 1",
  },
  {
    id: "l3-lucena",
    level: 3,
    name: "Lucena",
    fen: "1K6/1P6/3k4/8/8/8/r7/2R5 w - - 0 1",
  },
  {
    id: "l3-philidor",
    level: 3,
    name: "Philidor",
    fen: "8/8/r3k3/8/4PK2/8/8/4R3 w - - 0 1",
  },
  {
    id: "l3-vancura",
    level: 3,
    name: "Vancura",
    fen: "6k1/6r1/8/8/8/6P1/6K1/6R1 w - - 0 1",
  },
  {
    id: "l3-majority",
    level: 3,
    name: "Two pawns versus one",
    fen: "8/8/3k4/2p5/2PP4/3K4/8/8 w - - 0 1",
  },
  {
    id: "l3-bishop-pawns",
    level: 3,
    name: "Bishop and pawns",
    fen: "8/8/5k2/5p2/5P2/5B2/5K2/8 w - - 0 1",
  },
  {
    id: "l3-knight-pawns",
    level: 3,
    name: "Knight and pawns",
    fen: "8/8/4k3/4p3/4P3/4N3/4K3/8 w - - 0 1",
  },
  {
    id: "l3-heavy",
    level: 3,
    name: "Queen and rook",
    fen: "6k1/6p1/6Q1/8/8/8/5K2/6R1 w - - 0 1",
  },
  {
    id: "l3-minor",
    level: 3,
    name: "Bishop and knight",
    fen: "8/8/5k2/8/4p3/4BN2/4K3/8 w - - 0 1",
  },
  {
    id: "l3-rook-knight",
    level: 3,
    name: "Knight defends",
    fen: "8/5k2/3n4/5p2/5R2/8/5K2/8 w - - 0 1",
  },
  {
    id: "l3-passed",
    level: 3,
    name: "Protected passed pawn",
    fen: "8/2k5/2p5/2P1P3/3K4/8/8/8 w - - 0 1",
  },
  {
    id: "l4-rooks",
    level: 4,
    name: "Rook ending",
    fen: "5r2/5k2/5p2/8/4P3/8/5K2/4R3 w - - 0 1",
  },
  {
    id: "l4-bishops",
    level: 4,
    name: "Bishops and pawns",
    fen: "8/5k2/4pb2/4P3/4B3/8/5K2/8 w - - 0 1",
  },
  {
    id: "l4-minors",
    level: 4,
    name: "Minor pieces",
    fen: "8/5k2/5p2/5n2/5P2/5B2/5K2/8 w - - 0 1",
  },
  {
    id: "l4-pawns",
    level: 4,
    name: "Two versus two",
    fen: "8/8/2k1p3/2p5/2P1P3/2K5/8/8 w - - 0 1",
  },
  {
    id: "l4-qg",
    level: 4,
    name: "Queen's Gambit center",
    fen: "4k3/8/8/3p4/3P4/2N1P3/8/2K5 w - - 0 1",
  },
  {
    id: "l4-sicilian",
    level: 4,
    name: "Sicilian center",
    fen: "4k3/8/3p4/2p5/4P3/5N2/8/4K3 w - - 0 1",
  },
  {
    id: "l4-queen",
    level: 4,
    name: "Queen versus rook",
    fen: "4k3/4p3/8/4p3/4Q3/8/4K3/r7 w - - 0 1",
  },
  {
    id: "l4-kingside",
    level: 4,
    name: "Kingside pawns",
    fen: "6k1/5pp1/8/8/8/5PP1/6K1/8 w - - 0 1",
  },
  {
    id: "l4-iqp",
    level: 4,
    name: "Isolated pawn",
    fen: "4k3/3r4/3p4/8/3P4/8/4K3/3R4 w - - 0 1",
  },
  {
    id: "l4-french",
    level: 4,
    name: "French center",
    fen: "4k3/4p3/3p4/3P4/4P3/8/4K3/8 w - - 0 1",
  },
  {
    id: "l5-sicilian",
    level: 5,
    name: "Sicilian structure",
    fen: "6k1/6p1/2np4/2p5/3PP3/5N2/6P1/6K1 w - - 0 1",
  },
  {
    id: "l5-carlsbad",
    level: 5,
    name: "Carlsbad structure",
    fen: "6k1/8/2p1p3/3p4/3P4/2P1PN2/6P1/6K1 w - - 0 1",
  },
  {
    id: "l5-rooks",
    level: 5,
    name: "Open file",
    fen: "4r1k1/5pp1/8/3p4/3P4/6P1/5PK1/4R3 w - - 0 1",
  },
  {
    id: "l5-fianchetto",
    level: 5,
    name: "Fianchetto bishops",
    fen: "6k1/5pb1/6p1/3p4/3P4/6P1/5PB1/6K1 w - - 0 1",
  },
  {
    id: "l5-iqp",
    level: 5,
    name: "Isolated queen pawn",
    fen: "2r3k1/5pp1/3p4/8/3P4/5N2/5P2/2R2K2 w - - 0 1",
  },
  {
    id: "l5-queenside",
    level: 5,
    name: "Queenside pawns",
    fen: "5rk1/5p2/8/2p5/1pP5/1P6/5PK1/1R6 w - - 0 1",
  },
  {
    id: "l5-knights",
    level: 5,
    name: "Knight center",
    fen: "6k1/6pp/3n4/3p4/3P4/3N4/6PP/6K1 w - - 0 1",
  },
  {
    id: "l5-closed",
    level: 5,
    name: "Closed center",
    fen: "6k1/4bpp1/3p4/3P4/4P3/5B2/5P2/6K1 w - - 0 1",
  },
  {
    id: "l5-open",
    level: 5,
    name: "Simplified middlegame",
    fen: "r5k1/5pp1/2n5/8/8/2N5/5PP1/R5K1 w - - 0 1",
  },
  {
    id: "l5-queens",
    level: 5,
    name: "Queen ending",
    fen: "6k1/5pp1/3q4/3p4/3P4/3Q4/5PP1/6K1 w - - 0 1",
  },
];
