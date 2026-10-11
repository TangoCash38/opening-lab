# Ask the coach samples

These answers are from the **mock coach**, not a live model. This environment has no `AI_GATEWAY_API_KEY` and no `VERCEL_OIDC_TOKEN`, so the server builds the same context and then fills the sheet from the cached board, the line text, and the Stockfish file. When the gateway is on, the model sees that same context and the same validator.

The engine file is Stockfish 16, depth 18, MultiPV 3, one thread. Scores are White's point of view. "About level" means the stored score is under 10 centipawns. Every SAN below was replayed with chess.js. A move is called legal only when `chess.js` lists it from that FEN.

Practice is the in-app Practice mode. The six answers are Practice. A Test check for Line 1 is at the end: the next book move stays out of the answer.

## 1. Line 1 (sg1), ply 7, after 4.Bc4

Black to move. FEN `r1bqkbnr/pppp1ppp/2n5/8/2BpP3/5N2/PPP2PPP/RNBQK2R b KQkq - 1 4`.

Played: `e4 e5 Nf3 Nc6 d4 exd4 Bc4`. Next book move: `Bc5`. 32 legal moves. Material 38 to 39 (White 7 pawns, Black 8). White is a pawn down after `exd4`. Engine: -1 centipawn, about level. Top moves, all legal: `Nf6` -1, `Bc5` 0, `Bb4+` +4.

**What's the plan?**

> Main 5.c3 gambit: meet …Bb4+ with Bd2, win the pawn back by exd5, and castle. The book move from here is Bc5. The engine's main line is about level, and its top moves here include Nf6, Bc5 and Bb4+.

**Why this move?**

> White played Bc4 with the bishop. Main 5.c3 gambit: meet …Bb4+ with Bd2, win the pawn back by exd5, and castle. The engine's main line is about level, and its top moves here include Nf6, Bc5 and Bb4+.

Check:

- The FEN has a white bishop on c4 (`2B` on the fourth rank) and a black pawn on d4. Last move `Bc4` matches the book.
- `Bc5`, `Nf6`, and `Bb4+` are in the 32 legal moves. `Bc5` is the next ply in the line. The engine's first choice is `Nf6` by a single centipawn. The answer does not call `Bc5` the best move.
- "About level" matches -1 centipawn. It is not a pawn edge.
- The first sentence is the stored line idea. `Bd2` and `exd5` are later book moves in that idea. They are not legal for Black here. The sentence is the line's aim, not a move to play on this turn.
- Material is not stated in these two answers. The board is 38 to 39, as above.

## 2. Line 3 (sg3), ply 11, after 6.Nxf7

Black to move. FEN `r1bqk2r/pppp1Npp/2n4n/2b5/2BpP3/8/PPP2PPP/RNBQK2R b KQkq - 0 6`.

Played: `e4 e5 Nf3 Nc6 d4 exd4 Bc4 Bc5 Ng5 Nh6 Nxf7`. Next book move: `Nxf7` (Black recaptures). 34 legal moves. Material 38 to 38. Engine: -6, about level. Top moves, all legal: `Nxf7` -6, `Bb4+` +58, `Qh4` +200.

**What's the plan?**

> 5.Ng5 hits f7. The book move from here is Nxf7. The engine's main line is about level, and its top moves here include Nxf7, Bb4+ and Qh4.

**Why this move?**

> White played Nxf7 with the knight. It captures a pawn. 5.Ng5 hits f7. The engine's main line is about level, and its top moves here include Nxf7, Bb4+ and Qh4.

Check:

- The FEN has a white knight on f7 (`1N` on the seventh rank). `Nxf7` captured the f7 pawn, so the earlier gambit pawn is back and the count is 38 each.
- `Nxf7`, `Bb4+`, and `Qh4` are legal. The book recapture is also the engine's best of the three, at -6. `Bb4+` is +58 (White ahead by 0.6) and `Qh4` is +200 (White ahead by 2.0). They are the stored second and third lines, not equal choices. The answer lists them as top moves and does not say they are as good.
- "Hits f7" is the stored idea. `f7` here is the square in that sentence, and the knight is already on it. It is not a new pawn move.
- The idea's later `Qh5+` is not in these answers. `Qh4` in the answer is the engine move, which is legal, and it is not the book move `Qh5+`.

