import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { lessonArrowsAt, lessonSansAt, type LessonCue } from "@/lib/lesson-sync";
import { scotchCoachNarration } from "@/lib/scotch-coach-audio";
import { soundCapture, soundMove } from "@/lib/sounds";
import { ChessBoard, type BoardArrow, type SlideAnim } from "./chess-board";

type Props = {
  cues: readonly LessonCue[];
  flip?: boolean;
};

function chessFromSans(sans: readonly string[]): Chess | null {
  const chess = new Chess();
  for (const san of sans) {
    try {
      if (!chess.move(san)) return null;
    } catch {
      return null;
    }
  }
  return chess;
}

function lastSquares(chess: Chess): { from: Square; to: Square } | null {
  const history = chess.history({ verbose: true });
  const last = history[history.length - 1];
  if (!last) return null;
  return { from: last.from, to: last.to };
}

const SQUARE = /^[a-h][1-8]$/;

/** Arrow cues are shapes only. A bad square never becomes a piece move. */
function optionArrows(cues: readonly LessonCue[], timeSec: number): BoardArrow[] {
  const arrows: BoardArrow[] = [];
  for (const [from, to] of lessonArrowsAt(cues, timeSec)) {
    if (!SQUARE.test(from) || !SQUARE.test(to) || from === to) continue;
    arrows.push({ from: from as Square, to: to as Square, kind: "option" });
  }
  return arrows;
}

function sameArrows(a: readonly BoardArrow[], b: readonly BoardArrow[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (arrow, i) => arrow.from === b[i]?.from && arrow.to === b[i]?.to && arrow.kind === b[i]?.kind,
  );
}

function sharedPrefix(played: readonly string[], target: readonly string[]): number {
  let count = 0;
  while (count < played.length && count < target.length && played[count] === target[count]) {
    count += 1;
  }
  return count;
}

/**
 * Board follows intro.mp3 via currentTime and BOARD_CUES SANs.
 * A fromPly cue snaps back (the branch after Bc4) before the next slide.
 * Arrow cues draw temporary potential-move shapes and do not move pieces.
 * Skip/Done stops the narration, so the clock reads 0 and the arrows clear.
 */
export function LessonBoard({ cues, flip = false }: Props) {
  const [game, setGame] = useState(() => new Chess());
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const [arrows, setArrows] = useState<BoardArrow[]>([]);
  const playedRef = useRef<string[]>([]);
  const targetRef = useRef<string[]>([]);
  const slidingRef = useRef(false);
  const aliveRef = useRef(true);
  const cuesRef = useRef(cues);
  const animToken = useRef(0);
  const onDoneRef = useRef<() => void>(() => {});
  cuesRef.current = cues;

  const pump = useCallback(() => {
    if (!aliveRef.current || slidingRef.current) return;
    const played = playedRef.current;
    const target = targetRef.current;
    if (played.length >= target.length) return;
    const san = target[played.length];
    if (!san) return;
    const before = chessFromSans(played);
    if (!before) return;
    const preview = new Chess(before.fen());
    let move;
    try {
      move = preview.move(san);
    } catch {
      return;
    }
    if (!move) return;
    const occupant = before.get(move.from);
    if (!occupant) return;
    const piece = occupant.color === "w" ? occupant.type.toUpperCase() : occupant.type;
    const captured = move.captured
      ? move.color === "w"
        ? move.captured
        : move.captured.toUpperCase()
      : undefined;
    const token = ++animToken.current;
    slidingRef.current = true;
    onDoneRef.current = () => {
      if (!aliveRef.current || animToken.current !== token) return;
      const nextSans = [...playedRef.current, san];
      const next = chessFromSans(nextSans);
      slidingRef.current = false;
      if (!next) {
        setSlide(null);
        return;
      }
      playedRef.current = nextSans;
      setGame(next);
      setPly(nextSans.length);
      setSlide(null);
      pump();
    };
    setLastMove({ from: move.from, to: move.to });
    setSlide({ from: move.from, to: move.to, piece, captured });
    soundMove();
    if (captured) soundCapture();
  }, []);

  const onSlideComplete = useCallback(() => {
    onDoneRef.current();
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    const tick = () => {
      if (!aliveRef.current) return;
      const audio = scotchCoachNarration();
      const time = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const nextArrows = optionArrows(cuesRef.current, time);
      setArrows((prev) => (sameArrows(prev, nextArrows) ? prev : nextArrows));
      const target = lessonSansAt(cuesRef.current, time);
      const played = playedRef.current;
      const shared = sharedPrefix(played, target);
      if (shared < played.length) {
        const base = target.slice(0, shared);
        const snapped = chessFromSans(base);
        if (!snapped) return;
        animToken.current += 1;
        slidingRef.current = false;
        playedRef.current = base;
        setSlide(null);
        setGame(snapped);
        setLastMove(lastSquares(snapped));
        setPly(base.length);
        targetRef.current = target;
        return;
      }
      targetRef.current = target;
      pump();
    };
    tick();
    const id = window.setInterval(tick, 70);
    return () => {
      aliveRef.current = false;
      animToken.current += 1;
      window.clearInterval(id);
    };
  }, [pump]);

  return (
    <div
      className="w-full"
      data-lesson-board
      data-lesson-ply={ply}
      data-lesson-arrows={arrows.map((arrow) => `${arrow.from}${arrow.to}`).join(" ")}
    >
      <ChessBoard
        game={game}
        flip={flip}
        selected={null}
        wrongUntil={null}
        expected={null}
        showHints={false}
        lastMove={lastMove}
        slide={slide}
        arrows={arrows}
        onSlideComplete={onSlideComplete}
        onSquare={() => {}}
        interactive={false}
        frameCoords
      />
    </div>
  );
}
