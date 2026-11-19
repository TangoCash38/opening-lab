/**
 * Fictional marketplace samples for the Creator Packs preview.
 * Not part of the Opening Lab catalog, and not for sale.
 */

export type CreatorHue = "accent" | "gold" | "success";

export type DemoCreator = {
  id: string;
  name: string;
  hue: CreatorHue;
  /** One line on the browse card. */
  bio: string;
  /** A short portrait on the pack page. */
  about: string;
};

export type DemoLine = {
  name: string;
  /** Present only on the free first line. Later lines stay hidden. */
  plies?: readonly string[];
};

export type DemoPack = {
  id: string;
  creatorId: string;
  name: string;
  price: string;
  blurb: string;
  lines: readonly DemoLine[];
};

export const DEMO_CREATORS: readonly DemoCreator[] = [
  {
    id: "demo-coach",
    name: "Demo Coach",
    hue: "accent",
    bio: "Club coach. Short lines for players who like a calm centre.",
    about:
      "Demo Coach is a fictional club teacher. The notes favour modest development, a closed centre, and one idea you can remember on the way home.",
  },
  {
    id: "demo-streamer",
    name: "Demo Streamer",
    hue: "gold",
    bio: "An invented evening channel. Tidy lines, and no theatrics.",
    about:
      "Demo Streamer does not exist. The pack is a sample of how a chess channel might publish ten lines under its own name.",
  },
  {
    id: "demo-author",
    name: "Demo Author",
    hue: "success",
    bio: "Repertoire notes for players who prefer one structure.",
    about:
      "Demo Author is a sample byline. The lines stay inside a single Caro structure, so the pack reads as one idea rather than a pile of separate tricks.",
  },
] as const;

export const DEMO_PACKS: readonly DemoPack[] = [
  {
    id: "quiet-centre",
    creatorId: "demo-coach",
    name: "The Quiet Centre",
    price: "£2.50",
    blurb:
      "A calm Italian centre, written as 10 lines for club players who want one plan and no clutter.",
    lines: [
      {
        name: "The modest centre",
        plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d3", "d6"],
      },
      { name: "Bishop before the knight" },
      { name: "The quiet d3" },
      { name: "Meeting an early knight on f6" },
      { name: "The solid d6" },
      { name: "When the centre stays closed" },
      { name: "A knight on e7" },
      { name: "Castling short" },
      { name: "The c3 break" },
      { name: "A patient queen move" },
    ],
  },
  {
    id: "evening-italian",
    creatorId: "demo-streamer",
    name: "The Evening Italian",
    price: "£3.00",
    blurb:
      "Ten lines from an invented evening stream: the same Italian setup, and a clear reply for each guest move.",
    lines: [
      {
        name: "Both knights out",
        plies: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "d3", "Be7"],
      },
      { name: "The early bishop on c5" },
      { name: "A pawn on d6" },
      { name: "Meeting the bishop on b4" },
      { name: "Castling before the centre opens" },
      { name: "A knight lands on d4" },
      { name: "The c3 pawn" },
      { name: "Queen to e2" },
      { name: "The a4 idea" },
      { name: "A calm end to the opening" },
    ],
  },
  {
    id: "compact-caro",
    creatorId: "demo-author",
    name: "A Compact Caro",
    price: "£2.00",
    blurb:
      "One Caro structure and 10 lines, for players who would rather learn a single plan well.",
    lines: [
      {
        name: "The advanced pawn",
        plies: ["e4", "c6", "d4", "d5", "e5", "Bf5", "Nf3", "e6"],
      },
      { name: "The exchange" },
      { name: "A bishop on f5" },
      { name: "Meeting c5" },
      { name: "The knight on d7" },
      { name: "A pawn on h6" },
      { name: "Staying on the kingside" },
      { name: "The queen's knight" },
      { name: "A break with c5" },
      { name: "The quiet e6" },
    ],
  },
] as const;

export function demoCreator(id: string): DemoCreator | undefined {
  return DEMO_CREATORS.find((creator) => creator.id === id);
}

export function demoPack(id: string): DemoPack | undefined {
  return DEMO_PACKS.find((pack) => pack.id === id);
}

export function creatorForPack(pack: DemoPack): DemoCreator {
  const creator = demoCreator(pack.creatorId);
  if (!creator) throw new Error(`Missing sample creator for ${pack.id}`);
  return creator;
}

export function formatDemoPlies(plies: readonly string[]): string {
  const bits: string[] = [];
  for (let i = 0; i < plies.length; i++) {
    const san = plies[i]!;
    if (i % 2 === 0) bits.push(`${i / 2 + 1}.${san}`);
    else bits.push(san);
  }
  return bits.join(" ");
}

export function creatorInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
