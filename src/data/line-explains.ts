import type { OpeningLine } from "@/data/packs";

/**
 * Short end-of-line notes, keyed by `${packId}:${lineId}`.
 * A line with no entry, and no `explain` of its own, shows no card.
 * Add lines 2 to 10 by putting another string in this map, or set `explain`.
 */
export const LINE_EXPLAINS: Readonly<Record<string, string>> = {
  "scotch:sg1":
    "This is the Scotch Gambit you want: 5.c3, trade the dark-squared bishops, and win the pawn back with exd5. Both kings have castled and the chances are about level, with your knight still on d2 and Black's knight on d5. Next, bring that d2 knight to b3 or e4 and use the half-open e-file. You are not a pawn down. The gambit has done its job.",
  "london:lon1":
    "Both kings are castled, your knight is on e5, and f4 is already in, with the dark-squared bishop on g3 facing the bishop on d6. The position is about equal, and that knight is the piece this London is built around. Next, keep the knight supported. Do not throw more pawns at the king just to make something happen.",
  "sicilian-black:sib1":
    "White has castled queenside and you have castled kingside, so ...b5 is the start of your play against that king. White keeps a small edge, which is normal in this attack while your queenside pawns are still rolling. Your pieces are already on e6, e7, d7 and f6. Next, keep expanding on the queenside, and do not start a pawn storm in front of your own king.",
  "french-black:frb1":
    "You traded the dark-squared bishop for the knight, played ...c4 and ...f6, and castled long. White's c-pawns are doubled and the position is about level. The pawn on f6 already attacks the pawn on e5. Next, sort out that tension before you start a new plan.",
  "caro-kann-black:ckb1":
    "The Caro has done its job: the light-squared bishops are off and your knight stands on f5, pressing d4. The position is about equal. Your king is still on e8. Next, castle, then decide whether to keep the knight on f5 or turn your attention to d4.",
  "qgd-black:qgdb1":
    "You met the Queen's Gambit with ...e6, ...Be7 and ...c6, and the rook on e8 is ready for the centre. White keeps a small edge, which is normal while the c4 and d5 pawns are still staring at each other. Your light-squared bishop is still on c8. Next, develop that bishop, and take on c4 only when the capture does a clear job.",
  "london-black:alb1":
    "You have traded both pairs of bishops against the London, leaving White with doubled g-pawns. The position is about equal and both kings are castled. Next, bring the knight from d7 into the centre and play there. The doubled pawns can wait.",
  "d4-sidelines-black:d4s1":
    "You met the Colle with ...c5 and ...Nc6, hitting d4 before White is fully out. The position is about equal, and several pieces on both sides are still at home. Next, develop the dark-squared bishop and castle before you take on d4.",
  "anti-sicilian-black:as1":
    "You met the Alapin with ...d5, and the queen recaptured on d5. White has a small edge, which is normal while both kings are still in the centre. Next, develop the dark-squared bishop and castle before you look for more.",
  "nimzo-larsen-white:nl1":
    "Black closed the centre with ...e4, and you answered with the bishop on b5, the knight on g3, and d5. That space gives you a small edge. The knight on b1 is still at home, with the bishop on b2 waiting behind the centre. Next, develop that knight, and do not rush c4.",
  "italian-white:it1":
    "Both kings are castled in a quiet Italian, and the position is about equal. Black's knight has come to g6, your rook is on e1, and the other knight sits on d2. Next, prepare d4 only when those pieces can support it. There is no need to force the centre open on the next move.",
  "ruy-lopez-white:rlw1":
    "This is the closed Spanish: the knight has arrived on f1, both kings are castled, and you have a small edge. From f1 that knight usually wants e3 or g3. Next, choose one of those and keep the centre under control with the bishop on c2.",
  "french-white:fr1":
    "Black has just taken on d4 and is a pawn up, with doubled d-pawns, but the position is about level. Your space is the pawn on e5, the bishop is on d3, and the black queen sits on b6. Next, recapture on d4 and castle. The extra pawn is not a win for Black while that centre stands.",
  "alapin-white:al1":
    "You have an isolated d-pawn and Black's queen sits on d5, with the chances about level. Both kings are still uncastled, and the knight on f3 does not attack that queen. Next, develop the bishops and castle. Keep pieces active so the d-pawn stays a strength, not a dead target.",
  "english-black:en1":
    "Both sides have fianchettoed and castled in a mirror English, and the position is about equal. The plans are still not the same just because the pieces look alike. Next, pick one pawn break and finish it. Do not mix a central push with a queenside one.",
  "kg-black:kg1":
    "You met the gambit with ...d5 and took back on c6 with the knight, so you have a small edge. The doubled f-pawns are the price of that activity, and the king is still on e8. Next, develop the bishops and castle. Live with the doubled pawns. They are not a mistake you have to fix at once.",
  "scandinavian-white:sc1":
    "Nc3 has gained time on the queen, which now sits on a5, and you have a small edge. The centre pawn is on d4 and Black has played ...c6. Both kings are uncastled. Next, develop the bishops and castle, and do not spend the next few moves only chasing the queen.",
  "pirc-150-white:pm1":
    "Be3 and Qd2 are in, Black has castled, and you have a clear edge in this attack. Your king is still on e1 and the knight on g1 has not moved. Next, choose a home for your king before you start pushing pawns at g8. The setup is the idea. Finish it first.",
  "dutch-fianchetto-white:du1":
    "The bishop is on g2, c4 has taken space, and Black has castled. You have a small edge, and your king is still on e1. Next, castle, then choose a central break. Do not attack Black's king before your own king is safe.",
  "caro-advance-panov-white:ckw1":
    "You have space with the pawn on e5, and you have castled. The position is about level. Black's bishop is on f5 and ...c5 has already hit d4. Next, support d4 and bring out the queenside pieces.",
  "evans-black:evb1":
    "You took the Evans pawn and dropped the bishop back to a5, so you are a pawn up with level chances. White's extra time is real compensation, which is why the pawn is not a free win yet. Your king is still on e8. Next, develop the kingside and castle, and do not cling to the pawn move by move.",
  "englund-white:eg1":
    "The black queen has grabbed on b2, and you have a large advantage. That is the point of meeting the Englund this way: the queen is a long way from home, and Nc3 develops without even attacking it. Both kings are still in the centre. Next, castle and keep developing. Do not spend every move chasing the queen.",
  "budapest-white:bp1":
    "You are a pawn up against the Budapest, with a small edge, so the gambit has not paid for Black. The bishop check on b4 was met by Nbd2, and both kings are still uncastled. Next, finish development and castle. Keep the extra pawn while Black's pieces stay under control.",
  "qg-white:qg1":
    "The dark-squared bishops came off after ...Nd5, and you have a small edge. Your bishop is on c4 and a rook is already on c1. Black has castled and your king is still on e1. Next, castle and decide how to meet the knight on d5.",
  "english-white:engw1":
    "Black's bishop went home to f8, and your knight sits on d5 in a position that is about level. Bd3 has developed that bishop, and your king is still on e1. Next, castle and leave the d5 knight where it is unless Black can actually kick it.",
  "catalan-white:catw1":
    "You won the c4 pawn back, and ...b5 sent the queen home to c2. You have a small edge, with both kings castled. Black's bishop is on b7 and a knight on d7. Next, develop the knight on b1 and keep the g2 bishop aimed down the long diagonal.",
  "nimzo-indian-black:nib1":
    "You challenged the centre with ...d5 and ...c5, then finished with ...Nc6, both kings castled. The bishop is still on b4 and the central tension is intact. White is only a touch better, which is normal before anyone takes. Next, keep that tension until a capture does something useful.",
  "grunfeld-black:gfb1":
    "You took on c3, fianchettoed, and hit the centre with ...c5. The knight on a5 now attacks the bishop on c4, and it is White to move. White still has a small edge, which is normal in the Exchange, so do not count that bishop as won. Next, see where the bishop goes and keep the pressure on the centre.",
  "petroff-black:peb1":
    "You brought the knight back to c6, leaving a knight on e4 and a bishop on f5, with both kings castled. White has a small edge, which is normal while the knight on b1 is still at home. Next, keep the e4 knight secure. There is no need for a new break until that last white knight has moved.",
  "berlin-black:berb1":
    "The queens are off, so this is an endgame, and it is about level. Your king stays on e8, the c-pawns are doubled, and the bishop has just arrived on e6, with the other bishop on h4. Next, connect the rooks and keep the king in the centre. This is not a middlegame attack.",
  "kings-indian-black:kidb1":
    "You met d5 with ...Ne7, rerouted a knight through d7, and started the kingside with ...f5. The centre is closed, both kings are castled, and White keeps a small edge, which is normal here before your attack gets going. Next, support the f5 pawn and bring the d7 knight toward the kingside. Leave the queenside closed.",
  "old-indian-black:oib1":
    "White closed the centre with d5, and you answered with ...Nc5, ...a5 and ...Bd7. That knight on c5 is the piece to build around, and the light-squared bishop is already off the back rank. White keeps a small space edge, which is normal while the centre stays closed. Next, put a rook on e8 and keep the centre shut until a pawn break does a clear job.",
  "stafford-black:stb1":
    "The Stafford is a sharp gambit, and it is objectively risky: you are a pawn down, and White is much better if they stay calm. People still play it for the traps and the practical chances, because the h-pawn and the bishop on g4 can bother a player who does not know them. Your king is castled long. Next, use those two ideas and calculate before you push. Do not treat this as a sound equal position.",
  "ponziani-white:pw1":
    "The dark-squared bishops are off and a black knight sits on b4, with the position about level. Your king is still on e1 and Black has castled. Next, castle and meet that knight, either with a3 or by developing the knight on b1.",
  "alekhine-black:ab1":
    "You nudged the knight off e5 with ...Nd7, castled, and developed the bishop to b7. That bishop is the point of ...b6: it sits on the long diagonal against White's centre. White keeps a space edge, which is normal in the Alekhine, so you are playing for a break rather than a quick attack. Next, prepare ...c5, and do not open the centre just to make something happen.",
  "bdg-black:bdg1":
    "You took the offered pawn and traded the light-squared bishops on d3, so you are a pawn up with a small edge. Both kings are still in the centre, and White's queen sits on d3. Next, develop and castle before you try to attack. The extra pawn matters once the king is safe.",
  "slav-defence:sd1":
    "White's a4 stops ...b5, so you developed the bishop to f5, where it helps control e4. You are a pawn up on c4 for the moment, and the position is about equal because that pawn usually comes back. Your king is still on e8. Next, play ...e6 now that the bishop is out, then ...Bb4 and castle. Do not cling to the c4 pawn.",
  "opening-traps:ot1":
    "This line ends in checkmate, which is why the queen was not free. Black took the queen on d1 with the bishop, and Bxf7+ followed by Nd5 mates the king on e7. Next time you see this pin, look for the knight jump before you assume the queen can be taken.",
};

/** Note for the finish card, or undefined when this line should show none. */
export function lineFinishNote(line: OpeningLine, packId?: string): string | undefined {
  const own = line.explain?.trim();
  if (own) return own;
  if (!packId) return undefined;
  const keyed = LINE_EXPLAINS[`${packId}:${line.id}`]?.trim();
  return keyed || undefined;
}
