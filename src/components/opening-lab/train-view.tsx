import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Chess, type Square, type Move } from "chess.js";
import {
  type OpeningLine,
  type Pack,
} from "@/data/packs";
import { nextUnlockedLine } from "@/lib/catalog";
import {
  soundBad,
  soundCapture,
  soundMateBoom,
  soundMove,
  soundOk,
  soundSelect,
  soundWin,
} from "@/lib/sounds";
import { useT, type Translate } from "@/lib/i18n";
import {
  formatOpeningIdentity,
  lookupOpeningIdentityPrefix,
} from "@/lib/opening-identity";
import { useUnlocks } from "@/hooks/use-unlocks";
import { getBoardTheme } from "@/lib/board-theme";
import { warmupEndPly } from "@/lib/london-warmup";
import { ChessBoard, type SlideAnim } from "./chess-board";
import { LineCompleteBurst } from "./line-complete-burst";
import { LineFeedback } from "./line-feedback";
import { PackAboutModal } from "./pack-about-modal";
import { LineResultModal } from "./line-result-modal";

type Mode = "learn" | "practice";

type Props = {
  initialMode?: Mode;
  /** Keep parent active.mode in sync without remounting on Practice↔Test. */
  onModeChange?: (mode: Mode) => void;
  onLineComplete?: () => void;
  onLearnDone?: () => void;
  onPracticeFail?: () => void;
  /** Persist best Test ply after a successful book ply lands. */
  onTestPly?: (plyIndex: number) => void;
  onTrainNext?: () => void;
  hasNextDue?: boolean;
  onPracticeNext?: (line: OpeningLine) => void;
  pack: Pack;
  line: OpeningLine;
  onBack: () => void;
  /** Create-your-own gym line: custom chrome, Test gated until Practice. */
  gym?: boolean;
  testLocked?: boolean;
  /** Cap this session at startPly + plyLimit book plies (London warm-up). */
  plyLimit?: number;
  startPly?: number;
};

type ResultNextAction = "practiceNext" | "testYourself" | "learn";

function endResultCard(
  line: OpeningLine,
  pack: Pack,
  purchased: readonly string[],
  caption: string,
  t: Translate,
  nextAction?: Exclude<ResultNextAction, "learn"> | "practiceAgain",
  subscribed = false,
) {
  const unlockIds = subscribed ? [pack.id] : purchased;
  const nextLine = nextUnlockedLine(pack, line.id, unlockIds);
  const plan = (line.next ?? line.idea ?? "").trim();

  if (nextAction === "practiceAgain") {
    const spiel = t("Missed a move — practice again to lock it");
    return {
      kind: "end" as const,
      title: line.name,
      caption,
      body: plan ? `${spiel}\n\n${plan}` : spiel,
      actionLabel: nextLine ? t("Try next line") : t("Practice again"),
      primaryLabel: nextLine ? t("Practice again") : undefined,
      nextAction: "learn" as const,
      secondaryAction: nextLine ? ("practiceNext" as const) : undefined,
    };
  }

  const primaryLabel =
    nextAction === "testYourself"
      ? t("Test yourself")
      : nextAction === "practiceNext" && nextLine
        ? t("Practice next line")
        : undefined;
  return {
    kind: "end" as const,
    title: line.name,
    caption,
    body: (line.next ?? line.idea ?? "").trim(),
    actionLabel: t("Well done"),
    primaryLabel,
    nextAction: primaryLabel ? nextAction : undefined,
  };
}

const OPPONENT_THINK_MS = 420;
const HINT_REVEAL_MS = 180;

function fenPieceAt(g: Chess, sq: Square): string | null {
  const p = g.get(sq);
  if (!p) return null;
  return p.color === "w" ? p.type.toUpperCase() : p.type.toLowerCase();
}

/** Victim piece code from a chess.js Move (Arcade blast). */
function capturedCodeFromMove(m: { color: string; captured?: string }): string | undefined {
  if (!m.captured) return undefined;
  return m.color === "w" ? m.captured : m.captured.toUpperCase();
}

function findKingSquare(g: Chess, color: "w" | "b"): Square | null {
  const rows = g.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = rows[r]![c];
      if (p && p.type === "k" && p.color === color) {
        return `${"abcdefgh"[c]!}${8 - r}` as Square;
      }
    }
  }
  return null;
}

