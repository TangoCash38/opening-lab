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
  initialMode?: Mode;
  onLineComplete?: () => void;
  onLearnDone?: () => void;
  onPracticeFail?: () => void;
  onTrainNext?: () => void;
  hasNextDue?: boolean;
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

export function TrainView({ pack, line, onBack, initialMode = "learn", onLineComplete, onLearnDone, onPracticeFail, onTrainNext, hasNextDue }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const completedRef = useRef(false);
  const practiceMissedRef = useRef(false);
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
  const [nudgeTest, setNudgeTest] = useState(false);

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
      setBanner(nextPunishmentBannerState({ kind: "idle" }, { type: "reset" }));
      setStatus({
        text:
          (nextMode ?? mode) === "learn" ? "Your move (Practice)" : "Your move",
        cls: "",
      });
      completedRef.current = false;
      practiceMissedRef.current = false;
      setSession((s) => s + 1);
    },
    [clearAllTimers, mode],
  );

  const changeMode = (m: Mode) => {
    if (m === "practice") setNudgeTest(false);
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

    // Punishment drill: opponent just played the intentional blunder
    if (
      line.punishment &&
      isMistakeJustPlayed(
        line.punishment.mistakePlyIndex,
        pending.nextPly,
        pending.userMove,
      )
    ) {
      setBanner(
        nextPunishmentBannerState(
          { kind: "idle" },
          {
            type: "mistake_played",
            banner: line.punishment.banner,
            prompt: line.punishment.prompt,
          },
        ),
      );
      setStatus({
        text: line.punishment.prompt ?? "Find the punishment",
        cls: "warn",
      });
      if (mode === "learn") scheduleHints();
      else setHintsReady(true);
      return;
    }

    if (pending.nextPly >= line.plies.length) {
      if (line.punishment) {
        setBanner(
          nextPunishmentBannerState(
            { kind: "idle" },
            {
              type: "line_complete",
              explanation: line.punishment.successExplanation,
            },
          ),
        );
      }

      if (mode === "learn") {
        setNudgeTest(true);
        setStatus({
          text: "Practice done — now Test with no hints",
          cls: "done",
        });
        soundWin();
        if (!completedRef.current) {
          completedRef.current = true;
          onLearnDone?.();
        }
        return;
      }

      if (practiceMissedRef.current) {
        setStatus({
          text: "Finished, but you missed a move — Test again to go green",
          cls: "done",
        });
        soundWin();
        return;
      }

      setStatus({
        text: line.punishment
          ? "Punishment found — well done!"
          : "Line complete — well done!",
        cls: "done",
      });
      soundWin();
      if (!completedRef.current) {
        completedRef.current = true;
        onLineComplete?.();
      }
      return;
    }

    if (pending.userMove) {
      soundOk();
      // Keep blunder banner visible through the punish sequence
      setStatus({ text: "Good", cls: "ok" });
      setHintsReady(false);
    } else {
      setStatus({
        text: mode === "learn" ? "Your move (Practice)" : "Your move",
        cls: "",
      });
      if (mode === "learn") scheduleHints();
      else setHintsReady(true);
    }
  }, [line.plies.length, line.punishment, mode, scheduleHints, onLineComplete, onLearnDone]);

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
      if (mode === "practice") {
        practiceMissedRef.current = true;
        onPracticeFail?.();
      }
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

  const notationPairs = buildNotationPairs(line.plies, plyIndex);
  const n = pack.lines.findIndex((l) => l.id === line.id) + 1;

  // Keep the active (last-played) move visible in the horizontal strip
  useEffect(() => {
    activeMoveRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [plyIndex]);

  const statusColor =
    status.cls === "ok"
      ? "text-success font-semibold"
      : status.cls === "bad"
        ? "text-danger font-semibold"
        : status.cls === "warn"
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
      <h2 className="m-0 font-display text-[1.25rem] font-bold">
        Line {n} of {pack.lines.length}
      </h2>
      <div className="mt-0.5 text-[0.95rem] font-semibold">{line.name}</div>
      <div className="text-[0.78rem] text-fg-subtle">
        {pack.name} · train as {line.side === "b" ? "Black" : "White"}
      </div>

      {line.players ? (
        <div className="mt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-tag-white-bg px-3 py-2">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-tag-white-fg/70">
                White
              </div>
              <div className="mt-0.5 text-[0.85rem] font-semibold text-tag-white-fg">
                {line.players.white}
              </div>
            </div>
            <div className="rounded-xl bg-tag-black-bg px-3 py-2">
              <div className="text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-tag-black-fg/70">
                Black
              </div>
              <div className="mt-0.5 text-[0.85rem] font-semibold text-tag-black-fg">
                {line.players.black}
              </div>
            </div>
          </div>
          {line.players.event ? (
            <div className="mt-1.5 text-center text-[0.72rem] text-fg-subtle">
              {line.players.event}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="my-3.5 flex gap-1.5 rounded-full bg-bg-subtle p-1">
        <ModeTab active={mode === "learn"} onClick={() => changeMode("learn")}>
          Practice
        </ModeTab>
        <ModeTab
          active={mode === "practice"}
          onClick={() => changeMode("practice")}
          nudge={nudgeTest}
        >
          Test
        </ModeTab>
      </div>

      <div
        className={`mb-2 min-h-[1.2em] text-center text-[0.85rem] font-semibold text-accent transition-opacity duration-200 ${
          hint ? "opacity-100" : "opacity-0"
        }`}
      >
        {hint || "\u00a0"}
      </div>

      {banner.kind === "blunder" && (
        <div
          role="status"
          className="mb-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_28%,transparent)] bg-[var(--color-danger-soft)] px-3 py-2.5 text-center"
        >
          <div className="text-[0.82rem] font-bold text-[var(--color-danger)]">
            {banner.message}
          </div>
          {banner.prompt ? (
            <div className="mt-1 text-[0.72rem] font-medium text-fg-muted">
              {banner.prompt}
            </div>
          ) : null}
        </div>
      )}

      {banner.kind === "success" && (
        <div
          role="status"
          className="mb-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)] bg-[var(--color-success-soft)] px-3 py-2.5 text-center"
        >
          <div className="text-[0.82rem] font-bold text-[var(--color-success)]">
            Punishment secured
          </div>
          <div className="mt-1 text-[0.78rem] font-medium text-fg-muted">
            {banner.message}
          </div>
        </div>
      )}

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

      {/* Move history notation strip — horizontal, scrollable */}
      <div
        ref={notationStripRef}
        className="mt-2.5 mb-1 flex gap-1.5 overflow-x-auto rounded-xl border border-border bg-bg-elevated px-2.5 py-2 scrollbar-thin"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-label="Move history"
      >
        {notationPairs.length === 0 ? (
          <span className="text-[0.78rem] text-fg-subtle">Moves will appear here…</span>
        ) : (
          notationPairs.map((pair) => (
            <span
              key={pair.num}
              ref={pair.active ? activeMoveRef : undefined}
              className={`shrink-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.78rem] tabular-nums ${
                pair.active
                  ? "bg-accent/12 font-bold text-accent"
                  : "text-fg-muted"
              }`}
            >
              <span className="text-fg-subtle">{pair.num}.</span>{" "}
              <span>{pair.white}</span>
              {pair.black ? (
                <>
                  {" "}
                  <span>{pair.black}</span>
                </>
              ) : null}
            </span>
          ))
        )}
      </div>

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
          Done</button>
        {status.cls === "done" && mode === "learn" ? (
          <button
            type="button"
            onClick={() => changeMode("practice")}
            className="min-h-11 rounded-full bg-accent px-4 py-2.5 text-[0.85rem] font-bold text-accent-fg active:scale-95"
          >
            Start Test
          </button>
        ) : null}
        {status.cls === "done" && mode === "practice" ? (
          <button type="button" onClick={onTrainNext ?? onBack} className="min-h-11 rounded-full bg-accent px-4 py-2.5 text-[0.85rem] font-bold text-accent-fg active:scale-95">
            Train next due
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
  nudge,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  nudge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2.5 text-[0.82rem] font-semibold ${
        nudge
          ? "mode-tab-nudge"
          : active
            ? "bg-bg-elevated text-fg shadow-sm"
            : "bg-transparent text-fg-muted"
      }`}
    >
      {children}
    </button>
  );
}
