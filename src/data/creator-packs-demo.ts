/**
 * Fictional marketplace samples for the Creator Packs preview.
 * Not part of the Opening Lab catalog, and not for sale.
 */

export type CreatorHue = "accent" | "gold" | "success";
export type StudyMode = "drill" | "walk";

export type DemoCreator = {
  id: string;
  name: string;
  hue: CreatorHue;
  bio: string;
  about: string;
};

export type DemoLine = {
  name: string;
  mode: StudyMode;
  plies?: readonly string[];
  /** Optional note for each ply, aligned with `plies`. */
  comments?: readonly string[];
  /** When set, the line starts here instead of the opening array. */
  fen?: string;
};

export type DemoPack = {
  id: string;
  creatorId: string;
  name: string;
  price: string;
  /** Short label on the card. Packs of lines say "10 lines". */
  badge: string;
  blurb: string;
  lines: readonly DemoLine[];
};

export type DemoReview = {
  id: string;
  packId: string;
  author: string;
  stars: number;
  text: string;
};

export const DEMO_CREATORS: readonly DemoCreator[] = [
  {
    id: "demo-coach",
    name: "Demo Coach",
    hue: "accent",
    bio: "Club coach. Short lines, and a puzzle, for a calm centre.",
    about:
      "Demo Coach is a fictional club teacher. The notes favour modest development, a closed centre, and one idea you can remember on the way home.",
  },
  {
    id: "demo-streamer",
    name: "Demo Streamer",
    hue: "gold",
    bio: "An invented evening channel. Tidy lines, and no theatrics.",
    about:
      "Demo Streamer does not exist. The pack is a sample of how a chess channel might publish a drill under its own name.",
  },
  {
    id: "demo-author",
    name: "Demo Author",
    hue: "success",
    bio: "Repertoire notes for players who prefer one structure.",
    about:
      "Demo Author is a sample byline. The lines stay inside a single Caro structure, so the pack reads as one idea.",
  },
  {
    id: "demo-creator",
    name: "Demo Creator",
    hue: "gold",
    bio: "A fictional player. One made-up game, split into three moments.",
    about:
      "Demo Creator is not a real person. The pack follows a single invented game against Smith. Each line starts from its own position, with the moves played out and a comment on every move.",
  },
] as const;

const quietComments = [
  "The king's pawn steps out. Nothing sharp yet. You are choosing a calm centre.",
  "Black answers in the centre. The position stays open and even.",
  "The knight develops and watches e5.",
  "Black's knight comes to c6, defending e5.",
  "The bishop takes the Italian diagonal, looking toward f7.",
  "Black mirrors. Both bishops have a long view.",
  "c3 prepares a later d4, without opening the game at once.",
  "The king's knight develops. Black is ready to castle.",
  "d3 keeps the centre closed. This is the character of the pack.",
  "d6 matches you. A solid shell, and a plan you can remember.",
] as const;

const eveningComments = [
  "Open the king's pawn. In a drill you play this yourself.",
  "Black meets you. In Drill that reply is played for you.",
  "Develop the knight before you touch the bishop.",
  "Black's knight comes out to c6.",
  "The bishop goes to c4, the Italian square.",
  "Black develops the king's knight.",
  "d3 keeps the centre modest.",
  "The dark bishop steps to e7, ready to castle.",
] as const;