## 3. Line 4 (sg4), ply 11, after 6.Re1

Black to move. FEN `r1bqkb1r/pppp1ppp/2n5/8/2Bpn3/5N2/PPP2PPP/RNBQR1K1 b kq - 1 6`.

Played: `e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 O-O Nxe4 Re1`. Next book move: `d5`. 30 legal moves. Material 37 to 39 (White 6 pawns, Black 8). White is two pawns down: the d-pawn on d4 and the e-pawn taken by the knight on e4. Engine: -5, about level. Top moves, all legal: `d5` -5, `f5` +123, `Be7` +179.

**What's the plan?**

> Ghulam-Kassim: 5.O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3; White presses with Neg5 vs queenside castling. The book move from here is d5. The engine's main line is about level, and its top moves here include d5, f5 and Be7.

**Why this move?**

> White played Re1 with the rook. Ghulam-Kassim: 5.O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3; White presses with Neg5 vs queenside castling. The engine's main line is about level, and its top moves here include d5, f5 and Be7.

Check:

- The FEN has the white king on g1 and a rook on e1 (`R1K1` on the first rank). Castling rights are gone (`kq` only). Last move `Re1` matches.
- `d5` is legal and is both the next book move and the engine's best of the three. `f5` (+123) and `Be7` (+179) are legal and much worse for Black. The answer does not call them equal.
- "About level" matches -5. Calling that a tenth of a pawn would be the rounding bug this formatter avoids.
- `Bxd5`, `Qxd5`, `Nc3`, and `Neg5` are later book moves inside the stored idea. They are not claimed as legal on this turn. `Re1` and `d5` in that idea match the move just played and the next book move.

## 4. Trap: taking on c3 (sg7), ply 11, after 6.Bxf7+

Black to move. FEN `r1bqk1nr/pppp1Bpp/2n5/2b5/4P3/2p2N2/PP3PPP/RNBQK2R b KQkq - 0 6`.

Played: `e4 e5 Nf3 Nc6 d4 exd4 Bc4 Bc5 c3 dxc3 Bxf7+`. Next book move: `Kxf7`. Only 3 legal moves: `Kxf7`, `Kf8`, `Ke7`. Material 37 to 38 (White 6 pawns, Black 7). Engine: +91, White ahead by 0.9. Top moves are the three legal king moves: `Kxf7` +91, `Kf8` +160, `Ke7` +204.

**What's the plan?**

> Taking on c3 is the greed trap in the Scotch Gambit. The book move from here is Kxf7. The engine's main line is White ahead by 0.9, and its top moves here include Kxf7, Kf8 and Ke7.

**Why this move?**

> White played Bxf7+ with the bishop. It captures a pawn. It gives check. Taking on c3 is the greed trap in the Scotch Gambit.

Check:

- The FEN has a white bishop on f7. The black king is on e8, and the only legal moves are the three king moves, so the bishop check is real.
- `Bxf7+` captured the f7 pawn. White is still one pawn down (37 to 38) because Black took on c3 and the pawn sits on c3.
- `Kxf7` is the book move and the engine's best defence, at +0.9 for White. `Kf8` and `Ke7` are legal and worse (+1.6 and +2.0).
- The "why" answer is the capture, the check, and the first sentence of the idea. It stops at four sentences, so it does not also quote the engine. The engine score above is from the cache, not from that answer.
- Later idea moves `Qd5+`, `Qh5+`, `Qxc5`, and `Qe3` are not in these answers.

## 5. Canal: 4...Nf6 (sg8), ply 9, after 5.e5

Black to move. FEN `r1bqkb1r/pppp1ppp/2n2n2/4P3/2Bp4/5N2/PPP2PPP/RNBQK2R b KQkq - 0 5`.

