/**
 * Professor Potato Pie narration for Classic Run the game.
 * Fischer vs Sherwin, New Jersey Open 1957, from the start position.
 * Captions are the cleaned speech cues. Each SAN lands when that move is named.
 * Practice and Test stay on the book cut through 10...Qc7.
 */
import { Chess } from "chess.js";

export const CLASSIC_RUN_AUDIO = "/coach/classic-fischer-sherwin/professor-potato-pie-run-the-game.wav";
export const CLASSIC_RUN_KIND = "classic-fischer-sherwin:run";
/** Clip length in seconds. Ply cues are measured on this clock. */
export const CLASSIC_RUN_FALLBACK_SEC = 450.12;

export type ClassicRunBeat = {
  caption: string;
  atSec: number;
  ply?: string;
  plyAtSec?: number;
  extraPlies?: readonly { ply: string; plyAtSec: number }[];
};

export const CLASSIC_RUN_BEATS: readonly ClassicRunBeat[] = [
  { caption: "Right then, Professor Potato Pie on standby, and today we are running through a complete", atSec: 0 },
  { caption: "game from the New Jersey Open. It was played in round 7 on the 2nd of September 1957.", atSec: 7.04 },
  { caption: "Fourteen-year-old Robert James Fischer at the White Pieces against the experienced American", atSec: 15.14 },
  { caption: "master James T. Sherwin. White begins with Pawn to E4. Black answers Pawn to C5, the", atSec: 20.66, ply: "e4", plyAtSec: 24.81, extraPlies: [{ ply: "c5", plyAtSec: 27.31 }] },
  { caption: "Sicilian defence. Knight to F3, Pawn to E6. Rather than opening the centre immediately,", atSec: 28.76, ply: "Nf3", plyAtSec: 30.18, extraPlies: [{ ply: "e6", plyAtSec: 31.29 }] },
  { caption: "Fischer plays Pawn to D3, steering towards a King's Indian attack structure.", atSec: 36.36, ply: "d3", plyAtSec: 37.23 },
  { caption: "Black develops Knight to C6. White plays Pawn to G3, and Black develops Knight to F6.", atSec: 41.86, ply: "Nc6", plyAtSec: 42.93, extraPlies: [{ ply: "g3", plyAtSec: 44.79 }, { ply: "Nf6", plyAtSec: 47.01 }] },
  { caption: "Bishop to G2, Bishop to E7. White castles King's side, and Black castles King's side.", atSec: 48.9, ply: "Bg2", plyAtSec: 48.9, extraPlies: [{ ply: "Be7", plyAtSec: 49.9 }, { ply: "O-O", plyAtSec: 50.9 }, { ply: "O-O", plyAtSec: 53.11 }] },
  { caption: "White develops Knight to D2. Black places the Rook on B8, preparing Queen's side", atSec: 55.53, ply: "Nbd2", plyAtSec: 56.61, extraPlies: [{ ply: "Rb8", plyAtSec: 58.85 }] },
  { caption: "play. Rook to E1, Pawn to D6, Pawn to C3, Pawn to B6. Fischer is built a compact position,", atSec: 61.3, ply: "Re1", plyAtSec: 61.9, extraPlies: [{ ply: "d6", plyAtSec: 63.11 }, { ply: "c3", plyAtSec: 64.32 }, { ply: "b6", plyAtSec: 65.53 }] },
  { caption: "but compact does not mean passive. Now comes Pawn to D4, challenging the centre. Black replies", atSec: 70.82, ply: "d4", plyAtSec: 74.48 },
  { caption: "Queen to C7. Ten moves have passed. White's pieces are quietly assembled. Black has prepared", atSec: 78.46, ply: "Qc7", plyAtSec: 78.46 },
  { caption: "expansion on the Queen's side. The kettle looks calm, but there is already steam under the lid.", atSec: 85.44 },
  { caption: "Fischer advances Pawn to E5, gaining space and attacking the Knight. Black retreats Knight", atSec: 92.3, ply: "e5", plyAtSec: 93.63 },
  { caption: "to D5. Modern analysis finds Pawn to C4 particularly strong, chasing the Knight and preserving", atSec: 99.32, ply: "Nd5", plyAtSec: 99.32 },
  { caption: "White's advanced E4. Fischer chooses a more human continuation. Pawn from E5 takes D6.", atSec: 107.14, ply: "exd6", plyAtSec: 113.14 },
  { caption: "Black's bishop takes D6. White centralises Knight to E4. Black pushes Pawn to C4, gaining space,", atSec: 116, ply: "Bxd6", plyAtSec: 116.74, extraPlies: [{ ply: "Ne4", plyAtSec: 119.96 }, { ply: "c4", plyAtSec: 122.45 }] },
  { caption: "but allowing White to exchange an important defender. Knight takes D6, and Black's Queen takes D6.", atSec: 125.2, ply: "Nxd6", plyAtSec: 129.29, extraPlies: [{ ply: "Qxd6", plyAtSec: 131.48 }] },
  { caption: "White has traded a Knight for Black's Dark Squared Bishop, a useful transaction when the Black", atSec: 133.28 },
  { caption: "King may soon require Dark Square protection. The remaining White Knight goes to G5. Black C6", atSec: 138.76, ply: "Ng5", plyAtSec: 144.82 },
  { caption: "Knight goes to E7. Queen to C2 and Knight to G6. Fischer plays Pawn to H4, while Black's D5", atSec: 146.48, ply: "Nce7", plyAtSec: 147.19, extraPlies: [{ ply: "Qc2", plyAtSec: 148.42 }, { ply: "Ng6", plyAtSec: 150.05 }, { ply: "h4", plyAtSec: 152.9 }] },
  { caption: "Knight returns to F6. The design is becoming visible. The Queen on C2 and Knight on G5 are", atSec: 155.76, ply: "Ndf6", plyAtSec: 156.39 },
  { caption: "interested in H7, while the H4 is ready to advance. This is not random aggression. Fischer", atSec: 163.84 },
  { caption: "has moved the centre forward, removed a defensive bishop, and brought fresh pieces towards the", atSec: 170.44 },
  { caption: "King before opening the position. Now Fischer plays Knight takes H7. Black's F6 Knight takes H7.", atSec: 175.98, ply: "Nxh7", plyAtSec: 180.4, extraPlies: [{ ply: "Nxh7", plyAtSec: 182.78 }] },
  { caption: "The White Knight has removed the H Pawn, and drawn a defender onto the edge of the board.", atSec: 184.8 },
  { caption: "Pawn to H5 attacks the Knight on G6, and that Knight goes to H4. Bishop to F4 develops with", atSec: 190.78, ply: "h5", plyAtSec: 190.78, extraPlies: [{ ply: "Nh4", plyAtSec: 195.23 }, { ply: "Bf4", plyAtSec: 196.24 }] },
  { caption: "10 Pa against the Queen. Black retreats Queen to D8. Then Pawn from G3 takes H4, removing the", atSec: 198.42, ply: "Qd8", plyAtSec: 202.23, extraPlies: [{ ply: "gxh4", plyAtSec: 205.18 }] },
  { caption: "advanced Knight. Black places the rook on B7. Fischer continues Pawn to H6. Black's Queen takes H4,", atSec: 207.28, ply: "Rb7", plyAtSec: 210.44, extraPlies: [{ ply: "h6", plyAtSec: 213.23 }, { ply: "Qxh4", plyAtSec: 215.09 }] },
  { caption: "collecting the White Pawn that arrive there. White's H Pawn takes G7, tearing away another", atSec: 217, ply: "hxg7", plyAtSec: 221.31 },
  { caption: "pawn beside the King. Sherwin chooses King takes G7. That King capture is a serious concession.", atSec: 223.46, ply: "Kxg7", plyAtSec: 226.86 },
  { caption: "A rook move would have kept the King better sheltered, but the King now steps onto the very", atSec: 232.56 },
  { caption: "wing Fischer has been opening. Notice what the H Pawn achieved. It did not need to become a queen.", atSec: 237.62 },
  { caption: "It removed shelter, forced decisions, and gave White's heavy pieces an address to visit. A pawn", atSec: 244.64 },
  { caption: "can be remarkably persuasive when it arrives with friends. Fischer begins the celebrated rook", atSec: 251.5 },
  { caption: "manoeuvre with rook to E4. Black's Queen goes to H5. The rook drops to E3, ready to travel across", atSec: 257.6, ply: "Re4", plyAtSec: 258.96, extraPlies: [{ ply: "Qh5", plyAtSec: 261.31 }, { ply: "Re3", plyAtSec: 263.21 }] },
  { caption: "the third rank. Sherwin replies Pawn to F5. That move tries to hold the King side together,", atSec: 266.38, ply: "f5", plyAtSec: 269.02 },
  { caption: "but it weakens crucial squares and makes the King's position markedly worse. The engine regards", atSec: 274.28 },
  { caption: "it as the decisive deterioration. Fischer wastes no time. Rook to H3 attacks the Queen.", atSec: 280.46, ply: "Rh3", plyAtSec: 285.13 },
  { caption: "And the Queen retreats to E8. Bishop to E5 check. The Knight from H7 returns to F6 and blocks", atSec: 287.6, ply: "Qe8", plyAtSec: 288.92, extraPlies: [{ ply: "Be5+", plyAtSec: 290.42 }, { ply: "Nf6", plyAtSec: 294.08 }] },
  { caption: "the diagonal. Queen to D2, King to F7. Queen to G5 bringing another attacker beside the Rook", atSec: 296.34, ply: "Qd2", plyAtSec: 297.58, extraPlies: [{ ply: "Kf7", plyAtSec: 298.72 }, { ply: "Qg5", plyAtSec: 299.78 }] },
  { caption: "and Bishop. Black's Queen goes to E7. Now Bishop takes F6, removing the final Knight defender.", atSec: 304.46, ply: "Qe7", plyAtSec: 306.79, extraPlies: [{ ply: "Bxf6", plyAtSec: 308.23 }] },
  { caption: "Black's Queen takes F6. The position is a fine example of accumulation. First the center,", atSec: 313.66, ply: "Qxf6", plyAtSec: 314.28 },
  { caption: "then the Pawn lever, then the Rook lift, and finally the removal of the last guard.", atSec: 321.02 },
  { caption: "Fischer has not thrown pieces at the King. He has replaced each defender with a new problem.", atSec: 326.76 },
  { caption: "Fischer plays Rook to H7. Check. Sherwin's King goes to E8. Then Queen takes F6. Fischer removes", atSec: 332.54, ply: "Rh7+", plyAtSec: 333.88, extraPlies: [{ ply: "Ke8", plyAtSec: 337.12 }, { ply: "Qxf6", plyAtSec: 338.74 }] },
  { caption: "Black's Queen. Black now faces an unpleasant choice. The Rook on F8 could capture the White Queen,", atSec: 341.7 },
  { caption: "but the Rook on B7 is attacked along the seventh rank by White's Rook and along the long diagonal", atSec: 349.62 },
  { caption: "by the Bishop on G2. Sherwin instead plays Rook from B7, takes H7, removing the checking Rook,", atSec: 355.54, ply: "Rbxh7", plyAtSec: 359.25 },
  { caption: "but leaving Fischer's Queen on the board. Fischer finishes with Bishop to C6. Check.", atSec: 363.88, ply: "Bc6+", plyAtSec: 368.51 },
  { caption: "The Bishop that began quietly on G2 now reaches across the board and drives the King into another", atSec: 370.44 },
  { caption: "defensive decision. Sherwin resigns. For accuracy. Bishop to C6 is not checkmate. Black can", atSec: 376.66 },
  { caption: "interpose a Rook or Bishop, but the position is decisively lost. White retains a major material", atSec: 386.3 },
  { caption: "advantage. Black's King remains exposed and further checks are coming. Resignation is entirely reasonable.", atSec: 393.8 },
  { caption: "The game's lesson is more valuable than a claim of perfection. Fischer did not choose the", atSec: 402.7 },
  { caption: "engine's first move at every turn. What he did was maintain a coherent plan. He challenged the", atSec: 408.66 },
  { caption: "centre with D4 and E5, removed the dark squared bishop, used the H pawn as a lever, lifted the", atSec: 415.98 },
  { caption: "Rook through E4 and E3, and eliminated the final knight before collecting the Queen. That is a", atSec: 423.9 },
  { caption: "attacking chess with proper grammar. The pieces do not merely arrive loudly, they arrive in the correct", atSec: 431.22 },
  { caption: "order. Run the game through again until the Rook lift feels inevitable rather than magical.", atSec: 438.28 },
  { caption: "Then put the kettle on and perhaps make room for a potato pie.", atSec: 444.8 },
];