export const DEMO_PACKS: readonly DemoPack[] = [
  {
    id: "quiet-centre",
    creatorId: "demo-coach",
    name: "The Quiet Centre",
    price: "£2.50",
    badge: "10 lines",
    blurb:
      "A calm Italian centre, walked through with a comment on every move. Ten lines for players who want one plan and no clutter.",
    lines: [
      {
        name: "The modest centre",
        mode: "walk",
        plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6"],
        comments: quietComments,
      },
      { name: "Bishop before the knight", mode: "walk" },
      { name: "The quiet d3", mode: "walk" },
      { name: "Meeting an early knight on f6", mode: "walk" },
      { name: "The solid d6", mode: "walk" },
      { name: "When the centre stays closed", mode: "walk" },
      { name: "A knight on e7", mode: "walk" },
      { name: "Castling short", mode: "walk" },
      { name: "The c3 break", mode: "walk" },
      { name: "A patient queen move", mode: "walk" },
    ],
  },
  {
    id: "f7-glance",
    creatorId: "demo-coach",
    name: "The f7 Glance",
    price: "£1.50",
    badge: "Puzzle",
    blurb:
      "A puzzle from the same fictional coach. It starts in the middlegame, with the queen and bishop already looking at f7.",
    lines: [
      {
        name: "The glance at f7",
        mode: "drill",
        fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
        plies: ["Qxf7"],
        comments: ["The queen takes on f7. That glance was the whole idea."],
      },
    ],
  },
  {
    id: "evening-italian",
    creatorId: "demo-streamer",
    name: "The Evening Italian",
    price: "£3.00",
    badge: "10 lines",
    blurb:
      "Ten lines from an invented evening stream, set as a Drill: Practice with a hint, then Test with none.",
    lines: [
      {
        name: "Both knights out",
        mode: "drill",
        plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Be7"],
        comments: eveningComments,
      },
      { name: "The early bishop on c5", mode: "drill" },
      { name: "A pawn on d6", mode: "drill" },
      { name: "Meeting the bishop on b4", mode: "drill" },
      { name: "Castling before the centre opens", mode: "drill" },
      { name: "A knight lands on d4", mode: "drill" },
      { name: "The c3 pawn", mode: "drill" },
      { name: "Queen to e2", mode: "drill" },
      { name: "The a4 idea", mode: "drill" },
      { name: "A calm end to the opening", mode: "drill" },
    ],
  },
  {
    id: "compact-caro",
    creatorId: "demo-author",
    name: "A Compact Caro",
    price: "£2.00",
    badge: "10 lines",
    blurb: "One Caro structure and 10 lines, walked through at the player's own pace.",
    lines: [
      {
        name: "The advanced pawn",
        mode: "walk",
        plies: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6"],
        comments: [
          "The king's pawn invites a Caro.",
          "c6 prepares d5.",
          "White takes the centre.",
          "Black strikes back with d5.",
          "e5 gains space and sets the structure.",
          "The light bishop comes outside the pawn chain.",
          "The knight develops toward the centre.",
          "e6 closes the light bishop's old diagonal and solidifies.",
        ],
      },
      { name: "The exchange", mode: "walk" },
      { name: "A bishop on f5", mode: "walk" },
      { name: "Meeting c5", mode: "walk" },
      { name: "The knight on d7", mode: "walk" },
      { name: "A pawn on h6", mode: "walk" },
      { name: "Staying on the kingside", mode: "walk" },
      { name: "The queen's knight", mode: "walk" },
      { name: "A break with c5", mode: "walk" },
      { name: "The quiet e6", mode: "walk" },
    ],
  },
  {
    id: "game-vs-smith",
    creatorId: "demo-creator",
    name: "My game vs Smith",
    price: "£2.00",
    badge: "3 lines",
    blurb:
      "Three moments from a made-up game. Each line starts from its own position, with the moves played out and a comment on every one.",
    lines: [
      {
        name: "The knight hops to f5",
        mode: "walk",
        fen: "r4rk1/bppq1pp1/p1npbn1p/4p3/4P3/1BPP1NN1/PP3PPP/R1BQR1K1 w - - 2 12",
        plies: ["Nh4", "Rad8", "Nhf5", "Bxf5", "exf5"],
        comments: [
          "The knight steps toward f5. This moment is already a middlegame, long after the opening moves.",
          "Black brings a rook to d8, behind the queen.",
          "The knight lands on f5. That square was the point of the little manoeuvre.",
          "Black's light bishop takes the knight.",
          "The pawn recaptures on f5. White has opened a path for the rook on e1.",
        ],
      },
      {
        name: "The dark bishops leave",
        mode: "walk",
        fen: "3r1rk1/bppq1pp1/p1np1n1p/4pP2/8/1BPP2N1/PP3PPP/R1BQR1K1 b - - 0 14",
        plies: ["Ne7", "Be3", "Bxe3", "Rxe3", "d5"],
        comments: [
          "The knight on c6 steps to e7, making room and watching the centre.",
          "White offers a trade of the dark bishops.",
          "Black accepts. The bishop on a7 leaves the long diagonal.",
          "The rook recaptures on e3 and stays on the half-open e-file.",
          "d5 challenges the centre. The position has a new shape.",
        ],
      },
      {
        name: "The centre opens",
        mode: "walk",
        fen: "3rr1k1/1ppqnpp1/p4n1p/3ppP2/2P5/1B1PR1N1/PP2QPPP/R5K1 b - - 0 18",
        plies: ["dxc4", "dxc4", "Qe6", "Qd3", "Nfd5"],
        comments: [
          "Black takes on c4 and opens the centre.",
          "White recaptures. The d-file is now open.",
          "The queen steps to e6, opposite White's queen.",
          "White's queen moves to d3, off the e-file and onto a useful square.",
          "The knight from f6 arrives on d5, in the middle of the new centre.",
        ],
      },
    ],
  },
] as const;

