import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { PACKS } from "@/data/packs";
import {
  coachAudioPlyCount,
  coachIntroArrowsAt,
  coachTextPlyCount,
  type CoachIntroArrowCue,
} from "@/lib/coach-packs";
import { playWhiteOnlySan, replayWhiteOnly } from "@/lib/london-intro-stem";
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
import { ChessBoard, type BoardArrow, type SlideAnim } from "./chess-board";

type Talk = "intro" | "canal" | "line";

type Props = {
  flip: boolean;
  frameCoords?: boolean;
  /**
   * Cuppa intro plays the gambit stem. Canal plays Scotch line sg1 from the
   * pack, paced to the pack-recipe clip. A text talk passes `beatPlies` and
   * plays each beat's ply as that beat shows. Practice itself is a different mount.
   */
  talk?: Talk;
  /** Script plies aligned to captions. A text talk plays each ply as that beat shows. */
  beatPlies?: readonly (string | undefined)[] | null;
  beatIndex?: number;
  /**
   * Seconds into the line clip when each played ply is spoken.
   * Set only for an audio talk. The board follows the clip, not the caption index.
   */
  plyAtSec?: readonly number[] | null;
  /** Clip length used when the element has not reported a duration yet. */
  plyFallbackSec?: number;
  /**
   * Pack intro stem (e.g. Caro e4 c6). Defaults to the Scotch gambit stem
   * when the cuppa intro plays with no beatPlies.
   */
  stemSans?: readonly string[] | null;
  /** Seconds into the intro clip when each stem ply is spoken. */
  stemAtSec?: readonly number[] | null;
  /**
   * Intro stem is White moves only (London). Black never replies; the turn
   * is handed back to White between moves.
   */
  whiteOnly?: boolean;
  /**
   * Named options that stay unplayed (Italian …Bc5 / …Nf6). Empty for
   * every other intro. The arrow follows the clip and leaves when the
   * next option, or the end of the sentence, arrives.
   */
  introArrows?: readonly CoachIntroArrowCue[] | null;
};

