import { useEffect, useMemo, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { legalMateLine } from "@/lib/legal-mate";
import { FLASH_MS, GAP_MS } from "@/lib/square-memory";
import { SQUARE_MEMORY_LINE } from "@/lib/square-memory-line";
import { ChessBoard, SLIDE_MS, type SlideAnim } from "./chess-board";

const START_FEN = new Chess().fen();
const HINT_MS = 480;
const THINK_MS = 260;
const MOVE_GAP_MS = 140;
const HOLD_MS = 800;
/** Three Legal's Mate cycles, then one Square Memory preview. */
const CYCLE = 4;
const MEMORY_SLOT = 3;
/** Opening two moves of the free line. A flash preview, not a game to win. */
const PREVIEW_SQUARES = SQUARE_MEMORY_LINE.squares.slice(0, 4) as Square[];
const NOTE_LEAD_MS = 700;
const NOTE_HOLD_MS = 900;
const BIG_RED = "/coach/ruy-lopez-white/big-red-portrait.png";

type Phase = "practice" | "test" | "memory";

/**
 * Homepage board. Legal’s Mate plays itself: Practice with hints, then Test
 * with none. After three of those cycles, one short Square Memory preview
 * plays, then Legal’s Mate returns.
 */
export function LandingMateDemo() {
  const script = useMemo(() => legalMateLine()?.line.plies ?? [], []);
  const side = useMemo(() => legalMateLine()?.line.side ?? "w", []);
  const [fen, setFen] = useState(START_FEN);
  const [ply, setPly] = useState(0);
  const [phase, setPhase] = useState<Phase>("practice");
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [flash, setFlash] = useState<Square | null>(null);
  const [run, setRun] = useState(0);
  const game = useMemo(() => new Chess(fen), [fen]);

  useEffect(() => {
    if (script.length === 0) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    const resetBoard = () => {
      setFen(START_FEN);
      setPly(0);
      setSlide(null);
      setLastMove(null);
      setShowHint(false);
      setFlash(null);
    };

    const playMemory = async () => {
      setPhase("memory");
      resetBoard();
      await later(NOTE_LEAD_MS);
      for (const square of PREVIEW_SQUARES) {
        if (cancelled) return;
        setFlash(square);
        await later(FLASH_MS);
        if (cancelled) return;
        setFlash(null);
        await later(GAP_MS);
      }
      if (cancelled) return;
      await later(NOTE_HOLD_MS);
      if (!cancelled) setRun((n) => n + 1);
    };

    const playLine = async (withHints: boolean) => {
      let chess = new Chess();
      setFen(chess.fen());
      setPly(0);
      setSlide(null);
      setLastMove(null);
      setShowHint(false);
      setFlash(null);
      await later(40);
      for (let i = 0; i < script.length; i++) {
        if (cancelled) return;
        const san = script[i]!;
        const userTurn = chess.turn() === side;
        if (withHints && userTurn) {
          setShowHint(true);
          await later(HINT_MS);
          if (cancelled) return;
          setShowHint(false);
        } else {
          await later(THINK_MS);
          if (cancelled) return;
        }
        const next = new Chess(chess.fen());
        let played;
        try {
          played = next.move(san);
        } catch {
          return;
        }
        if (!played) return;
        const occupant = chess.get(played.from);
        if (!occupant) return;
        const piece = occupant.color === "w" ? occupant.type.toUpperCase() : occupant.type;
        const captured = played.captured
          ? played.color === "w"
            ? played.captured
            : played.captured.toUpperCase()
          : undefined;
        setLastMove({ from: played.from, to: played.to });
        setSlide({ from: played.from, to: played.to, piece, captured });
        await later(SLIDE_MS + 50);
        if (cancelled) return;
        chess = next;
        setFen(chess.fen());
        setPly(i + 1);
        setSlide(null);
        await later(MOVE_GAP_MS);
      }
    };

    if (run % CYCLE === MEMORY_SLOT) {
      void playMemory();
    } else {
      void (async () => {
        setPhase("practice");
        await playLine(true);
        if (cancelled) return;
        await later(HOLD_MS);
        if (cancelled) return;
        setPhase("test");
        await playLine(false);
        if (cancelled) return;
        await later(HOLD_MS);
        if (!cancelled) setRun((n) => n + 1);
      })();
    }

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [run, script, side]);

  const expected = useMemo((): Move | null => {
    if (phase !== "practice" || !showHint) return null;
    const san = script[ply];
    if (!san) return null;
    const probe = new Chess(fen);
    return probe.moves({ verbose: true }).find((move) => move.san === san) ?? null;
  }, [fen, phase, ply, script, showHint]);

  return (
    <div className="landing-demo" data-landing-demo data-landing-demo-phase={phase} data-landing-demo-ply={ply}>
      {phase === "memory" ? (
        <p className="landing-memory-invite" data-landing-memory-invite>
          Try the new Square Memory game for free.
        </p>
      ) : (
        <div className="landing-demo-modes" role="group" aria-label="Legal’s Mate demo">
          <span className={`landing-demo-tab${phase === "practice" ? " is-active" : ""}`}>Practice</span>
          <span
            className={`landing-demo-tab${phase === "test" ? " is-active mode-tab-nudge-yellow" : ""}`}
            data-test-flash={phase === "test" ? "yellow" : undefined}
          >
            Test
          </span>
        </div>
      )}
      <p className="sr-only">
        {phase === "memory"
          ? "Try the new Square Memory game for free. Tap Square Memory game to play."
          : "Legal’s Mate plays on its own. Practice with hints, then Test with none."}
      </p>
      <ChessBoard
        game={game}
        flip={false}
        selected={null}
        wrongUntil={null}
        expected={expected}
        showHints={phase === "practice" && showHint}
        lastMove={lastMove}
        slide={slide}
        memoryFlash={flash}
        onSquare={() => {}}
        interactive={false}
      />
      {phase === "memory" ? (
        <div className="landing-memory-pop" data-landing-memory-pop>
          <img src={BIG_RED} alt="Big Red" width={360} height={800} draggable={false} />
          <p className="landing-memory-note" data-landing-memory-note>
            Try Square Memory free. Tap Square Memory game to play.
          </p>
        </div>
      ) : null}
    </div>
  );
}