export const DEMO_REVIEWS: readonly DemoReview[] = [
  {
    id: "review-quiet-1",
    packId: "quiet-centre",
    author: "Sample Student",
    stars: 5,
    text: "The comments made the closed centre feel obvious. I could say the idea back after one evening.",
  },
  {
    id: "review-quiet-2",
    packId: "quiet-centre",
    author: "Demo Clubmate",
    stars: 4,
    text: "Short enough to finish, and the walk-through let me linger on d3. I would have liked one extra line.",
  },
  {
    id: "review-glance-1",
    packId: "f7-glance",
    author: "Fictional Viewer",
    stars: 5,
    text: "A tiny puzzle with a clear point. The bishop's glance at f7 is the whole lesson, and that is enough.",
  },
  {
    id: "review-evening-1",
    packId: "evening-italian",
    author: "Sample Evening Player",
    stars: 5,
    text: "Practice with the hint, then Test with none. It feels like the Opening Lab drills I already know.",
  },
  {
    id: "review-evening-2",
    packId: "evening-italian",
    author: "Demo Viewer",
    stars: 4,
    text: "The comments on the white moves are the useful part. I remembered Bc4 the next day.",
  },
  {
    id: "review-caro-1",
    packId: "compact-caro",
    author: "Sample Reader",
    stars: 5,
    text: "One structure, ten lines, and a comment when I wanted one. Calm and easy to trust.",
  },
  {
    id: "review-caro-2",
    packId: "compact-caro",
    author: "Fictional Student",
    stars: 3,
    text: "Clear notes. I wanted the walk-through to linger a little longer on the bishop outside the chain.",
  },
  {
    id: "review-smith-1",
    packId: "game-vs-smith",
    author: "Sample Sparring Partner",
    stars: 5,
    text: "Three moments, and each one started where the idea begins. I did not have to click through the opening first.",
  },
  {
    id: "review-smith-2",
    packId: "game-vs-smith",
    author: "Fictional Friend",
    stars: 4,
    text: "The comment sits on the move. The knight landing on f5 finally made sense.",
  },
] as const;

export function demoCreator(id: string): DemoCreator | undefined {
  return DEMO_CREATORS.find((creator) => creator.id === id);
}

export function demoPack(id: string): DemoPack | undefined {
  return DEMO_PACKS.find((pack) => pack.id === id);
}

export function packsForCreator(creatorId: string): DemoPack[] {
  return DEMO_PACKS.filter((pack) => pack.creatorId === creatorId);
}

export function creatorForPack(pack: DemoPack): DemoCreator {
  const creator = demoCreator(pack.creatorId);
  if (!creator) throw new Error(`Missing sample creator for ${pack.id}`);
  return creator;
}

export function reviewsForPack(packId: string): DemoReview[] {
  return DEMO_REVIEWS.filter((review) => review.packId === packId);
}

export function reviewsForCreator(creatorId: string): DemoReview[] {
  const ids = new Set(packsForCreator(creatorId).map((pack) => pack.id));
  return DEMO_REVIEWS.filter((review) => ids.has(review.packId));
}

export function averageStars(reviews: readonly { stars: number }[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((total, review) => total + review.stars, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function formatStars(value: number): string {
  return value.toFixed(1);
}

export function formatDemoPlies(plies: readonly string[], fen?: string): string {
  return plies.map((san, index) => plyLabel(index, san, fen)).join(" ");
}

/** Move label from the start of a line. A FEN supplies the real move number. */
export function plyLabel(index: number, san: string, fen?: string): string {
  const parts = fen?.trim().split(/\s+/) ?? [];
  const side = parts[1] === "b" ? "b" : "w";
  const parsedMove = Number(parts[5]);
  const fullMove = Number.isFinite(parsedMove) && parsedMove > 0 ? parsedMove : 1;
  const offset = (fullMove - 1) * 2 + (side === "b" ? 1 : 0);
  const absolute = offset + index;
  const moveNo = Math.floor(absolute / 2) + 1;
  return absolute % 2 === 0 ? `${moveNo}.${san}` : `${moveNo}...${san}`;
}

export function modeLabel(mode: StudyMode): string {
  return mode === "drill" ? "Drill" : "Walk-through";
}

export function creatorInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
