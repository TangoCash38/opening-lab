import { useCallback, useEffect, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import {
  SCOTCH_COACH_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_STEM,
  scotchCoachStemPlyCount,
} from "@/lib/scotch-coach";
import { scotchCoachNarration } from "@/lib/scotch-coach-audio";
import { soundCapture, soundMove } from "@/lib/sounds";
import { ChessBoard, type SlideAnim } from "./chess-board";

type Props = {
  flip: boolean;
  frameCoords?: boolean;
};

function narrationClock(startedAt: number): { time: number; duration: number } {
  const audio = scotchCoachNarration();
  let duration = SCOTCH_COACH_NARRATION_FALLBACK_SEC;
  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    duration = audio.duration;
  }
  if (audio && !audio.paused && !audio.ended && audio.currentTime > 0.05) {
    return { time: audio.currentTime, duration };
  }
  if (audio?.ended) return { time: duration, duration };
  return { time: (performance.now() - startedAt) / 1000, duration };
}

/**
 * Auto-plays the Scotch Gambit stem on the practice board while Sean speaks.
 * Moves follow the narration clock (wall clock if audio has not started).
 */
export function ScotchCoachBoard({ flip, frameCoords }: Props) {
  const [game, setGame] = useState(() => new Chess());
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const gameRef = useRef(game);
  const playedRef = useRef(0);
  const targetRef = useRef(0);
  const slidingRef = useRef(false);
  const aliveRef = useRef(true);

  const pump = useCallback(() => {
    if (!aliveRef.current || slidingRef.current) return;
    if (playedRef.current >= targetRef.current) return;
    const san = SCOTCH_COACH_STEM[playedRef.current];
    if (!san) return;
    const before = new Chess();
    for (const move of gameRef.current.history()) {
      try {
        if (!before.move(move)) return;
      } catch {
        return;
      }
    }
    const preview = new Chess(before.fen());
    let played;
    try {
      played = preview.move(san);
    } catch {
      return;
    }
    if (!played) return;
    const occupant = before.get(played.from);
    if (!occupant) return;
    const piece = occupant.color === "w" ? occupant.type.toUpperCase() : occupant.type;
    const captured = played.captured
      ? played.color === "w"
        ? played.captured
        : played.captured.toUpperCase()
      : undefined;
    slidingRef.current = true;
    setLastMove({ from: played.from, to: played.to });
    setSlide({ from: played.from, to: played.to, piece, captured });
    soundMove();
    if (captured) soundCapture();
  }, []);

  const onSlideComplete = useCallback(() => {
    if (!aliveRef.current) return;
    const san = SCOTCH_COACH_STEM[playedRef.current];
    const next = new Chess();
    for (const move of gameRef.current.history()) {
      try {
        next.move(move);
      } catch {
        return;
      }
    }
    if (san) {
      try {
        next.move(san);
      } catch {
        /* fixed legal stem */
      }
    }
    gameRef.current = next;
    playedRef.current += 1;
    slidingRef.current = false;
    setGame(next);
    setPly(playedRef.current);
    setSlide(null);
    pump();
  }, [pump]);

  useEffect(() => {
    aliveRef.current = true;
    const started = performance.now();
    const tick = () => {
      const clock = narrationClock(started);
      targetRef.current = scotchCoachStemPlyCount(clock.time, clock.duration);
      pump();
    };
    tick();
    const id = window.setInterval(tick, 70);
    return () => {
      aliveRef.current = false;
      window.clearInterval(id);
    };
  }, [pump]);

  return (
    <div className="w-full" data-scotch-coach-stem={ply}>
      <ChessBoard
        game={game}
        flip={flip}
        selected={null}
        wrongUntil={null}
        expected={null}
        showHints={false}
        lastMove={lastMove}
        slide={slide}
        onSlideComplete={onSlideComplete}
        onSquare={() => {}}
        interactive={false}
        frameCoords={frameCoords}
      />
    </div>
  );
}