/** Group SAN plies into standard move pairs for the notation strip. */
type NotationPair = {
  num: number;
  white: string;
  black?: string;
  /** True when this pair contains the most recently played ply */
  active: boolean;
};

function buildNotationPairs(
  plies: string[],
  playedCount: number,
  highlightPly?: number,
): NotationPair[] {
  const pairs: NotationPair[] = [];
  // Only include plies that have actually been played
  for (let i = 0; i < playedCount; i += 2) {
    const moveNum = i / 2 + 1;
    const white = plies[i]!;
    const black = i + 1 < playedCount ? plies[i + 1] : undefined;
    // Active if the viewed ply (or last played ply) sits in this pair
    const lastPlayed = (highlightPly !== undefined ? highlightPly : playedCount) - 1;
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

function safeMove(
  chess: Chess,
  move: string | { from: string; to: string; promotion?: string },
): Move | null {
  try {
    const result = chess.move(move);
    return result || null;
  } catch {
    return null;
  }
}

/** Replay SAN; stop on the first illegal ply without throwing. */
function replaySans(sans: string[], count: number): Chess {
  const g = new Chess();
  for (let i = 0; i < count; i++) {
    const san = sans[i];
    if (!san || !safeMove(g, san)) break;
  }
  return g;
}

/**
 * Apply a move while keeping the full move history.
 * Never rebase with `new Chess(fen)` — that leaves history length 1.
 */
function cloneAndMove(
  game: Chess,
  move: { from: string; to: string; promotion?: string },
): { next: Chess; move: Move } | null {
  const next = new Chess();
  for (const san of game.history()) {
    if (!safeMove(next, san)) return null;
  }
  const played = safeMove(next, move);
  if (!played) return null;
  return { next, move: played };
}

function pieceCodeFromVerbose(m: {
  color: string;
  piece: string;
  promotion?: string | undefined;
}): string {
  const t = m.promotion || m.piece;
  return m.color === "w" ? t.toUpperCase() : t.toLowerCase();
}

function lastMoveSquares(g: Chess): { from: Square; to: Square } | null {
  const hist = g.history({ verbose: true });
  const m = hist[hist.length - 1];
  if (!m) return null;
  return { from: m.from as Square, to: m.to as Square };
}

export function TrainView({ pack, line, onBack, initialMode = "learn", onModeChange, onLineComplete, onLearnDone, onPracticeFail, onTestPly, onTrainNext, hasNextDue, onPracticeNext, gym = false, testLocked = false, plyLimit, startPly = 0 }: Props) {
  const t = useT();
  const { state, subscribed } = useUnlocks();
  const purchased = state.packs;
  const unlockIds = subscribed ? [pack.id] : purchased;
  const warmup = plyLimit != null;
  const lockTest = testLocked || warmup;
  const bookStartPly = Math.max(0, Math.min(Math.floor(startPly) || 0, line.plies.length));
  const bookEndPly = warmup
    ? warmupEndPly(bookStartPly, line.plies.length, plyLimit)
    : line.plies.length;
  const [mode, setMode] = useState<Mode>(initialMode);
  const completedRef = useRef(false);
  const practiceMissedRef = useRef(false);
  const [game, setGame] = useState(() => replaySans(line.plies, bookStartPly));
  const [plyIndex, setPlyIndex] = useState(bookStartPly);
  const [viewPly, setViewPly] = useState(bookStartPly);
  const [nearMissSan, setNearMissSan] = useState<string | null>(null);
  const [nearMissTick, setNearMissTick] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [wrongUntil, setWrongUntil] = useState<Square | null>(null);
  const [status, setStatus] = useState({
    text: "Your move",
    cls: "",
  });
  const [session, setSession] = useState(0);
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    () => lastMoveSquares(replaySans(line.plies, bookStartPly)),
  );
  const [hintsReady, setHintsReady] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nudgeTest, setNudgeTest] = useState(false);
  const [celebratePiece, setCelebratePiece] = useState<string | null>(null);
  const [mateBlast, setMateBlast] = useState<{ code: string; sq: Square } | null>(null);
  /** Line-complete sheet waits until the burst finishes so celebration is visible. */
  const pendingEndCardRef = useRef<{
    kind: "wrong" | "end";
    title: string;
    body: string;
    caption?: string;
    actionLabel: string;
    primaryLabel?: string;
    nextAction?: ResultNextAction;
    secondaryAction?: "practiceNext";
  } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [boardExpanded, setBoardExpanded] = useState(false);
  const [resultCard, setResultCard] = useState<{
    kind: "wrong" | "end";
    title: string;
    body: string;
    caption?: string;
    actionLabel: string;
    primaryLabel?: string;
    nextAction?: ResultNextAction;
    secondaryAction?: "practiceNext";
  } | null>(null);

  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notationStripRef = useRef<HTMLDivElement | null>(null);
  const activeMoveRef = useRef<HTMLSpanElement | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const pendingCommit = useRef<{
    nextGame: Chess;
    nextPly: number;
    move: { from: Square; to: Square };
    userMove: boolean;
  } | null>(null);
  const replyGenRef = useRef(0);

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const expectedMove = useCallback(
    (g: Chess, idx: number): Move | null => {
      if (idx >= line.plies.length) return null;
      const san = line.plies[idx]!;
      const tmp = new Chess(g.fen());
      const moves = tmp.moves({ verbose: true });
      const found = moves.find((m) => m.san === san);
      if (found) return found;
      try {
        return tmp.move(san) || null;
      } catch {
        return null;
      }
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
      replyGenRef.current += 1;
      setSlide(null);
      setBusy(false);
      setResultCard(null);
      setHintsReady(true);
      setNearMissSan(null);
      const start = replaySans(line.plies, bookStartPly);
      setGame(start);
      setPlyIndex(bookStartPly);
      setViewPly(bookStartPly);
      setLastMove(lastMoveSquares(start));
      setSelected(null);
      setWrongUntil(null);
      setStatus({
        text: (nextMode ?? mode) === "learn"
            ? "Your move (Practice)"
            : "Your move",
        cls: "",
      });
      completedRef.current = false;
      practiceMissedRef.current = false;
      pendingEndCardRef.current = null;
      setCelebratePiece(null);
      setMateBlast(null);
      setSession((s) => s + 1);
    },
    [clearAllTimers, mode, line.plies, bookStartPly],
  );

  const changeMode = (m: Mode) => {
    if (m === "practice" && lockTest) return;
    if (m === "practice") setNudgeTest(false);
    setMode(m);
    onModeChange?.(m);
    resetLine(m);
  };

  const stopCelebrate = useCallback(() => {
    setCelebratePiece(null);
    const pending = pendingEndCardRef.current;
    if (!pending) return;
    // Clean Test on Arcade mate: burst first, then king blast, then finish sheet.
    if (getBoardTheme() === "arcade" && gameRef.current.isCheckmate()) {
      const mated = gameRef.current.turn();
      const sq = findKingSquare(gameRef.current, mated);
      if (sq) {
        setMateBlast({
          code: mated === "w" ? "K" : "k",
          sq,
        });
        soundMateBoom();
        return;
      }
    }
    pendingEndCardRef.current = null;
    setResultCard(pending);
  }, []);

  const stopMateBlast = useCallback(() => {
    setMateBlast(null);
    const pending = pendingEndCardRef.current;
    if (pending) {
      pendingEndCardRef.current = null;
      setResultCard(pending);
    }
  }, []);

  /** Arcade mate: king blasts off, then finish sheet. Other themes open the sheet now. */
  const openEndCard = useCallback(
    (
      card: {
        kind: "end";
        title: string;
        caption: string;
        body: string;
        actionLabel: string;
        primaryLabel?: string;
        nextAction?: ResultNextAction;
        secondaryAction?: "practiceNext";
      },
      nextGame: Chess,
    ) => {
      if (getBoardTheme() === "arcade" && nextGame.isCheckmate()) {
        const mated = nextGame.turn();
        const sq = findKingSquare(nextGame, mated);
        if (sq) {
          pendingEndCardRef.current = card;
          setCelebratePiece(null);
          setMateBlast({
            code: mated === "w" ? "K" : "k",
            sq,
          });
          soundMateBoom();
          return;
        }
      }
      setResultCard(card);
    },
    [],
  );

  const beginSlide = useCallback(
    (
      from: Square,
      to: Square,
      pieceCode: string,
      nextGame: Chess,
      nextPly: number,
      userMove: boolean,
      capturedCode?: string,
    ) => {
      setSelected(null);
      setBusy(true);
      setHintsReady(false);
      // Brown last-move wash immediately; hint-from/to drop with showHints.
      setLastMove({ from, to });
      pendingCommit.current = {
        nextGame,
        nextPly,
        move: { from, to },
        userMove,
      };
      setSlide({
        from,
        to,
        piece: pieceCode,
        captured: capturedCode,
      });
      soundMove();
      if (capturedCode) soundCapture();
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

    // Persist Test (practice) book progress for pack list %.
    // Only advance while this attempt is still clean — a miss freezes Test %.
    if (mode === "practice" && !practiceMissedRef.current) {
      onTestPly?.(pending.nextPly);
    }

    if (pending.nextPly >= bookEndPly) {
      if (warmup && mode === "learn") {
        setStatus({
          text: t("Warm-up done"),
          cls: "done",
        });
        setResultCard({
          kind: "end",
          title: line.name,
          caption: t("Warm-up done"),
          body: "",
          actionLabel: t("Done"),
        });
        return;
      }

      if (mode === "learn") {
        setNudgeTest(true);
        setStatus({
          text: "Practice done — Test with no hints",
          cls: "done",
        });
        openEndCard(
          endResultCard(line, pack, purchased, t("Practice done"), t, "testYourself", subscribed),
          pending.nextGame,
        );
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
        openEndCard(
          endResultCard(line, pack, purchased, t("Finished, but you missed a move"), t, "practiceAgain", subscribed),
          pending.nextGame,
        );
        return;
      }

      setStatus({
        text: t("Book solid"),
        cls: "done",
      });
      soundWin();
      setResultCard(
        endResultCard(
          line,
          pack,
          purchased,
          t("Book solid"),
          t,
          "practiceNext",
          subscribed,
        ),
      );
      if (!completedRef.current) {
        completedRef.current = true;
        onLineComplete?.();
      }
      return;
    }

    if (pending.userMove) {
      soundOk();
      setStatus({ text: "Good", cls: "ok" });
      setHintsReady(false);
    } else {
      setStatus({
        text:
          mode === "learn"
            ? "Your move (Practice)"
            : "Your move",
        cls: "",
      });
      if (mode === "learn") scheduleHints();
      else setHintsReady(true);
    }
  }, [line, pack, purchased, subscribed, t, mode, warmup, bookEndPly, scheduleHints, onLineComplete, onLearnDone, onTestPly, openEndCard]);

  useEffect(() => {
    clearReplyTimer();
    if (busy || slide) return;
    if (plyIndex >= bookEndPly) return;
    if (isUserTurn(game)) return;

    setStatus({ text: "…", cls: "" });
    setHintsReady(false);
    const idx = plyIndex;
    const fenNow = game.fen();

    const gen = replyGenRef.current;
    replyTimer.current = setTimeout(() => {
      if (gen !== replyGenRef.current) return;
      // Position probe only — commits go through cloneAndMove so history stays full.
      const probe = new Chess(fenNow);
      const exp = expectedMove(probe, idx);
      if (!exp) return;
      const pieceCode = fenPieceAt(probe, exp.from as Square);
      if (!pieceCode) return;
      const committed = cloneAndMove(game, {
        from: exp.from,
        to: exp.to,
        promotion: exp.promotion || "q",
      });
      if (!committed) return;
      beginSlide(
        exp.from as Square,
        exp.to as Square,
        pieceCode,
        committed.next,
        idx + 1,
        false,
        capturedCodeFromMove(committed.move),
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
    bookEndPly,
    isUserTurn,
    expectedMove,
    clearReplyTimer,
    beginSlide,
  ]);

  const playFromTo = (from: Square, to: Square) => {
    if (from === to) return;
    if (busy || slide) return;
    if (plyIndex >= bookEndPly) return;
    const live = gameRef.current;
    if (!isUserTurn(live)) return;

    const legalMoves = live.moves({ square: from, verbose: true });
    const legal = legalMoves.find((m) => m.to === to);
    if (legal) {
      tryPlay(from, to, legal.promotion);
      return;
    }

    const destPiece = live.get(to);
    if (destPiece && destPiece.color === game.turn()) {
      setSelected(to);
      soundSelect();
      return;
    }
    setSelected(null);
  };

  const tryPlay = (from: Square, to: Square, promotion?: string) => {
    const exp = expectedMove(game, plyIndex);
    if (!exp) return;
    if (exp.from !== from || exp.to !== to) {
      soundBad();
      setWrongUntil(to);
      setStatus({
        text:
          mode === "practice"
            ? t("Try again to reset, or Practice again")
            : t("Wrong move — try again"),
        cls: "bad",
      });
      setSelected(null);
      if (mode === "practice") {
        setNearMissSan(null);
        setResultCard({
          kind: "wrong",
          title: t("Inaccurate move"),
          body: t("The book move is {san}.", { san: exp.san }),
          primaryLabel: t("Try again"),
          actionLabel: t("Practice again"),
          nextAction: "learn",
        });
        practiceMissedRef.current = true;
        onPracticeFail?.();
      } else {
        // Practice: toast with book SAN. Never a blocking sheet. Never in Test.
        setResultCard(null);
        setNearMissSan(exp.san);
        setNearMissTick((n) => n + 1);
      }
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongUntil(null), 450);
      return;
    }

    setNearMissSan(null);
    const pieceCode = fenPieceAt(game, from);
    if (!pieceCode) return;

    const committed = cloneAndMove(game, {
      from,
      to,
      promotion: exp.promotion || promotion || "q",
    });
    if (!committed) return;

    beginSlide(
      from,
      to,
      pieceCode,
      committed.next,
      plyIndex + 1,
      true,
      capturedCodeFromMove(committed.move),
    );
  };

  const onSquare = (sq: Square) => {
    if (busy || slide) return;
    if (plyIndex >= bookEndPly) return;
    if (!isUserTurn(game)) return;

    const piece = game.get(sq);

    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      playFromTo(selected, sq);
      return;
    }

    if (piece && piece.color === game.turn()) {
      setSelected(sq);
      soundSelect();
    }
  };

  const livePly = plyIndex;

  // Snap the view to the live ply when a new ply lands or the line resets.
  useEffect(() => {
    setViewPly((v) => (livePly > v || livePly === 0 ? livePly : v));
  }, [livePly]);

  const viewingHistory = viewPly !== livePly;
  const displayGame = replaySans(line.plies, viewPly);
  const displayLastMove = viewingHistory
    ? lastMoveSquares(displayGame)
    : lastMove;

  const historySans = line.plies;

  const jumpToPly = (nextPly: number) => {
    if (busy || slide) return;
    // View-only. Does not undo progress / SM-2 / miss flags / a completed line.
    const target = Math.max(0, Math.min(nextPly, livePly));
    setSelected(null);
    setViewPly(target);
  };

  /** Scrub one half-move with a single-piece slide (not a full move pair). */
  const scrubOnePly = (dir: -1 | 1) => {
    const target = viewPly + dir;
    if (target < 0 || target > livePly) return;
    const sans = historySans;
    // Move being undone (Back) is the last ply of the current view;
    // move being replayed (Forward) is the next ply after the current view.
    const probeAt = dir === -1 ? viewPly : target;
    const probe = replaySans(sans, probeAt);
    const hist = probe.history({ verbose: true });
    const m = hist[hist.length - 1];
    setSelected(null);
    if (m) {
      const piece = pieceCodeFromVerbose(m);
      // No pendingCommit — onSlideComplete only clears the scrub animation.
      pendingCommit.current = null;
      setBusy(true);
      if (dir === -1) {
        // Reverse slide: piece walks back to its from-square.
        setSlide({
          from: m.to as Square,
          to: m.from as Square,
          piece,
        });
      } else {
        setSlide({
          from: m.from as Square,
          to: m.to as Square,
          piece,
        });
      }
      soundMove();
    }
    setViewPly(target);
  };

  /** Same as Back after a rejected book try — stay on this ply. */
  const retryFromHere = () => {
    if (wrongTimer.current) {
      clearTimeout(wrongTimer.current);
      wrongTimer.current = null;
    }
    setSelected(null);
    setWrongUntil(null);
    setNearMissSan(null);
    setStatus({
      text: mode === "learn" ? "Your move (Practice)" : "Your move",
      cls: "",
    });
  };

  const stepBack = () => {
    if (busy || slide) return;

    // Rejected book try never landed — just clear the pick / red flash.
    if (wrongUntil || status.cls === "bad" || nearMissSan) {
      retryFromHere();
      return;
    }

    if (viewPly > 0) scrubOnePly(-1);
    else setSelected(null);
  };

  const stepForward = () => {
    if (busy || slide) return;
    if (viewPly < livePly) scrubOnePly(1);
  };

  const bookExp = viewingHistory ? null : expectedMove(game, plyIndex);
  const userTurn = isUserTurn(game) && !busy && !slide && !viewingHistory;
  const showHints =
    !viewingHistory &&
    mode === "learn" &&
    userTurn &&
    hintsReady &&
    plyIndex < bookEndPly;
  const exp = bookExp;

  const hint = showHints && bookExp ? `Play: ${line.plies[plyIndex]}` : "";

  const historyCount = livePly;
  const notationPairs = buildNotationPairs(historySans, historyCount, viewPly);
  const n = pack.lines.findIndex((l) => l.id === line.id) + 1;
  const bookLen = bookEndPly - bookStartPly;
  const pct = bookLen <= 0
    ? 0
    : Math.min(
        100,
        Math.max(
          0,
          plyIndex >= bookEndPly || status.cls === "done"
            ? 100
            : Math.round(((plyIndex - bookStartPly) / bookLen) * 100),
        ),
      );

  // Keep the active (last-played) move visible by scrolling only the strip
  useEffect(() => {
    const strip = notationStripRef.current;
    const chip = activeMoveRef.current;
    if (!strip || !chip) return;
    const stripRect = strip.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const left =
      strip.scrollLeft +
      (chipRect.left - stripRect.left) -
      strip.clientWidth / 2 +
      chipRect.width / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [plyIndex, viewPly]);

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

  const statusBody = status.text;

  const bookDone = status.cls === "done";

  useEffect(() => {
    if (!boardExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Result modal owns Escape while the finish/wrong popup is up.
      if (resultCard) return;
      setBoardExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [boardExpanded, resultCard]);

  // Keep the board still when the finish/wrong sheet opens (no page jump).
  useEffect(() => {
    if (!resultCard) return;
    const x = window.scrollX;
    const y = window.scrollY;
    const restore = () => window.scrollTo(x, y);
    restore();
    const raf = requestAnimationFrame(restore);
    const t0 = window.setTimeout(restore, 0);
    const t1 = window.setTimeout(restore, 50);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [resultCard]);

  useEffect(() => {
    if (!nearMissSan || mode !== "learn" || resultCard) return;
    const id = window.setTimeout(() => setNearMissSan(null), 3000);
    return () => window.clearTimeout(id);
  }, [nearMissSan, nearMissTick, mode, resultCard]);


  const canBack =
    !busy &&
    !slide &&
    (Boolean(wrongUntil) ||
      status.cls === "bad" ||
      Boolean(nearMissSan) ||
      viewPly > 0);
  const canForward = !busy && !slide && viewPly < livePly;
  const gymOpening = gym ? lookupOpeningIdentityPrefix(line.plies) : null;

  return (
    <div className="train-layout">
      <div className="train-top-chrome">
      {gym ? (
        <div className="create-own-train-head" data-gym-line>
          <h2 className="m-0 font-display text-[1.45rem] font-bold tracking-tight">
            {t(line.side === "b" ? "My line · Black" : "My line · White")}
          </h2>
          {gymOpening ? (
            <p
              className="create-own-train-identity"
              data-create-own-train-identity={`${gymOpening.name}|${gymOpening.eco}`}
            >
              {formatOpeningIdentity(gymOpening)}
            </p>
          ) : null}
          <p className="create-own-train-chip" data-gym-remembered>
            {t("Yours · remembered")}
          </p>
        </div>
      ) : (
        <>
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
      <div className="mt-0.5 text-[0.78rem] text-fg-subtle">
        {t("{pct}% complete", { pct })}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.95rem] font-semibold">
        <span>{line.name}</span>
      </div>
        </>
      )}
      {!gym && line.idea ? (
        <p className="train-idea mt-1 text-[0.88rem] text-fg-muted">{line.idea}</p>
      ) : null}
      {!gym ? (
      <div className="text-[0.78rem] text-fg-subtle">
        {pack.name} · train as {line.side === "b" ? "Black" : "White"}
      </div>
      ) : null}

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
          disabled={lockTest}
          title={lockTest ? t("Test unlocks after a clean Practice.") : undefined}
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
      </div>

      <div className="train-board-band">
      {!boardExpanded ? (
        <div className="mb-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setBoardExpanded(true)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
          >
            <Maximize2 className="size-4" strokeWidth={2.25} aria-hidden />
            Expand
          </button>
        </div>
      ) : null}

      <div
        className={boardExpanded ? "board-fs-overlay" : "train-board-anchor relative"}
      >
        {boardExpanded ? (
          <>
            <button
              type="button"
              onClick={() => setBoardExpanded(false)}
              className="board-fs-toggle"
              aria-label="Close full screen"
            >
              <Minimize2 className="size-5" strokeWidth={2.25} aria-hidden />
              Close
            </button>
            <div className="board-fs-modes" role="group" aria-label="Mode">
              <ModeTab
                active={mode === "learn"}
                onClick={() => changeMode("learn")}
              >
                Practice
              </ModeTab>
              <ModeTab
                active={mode === "practice"}
                onClick={() => changeMode("practice")}
                nudge={nudgeTest}
                disabled={lockTest}
                title={lockTest ? t("Test unlocks after a clean Practice.") : undefined}
              >
                Test
              </ModeTab>
            </div>
            <p
              className={`board-fs-hint text-center text-[0.85rem] font-semibold text-accent ${
                hint ? "opacity-100" : "opacity-0"
              }`}
            >
              {hint || " "}
            </p>
          </>
        ) : null}
        <div className={boardExpanded ? "board-fs-stage" : undefined}>
          <div className="relative">
            <ChessBoard
              key={session}
              game={displayGame}
              flip={line.side === "b"}
              selected={viewingHistory ? null : selected}
              wrongUntil={viewingHistory ? null : wrongUntil}
              expected={exp}
              showHints={showHints}
              lastMove={displayLastMove}
              slide={slide}
              onSlideComplete={onSlideComplete}
              onSquare={onSquare}
              onPlay={playFromTo}
              expanded={boardExpanded}
              mateBlast={mateBlast}
              onMateBlastDone={stopMateBlast}
              interactive={!busy && !slide && !viewingHistory}
            />
            {celebratePiece ? (
              <LineCompleteBurst
                pieceCode={celebratePiece}
                onFinished={stopCelebrate}
              />
            ) : null}
          </div>
        </div>
        {boardExpanded ? (
          <>
            <p className={`board-fs-status text-center text-[0.9rem] ${statusColor}`}>
              {statusBody}
            </p>
            {nearMissSan && mode === "learn" && !resultCard ? (
              <NearMissToast
                san={nearMissSan}
                onRetry={retryFromHere}
                onDismiss={() => setNearMissSan(null)}
              />
            ) : null}
            <div className="board-fs-actions">
              <button
                type="button"
                onClick={() => resetLine()}
                className="board-fs-action"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={stepBack}
                disabled={!canBack}
                aria-label={t("Back")}
                className="board-fs-action"
              >
                {t("Back")}
              </button>
              {canForward || viewingHistory ? (
                <button
                  type="button"
                  onClick={stepForward}
                  disabled={!canForward}
                  aria-label={t("Forward")}
                  className="board-fs-action"
                >
                  {t("Forward")}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      </div>

      <div className="train-below">
      {/* Move history — single-row horizontal scroller (no wrap → no board jump) */}
      <div
        ref={notationStripRef}
        className="mt-2.5 mb-1 flex flex-nowrap gap-x-1.5 overflow-x-auto rounded-xl border border-border bg-bg-elevated px-2.5 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Move history"
      >
        {notationPairs.length === 0 ? (
          <span className="text-[0.78rem] text-fg-subtle">Moves will appear here…</span>
        ) : (
          notationPairs.map((pair) => {
            const whitePly = pair.num * 2 - 1;
            const blackPly = pair.num * 2;
            const viewHighlight = viewPly;
            const whiteOn = viewHighlight === whitePly;
            const blackOn = Boolean(pair.black) && viewHighlight === blackPly;
            return (
            <span
              key={pair.num}
              ref={pair.active ? activeMoveRef : undefined}
              className="whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.78rem] tabular-nums text-fg-muted"
            >
              <span className="text-fg-subtle">{pair.num}.</span>{" "}
              <button
                type="button"
                onClick={() => jumpToPly(whitePly)}
                className={`cursor-pointer rounded-sm px-0.5 ${
                  whiteOn ? "bg-accent/12 font-bold text-accent" : ""
                }`}
              >
                {pair.white}
              </button>
              {pair.black ? (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={() => jumpToPly(blackPly)}
                    className={`cursor-pointer rounded-sm px-0.5 ${
                      blackOn ? "bg-accent/12 font-bold text-accent" : ""
                    }`}
                  >
                    {pair.black}
                  </button>
                </>
              ) : null}
            </span>
            );
          })
        )}
      </div>

      <div
        className={`mb-3 min-h-[3.2em] text-center text-[0.9rem] transition-opacity duration-200 ${statusColor}`}
      >
        {statusBody}
      </div>

      {nearMissSan && mode === "learn" && !resultCard && !boardExpanded ? (
        <NearMissToast
          san={nearMissSan}
          onRetry={retryFromHere}
          onDismiss={() => setNearMissSan(null)}
        />
      ) : null}
      <div className="trainer-actions">
        <div className="trainer-secondaries">
          <button
            type="button"
            onClick={() => resetLine()}
            className="rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={stepBack}
            disabled={!canBack}
            aria-label={t("Back")}
            className="min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {t("Back")}
          </button>
          {canForward || viewingHistory ? (
            <button
              type="button"
              onClick={stepForward}
              disabled={!canForward}
              aria-label={t("Forward")}
              className="min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted active:scale-95 disabled:opacity-40 disabled:active:scale-100"
            >
              {t("Forward")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            className="rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
          >
            Done
          </button>
          {bookDone && mode === "practice" ? (
            <button
              type="button"
              onClick={onTrainNext ?? onBack}
              className="rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
            >
              Train next due
            </button>
          ) : null}
        </div>
        <div className="trainer-primary">
          {bookDone && mode === "learn" && !warmup && !testLocked ? (
            <button
              type="button"
              onClick={() => changeMode("practice")}
              className="min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted active:scale-95"
            >
              Start Test
            </button>
          ) : null}
        </div>
      </div>
      <LineFeedback pack={pack} line={line} />
      </div>
      {resultCard ? (
        <LineResultModal
          kind={resultCard.kind}
          title={resultCard.title}
          body={resultCard.body}
          caption={resultCard.caption}
          actionLabel={resultCard.actionLabel}
          primaryLabel={resultCard.primaryLabel}
          boardExpanded={boardExpanded}
          onClose={() => {
            setResultCard(null);
            if (warmup && resultCard.kind === "end") onBack();
          }}
          onAction={
            resultCard.kind === "wrong"
              ? resultCard.nextAction === "learn"
                ? () => changeMode("learn") // Practice again
                : () => resetLine() // Try again (Practice miss)
              : warmup && resultCard.kind === "end"
                ? onBack
                : resultCard.secondaryAction === "practiceNext"
                ? () => {
                    const nextLine = nextUnlockedLine(pack, line.id, unlockIds);
                    setResultCard(null);
                    if (nextLine) onPracticeNext?.(nextLine);
                  }
                : resultCard.nextAction === "learn"
                ? () => changeMode("learn")
                : undefined
          }
          onPrimary={
            resultCard.kind === "wrong"
              ? () => resetLine() // Try again — reset line, stay in Test
              : resultCard.primaryLabel
                ? () => {
                    if (resultCard.nextAction === "testYourself") {
                      changeMode("practice");
                      return;
                    }
                    if (resultCard.nextAction === "learn") {
                      changeMode("learn");
                      return;
                    }
                    const nextLine = nextUnlockedLine(pack, line.id, unlockIds);
                    setResultCard(null);
                    if (nextLine) onPracticeNext?.(nextLine);
                  }
                : undefined
          }
        />
      ) : null}
      {pack.about && aboutOpen ? (
        <PackAboutModal
          title={pack.name}
          about={pack.about}
          packId={pack.id}
          startLabel={t("Train")}
          onClose={() => setAboutOpen(false)}
          onStart={() => setAboutOpen(false)}
        />
      ) : null}
    </div>
  );
}

function NearMissToast({
  san,
  onRetry,
  onDismiss,
}: {
  san: string;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const t = useT();
  return (
    <div
      className="near-miss-toast"
      role="status"
      data-near-miss-toast
      aria-label={t("The book move is {san}.", { san })}
      onClick={onDismiss}
    >
      <span className="near-miss-san-chip" data-near-miss-san>
        {san}
      </span>
      <button
        type="button"
        data-near-miss-retry
        onClick={(event) => {
          event.stopPropagation();
          onRetry();
        }}
        className="near-miss-toast-cta"
      >
        {t("Try again from here")}
      </button>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
  nudge,
  disabled,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  nudge?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-disabled={disabled || undefined}
      className={`flex-1 rounded-full py-2.5 text-[0.82rem] font-semibold ${
        active
          ? "bg-bg-elevated text-fg shadow-sm"
          : "bg-transparent text-fg-muted"
      }${nudge ? " mode-tab-nudge" : ""}${disabled ? " opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}