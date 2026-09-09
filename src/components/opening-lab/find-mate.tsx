import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useT } from "@/lib/i18n";
import {
  loadMateSession,
  matePuzzles,
  saveMateIndex,
  type MatePuzzle,
  type MateSession,
} from "@/lib/find-mate";
import { ChessBoard } from "./chess-board";

type Props = { onBack: () => void };

const RESET_MS = 520;

export function FindMate({ onBack }: Props) {
  const t = useT();
  const session = useMemo(() => loadMateSession(), []);
  if (!session) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
        >
          {t("← Back")}
        </button>
      </div>
    );
  }
  if (session.done || !session.puzzle) {
    return <FindMateDone session={session} onBack={onBack} />;
  }
  return <FindMateSet initial={session} onBack={onBack} />;
}

function BackButton({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
    >
      {t("← Back")}
    </button>
  );
}

function FindMateDone({ session, onBack }: { session: MateSession; onBack: () => void }) {
  const t = useT();
  return (
    <div>
      <BackButton onBack={onBack} />
      <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {t("Mate in one")}
      </p>
      <h1 className="mb-3 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Find the mate")}
      </h1>
      <p className="mb-3 text-[0.8rem] font-semibold text-fg-muted">
        {t("{n} of {total}", { n: session.total, total: session.total })}
      </p>
      <div className="rounded-2xl bg-success-soft px-4 py-3.5" role="status">
        <p className="m-0 text-[0.95rem] font-bold text-success">{t("Done")}</p>
      </div>
    </div>
  );
}

function FindMateSet({ initial, onBack }: { initial: MateSession; onBack: () => void }) {
  const pool = useMemo(() => matePuzzles(), []);
  const [index, setIndex] = useState(initial.index);
  const puzzle = pool[index];
  if (!puzzle || index >= pool.length) {
    return <FindMateDone session={{ ...initial, index: pool.length, done: true }} onBack={onBack} />;
  }
  return (
    <FindMateRound
      key={puzzle.id}
      date={initial.date}
      index={index}
      total={pool.length}
      puzzle={puzzle}
      onBack={onBack}
      onNext={() => setIndex((n) => n + 1)}
    />
  );
}

function FindMateRound({
  date,
  index,
  total,
  puzzle,
  onBack,
  onNext,
}: {
  date: string;
  index: number;
  total: number;
  puzzle: MatePuzzle;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();
  const gameRef = useRef(new Chess(puzzle.fen));
  const [, bumpBoard] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [solved, setSolved] = useState(false);
  const [notMate, setNotMate] = useState(false);
  const [busy, setBusy] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const last = index + 1 >= total;

  useEffect(() => {
    gameRef.current = new Chess(puzzle.fen);
    bumpBoard((n) => n + 1);
    return () => {
      if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
    };
  }, [puzzle.fen, puzzle.id]);

  const resetBoard = () => {
    gameRef.current = new Chess(puzzle.fen);
    setSelected(null);
    setLastMove(null);
    bumpBoard((n) => n + 1);
  };

  const finishMate = (from: Square, to: Square) => {
    setSelected(null);
    setLastMove({ from, to });
    setNotMate(false);
    setSolved(true);
    saveMateIndex(date, index + 1);
    bumpBoard((n) => n + 1);
  };

  const rejectMove = (from: Square, to: Square) => {
    setSelected(null);
    setLastMove({ from, to });
    setNotMate(true);
    setBusy(true);
    bumpBoard((n) => n + 1);
    if (resetTimer.current != null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      resetTimer.current = null;
      resetBoard();
      setBusy(false);
    }, RESET_MS);
  };

  const tryMove = (from: Square, to: Square) => {
    if (solved || busy) return;
    const game = gameRef.current;
    const piece = game.get(from);
    if (!piece || piece.color !== game.turn()) return;
    const legal = game.moves({ square: from, verbose: true }).some((move) => move.to === to);
    if (!legal) return;
    const played = game.move({ from, to, promotion: "q" });
    if (!played) return;
    if (game.isCheckmate()) {
      finishMate(played.from, played.to);
      return;
    }
    rejectMove(played.from, played.to);
  };

  const onSquare = (sq: Square) => {
    if (solved || busy) return;
    const game = gameRef.current;
    const piece = game.get(sq);

    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game
        .moves({ square: selected, verbose: true })
        .some((move) => move.to === sq);
      if (legal) {
        tryMove(selected, sq);
        return;
      }
      if (piece && piece.color === game.turn()) {
        setNotMate(false);
        setSelected(sq);
        return;
      }
      return;
    }

    if (piece && piece.color === game.turn()) {
      setNotMate(false);
      setSelected(sq);
    }
  };

  return (
    <div>
      <BackButton onBack={onBack} />

      <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        {t("Mate in one")}
      </p>
      <h1 className="mb-1 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Find the mate")}
      </h1>
      <p className="mb-3 text-[0.8rem] font-semibold text-fg-muted">
        {t("{n} of {total}", { n: index + 1, total })}
      </p>

      <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-border bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="px-2 pb-3 pt-2">
          <ChessBoard
            key={puzzle.id}
            game={gameRef.current}
            flip={puzzle.side === "b"}
            selected={selected}
            wrongUntil={null}
            expected={null}
            showHints={false}
            lastMove={lastMove}
            slide={null}
            onSquare={onSquare}
            onPlay={tryMove}
            interactive={!solved && !busy}
          />
        </div>
      </div>

      {notMate && !solved ? (
        <div className="mt-4 rounded-2xl bg-danger-soft px-4 py-3.5" role="status">
          <p className="m-0 text-[0.95rem] font-bold text-danger">{t("Not mate")}</p>
        </div>
      ) : null}

      {solved ? (
        <div className="mt-4 rounded-2xl bg-success-soft px-4 py-3.5" role="status">
          <p className="m-0 text-[0.95rem] font-bold text-success">{t("Correct")}</p>
          {last ? (
            <p className="m-0 mt-1 text-[0.8rem] text-fg-muted">{t("Done")}</p>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 min-h-11 rounded-full bg-accent px-4 py-2 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              {t("Next")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

