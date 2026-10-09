import type { OpeningLine } from "@/data/packs";

/**
 * Short end-of-line notes, keyed by `${packId}:${lineId}`.
 * A line with no entry, and no `explain` of its own, shows no card.
 * Lines 1 and 2 of each visible drill pack are filled in.
 * Later lines only need another string in this map, or their own `explain`.
 */
export const LINE_EXPLAINS: Readonly<Record<string, string>> = {
  "scotch:sg1":
    "This is the Scotch Gambit you want: 5.c3, trade the dark-squared bishops, and win the pawn back with exd5. Both kings have castled and the chances are about level, with your knight still on d2 and Black's knight on d5. Next, bring that d2 knight to b3 or e4 and use the half-open e-file. You are not a pawn down. The gambit has done its job.",
  "scotch:sg2":
    "Line 1 castled after the pawn came back. This time the queen goes to b3, and Black's knight comes to a5, where it attacks that queen. Material is level and the chances are about level, with Black's other knight on d5. Next, move the queen, often to c2 or a4, and castle. The knight on a5 has done its job once the queen steps away.",
  "london:lon1":
    "Both kings are castled, your knight is on e5, and f4 is already in, with the dark-squared bishop on g3 facing the bishop on d6. The position is about equal, and that knight is the piece this London is built around. Next, keep the knight supported. Do not throw more pawns at the king just to make something happen.",
  "london:lon2":
    "Line 1 kept the centre closed and put a knight on e5. This time Black took on d4, you recaptured with the pawn, and the bishop came to b5 against the bishop on d6. The position is about equal, with Black's other bishop on f5. Next, castle, then choose Bg3 or Ne5. Do not leave the d4 pawn without support.",
  "sicilian-black:sib1":
    "White has castled queenside and you have castled kingside, so ...b5 is the start of your play against that king. White keeps a small edge, which is normal in this attack while your queenside pawns are still rolling. Your pieces are already on e6, e7, d7 and f6. Next, keep expanding on the queenside, and do not start a pawn storm in front of your own king.",
  "sicilian-black:sib2":
    "Line 1 was the ...a6 attack with ...b5. This time you fianchetto with ...g6, break with ...d5, and after the trades the queen sits on a5. Pawns are level, and White keeps a small edge, which is normal once so many pieces have come off. Next, develop the light-squared bishop and use the half-open b-file. Do not start a pawn storm in front of your own king.",
  "french-black:frb1":
    "You traded the dark-squared bishop for the knight, played ...c4 and ...f6, and castled long. White's c-pawns are doubled and the position is about level. The pawn on f6 already attacks the pawn on e5. Next, sort out that tension before you start a new plan.",
  "french-black:frb2":
    "Line 1 was the Winawer, with long castling and ...f6. This time it is the Advance: ...Qb6, the knight comes via h6 to f5, and you take on f5 with the pawn before ...Be6. The position is about level. White has castled and your king is still on e8. Next, decide where that king belongs, and keep the pressure on d4.",
  "caro-kann-black:ckb1":
    "The Caro has done its job: the light-squared bishops are off and your knight stands on f5, pressing d4. The position is about equal. Your king is still on e8. Next, castle, then decide whether to keep the knight on f5 or turn your attention to d4.",
  "caro-kann-black:ckb2":
    "This is the Classical Caro, not the Advance from line 1. The knight on c3 took on e4, and your light-squared bishop dropped back before the trade on d3. White has castled long, your king is still on e8, and White keeps a small edge, which is normal here. Next, castle short, then look at ...c5 or ...b5 against that king. Leave the pawn on h6 where it is.",
  "qgd-black:qgdb1":
    "You met the Queen's Gambit with ...e6, ...Be7 and ...c6, and the rook on e8 is ready for the centre. White keeps a small edge, which is normal while the c4 and d5 pawns are still staring at each other. Your light-squared bishop is still on c8. Next, develop that bishop, and take on c4 only when the capture does a clear job.",
  "qgd-black:qgdb2":
    "Line 1 kept the rook on e8 and left the centre pawns staring at each other. This time you took on c4 and planted the knight on d5. White's dark-squared bishop is still on g5, and the light-squared bishop has come to c4. White is only a touch better, which is normal before anyone resolves the centre. Next, decide how to meet the bishop on g5, and develop the bishop on c8.",
  "london-black:alb1":
    "You have traded both pairs of bishops against the London, leaving White with doubled g-pawns. The position is about equal and both kings are castled. Next, bring the knight from d7 into the centre and play there. The doubled pawns can wait.",
  "london-black:alb2":
    "Line 1 traded both pairs of bishops. This time the light-squared bishop stays on f5, and you build ...Bd6 and ...Qc7 instead. You have castled, the queen sits on c7, and the position is about equal. Next, keep that bishop on f5 supported, and meet a central push only when your pieces are ready.",
  "d4-sidelines-black:d4s1":
    "You met the Colle with ...c5 and ...Nc6, hitting d4 before White is fully out. The position is about equal, and several pieces on both sides are still at home. Next, develop the dark-squared bishop and castle before you take on d4.",
  "d4-sidelines-black:d4s2":
    "Line 1 hit d4 with ...Nc6 before anyone castled. This time the bishop goes to d6 and both sides castle, so the Colle stays quiet. The position is about equal. Next, bring the knight from b8 into the game and keep ...c5 as your central lever. Do not take on d4 until that knight has a job.",
  "anti-sicilian-black:as1":
    "You met the Alapin with ...d5, and the queen recaptured on d5. White has a small edge, which is normal while both kings are still in the centre. Next, develop the dark-squared bishop and castle before you look for more.",
  "anti-sicilian-black:as2":
    "Line 1 met the Alapin by taking on d5 with the queen. This time you played ...Nf6, e5 sent the knight to d5, and you took on d4 with the c-pawn. You are a pawn up on d4, and the chances are about level because the pawn on e5 gives White space. Next, develop the dark-squared bishop and castle. Do not let that centre pawn sit unchallenged.",
  "nimzo-larsen-white:nl1":
    "Black closed the centre with ...e4, and you answered with the bishop on b5, the knight on g3, and d5. That space gives you a small edge. The knight on b1 is still at home, with the bishop on b2 waiting behind the centre. Next, develop that knight, and do not rush c4.",
  "nimzo-larsen-white:nl2":
    "Line 1 met ...e5 and closed the centre with d5. This time Black played ...d5 and ...c5, and you have a quiet setup with bishops on b2 and d3. The position is about equal, and it is your move. Next, develop the knight from b1, and choose c4 or e4 only when that knight can help.",
  "italian-white:it1":
    "Both kings are castled in a quiet Italian, and the position is about equal. Black's knight has come to g6, your rook is on e1, and the other knight sits on d2. Next, prepare d4 only when those pieces can support it. There is no need to force the centre open on the next move.",
  "italian-white:it2":
    "This is the Two Knights, not the quiet ...Bc5 Italian from line 1. You are a pawn up, and the chances are about level because Black's pawn on e4 and the bishop on d6 give real activity. Your knight is on e5, and that bishop looks straight at it. Next, castle and decide whether to challenge e4 with d3 or d4. Do not grab on f7 in this book position.",
  "ruy-lopez-white:rlw1":
    "This is the closed Spanish: the knight has arrived on f1, both kings are castled, and you have a small edge. From f1 that knight usually wants e3 or g3. Next, choose one of those and keep the centre under control with the bishop on c2.",
  "ruy-lopez-white:rlw2":
    "Line 1 was the closed Spanish, with the knight rerouted to f1. This time Black fianchettos with ...Bb7, and you meet it with d3, a4, and the bishop tucked on a2 after ...Na5. You have a small edge, which is normal in the Spanish, and it is Black to move. Next, keep the bishop on a2 aimed at the centre. There is no need to open the centre on the next move.",
  "french-white:fr1":
    "Black has just taken on d4 and is a pawn up, with doubled d-pawns, but the position is about level. Your space is the pawn on e5, the bishop is on d3, and the black queen sits on b6. Next, recapture on d4 and castle. The extra pawn is not a win for Black while that centre stands.",
  "french-white:fr2":
    "Line 1 met ...Qb6 with Bd3 and let Black take on d4. This time you play a3, which prepares b4 and takes the b4 square away from Black. The position is about level, with your space on e5, and the queen on b6 is looking at b2. Next, develop the light-squared bishop and castle, and keep b2 defended while you do it.",
  "alapin-white:al1":
    "You have an isolated d-pawn and Black's queen sits on d5, with the chances about level. Both kings are still uncastled, and the knight on f3 does not attack that queen. Next, develop the bishops and castle. Keep pieces active so the d-pawn stays a strength, not a dead target.",
  "alapin-white:al2":
    "Line 1 met ...Nc6 and left an isolated pawn on d4. This time Black played ...d5 at once, the queen recaptured on d5, and you have castled with the bishop on e2 facing the bishop on g4. The chances are about level, and it is Black to move. Next, be ready to meet a capture on d4, then develop the knight from b1. Keep the d4 pawn active.",
  "english-black:en1":
    "Both sides have fianchettoed and castled in a mirror English, and the position is about equal. The plans are still not the same just because the pieces look alike. Next, pick one pawn break and finish it. Do not mix a central push with a queenside one.",
  "english-black:en2":
    "Line 1 fianchettoed before the knights came out. This time the knights come first, and you still fianchetto and castle. The position is about equal. The plans are not the same just because the pieces look alike. Next, pick one pawn break and finish it.",
  "kg-black:kg1":
    "You met the gambit with ...d5 and took back on c6 with the knight, so you have a small edge. The doubled f-pawns are the price of that activity, and the king is still on e8. Next, develop the bishops and castle. Live with the doubled pawns. They are not a mistake you have to fix at once.",
  "kg-black:kg2":
    "Line 1 took back on c6 with the knight. This time you kept the pawn on f4, put the bishop on d6, and castled. The chances are about level, and White's king is still on e1 with doubled d-pawns. Next, develop the queenside. Do not cling to the f4 pawn if it gets in the way of your pieces.",
  "scandinavian-white:sc1":
    "Nc3 has gained time on the queen, which now sits on a5, and you have a small edge. The centre pawn is on d4 and Black has played ...c6. Both kings are uncastled. Next, develop the bishops and castle, and do not spend the next few moves only chasing the queen.",
  "scandinavian-white:sc2":
    "Line 1 stopped after ...c6. This time you develop the bishop to c4 and Black answers ...Bf5. The queen is still on a5, and you have a small edge from the lead in activity. Next, castle and bring out the dark-squared bishop. Do not spend the next few moves only chasing the queen.",
  "pirc-150-white:pm1":
    "Be3 and Qd2 are in, Black has castled, and you have a clear edge in this attack. Your king is still on e1 and the knight on g1 has not moved. Next, choose a home for your king before you start pushing pawns at g8. The setup is the idea. Finish it first.",
  "pirc-150-white:pm2":
    "Line 1 was the 150 Attack with Black already castled. This time Black played ...c6 before castling, and you have supported the centre with f3. You have a small edge, and your king is still on e1. Next, choose a home for your king before you push pawns. The pawn on c6 is a clue to watch the queenside.",
  "dutch-fianchetto-white:du1":
    "The bishop is on g2, c4 has taken space, and Black has castled. You have a small edge, and your king is still on e1. Next, castle, then choose a central break. Do not attack Black's king before your own king is safe.",
  "dutch-fianchetto-white:du2":
    "Line 1 built the fianchetto and let Black castle. This time Black checked from b4, you blocked with Bd2, and the bishop went home to e7. You have a small edge, and your king is still on e1. Next, castle and finish the knights. Do not let one check change the system.",
  "caro-advance-panov-white:ckw1":
    "You have space with the pawn on e5, and you have castled. The position is about level. Black's bishop is on f5 and ...c5 has already hit d4. Next, support d4 and bring out the queenside pieces.",
  "caro-advance-panov-white:ckw2":
    "Line 1 stopped once you had castled. This time Black has added ...Nc6, so the bishop on f5 and the hit on d4 are both still there. The position is about level, with your space on e5. Next, support d4 and bring out the knight from b1. There is no need to chase the bishop on f5 yet.",
  "evans-black:evb1":
    "You took the Evans pawn and dropped the bishop back to a5, so you are a pawn up with level chances. White's extra time is real compensation, which is why the pawn is not a free win yet. Your king is still on e8. Next, develop the kingside and castle, and do not cling to the pawn move by move.",
  "evans-black:evb2":
    "Line 1 stopped after the bishop dropped back to a5. This time you meet d4 by taking, so you are two pawns up for the moment and the chances are about level. White's bishop on c4 and the open centre are the compensation, which is why the pawns are not a free win yet. Your king is still on e8. Next, develop the kingside and castle.",
  "englund-white:eg1":
    "The black queen has grabbed on b2, and you have a large advantage. That is the point of meeting the Englund this way: the queen is a long way from home, and Nc3 develops without even attacking it. Both kings are still in the centre. Next, castle and keep developing. Do not spend every move chasing the queen.",
  "englund-white:eg2":
    "Line 1 let the queen grab on b2. This time the queen went to c5 and then checked from b4, and Nbd2 met the check without giving up the b-pawn. You are a pawn up with a large advantage, which is the point of meeting the Englund this way. Next, it is Black to move, so castle and keep developing. Do not spend every move chasing the queen.",
  "budapest-white:bp1":
    "You are a pawn up against the Budapest, with a small edge, so the gambit has not paid for Black. The bishop check on b4 was met by Nbd2, and both kings are still uncastled. Next, finish development and castle. Keep the extra pawn while Black's pieces stay under control.",
  "budapest-white:bp2":
    "Line 1 kept the extra pawn with Bf4. This time you played e3, Black took the pawn back with ...Nxe5, and Bd2 met the bishop check on b4. You still have a small edge, because your pieces are coming out faster. Next, finish the kingside and castle, and keep the knight on e5 under control.",
  "qg-white:qg1":
    "The dark-squared bishops came off after ...Nd5, and you have a small edge. Your bishop is on c4 and a rook is already on c1. Black has castled and your king is still on e1. Next, castle and decide how to meet the knight on d5.",
  "qg-white:qg2":
    "Line 1 was the Queen's Gambit Declined, with the dark-squared bishops coming off. This time Black took on c4, you won the pawn back, and the bishop sits on b3 against ...c5 and ...Nc6. The chances are about level, and you have already castled. Next, choose between taking on c5 and pushing d5. Black gave the pawn back, so do not play as if you are a pawn up.",
  "english-white:engw1":
    "Black's bishop went home to f8, and your knight sits on d5 in a position that is about level. Bd3 has developed that bishop, and your king is still on e1. Next, castle and leave the d5 knight where it is unless Black can actually kick it.",
  "english-white:engw2":
    "Line 1 played e3 and Qc2, and the bishop went home to f8. This time you fianchetto, meet ...e4 with Ne1, and take back on c3 toward the centre. You have the bishop pair, and the chances are about level, while Black's pawn on e4 takes space. Next, bring the knight from e1 to c2, or challenge e4 with f3.",
  "catalan-white:catw1":
    "You won the c4 pawn back, and ...b5 sent the queen home to c2. You have a small edge, with both kings castled. Black's bishop is on b7 and a knight on d7. Next, develop the knight on b1 and keep the g2 bishop aimed down the long diagonal.",
  "catalan-white:catw2":
    "Line 1 won the pawn back later, after both sides had castled. This time Qa4+ wins it back at once, and you have a knight on e5 plus a4 against ...b5 and ...Bb7. The position is about equal, and your king is still on e1. The knight on d7 attacks your knight on e5. Next, castle and develop the knight from b1, and do not leave the e5 knight without a recapture.",
  "nimzo-indian-black:nib1":
    "You challenged the centre with ...d5 and ...c5, then finished with ...Nc6, both kings castled. The bishop is still on b4 and the central tension is intact. White is only a touch better, which is normal before anyone takes. Next, keep that tension until a capture does something useful.",
  "nimzo-indian-black:nib2":
    "Line 1 kept the central tension and finished with ...Nc6. This time you took on c4 and then on d4, so White has an isolated pawn on d4 and it is your move. The chances are about level, and the bishop is still on b4. Next, develop the knight from b8 and the light-squared bishop, and keep d4 as a target.",
  "grunfeld-black:gfb1":
    "You took on c3, fianchettoed, and hit the centre with ...c5. The knight on a5 now attacks the bishop on c4, and it is White to move. White still has a small edge, which is normal in the Exchange, so do not count that bishop as won. Next, see where the bishop goes and keep the pressure on the centre.",
  "grunfeld-black:gfb2":
    "Line 1 took on c3 and hit the centre with ...c5. This time the knight goes to b6, and ...f5 lets the bishop recapture on f5. White has castled long and still has a small edge, which is normal in the Exchange. Next, find a stable square for the bishop on f5 and keep the pressure toward the king on c1.",
  "petroff-black:peb1":
    "You brought the knight back to c6, leaving a knight on e4 and a bishop on f5, with both kings castled. White has a small edge, which is normal while the knight on b1 is still at home. Next, keep the e4 knight secure. There is no need for a new break until that last white knight has moved.",
  "petroff-black:peb2":
    "Line 1 brought the knight to c6 and then to b4. This time the bishop goes to d6, you play ...c6, and the other knight comes out to a6. Both kings are castled, a knight remains on e4, and White is only a touch better, which is normal. Next, bring the a6 knight to c7 and keep the e4 knight secure.",
  "berlin-black:berb1":
    "The queens are off, so this is an endgame, and it is about level. Your king stays on e8, the c-pawns are doubled, and the bishop has just arrived on e6, with the other bishop on h4. Next, connect the rooks and keep the king in the centre. This is not a middlegame attack.",
  "berlin-black:berb2":
    "Line 1 developed ...Be7 and ...Be6. This time the bishop goes to d7, the king tucks to e8, and ...h5 plus ...c5 fight for space. The queens are off, so this is an endgame, and White keeps a small edge, which is normal in the Berlin. Next, develop the dark-squared bishop and connect the rooks. Keep the king in the centre.",
  "kings-indian-black:kidb1":
    "You met d5 with ...Ne7, rerouted a knight through d7, and started the kingside with ...f5. The centre is closed, both kings are castled, and White keeps a small edge, which is normal here before your attack gets going. Next, support the f5 pawn and bring the d7 knight toward the kingside. Leave the queenside closed.",
  "kings-indian-black:kidb2":
    "Line 1 started ...f5 after Ne1 and f3. This time White plays the Bayonet with b4, you take on a5 with the rook, and after ...Nd7 and Re1 you still get ...f5 in. White keeps a small edge from the queenside space, which is normal before your attack gets going. Next, support the f5 pawn and look at ...Ng6 for the knight on e7.",
  "old-indian-black:oib1":
    "White closed the centre with d5, and you answered with ...Nc5, ...a5 and ...Bd7. That knight on c5 is the piece to build around, and the light-squared bishop is already off the back rank. White keeps a small space edge, which is normal while the centre stays closed. Next, put a rook on e8 and keep the centre shut until a pawn break does a clear job.",
  "old-indian-black:oib2":
    "Line 1 was the closed centre, with your knight on c5. This time White plays e4, and you build the classical shell with ...c6, ...Re8, ...a5 and ...Qc7. White keeps a clear space edge, and that is the normal price of this centre: your pieces are developed, but White has more room. Next, keep the centre closed until a pawn break does a clear job. Look at ...Nf8 when the knight on d7 needs a new square.",
  "stafford-black:stb1":
    "The Stafford is a sharp gambit, and it is objectively risky: you are a pawn down, and White is much better if they stay calm. People still play it for the traps and the practical chances, because the h-pawn and the bishop on g4 can bother a player who does not know them. Your king is castled long. Next, use those two ideas and calculate before you push. Do not treat this as a sound equal position.",
  "stafford-black:stb2":
    "This is a different Stafford from the long-castle line. White played Nc3, you castled short, and ...Ng4 plus ...Qh4 won the light-squared bishop, so the queen now sits on g4 with a rook on e8. It is still objectively risky: you are a pawn down, and White is much better if they stay calm. People play it for the practical chances against a king that has just played g3. Next, use the e-file and calculate before you push, and do not treat this as a sound equal position.",
  "ponziani-white:pw1":
    "The dark-squared bishops are off and a black knight sits on b4, with the position about level. Your king is still on e1 and Black has castled. Next, castle and meet that knight, either with a3 or by developing the knight on b1.",
  "ponziani-white:pw2":
    "Line 1 traded the dark-squared bishops and left a knight on b4. This time Black took on e4, you pushed d5, and the knight on d3 attacks the bishop on c5. The position is about level, and your king is still on e1. Next, it is Black to move, so be ready for that bishop to drop back, then castle.",
  "alekhine-black:ab1":
    "You nudged the knight off e5 with ...Nd7, castled, and developed the bishop to b7. That bishop is the point of ...b6: it sits on the long diagonal against White's centre. White keeps a space edge, which is normal in the Alekhine, so you are playing for a break rather than a quick attack. Next, prepare ...c5, and do not open the centre just to make something happen.",
  "alekhine-black:ab2":
    "Line 1 nudged the knight away with ...Nd7 and put a bishop on b7. This time you play ...c6 and ...Bf5, then park the dark-squared bishop on d6. White keeps a space edge, which is normal in the Alekhine, and your king is still on e8. Next, castle, then ...Qc7. The bishop on f5 is a piece to keep, so do not trade it without a reason.",
  "bdg-black:bdg1":
    "You took the offered pawn and traded the light-squared bishops on d3, so you are a pawn up with a small edge. Both kings are still in the centre, and White's queen sits on d3. Next, develop and castle before you try to attack. The extra pawn matters once the king is safe.",
  "bdg-black:bdg2":
    "Line 1 traded the light-squared bishops on d3. This time the bishop goes to g4, you play ...e6, and White has castled. You are a pawn up with a clear edge, and the bishop on g4 attacks the knight on f3. Next, it is your move. Develop the dark-squared bishop and castle before you try to attack.",
  "slav-defence:sd1":
    "White's a4 stops ...b5, so you developed the bishop to f5, where it helps control e4. You are a pawn up on c4 for the moment, and the position is about equal because that pawn usually comes back. Your king is still on e8. Next, play ...e6 now that the bishop is out, then ...Bb4 and castle. Do not cling to the c4 pawn.",
  "slav-defence:sd2":
    "Line 1 stopped once the bishop reached f5, with you a pawn up for the moment. This line plays on: ...e6, White takes the pawn back on c4, then ...Bb4 and both sides castle. The bishop on b4 eyes the knight on c3, and White keeps a small edge, which is normal once the pawn has come home. Next, develop the knight from b8, usually to d7.",
  "opening-traps:ot1":
    "This line ends in checkmate, which is why the queen was not free. Black took the queen on d1 with the bishop, and Bxf7+ followed by Nd5 mates the king on e7. Next time you see this pin, look for the knight jump before you assume the queen can be taken.",
  "opening-traps:ot2":
    "Line 1 was Legal's Mate for White. This Fishing Pole is yours, as Black. White's mistake was taking the knight on g4, which opened the h-file, and after ...gxf3 your queen arrived on h4. You are much better, with that queen in front of the white king. Next, keep the queen safe and look for ...Bc5, because this attack appears only when White takes the knight.",
};

/** Note for the finish card, or undefined when this line should show none. */
export function lineFinishNote(line: OpeningLine, packId?: string): string | undefined {
  const own = line.explain?.trim();
  if (own) return own;
  if (!packId) return undefined;
  const keyed = LINE_EXPLAINS[`${packId}:${line.id}`]?.trim();
  return keyed || undefined;
}
