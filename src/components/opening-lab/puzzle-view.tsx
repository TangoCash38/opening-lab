import { useEffect, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { useT } from "@/lib/i18n";
import { starterPuzzle, type LabPuzzle } from "@/lib/lab-puzzle";
import { soundBad, soundMove, soundWin } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";

type Props = { onBack: () => void };

const REPLY_MS = 450;
const WRONG_MS = 700;

function normSan(san: string) {
  return san.replace(/[+#]/g, "");
}

function findSanMove(game: Chess, san: string): Move | null {
  const target = normSan(san);
  return game.moves({ verbose: true }).find((move) => normSan(move.san) === target) ?? null;
}

/**
 * One mate on the website. The player makes the mating moves; the reply in
 * the line is auto-played. A wrong move snaps back. Nothing continues after mate.
 */
export function PuzzleView({ onBack }: Props) {
  const [round, setRound] = useState(0);
  const puzzle = starterPuzzle();
  return (
    <PuzzleRound
      key={round}
      puzzle={puzzle}
      onBack={onBack}
      onRetry={() => setRound((n) => n + 1)}
    />
  );
}

function PuzzleRound({
  puzzle,
  onBack,
  onRetry,
}: {
  puzzle: LabPuzzle;
  onBack: () => void;
  onRetry: () => void;
}) {
  const t = useT();
  const gameRef = useRef(new Chess(puzzle.fen));
  const stepRef = useRef(0);
  const lastMoveRef = useRef<{ from: Square; to: Square } | null>(null);
  const timer = useRef<number | null>(null);
  const [, bump] = useState(0);
  const [step, setStepState] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [wrongUntil, setWrongUntil] = useState<Square | null>(null);
  const [status, setStatus] = useState<"play" | "wrong" | "solved">("play");
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const setStep = (next: number) => {
    stepRef.current = next;
    setStepState(next);
  };

  useEffect(() => {
    return () => {
      if (timer.current != null) window.clearTimeout(timer.current);
    };
  }, []);

  const playerTurn = step % 2 === 0 && status !== "solved";
  const hintSan = playerTurn ? puzzle.line[step] : undefined;
  const hintMove =
    showHint && hintSan && !busy ? findSanMove(gameRef.current, hintSan) : null;

  const accept = (played: Move) => {
    const at = stepRef.current;
    setSelected(null);
    setShowHint(false);
    setWrongUntil(null);
    setStatus("play");
    const mark = { from: played.from, to: played.to };
    setLastMove(mark);
    lastMoveRef.current = mark;
    bump((n) => n + 1);

    if (gameRef.current.isCheckmate()) {
      setStep(at + 1);
      setStatus("solved");
      setBusy(false);
      soundWin();
      return;
    }

    const replySan = puzzle.line[at + 1];
    if (!replySan) {
      setStep(at + 1);
      setBusy(false);
      return;
    }

    soundMove();
    setStep(at + 1);
    setBusy(true);
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      const reply = gameRef.current.move(replySan);
      if (!reply) {
        setBusy(false);
        bump((n) => n + 1);
        return;
      }
      soundMove();
      const replyMark = { from: reply.from, to: reply.to };
      setLastMove(replyMark);
      lastMoveRef.current = replyMark;
      setStep(at + 2);
      setBusy(false);
      bump((n) => n + 1);
    }, REPLY_MS);
  };

  const reject = (played: Move) => {
    soundBad();
    setSelected(null);
    setShowHint(false);
    setWrongUntil(played.to);
    setLastMove({ from: played.from, to: played.to });
    setStatus("wrong");
    setBusy(true);
    bump((n) => n + 1);
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      gameRef.current.undo();
      setWrongUntil(null);
      setLastMove(lastMoveRef.current);
      setBusy(false);
      bump((n) => n + 1);
    }, WRONG_MS);
  };

  const tryMove = (from: Square, to: Square) => {
    if (busy || status === "solved") return;
    const stepNow = stepRef.current;
    if (stepNow % 2 !== 0) return;
    const expected = puzzle.line[stepNow];
    if (!expected) return;
    const game = gameRef.current;
    const legal = game.moves({ square: from, verbose: true }).find((move) => move.to === to);
    if (!legal) return;
    const played = game.move({ from, to, promotion: legal.promotion ?? "q" });
    if (!played) return;
    if (normSan(played.san) === normSan(expected)) {
      accept(played);
      return;
    }
    reject(played);
  };

  const onSquare = (sq: Square) => {
    if (busy || status === "solved") return;
    const game = gameRef.current;
    const piece = game.get(sq);

    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game.moves({ square: selected, verbose: true }).some((move) => move.to === sq);
      if (legal) {
        tryMove(selected, sq);
        return;
      }
      if (piece && piece.color === game.turn()) {
        setStatus((prev) => (prev === "wrong" ? "play" : prev));
        setSelected(sq);
        return;
      }
      return;
    }

    if (piece && piece.color === game.turn()) {
      setStatus((prev) => (prev === "wrong" ? "play" : prev));
      setSelected(sq);
    }
  };

  return (
    <div data-puzzle>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        {t("← Back")}
      </button>

      <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {t(puzzle.label)}
      </p>
      <h1 className="mb-1 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Today's puzzle")}
      </h1>
      <p
        className="mb-3 text-[0.9rem] font-semibold text-fg-muted"
        data-puzzle-caption
      >
        {t(puzzle.caption)}
      </p>

      <div className="mx-auto w-full max-w-[420px]">
        <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-border bg-bg-elevated shadow-[var(--shadow-card)]">
          <div className="px-2 pb-3 pt-2">
            <ChessBoard
              game={gameRef.current}
              flip={puzzle.side === "b"}
              selected={selected}
              wrongUntil={wrongUntil}
              expected={hintMove}
              showHints={hintMove != null}
              lastMove={lastMove}
              slide={null}
              onSquare={onSquare}
              onPlay={tryMove}
              interactive={!busy && status !== "solved"}
            />
          </div>
        </div>

        {status !== "solved" ? (
          <button
            type="button"
            data-puzzle-hint
            disabled={busy || !playerTurn}
            onClick={() => setShowHint((on) => !on)}
            className="mt-3 min-h-11 rounded-full bg-bg-subtle px-4 py-2 text-[0.92rem] font-semibold text-fg-muted active:opacity-80 disabled:opacity-50"
          >
            {t("Hint")}
          </button>
        ) : null}

        {status === "wrong" ? (
          <p
            className="mt-3 text-[0.95rem] font-semibold text-fg-muted"
            role="status"
            data-puzzle-status="wrong"
          >
            {t("Not quite")}
          </p>
        ) : null}

        {status === "solved" ? (
          <div
            className="mt-4 rounded-2xl bg-success-soft px-4 py-3.5"
            role="status"
            data-puzzle-status="solved"
          >
            <p className="m-0 text-[0.95rem] font-bold text-success">{t("Correct")}</p>
            <p className="m-0 mt-1 text-[0.85rem] text-fg-muted">{t("That's mate.")}</p>
            <button
              type="button"
              data-puzzle-retry
              onClick={onRetry}
              className="mt-3 min-h-11 rounded-full bg-accent px-4 py-2 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              {t("Retry")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