/** SAN for the talk. Canal reads pack id sg1. The cuppa stem stays the named moves. */
function talkSans(
  talk: Talk,
  beatPlies?: readonly (string | undefined)[] | null,
  stemSans?: readonly string[] | null,
): readonly string[] {
  if (beatPlies) return beatPlies.filter((ply): ply is string => Boolean(ply));
  if (talk === "line") return [];
  if (talk !== "canal") return stemSans && stemSans.length > 0 ? stemSans : SCOTCH_COACH_STEM;
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
 * coach speaks. Slide plus the soft yellow last-move wash. No hint squares.
 * Optional intro arrows mark a named reply that is not played. The final
 * position holds until the card unmounts this board.
 */
function arrowKey(arrows: readonly BoardArrow[]): string {
  return arrows.map((arrow) => `${arrow.from}${arrow.to}`).join(" ");
}

export function ScotchCoachBoard({
  flip,
  frameCoords,
  talk = "intro",
  beatPlies = null,
  beatIndex = 0,
  plyAtSec = null,
  plyFallbackSec = 0,
  stemSans = null,
  stemAtSec = null,
  whiteOnly = false,
  introArrows = null,
}: Props) {
  const sans = useMemo(() => talkSans(talk, beatPlies, stemSans), [talk, beatPlies, stemSans]);
  const [game, setGame] = useState(() => new Chess());
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ply, setPly] = useState(0);
  const [boardArrows, setBoardArrows] = useState<BoardArrow[]>([]);
  const gameRef = useRef(game);
  const playedRef = useRef(0);
  const targetRef = useRef(0);
  const slidingRef = useRef(false);
  const aliveRef = useRef(true);
  const sansRef = useRef(sans);
  const talkRef = useRef(talk);
  const beatPliesRef = useRef(beatPlies);
  const beatIndexRef = useRef(beatIndex);
  const plyAtSecRef = useRef(plyAtSec);
  const plyFallbackRef = useRef(plyFallbackSec);
  const stemAtSecRef = useRef(stemAtSec);
  const whiteOnlyRef = useRef(whiteOnly);
  const introArrowsRef = useRef(introArrows);
  sansRef.current = sans;
  talkRef.current = talk;
  beatPliesRef.current = beatPlies;
  beatIndexRef.current = beatIndex;
  plyAtSecRef.current = plyAtSec;
  plyFallbackRef.current = plyFallbackSec;
  stemAtSecRef.current = stemAtSec;
  whiteOnlyRef.current = whiteOnly;
  introArrowsRef.current = introArrows;

  const pump = useCallback(() => {
    if (!aliveRef.current || slidingRef.current) return;
    if (playedRef.current >= targetRef.current) return;
    const san = sansRef.current[playedRef.current];
    if (!san) return;
    const before = whiteOnlyRef.current
      ? replayWhiteOnly(sansRef.current, playedRef.current)
      : new Chess();
    if (!whiteOnlyRef.current) {
      for (const move of gameRef.current.history()) {
        try {
          if (!before.move(move)) return;
        } catch {
          return;
        }
      }
    }
    const preview = new Chess(before.fen());
    let played;
    try {
      played = whiteOnlyRef.current ? playWhiteOnlySan(preview, san) : preview.move(san);
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
    const next = whiteOnlyRef.current
      ? replayWhiteOnly(sansRef.current, playedRef.current + 1)
      : new Chess();
    if (!whiteOnlyRef.current) {
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
      const arrowCues = introArrowsRef.current;
      if (arrowCues && arrowCues.length > 0 && talkRef.current === "intro" && !beatPliesRef.current) {
        const fallback =
          plyFallbackRef.current > 0 ? plyFallbackRef.current : SCOTCH_COACH_NARRATION_FALLBACK_SEC;
        const clock = narrationClock(started, fallback, true);
        const active = coachIntroArrowsAt(arrowCues, clock.time, clock.duration, fallback);
        const next: BoardArrow[] = active.map((cue) => ({
          from: cue.from as Square,
          to: cue.to as Square,
          kind: "pv1",
        }));
        setBoardArrows((prev) => (arrowKey(prev) === arrowKey(next) ? prev : next));
      } else {
        setBoardArrows((prev) => (prev.length === 0 ? prev : []));
      }
      const cues = plyAtSecRef.current;
      if (cues && cues.length > 0) {
        const fallback = plyFallbackRef.current > 0 ? plyFallbackRef.current : 1;
        const clock = narrationClock(started, fallback, true);
        targetRef.current = coachAudioPlyCount(cues, clock.time, clock.duration, fallback);
        pump();
        return;
      }
      const stemCues = stemAtSecRef.current;
      if (stemCues && stemCues.length > 0 && talkRef.current === "intro" && !beatPliesRef.current) {
        const fallback = plyFallbackRef.current > 0 ? plyFallbackRef.current : SCOTCH_COACH_NARRATION_FALLBACK_SEC;
        const clock = narrationClock(started, fallback, true);
        targetRef.current = coachAudioPlyCount(stemCues, clock.time, clock.duration, fallback);
        pump();
        return;
      }
      const script = beatPliesRef.current;
      if (script) {
        targetRef.current = coachTextPlyCount(script, beatIndexRef.current);
        pump();
        return;
      }
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
      data-coach-white-only={whiteOnly ? "true" : undefined}
      data-coach-intro-arrows={boardArrows.length > 0 ? arrowKey(boardArrows) : undefined}
      data-scotch-coach-stem={talk === "intro" && !beatPlies ? ply : undefined}
      data-scotch-canal-ply={talk === "canal" ? ply : undefined}
      data-coach-line-ply={beatPlies ? ply : undefined}
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
        arrows={boardArrows}
      />
    </div>
  );
}
