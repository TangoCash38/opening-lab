import type { OpeningLine } from "@/data/packs";

/**
 * Short end-of-line notes, keyed by `${packId}:${lineId}`.
 * A line with no entry, and no `explain` of its own, shows no card.
 * Add lines 2 to 10 by putting another string in this map, or set `explain`.
 */
export const LINE_EXPLAINS: Readonly<Record<string, string>> = {
  "scotch:sg1":
    "The queens are off and Black is a pawn up, with a small edge. White's bishops stand on b2 and e4, which is the compensation for that pawn. This is an ending, not an attack. Next, keep the bishops active and do not rush to win the pawn back.",
  "london:lon1":
    "Both kings have castled and the engine calls the position level. Your knight is on e5, f4 is already played, and the dark-squared bishop sits on g3 opposite the bishop on d6. The knight on e5 is the piece this setup is built around. Next, keep it supported instead of throwing more pawns at the king.",
  "sicilian-black:sib1":
    "White has castled queenside and you have castled kingside, and ...b5 starts your play on that wing. The engine gives White a small edge. Your pieces are already on e6, e7, d7 and f6. Next, keep the queenside expansion going, and do not start a pawn storm in front of your own king.",
  "french-black:frb1":
    "You traded the dark-squared bishop for the knight, played ...c4 and ...f6, and castled long. White's c-pawns are doubled and the engine calls it about level. The pawn on f6 already attacks the pawn on e5. Next, resolve that tension before you invent a new plan.",
  "caro-kann-black:ckb1":
    "The light-squared bishops have been traded and your knight stands on f5, pressing d4. The engine calls the position level. Your king is still on e8. Next, castle before you look for another pawn break.",
  "qgd-black:qgdb1":
    "Both knights are out, you have castled, and ...c6 plus ...Re8 meet White's rook on the c-file. The centre has not been released, and White has a small edge. The light-squared bishop is still on c8, and White's king is still on e1. Next, develop that bishop and take on c4 only when the capture does a clear job.",
  "london-black:alb1":
    "Both pairs of bishops have come off, leaving White with doubled g-pawns, and the engine calls it level. Both kings have castled. Next, bring the knight on d7 into the game and play in the centre. Those doubled pawns are a long-term feature, not a reason to rush.",
  "d4-sidelines-black:d4s1":
    "You have challenged the Colle centre with ...c5 and developed the knight to c6. The engine calls it about level. Several pieces on both sides are still on their home squares. Next, develop the dark-squared bishop and castle before you take on d4.",
  "anti-sicilian-black:as1":
    "...d5 opened the centre and the queen recaptured on d5. The engine calls the position about level. Both kings are still in the centre. Next, develop the dark-squared bishop and castle before you look for more.",
  "nimzo-larsen-white:nl1":
    "After Black closed the centre with ...e4, the bishop went to b5, the knight went to g3, and d5 gained space. White has a small edge. The knight on b1 is still at home. Next, develop that knight and keep the bishop on b2 useful, and do not rush c4.",
  "italian-white:it1":
    "Both kings have castled in this quiet Italian, and White has a small edge. Black's knight has arrived on g6, and your rook is on e1 with the knight on d2. Next, prepare d4 only when those pieces are ready to support it. There is no need to force the centre open on the next move.",
  "ruy-lopez-white:rlw1":
    "This is the closed Spanish manoeuvre: the knight has arrived on f1, with both kings castled. White has a small edge. The knight's usual squares from here are e3 or g3. Next, choose one of those and keep the centre under control with the bishop on c2.",
  "french-white:fr1":
    "Black has just captured on d4, with doubled d-pawns and an extra pawn, but the engine calls the position about level. The pawn on e5 is your space, the bishop is on d3, and the black queen sits on b6. Next, recapture on d4 and castle. Do not panic about the pawn: the position is level for a reason.",
  "alapin-white:al1":
    "Black's queen is on d5 and White has an isolated d-pawn, with a small edge. Both kings are still uncastled. The knight on f3 does not attack that queen. Next, develop the bishops and castle, and keep pieces active so the d-pawn does not become a dead target.",
  "english-black:en1":
    "Both sides have fianchettoed and castled, and the engine gives White a small edge. The position looks like a mirror, but the plans are not the same just because the pieces look alike. Next, pick one pawn break and finish it, instead of mixing a central push with a queenside one.",
  "kg-black:kg1":
    "You met the gambit with ...d5 and recaptured on c6 with the knight. Black has doubled f-pawns and a small edge. The king is still on e8. Next, develop the bishops and castle, and live with the doubled f-pawns instead of trying to fix them at once.",
  "scandinavian-white:sc1":
    "Nc3 has gained time against the queen, which sits on a5, and White has a small edge. The centre pawn is on d4 and Black has played ...c6. Both kings are uncastled. Next, develop the bishops and castle, and do not spend more moves only chasing the queen.",
  "pirc-150-white:pm1":
    "Be3 and Qd2 are in place and Black has castled, and White has a small edge. Your king is still on e1 and the knight on g1 has not moved. Next, finish development and choose a king home before you start an attack.",
  "dutch-fianchetto-white:du1":
    "The bishop is on g2, c4 has claimed space, and Black has castled. White has a small edge. Your king is still on e1. Next, castle, then choose a central break, and do not attack Black's king before your own king is safe.",
  "caro-advance-panov-white:ckw1":
    "You have space with the pawn on e5 and you have castled. The engine calls the position about level. Black's bishop is on f5 and ...c5 has already hit d4. Next, support d4 and bring out the queenside pieces.",
  "evans-black:evb1":
    "You took on b4 and retreated the bishop to a5, so you are a pawn up. The engine calls the position level, which means White's extra time is real compensation. Your king is still on e8. Next, develop the kingside and castle, and do not try to cling to the pawn move by move.",
  "englund-white:eg1":
    "The black queen has captured on b2, and the engine gives White a large advantage. Nc3 is a developing move, and it does not attack the queen on b2. Both kings are still in the centre. Next, castle and keep developing, and do not spend every move chasing the queen.",
  "budapest-white:bp1":
    "You are a pawn up, and the engine calls the position about level, so the pawn is not yet a win. Black's bishop went to b4 with check, and Nbd2 met it. Both kings are uncastled. Next, finish development and castle, and keep the extra pawn only while Black's pieces stay under control.",
  "qg-white:qg1":
    "The dark-squared bishops came off after ...Nd5, and the engine calls the position about level. Your bishop is on c4 and the rook is already on c1. Black's king has castled and yours is still on e1. Next, castle and decide how to meet the knight on d5.",
  "english-white:engw1":
    "Black's bishop went home to f8, and your knight sits on d5. The engine calls the position about level. Bd3 has developed that bishop, and the king is still on e1. Next, castle and leave the d5 knight where it is unless Black can actually kick it.",
  "catalan-white:catw1":
    "You won the c4 pawn back, and ...b5 sent the queen home to c2. The engine calls the position about level. Black's bishop is on b7 and the knight on d7, with both kings castled. Next, develop the knight on b1 and keep the g2 bishop aimed down the long diagonal.",
  "nimzo-indian-black:nib1":
    "You challenged the centre with ...d5 and ...c5 and finished development with ...Nc6, with both kings castled. The bishop is still on b4 and the central tension is intact. White has a small edge, which is normal before anyone takes. Next, keep that tension until a capture does something useful.",
  "grunfeld-black:gfb1":
    "You took on c3, fianchettoed, and hit the centre with ...c5. The knight on a5 now attacks the bishop on c4, and it is White to move. White still has a small edge, so do not count that bishop as won. Next, see where the bishop goes and keep pressure on the centre.",
  "petroff-black:peb1":
    "The knight returned to c6, leaving a knight on e4 and a bishop on f5. Both kings have castled. White has a small edge, and the knight on b1 is still at home. Next, keep the e4 knight secure and do not force a new break while White's last knight is still at home.",
  "berlin-black:berb1":
    "The queens are off, your king is on e8, and the c-pawns are doubled. The engine calls this endgame about level. The bishop has just arrived on e6, and the other bishop is on h4. Next, connect the rooks and keep the king in the centre rather than treating this like a middlegame attack.",
  "kings-indian-black:kidb1":
    "You met d5 with ...Ne7, rerouted a knight via d7, and started the kingside with ...f5. Both kings have castled and the centre is closed. White has a small edge, which is normal before the attack gets going. Next, support the f5 pawn and bring the d7 knight toward the kingside, and do not open the queenside for White.",
  "old-indian-black:oib1":
    "You have built a solid shell with ...c6, ...Re8, ...a5 and ...Qc7, and both kings have castled. White has a clear edge even so. The light-squared bishop is still on c8. Next, develop that bishop and do not rush ...f5.",
  "stafford-black:stb1":
    "This is a sharp try: ...h5, the bishop on g4, and a king castled long. Black is a pawn down, and the engine thinks White is much better. Do not treat the position as equal. Next, the h-pawn and the bishop on g4 are your active ideas, so calculate before you push.",
  "ponziani-white:pw1":
    "The dark-squared bishops have been traded and a black knight sits on b4. The engine calls the position about level. White's king is still on e1 and Black has castled. Next, castle and decide how to meet the b4 knight, either with a3 or by developing the knight on b1.",
  "alekhine-black:ab1":
    "You asked the knight on e5 to move with ...Nd7, then castled and played ...b6. White has a clear edge. The light-squared bishop is still on c8. Next, ...Bb7 is the natural square, and do not open the centre just because White has more space.",
  "bdg-black:bdg1":
    "You took the pawn and traded the light-squared bishops on d3, so you are a pawn up with a small edge. Both kings are still in the centre, and White's queen is on d3. Next, develop and castle before you try to attack. The extra pawn only matters once the king is safe.",
  "slav-defence:sd1":
    "White's a4 restrains ...b5, and you have developed the bishop to f5, where it helps control e4. You are a pawn up on c4, but that pawn is normally temporary, and White has a small edge. The king is still on e8. Next, play ...e6 now that the bishop is out, then ...Bb4 and castle, and do not try to cling to the c4 pawn.",
  "opening-traps:ot1":
    "This line ends in checkmate. Black took the queen on d1 with the bishop, and Bxf7+ followed by Nd5 is mate against the king on e7. The engine's verdict is mate, which is why the queen was not free. Next time you see this pin, look for the knight jump before you assume the queen can be taken.",
};

/** Note for the finish card, or undefined when this line should show none. */
export function lineFinishNote(line: OpeningLine, packId?: string): string | undefined {
  const own = line.explain?.trim();
  if (own) return own;
  if (!packId) return undefined;
  const keyed = LINE_EXPLAINS[`${packId}:${line.id}`]?.trim();
  return keyed || undefined;
}