export function classicRunMoves(): { ply: string; plyAtSec: number }[] {
  const moves: { ply: string; plyAtSec: number }[] = [];
  for (const beat of CLASSIC_RUN_BEATS) {
    if (beat.ply) {
      if (beat.plyAtSec == null) return [];
      moves.push({ ply: beat.ply, plyAtSec: beat.plyAtSec });
    }
    for (const extra of beat.extraPlies ?? []) moves.push(extra);
  }
  return moves;
}

/** Null when the full game is legal and every spoken ply has a time. */
export function verifyClassicRun(): string | null {
  const moves = classicRunMoves();
  if (CLASSIC_RUN_BEATS.length !== 61) return "beats";
  if (moves.length !== 65) return "plies";
  if (moves[0]?.ply !== "e4") return "start";
  if (moves[19]?.ply !== "Qc7") return "cut";
  if (moves[64]?.ply !== "Bc6+") return "last";
  let prev = -1;
  for (const move of moves) {
    if (!(move.plyAtSec > prev)) return `order:${move.ply}`;
    prev = move.plyAtSec;
  }
  const game = new Chess();
  for (const move of moves) {
    if (!game.move(move.ply)) return `illegal:${move.ply}`;
  }
  if (game.history().length !== 65) return "history";
  return null;
}

/** This visit only. Closing the tab brings the walkthrough back. */
const CLASSIC_RUN_SESSION_KEY = "opening-lab:classic-run-seen";

export function classicRunAlreadySeen(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(CLASSIC_RUN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markClassicRunSeen(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(CLASSIC_RUN_SESSION_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}
