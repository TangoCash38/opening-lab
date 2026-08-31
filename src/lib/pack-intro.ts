/** Shared gym pitch — first card of the pack intro. Not opening-specific. */
export const GAME_INTRO_TITLE = "How the gym works";

export const GAME_INTRO =
  "Opening Lab is a strict book-move trainer. Practice with the yellow hint. Test with none. Only the book move counts. Then Play on from the setup if you want.\n\nThis way of learning builds a working repertoire of the opening: the main book replies, not a fog of ideas. Finding those moves without the hint makes your early decisions more informed. It is a solid ground to take your study further — books, games, engines — not a shortcut to having the whole opening down.";

const GYM_SNIPPETS = [
  "Practice the main book moves with the yellow hint",
  "Then Test with none",
  "Play on from the setup",
];

/** Fuller opening cards. Defence packs describe the attack, then how to meet it. */
export const PACK_OPENING: Readonly<Record<string, readonly string[]>> = {
  "caro-kann-black": [
    "The Caro-Kann is Black's answer to 1.e4. After 1…c6 and 2…d5 you take a pawn centre, get the light-squared bishop out before …e6, and keep a solid pawn structure. White can go Advance (3.e5), Classical (Nc3), Exchange, Panov, Fantasy, or Two Knights.",
    "This pack is how you play the Caro as Black. You train the main book replies to those tries, then Play on from the setup.",
    "Free sample: Advance, Classical, Exchange. Other Caro lines are in the full pack.",
  ],
  "qgd-black": [
    "The Queen's Gambit is 1.d4 d5 2.c4. White offers a wing pawn to trade for the centre. Declining with 2…e6 keeps a solid pawn chain instead of taking on c4. White can Exchange on d5, pin with Bg5, develop Bf4, or fianchetto in the Catalan.",
    "This pack is how you play the Queen's Gambit Declined as Black. You hold the centre, develop, then challenge it with the book breaks (…c5, …c6, …Ne4) rather than mixing plans.",
  ],
  "london-black": [
    "The London System is White's quiet 1.d4 setup: Nf3, Bf4, e3, and often c3. The dark-squared bishop comes out early, the centre stays solid, and the same moves work against almost anything. The Jobava London adds Nc3 and looks for Nb5 or e4.",
    "This pack is how you play against the London as Black. You hit the centre with …c5, pressure b2 with …Qb6, and trade that Bf4 bishop when you can.",
  ],
  "d4-sidelines-black": [
    "After 1.d4, not every White player goes Queen's Gambit. The Colle and Torre keep a London-like shell. The Trompowsky (Bg5) and Veresov (Nc3 and Bg5) pin or trade the f6 knight. The Blackmar-Diemer offers a pawn for a quick attack.",
    "This pack is how you play against those sidelines as Black. You challenge the centre, complete development, and meet each try with its own book reply instead of one mixed plan.",
  ],
  "anti-sicilian-black": [
    "The Open Sicilian is 1.e4 c5 2.Nf3 and 3.d4. An anti-Sicilian is White skipping that open centre: Alapin (2.c3), Grand Prix (f4), Closed (Nc3 and g3), Smith-Morra (d4 then c3), Rossolimo (Bb5), or the Wing Gambit (b4).",
    "This pack is how you play against those as Black. You take a centre when it is offered, develop, and do not panic when White gambits a pawn.",
  ],
  "nimzo-larsen-white": [
    "The Nimzo-Larsen Attack is 1.b3. White fianchettoes the queen's bishop and pressures the centre from the flank, instead of occupying it with a pawn on move one.",
    "This pack is how you play it as White. You meet …e5, …d5, …c5, and the kingside fianchetto with the same idea: Bb2, a later c4 or e3, and a solid centre of your own.",
  ],
  "italian-white": [
    "The Italian Game is 1.e4 e5 2.Nf3 Nc6 3.Bc4. White eyes f7, develops quickly, and can keep it quiet with d3 or open the centre with d4. The Two Knights, Evans Gambit, and Hungarian all sit in this family.",
    "This pack is how you play the Italian as White. You train the quiet Giuoco Piano shell, the open d4 lines, the Evans, and the replies to …Nf6 and …Be7.",
  ],
  "ruy-white": [
    "The Ruy Lopez is 1.e4 e5 2.Nf3 Nc6 3.Bb5. White pressures e5 by pinning the knight, then builds a Spanish centre with c3 and d4. Black can go Closed, Berlin, Open, Exchange, Marshall, or Schliemann.",
    "This pack is how you play the Ruy as White. You learn the Closed Spanish shell and the book answers to those Black choices, including when to step aside of the Marshall.",
  ],
  "french-white": [
    "The French Defence is 1.e4 e6 2.d4 d5. Black challenges the e-pawn at once and accepts a cramped light-squared bishop in return for a solid centre and a later …c5 break.",
    "This pack is how you play against the French as White. Advance (e5), Tarrasch (Nd2), Classical (Nc3), Winawer (…Bb4), and Exchange — each with its own book plan, not a mix of all five.",
  ],
  "alapin-white": [
    "The Sicilian is 1.e4 c5. The Alapin is White's 2.c3: prepare d4 and a classical pawn centre instead of the Open Sicilian's piece play.",
    "This pack is how you meet the Sicilian as White with the Alapin. You play d4 against …Nc6, …d5, …Nf6, …e6, …d6, and …g6, and you do not let Black's extra tempo panic you.",
  ],
  "english-black": [
    "The English Opening is 1.c4. White controls d5 from the flank. The Symmetrical English is Black answering 1…c5, mirroring the c-pawn and choosing a Four Knights, Botvinnik, Hedgehog, or reversed-Sicilian centre.",
    "This pack is how you play against 1.c4 as Black. You keep the symmetry until the right break (…d5, …b5, or …e6), then follow the book plan for that structure.",
  ],
  "kg-black": [
    "The King's Gambit is 1.e4 e5 2.f4. White offers a pawn to open the f-file and take the centre. Accepted, it can get sharp (Knight's Gambit with Nf3, Bishop's Gambit with Bc4). Declined, or the Falkbeer with …d5, fights for the centre instead.",
    "This pack is how you play against the King's Gambit as Black. You recapture with development, use Fischer's …d6 when it fits, and do not grab pawns that hang the king.",
  ],
  "scandinavian-white": [
    "The Scandinavian is 1.e4 d5. Black hits the e-pawn at once. After 2.exd5 the queen often comes out (…Qa5, …Qd6, or …Qd8), or Black recaptures with a knight (…Nf6). The Portuguese and Icelandic are the sharper cousins.",
    "This pack is how you meet it as White. You take the tempo on the queen, develop, and keep a useful centre instead of chasing the queen around the board.",
  ],
  "pirc-150-white": [
    "The Pirc is 1.e4 d6 2.d4 Nf6 3.Nc3 g6. The Modern is the same idea without an early …Nf6. Black fianchettoes and lets White take the centre, then chips away at it.",
    "The 150 Attack is White's Be3, Qd2, and a supported pawn centre — a club system that works against both. This pack is how you play it as White: build the shell, meet …c6, …a6, …Ng4, and …e5, and only castle long when the queenside is ready.",
  ],
  "dutch-fianchetto-white": [
    "The Dutch Defence is 1.d4 f5. Black fights for e4 and kingside play, at the cost of king safety. The main shapes are Classical (…e6), Stonewall (…e6 and …d5), and Leningrad (…g6).",
    "This pack is how you meet the Dutch as White with the fianchetto: g3, Bg2, and often c4. You castle, restrain …e5, and do not get dragged into a wild kingside race.",
  ],
  "caro-advance-panov-white": [
    "The Caro-Kann is 1.e4 c6 2.d4 d5. Black wants a solid centre and an easy light-squared bishop. Two of White's most ambitious answers are the Advance (3.e5) and the Panov (3.exd5 cxd5 4.c4).",
    "This pack is how you play against the Caro as White in those two systems. Advance takes space and meets …Bf5 and …c5; the Panov opens the centre and plays against an isolated queen pawn or hanging pawns.",
  ],
  "evans-black": [
    "The Evans Gambit is an Italian with 4.b4. White offers a pawn to drag the c5 bishop off the a7–g1 diagonal, then hits the centre with c3 and d4 and looks at f7.",
    "This pack is how you play against it as Black. You can accept and retreat (…Ba5 or …Be7) or decline with …Bb6. In every case you develop, watch f7, and do not get greedy on extra pawns.",
  ],
  "englund-white": [
    "The Englund Gambit is 1.d4 e5. Black offers a pawn on move one to pull White's queen or pieces into a raid. Accepted, 2.dxe5, Black often tries …Nc6 and …Qe7, …Qc5, or …d6.",
    "This pack is how you meet it as White. Take on e5, develop, and do not let the queen raid dictate the game. Return a pawn if you must; keep the extra one if it is safe.",
  ],
  "budapest-white": [
    "The Budapest Gambit is 1.d4 Nf6 2.c4 e5. Black offers a pawn to open lines and jump a knight into e4 or g4. The main recapture is 3.dxe5 Ng4; the Fajarowicz is 3…Ne4 instead.",
    "This pack is how you meet it as White. The Alekhine lines (4.Bf4, 4.e3, 4.Nf3) and the Qd5 main line keep the extra pawn or give it back for development. Do not fall for the cheap queen traps.",
  ],
  "bdg-black": [
    "The Blackmar-Diemer Gambit is 1.d4 d5 2.e4 dxe4 3.Nc3 Nf6 4.f3. White offers a pawn to open the f-file and castle long into an attack. Club players like it because the plans look obvious.",
    "This pack is how you play against it as Black. Gunderam (…Bf5), Teichmann (…Bg4), Euwe (…e6), and Bogoljubow (…g6) are the book ways to take the pawn and complete development without walking into the attack.",
  ],
};

/** Kept so older tests and callers still resolve. Extra lines now live in PACK_OPENING. */
export const PACK_OPENING_EXTRA: Readonly<Record<string, string>> = {};

function isGymCopy(text: string): boolean {
  return GYM_SNIPPETS.some((s) => text.includes(s));
}

/** Opening-card paragraphs: authored PACK_OPENING, else first non-gym `about` para. */
export function openingParagraphs(about: string, packId?: string): string[] {
  if (packId && PACK_OPENING[packId]) {
    return [...PACK_OPENING[packId]];
  }
  const paras = about
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !isGymCopy(p));
  const extra = packId ? PACK_OPENING_EXTRA[packId] : undefined;
  if (extra && !paras.some((p) => p.includes(extra.slice(0, 24)))) {
    paras.push(extra);
  }
  return paras;
}

const seen = new Set<string>();

export function hasSeenPackIntro(packId: string): boolean {
  return seen.has(packId);
}

export function markPackIntroSeen(packId: string): void {
  seen.add(packId);
}
