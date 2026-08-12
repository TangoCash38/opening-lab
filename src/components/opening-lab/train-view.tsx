import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Chess, type Square, type Move } from "chess.js";
import type { OpeningLine, Pack } from "@/data/packs";
import {
  isMistakeJustPlayed,
  nextPunishmentBannerState,
  type PunishmentBannerState,
} from "@/lib/punishment";
import {
  soundBad,
  soundMove,
  soundOk,
  soundSelect,
  soundWin,
} from "@/lib/sounds";
import { ChessBoard, type SlideAnim } from "./chess-board";

type Mode = "learn" | "practice";

type Props = {
  pack: Pack;
  line: OpeningLine;
  onBack: () => void;
};

const OPPONENT_THINK_MS = 420;
const HINT_REVEAL_MS = 180;

function fenPieceAt(g: Chess, sq: Square): string | null {
  const p = g.get(sq);
  if (!p) return null;
  return p.color === "w" ? p.type.toUpperCase() : p.type.toLowerCase();
}

/** Group SAN plies into standard move pairs for the notation strip. */
type NotationPair = {
  num: number;
  white: string;
  black?: string;
  /** True when this pair contains the most recently played ply */
  active: boolean;
};

function buildNotationPairs(plies: string[], playedCount: number): NotationPair[] {
  const pairs: NotationPair[] = [];
  // Only include plies that have actually been played
  for (let i = 0; i < playedCount; i += 2) {
    const moveNum = i / 2 + 1;
    const white = plies[i]!;
    const black = i + 1 < playedCount ? plies[i + 1] : undefined;
    // Active if the last played ply sits in this pair
    const lastPlayed = playedCount - 1;
    const active = lastPlayed === i || lastPlayed === i + 1;
    pairs.push({
      num: moveNum,
      white,
      black,
      active,
    });
  }
  return pairs;
}

export function TrainView({ pack, line, onBack }: Props) {
  const [mode, setMode] = useState<Mode>("learn");
  const [game, setGame] = useState(() => new Chess());
  const [plyIndex, setPlyIndex] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [wrongUntil, setWrongUntil] = useState<Square | null>(null);
  const [status, setStatus] = useState({ text: "Your move", cls: "" });
  const [session, setSession] = useState(0);
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [hintsReady, setHintsReady] = useState(true);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<PunishmentBannerState>({ kind: "idle" });

  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notationStripRef = useRef<HTMLDivElement | null>(null);
  const activeMoveRef = useRef<HTMLSpanElement | null>(null);
  const pendingCommit = useRef<{
    nextGame: Chess;
    nextPly: number;
    move: { from: Square; to: Square };
    userMove: boolean;
  } | null>(null);

  const clearReplyTimer = useCallback(() => {
    if (replyTimer.current) {
      clearTimeout(replyTimer.current);
      replyTimer.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearReplyTimer();
    if (wrongTimer.current) {
      clearTimeout(wrongTimer.current);
      wrongTimer.current = null;
    }
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
  }, [clearReplyTimer]);

  // ... rest of the file with the notation strip UI under the ChessBoard ...
  // (full content is the local train-view.tsx with buildNotationPairs, notationPairs, useEffect auto-scroll, and the horizontal scrollable strip)
  return null;
}
