import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Chess, type Square, type Move } from "chess.js";
import type { OpeningLine, Pack } from "@/data/packs";
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

  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const expectedMove = useCallback(
    (g: Chess, idx: number): Move | null => {
      if (idx >= line.plies.length) return null;
      const san = line.plies[idx]!;
      const tmp = new Chess(g.fen());
      const moves = tmp.moves({ verbose: true });
      return moves.find((m) => m.san === san) || null;
    },
    [line.plies],
  );

  const isUserTurn = useCallback(
    (g: Chess) => g.turn() === line.side,
    [line.side],
  );

  const scheduleHints = useCallback(() => {
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
    setHintsReady(false);
    hintTimer.current = setTimeout(() => {
      setHintsReady(true);
      hintTimer.current = null;
    }, HINT_REVEAL_MS);
  }, []);

  const resetLine = useCallback(
    (nextMode?: Mode) => {
      clearAllTimers();
      pendingCommit.current = null;
      setSlide(null);
      setBusy(false);
      setLastMove(null);
      setHintsReady(true);
      setGame(new Chess());
      setPlyIndex(0);
      setSelected(null);
      setWrongUntil(null);
      setStatus({
        text:
          (nextMode ?? mode) === "learn" ? "Your move (hint on)" : "Your move",
        cls: "",
      });
      setSession((s) => s + 1);
    },
    [clearAllTimers, mode],
  );

  const changeMode = (m: Mode) => {
    setMode(m);
    resetLine(m);
  };

  const beginSlide = useCallback(
    (
      from: Square,
      to: Square,
      pieceCode: string,
      nextGame: Chess,
      nextPly: number,
      userMove: boolean,
    ) => {
      setSelected(null);
      setBusy(true);
      setHintsReady(false);
      pendingCommit.current = {
        nextGame,
        nextPly,
        move: { from, to },
        userMove,
      };
      setSlide({ from, to, piece: pieceCode });
      soundMove();
    },
    [],
  );

  const onSlideComplete = useCallback(() => {
    const pending = pendingCommit.current;
    if (!pending) {
      setSlide(null);
      setBusy(false);
      return;
    }
    pendingCommit.current = null;
    setGame(pending.nextGame);
    setPlyIndex(pending.nextPly);
    setLastMove(pending.move);
    setSlide(null);
    setBusy(false);

    if (pending.nextPly >= line.plies.length) {
      setStatus({ text: "Line complete — well done!", cls: "done" });
      soundWin();
      return;
    }

    if (pending.userMove) {
      soundOk();
      setStatus({ text: "Good", cls: "ok" });
      setHintsReady(false);
    } else {
      setStatus({
        text: mode === "learn" ? "Your move (hint on)" : "Your move",
        cls: "",
      });
      if (mode === "learn") scheduleHints();
      else setHintsReady(true);
    }
  }, [line.plies.length, mode, scheduleHints]);

  useEffect(() => {
    clearReplyTimer();
    if (busy || slide) return;
    if (plyIndex >= line.plies.length) return;
    if (isUserTurn(game)) return;

    setStatus({ text: "…", cls: "" });
    setHintsReady(false);
    const idx = plyIndex;
    const fenNow = game.fen();

    replyTimer.current = setTimeout(() => {
      const g = new Chess(fenNow);
      const exp = expectedMove(g, idx);
      if (!exp) return;
      const pieceCode = fenPieceAt(g, exp.from as Square);
      if (!pieceCode) return;
      const next = new Chess(fenNow);
      const ok = next.move({
        from: exp.from,
        to: exp.to,
        promotion: exp.promotion || "q",
      });
      if (!ok) return;
      beginSlide(
        exp.from as Square,
        exp.to as Square,
        pieceCode,
        next,
        idx + 1,
        false,
      );
    }, OPPONENT_THINK_MS);

    return clearReplyTimer;
  }, [
    plyIndex,
    game,
    busy,
    slide,
    session,
    line.plies.length,
    isUserTurn,
    expectedMove,
    clearReplyTimer,
    beginSlide,
  ]);

  const onSquare = (sq: Square) => {
    if (busy || slide) return;
    if (plyIndex >= line.plies.length) return;
    if (!isUserTurn(game)) return;

    const piece = game.get(sq);

    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game
        .moves({ square: selected, verbose: true })
        .find((m) => m.to === sq);
      if (legal) {
        tryPlay(selected, sq, legal.promotion);
        return;
      }
      if (piece && piece.color === game.turn()) {
        setSelected(sq);
        soundSelect();
        return;
      }
      setSelected(null);
      return;
    }

    if (piece && piece.color === game.turn()) {
      setSelected(sq);
      soundSelect();
    }
  };

  const tryPlay = (from: Square, to: Square, promotion?: string) => {
    const exp = expectedMove(game, plyIndex);
    if (!exp) return;
    if (exp.from !== from || exp.to !== to) {
      soundBad();
      setWrongUntil(to);
      setStatus({ text: "Wrong move — try again", cls: "bad" });
      setSelected(null);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongUntil(null), 450);
      return;
    }

    const pieceCode = fenPieceAt(game, from);
    if (!pieceCode) return;

    const next = new Chess(game.fen());
    const move = next.move({
      from,
      to,
      promotion: promotion || exp.promotion || "q",
    });
    if (!move) return;

    beginSlide(from, to, pieceCode, next, plyIndex + 1, true);
  };

  const exp = expectedMove(game, plyIndex);
  const userTurn = isUserTurn(game) && !busy && !slide;
  const showHints =
    mode === "learn" &&
    userTurn &&
    hintsReady &&
    plyIndex < line.plies.length;

  const hint = showHints && exp ? `Play: ${line.plies[plyIndex]}` : "";

  const statusColor =
    status.cls === "ok"
      ? "text-success font-semibold"
      : status.cls === "bad"
        ? "text-danger font-semibold"
        : status.cls === "done"
          ? "text-accent font-bold"
          : "text-fg-muted";

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-2.5 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        ← Packs
      </button>
      <h2 className="m-0 font-display text-[1.25rem] font-bold">{line.name}</h2>
      <div className="text-[0.78rem] text-fg-subtle">
        {pack.name} · train as {line.side === "b" ? "Black" : "White"}
      </div>

      <div className="my-3.5 flex gap-1.5 rounded-full bg-bg-subtle p-1">
        <ModeTab active={mode === "learn"} onClick={() => changeMode("learn")}>
          Learn
        </ModeTab>
        <ModeTab
          active={mode === "practice"}
          onClick={() => changeMode("practice")}
        >
          Practice
        </ModeTab>
      </div>

      <div
        className={`mb-2 min-h-[1.2em] text-center text-[0.85rem] font-semibold text-accent transition-opacity duration-200 ${
          hint ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint || "\u00a0"}
      </div>

      <ChessBoard
        game={game}
        flip={line.side === "b"}
        selected={selected}
        wrongUntil={wrongUntil}
        expected={exp}
        showHints={showHints}
        lastMove={lastMove}
        slide={slide}
        onSlideComplete={onSlideComplete}
        onSquare={onSquare}
        interactive={!busy && !slide}
      />

      <div
        className={`mb-3 min-h-[1.4em] text-center text-[0.9rem] transition-opacity duration-200 ${statusColor}`}
      >
        {status.text}
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => resetLine()}
          className="rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full bg-accent px-4 py-2 text-[0.82rem] font-semibold text-accent-fg active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2.5 text-[0.82rem] font-semibold ${
        active
          ? "bg-bg-elevated text-fg shadow-sm"
          : "bg-transparent text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}
