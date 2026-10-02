import { useEffect, useMemo, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { legalMateLine } from "@/lib/legal-mate";
import { ChessBoard, SLIDE_MS, type SlideAnim } from "./chess-board";
import { FreeTryCard } from "./free-try-card";

const START_FEN = new Chess().fen();
const HINT_MS = 480;
const THINK_MS = 260;
const GAP_MS = 140;
const HOLD_MS = 800;

type Phase = "practice" | "test";

type Props = {
  onBuyAll: () => void;
  onPickPack: () => void;
  onMoreFree: () => void;
  onFeedback: () => void;
};

/**
 * Homepage board. Legal’s Mate plays itself: Practice with hints, then Test
 * with none. The visitor never moves a piece. The pack offer stays in view.
 */
export function LandingMateDemo({ onBuyAll, onPickPack, onMoreFree, onFeedback }: Props) {
  const script = useMemo(() => legalMateLine()?.line.plies ?? [], []);
  const side = useMemo(() => legalMateLine()?.line.side ?? "w", []);
  const [fen, setFen] = useState(START_FEN);
  const [ply, setPly] = useState(0);
  const [phase, setPhase] = useState<Phase>("practice");
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [showHint, setShowHint] = useState(false);
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

    const playLine = async (withHints: boolean) => {
      let chess = new Chess();
      setFen(chess.fen());
      setPly(0);
      setSlide(null);
      setLastMove(null);
      setShowHint(false);
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
        await later(GAP_MS);
      }
    };

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
    <>
      <div className="landing-demo" data-landing-demo data-landing-demo-phase={phase} data-landing-demo-ply={ply}>
        <div className="landing-demo-modes" role="group" aria-label="Legal’s Mate demo">
          <span className={`landing-demo-tab${phase === "practice" ? " is-active" : ""}`}>Practice</span>
          <span
            className={`landing-demo-tab${phase === "test" ? " is-active mode-tab-nudge-yellow" : ""}`}
            data-test-flash={phase === "test" ? "yellow" : undefined}
          >
            Test
          </span>
        </div>
        <p className="sr-only">
          Legal’s Mate plays on its own. Practice with hints, then Test with none.
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
          onSquare={() => {}}
          interactive={false}
        />
      </div>
      <FreeTryCard
        placement="beside"
        onBuyAll={onBuyAll}
        onPickPack={onPickPack}
        onMoreFree={onMoreFree}
        onTryAgain={() => setRun((n) => n + 1)}
        onFeedback={onFeedback}
      />
    </>
  );
}