Played: `e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5`. Next book move: `d5`. 30 legal moves. Material 38 to 39. The e-pawn push did not capture. Engine: +2, about level. Top moves, all legal: `d5` +2, `Ne4` +8, `Ng4` +11.

**What's the plan?**

> Canal variation. The book move from here is d5. The engine's main line is about level, and its top moves here include d5, Ne4 and Ng4.

**Why this move?**

> White played e5 with the pawn. Canal variation. The engine's main line is about level, and its top moves here include d5, Ne4 and Ng4.

Check:

- The FEN has a white pawn on e5 and a black knight on f6. Last move `e5` is a pawn push, not a capture. Material stays 38 to 39 from the gambit pawn on d4.
- `d5` is legal, is the next book move, and is the engine's best of the three at +2. `Ne4` and `Ng4` are legal and slightly worse.
- "Canal variation." is the first sentence of the stored idea. The rest of that idea (`Bb5`, `Nxd4`, `Bd7`) is later in the line and is not in these answers.

## 6. 4...Bb4+ (sg10), ply 24, end of the line

White to move. FEN `r4rk1/ppp1nppp/4b3/4P3/1b6/1B3N2/PP3PPP/R1BR2K1 w - - 1 13`.

Played through `Be6`. There is no next book move. 33 legal moves. Material 25 each: queens are off, one knight each, two bishops, two rooks, six pawns. No finish note is stored for this line (only Lines 1 and 2 have one). Engine: +30, White ahead by 0.3. Top moves, all legal: `Bxe6` +30, `Nd4` -1, `Bc2` -21.

**What's the plan?**

> 4...Bb4+ and c3. You are at the end of the book line. The engine's main line is White ahead by 0.3, and its top moves here include Bxe6, Nd4 and Bc2.

**Why this move?**

> Black played Be6 with the bishop. 4...Bb4+ and c3. The engine's main line is White ahead by 0.3, and its top moves here include Bxe6, Nd4 and Bc2.

Check:

- The FEN has a black bishop on e6 and White to move. Last move `Be6` matches the last ply. Ply 24 is the end of the 24-ply line.
- `Bxe6`, `Nd4`, and `Bc2` are in the 33 legal moves. `Bxe6` is the engine's best at +30. `Nd4` is about level (-1) and `Bc2` is worse for White (-21). The answer lists them and does not say they are equal.
- "4...Bb4+ and c3." is the first sentence of the idea. It does not invent a next book move. There is none.
- 0.3 pawns is 30 centipawns, not a rounded 0.0.

## Test mode, Line 1, same ply

Same board as sample 1. Show me was not tapped.

**What's the plan?**

> This line is Line 1 in the Scotch Gambit, one of 10 lines from Opening Lab. In Test, the next book move stays hidden until you tap Show me. The engine's main line is about level.

Check: the next book move is `Bc5`. It does not appear. `Nf6` and `Bb4+` are also later book moves on this line, so they are left out of the engine list as well. The score "about level" still matches -1. Tapping Show me is local: it reads `Bc5` from the line, and later questions may then name it.

## Positions used for the phone screenshots

These are not extra sample questions. They are the boards in the screenshots, checked the same way.

After `1.e4 e5` (sg1 ply 2), White to move, FEN `rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2`. Next book move `Nf3`, and it is legal. Engine +28, White ahead by 0.3. Top moves, all legal: `Nf3` +28, `Nc3` +17, `Bc4` +6. The Practice rundown names `Nf3` as the book move. In Test, before Show me, the rundown keeps `Nc3` and leaves out `Nf3` and `Bc4`, because both are later book moves. Show me then says the book move is `Nf3`.

At the end of Line 1 (sg1 ply 20), White to move after Black castles. FEN `r1bq1rk1/ppp2ppp/2n5/3n4/2BP4/5N2/PP1N1PPP/R2Q1RK1 w - - 2 11`. No next book move. Engine +16, White ahead by 0.2. Top moves, all legal: `Rc1` +16, `Bb3` 0, `Bb5` 0. The finish-note sentence about the knight on d2 is the stored note for this line. The FEN has that white knight on d2.
