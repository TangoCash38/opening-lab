import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { PACKS } from "@/data/packs";
import {
  SCOTCH_CANAL_LINE_ID,
  SCOTCH_CANAL_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_NARRATION_FALLBACK_SEC,
  SCOTCH_COACH_STEM,
  SCOTCH_PACK_ID,
  scotchCanalLinePlyCount,
  scotchCoachStemPlyCount,
} from "@/lib/scotch-coach";
import { scotchCoachNarration } from "@/lib/scotch-coach-audio";
import { soundCapture, soundMove } from "@/lib/sounds";
import { ChessBoard, type SlideAnim } from "./chess-board";

type Talk = "intro" | "canal";

type Props = {
  flip: boolean;
  frameCoords?: boolean;
  /**
   * Cuppa intro plays the gambit stem. Canal plays Scotch line sg1 from the
   * pack, paced to the pack-recipe clip. Practice itself is a different mount.
   */
  talk?: Talk;
};

/** SAN for the talk. Canal reads pack id sg1. The cuppa stem stays the named moves. */
function talkSans(talk: Talk): readonly string[] {
  if (talk !== "canal") return SCOTCH_COACH_STEM;
  const pack = PACKS.find((item) => item.id === SCOTCH_PACK_ID);
  const line = pack?.lines.find((item) => item.id === SCOTCH_CANAL_LINE_ID);
  return line?.plies ?? [];
}

/**
 * Narration clock. A playing element (including Mute) uses currentTime and
 * the reported duration so Unmute stays aligned. Autoplay blocked, or no
 * element yet, uses the wall clock. Canal idle timing uses the 95s fallback
 * until the clip is actually running.
 */
function narrationClock(
  startedAt: number,
  fallbackSec: number,
  idleUsesFallback: boolean,
): { time: number; duration: number } {
  const audio = scotchCoachNarration();
  const reported =
    audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackSec;
  if (audio && !audio.paused && !audio.ended && audio.currentTime > 0.05) {
    return { time: audio.currentTime, duration: reported };
  }
  if (audio?.ended) return { time: reported, duration: reported };
  return {
    time: (performance.now() - startedAt) / 1000,
    duration: idleUsesFallback ? fallbackSec : reported,
  };
}

/**
 * Auto-plays book moves on the non-interactive practice board while the
 * coach speaks. Slide plus the soft yellow last-move wash. No hint squares
 * and no arrows. The final position holds until the card unmounts this board.
 */
export function ScotchCoachBoard({ flip, frameCoords, talk = "intro" }: Props) {
  const sans = useMemo(() => talkSans(talk), [talk]);
  const [game, setGame] = useState(() => new Chess());
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const gameRef = useRef(game);
  const playedRef = useRef(0);
  const targetRef = useRef(0);
  const slidingRef = useRef(false);
  const aliveRef = useRef(true);
  const sansRef = useRef(sans);
  const talkRef = useRef(talk);
  sansRef.current = sans;
  talkRef.current = talk;

  const pump = useCallback(() => {
    if (!aliveRef.current || slidingRef.current) return;
    if (playedRef.current >= targetRef.current) return;
    const san = sansRef.current[playedRef.current];
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
    const san = sansRef.current[playedRef.current];
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
        /* fixed legal book moves */
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
      const canal = talkRef.current === "canal";
      const clock = narrationClock(
        started,
        canal ? SCOTCH_CANAL_NARRATION_FALLBACK_SEC : SCOTCH_COACH_NARRATION_FALLBACK_SEC,
        canal,
      );
      targetRef.current = canal
        ? scotchCanalLinePlyCount(clock.time, clock.duration, sansRef.current.length)
        : scotchCoachStemPlyCount(clock.time, clock.duration);
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
    <div
      className="w-full"
      data-scotch-coach-stem={talk === "intro" ? ply : undefined}
      data-scotch-canal-ply={talk === "canal" ? ply : undefined}
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
        onSlideComplete={onSlideComplete}
        onSquare={() => {}}
        interactive={false}
        frameCoords={frameCoords}
      />
    </div>
  );
}
