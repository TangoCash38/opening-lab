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
  soundMove,
  soundOk,
  soundSelect,
  soundWin,
} from "@/lib/sounds";
import { useT, type Translate } from "@/lib/i18n";
import { useUnlocks } from "@/hooks/use-unlocks";
import { ChessBoard, type SlideAnim, type PromotionPiece } from "./chess-board";
import { LineFeedback } from "./line-feedback";
import { PackAboutModal } from "./pack-about-modal";
import { LineResultModal } from "./line-result-modal";

type PlayLevel = "beginner" | "intermediate" | "advanced";

type PlayEngine = {
  pickMove: (
    fen: string,
    thinkMs: number,
    level?: PlayLevel,
  ) => Promise<{ from: string; to: string; promotion?: "q" | "r" | "b" | "n" } | null>;
  dispose: () => void;
};

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
};

type ResultNextAction = "practiceNext" | "testYourself" | "learn";

function endResultCard(
  line: OpeningLine,
  pack: Pack,
  purchased: readonly string[],
  caption: string,
  t: Translate,
  nextAction?: Exclude<ResultNextAction, "learn">,
  subscribed = false,
) {
  const unlockIds = subscribed ? [pack.id] : purchased;
  const nextLine = nextUnlockedLine(pack, line.id, unlockIds);
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

const PLAY_THINK_MS: Record<PlayLevel, number> = {
  beginner: 400,
  intermediate: 800,
  advanced: 1400,
};

const PLAY_LEVEL_LABEL: Record<PlayLevel, string> = {
  beginner: "Level 1",
  intermediate: "Level 2",
  advanced: "Level 3",
};

const PLAY_LEVEL_ARIA: Record<PlayLevel, string> = {
  beginner: "Level 1, about 800.",
  intermediate: "Level 2, about 1200.",
  advanced: "Level 3, about 1800.",
};

const PLAY_LEVELS: PlayLevel[] = ["beginner", "intermediate", "advanced"];

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

function playOnGameOverText(g: Chess, userSide: "w" | "b"): string {
  if (g.isCheckmate()) {
    return g.turn() !== userSide ? "Checkmate — you win" : "Checkmate";
  }
  return "Draw";
}

type PlayableReply = {
  from: Square;
  to: Square;
  pieceCode: string;
  next: Chess;
};

/** Capture if one exists, else the first legal move. Used when search fails. */
function firstPlayableReply(game: Chess): PlayableReply | null {
  try {
    const moves = game.moves({ verbose: true });
    if (moves.length === 0) return null;
    const m = moves.find((mv) => mv.captured) ?? moves[0]!;
    const pieceCode = fenPieceAt(game, m.from as Square);
    const committed = cloneAndMove(game, {
      from: m.from,
      to: m.to,
      promotion: m.promotion || "q",
    });
    if (!pieceCode || !committed) return null;
    return {
      from: m.from as Square,
      to: m.to as Square,
      pieceCode,
      next: committed.next,
    };
  } catch {
    return null;
  }
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
 * Never rebase with `new Chess(fen)` — that leaves history length 1 and
 * breaks Play on display (`replaySans(game.history(), viewPly)`).
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

function lastMoveSquares(g: Chess): { from: Square; to: Square } | null {
  const hist = g.history({ verbose: true });
  const m = hist[hist.length - 1];
  if (!m) return null;
  return { from: m.from as Square, to: m.to as Square };
}

export function TrainView({ pack, line, onBack, initialMode = "learn", onModeChange, onLineComplete, onLearnDone, onPracticeFail, onTestPly, onTrainNext, hasNextDue, onPracticeNext }: Props) {
  const t = useT();
  const { state, subscribed } = useUnlocks();
  const purchased = state.packs;
  const unlockIds = subscribed ? [pack.id] : purchased;
  const [mode, setMode] = useState<Mode>(initialMode);
  const completedRef = useRef(false);
  const practiceMissedRef = useRef(false);
  const [game, setGame] = useState(() => new Chess());
  const [plyIndex, setPlyIndex] = useState(0);
  const [viewPly, setViewPly] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [wrongUntil, setWrongUntil] = useState<Square | null>(null);
  const [status, setStatus] = useState({
    text: "Your move",
    cls: "",
  });
  const [session, setSession] = useState(0);
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [hintsReady, setHintsReady] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nudgeTest, setNudgeTest] = useState(false);
  const [playingOn, setPlayingOn] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [engineBusy, setEngineBusy] = useState(false);
  const [playHint, setPlayHint] = useState<Move | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [pendingPromo, setPendingPromo] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [playLevel, setPlayLevel] = useState<PlayLevel | null>("beginner");
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
  } | null>(null);

  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrongTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notationStripRef = useRef<HTMLDivElement | null>(null);
  const activeMoveRef = useRef<HTMLSpanElement | null>(null);
  const playingOnRef = useRef(false);
  const playOnStartPlyRef = useRef(line.plies.length);
  const engineRef = useRef<PlayEngine | null>(null);
  const playLevelRef = useRef<PlayLevel>("beginner");
  const thinkMsRef = useRef(PLAY_THINK_MS.beginner);
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

  const dropEngine = useCallback(() => {
    engineRef.current?.dispose();
    engineRef.current = null;
    playingOnRef.current = false;
    setPlayingOn(false);
    setEngineReady(false);
    setEngineBusy(false);
    setPlayHint(null);
    setHintBusy(false);
    setPendingPromo(null);
    setPlayLevel("beginner");
  }, []);

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
      dropEngine();
      setSlide(null);
      setBusy(false);
      setLastMove(null);
      setResultCard(null);
      setBoardExpanded(false);
      setHintsReady(true);
      setPlayHint(null);
      setHintBusy(false);
      setGame(new Chess());
      setPlyIndex(0);
      setViewPly(0);
      setSelected(null);
      setWrongUntil(null);
      playOnStartPlyRef.current = line.plies.length;
      setStatus({
        text: (nextMode ?? mode) === "learn"
            ? "Your move (Practice)"
            : "Your move",
        cls: "",
      });
      completedRef.current = false;
      practiceMissedRef.current = false;
      setSession((s) => s + 1);
    },
    [clearAllTimers, dropEngine, mode, line.plies.length],
  );

  const changeMode = (m: Mode) => {
    if (m === "practice") setNudgeTest(false);
    setMode(m);
    onModeChange?.(m);
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
      setPlayHint(null);
      // Brown last-move wash immediately; hint-from/to drop with showHints.
      setLastMove({ from, to });
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

    // Play-on never writes book progress (no complete / learned / fail / SM-2).
    if (playingOnRef.current) {
      const g = pending.nextGame;
      if (g.isGameOver()) {
        setStatus({
          text: playOnGameOverText(g, line.side),
          cls: "ok",
        });
        if (g.isCheckmate()) soundWin();
        return;
      }
      if (pending.userMove) {
        soundOk();
        setStatus({ text: "…", cls: "" });
      } else {
        setStatus({ text: "Your move — playing on", cls: "" });
      }
      return;
    }

    // Persist Test (practice) book progress for pack list %.
    // Only advance while this attempt is still clean — a miss freezes Test %.
    if (mode === "practice" && !practiceMissedRef.current) {
      onTestPly?.(pending.nextPly);
    }

    if (pending.nextPly >= line.plies.length) {
      if (mode === "learn") {
        setNudgeTest(true);
        setStatus({
          text: "Practice done — Play on, or Test with no hints",
          cls: "done",
        });
        soundWin();
        setResultCard(endResultCard(line, pack, purchased, t("Practice done"), t, "testYourself", subscribed));
        if (!completedRef.current) {
          completedRef.current = true;
          onLearnDone?.();
        }
        return;
      }

      if (practiceMissedRef.current) {
        setStatus({
          text: "Finished, but you missed a move — Play on, or Test again to go green",
          cls: "done",
        });
        soundWin();
        setResultCard(
          endResultCard(line, pack, purchased, t("Finished, but you missed a move"), t, undefined, subscribed),
        );
        return;
      }

      setStatus({
        text: "Line complete — well done!",
        cls: "done",
      });
      soundWin();
      setResultCard(endResultCard(line, pack, purchased, t("Line complete"), t, "practiceNext", subscribed));
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
  }, [line, pack, purchased, subscribed, t, mode, scheduleHints, onLineComplete, onLearnDone, onTestPly]);

  useEffect(() => {
    clearReplyTimer();
    if (playingOn) return;
    if (busy || slide) return;
    if (plyIndex >= line.plies.length) return;
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
      );
    }, OPPONENT_THINK_MS);

    return clearReplyTimer;
  }, [
    plyIndex,
    game,
    busy,
    slide,
    session,
    playingOn,
    line.plies.length,
    isUserTurn,
    expectedMove,
    clearReplyTimer,
    beginSlide,
  ]);

  useEffect(() => {
    if (!playingOn || !engineReady) return;
    // Do not read engineBusy here or list it as a dep: setEngineBusy(true)
    // would re-run this effect, cancel the search, and lock the board.
    if (busy || slide) return;
    if (isUserTurn(game)) return;
    if (game.isGameOver()) return;
    const engine = engineRef.current;
    if (!engine) return;

    let cancelled = false;
    const gen = replyGenRef.current;
    const fenNow = game.fen();
    const idx = plyIndex;
    setEngineBusy(true);
    setStatus({ text: "…", cls: "" });

    const applyReply = (from: Square, to: Square, pieceCode: string, next: Chess) => {
      if (cancelled || gen !== replyGenRef.current) return;
      setEngineBusy(false);
      beginSlide(from, to, pieceCode, next, idx + 1, false);
    };

    const playFallback = () => {
      if (cancelled || !playingOnRef.current || gen !== replyGenRef.current) return;
      const fb = firstPlayableReply(game);
      if (fb) {
        applyReply(fb.from, fb.to, fb.pieceCode, fb.next);
        return;
      }
      setEngineBusy(false);
      setStatus({
        text: playOnGameOverText(new Chess(fenNow), line.side),
        cls: "ok",
      });
    };

    engine
      .pickMove(fenNow, thinkMsRef.current, playLevelRef.current)
      .then((mv) => {
        if (cancelled || !playingOnRef.current || gen !== replyGenRef.current) return;
        if (mv) {
          const probe = new Chess(fenNow);
          const pieceCode = fenPieceAt(probe, mv.from as Square);
          const committed = cloneAndMove(game, {
            from: mv.from,
            to: mv.to,
            promotion: mv.promotion || "q",
          });
          if (pieceCode && committed) {
            applyReply(
              mv.from as Square,
              mv.to as Square,
              pieceCode,
              committed.next,
            );
            return;
          }
        }
        playFallback();
      })
      .catch(() => {
        playFallback();
      });

    return () => {
      cancelled = true;
      // Do not leave the board locked if this search was abandoned.
      if (gen === replyGenRef.current) {
        setEngineBusy(false);
      }
    };
  }, [
    playingOn,
    engineReady,
    plyIndex,
    game,
    busy,
    slide,
    session,
    isUserTurn,
    beginSlide,
    line.side,
  ]);

  useEffect(() => {
    return () => {
      playingOnRef.current = false;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const playFromTo = (from: Square, to: Square) => {
    if (from === to) return;
    if (busy || slide || engineBusy) return;
    if (pendingPromo) return;
    if (!playingOn && plyIndex >= line.plies.length) return;
    if (!isUserTurn(game)) return;

    const legalMoves = game.moves({ square: from, verbose: true });
    const legal = legalMoves.find((m) => m.to === to);
    if (legal) {
      if (playingOn && legalMoves.some((m) => m.to === to && m.promotion)) {
        setPendingPromo({ from, to });
        setSelected(null);
        return;
      }
      tryPlay(from, to, legal.promotion);
      return;
    }

    const destPiece = game.get(to);
    if (destPiece && destPiece.color === game.turn()) {
      setSelected(to);
      soundSelect();
      return;
    }
    setSelected(null);
  };

  const tryPlay = (from: Square, to: Square, promotion?: string) => {
    if (playingOnRef.current) {
      const pieceCode = fenPieceAt(game, from);
      if (!pieceCode) return;
      const committed = cloneAndMove(game, {
        from,
        to,
        promotion: promotion || "q",
      });
      if (!committed) return;
      beginSlide(from, to, pieceCode, committed.next, plyIndex + 1, true);
      return;
    }

    const exp = expectedMove(game, plyIndex);
    if (!exp) return;
    if (exp.from !== from || exp.to !== to) {
      soundBad();
      setWrongUntil(to);
      setStatus({
        text:
          mode === "practice"
            ? t("Tap Reset to try again, or go back to Practice")
            : t("Wrong move — try again"),
        cls: "bad",
      });
      setSelected(null);
      if (mode === "practice") {
        setResultCard({
          kind: "wrong",
          title: t("Inaccurate move"),
          body: t("The book move is {san}.", { san: exp.san }),
          primaryLabel: t("Try again"),
          actionLabel: t("Back to practice"),
          nextAction: "learn",
        });
        practiceMissedRef.current = true;
        onPracticeFail?.();
      } else {
        setResultCard({
          kind: "wrong",
          title: t("Wrong move"),
          body: t("The book move is {san}.", { san: exp.san }),
          actionLabel: t("Try again"),
        });
      }
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrongUntil(null), 450);
      return;
    }

    const pieceCode = fenPieceAt(game, from);
    if (!pieceCode) return;

    const committed = cloneAndMove(game, {
      from,
      to,
      promotion: promotion || exp.promotion || "q",
    });
    if (!committed) return;

    beginSlide(from, to, pieceCode, committed.next, plyIndex + 1, true);
  };

  const onSquare = (sq: Square) => {
    if (busy || slide || engineBusy) return;
    if (pendingPromo) return;
    if (!playingOn && plyIndex >= line.plies.length) return;
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

  const startPlayOn = () => {
    if (playingOnRef.current) return;
    const level: PlayLevel = playLevel ?? "beginner";
    playLevelRef.current = level;
    thinkMsRef.current = PLAY_THINK_MS[level];
    // Rebuild from the book line so chess.js history matches the board.
    // FEN-rebase commits leave history length 1 and Play on jumps to start.
    const full = replaySans(line.plies, line.plies.length);
    const startPly = full.history().length;
    replyGenRef.current += 1;
    playingOnRef.current = true;
    playOnStartPlyRef.current = startPly;
    setGame(full);
    setPlyIndex(startPly);
    setViewPly(startPly);
    setPlayingOn(true);
    setSelected(null);
    setPendingPromo(null);
    setEngineBusy(false);
    setEngineReady(false);
    setPlayHint(null);
    setHintBusy(false);
    setStatus({ text: "…", cls: "" });

    void (async () => {
      let mod: typeof import("@/lib/play-engine");
      try {
        mod = await import("@/lib/play-engine");
      } catch {
        // Only a rejected module load means this phone cannot run the engine.
        if (!playingOnRef.current) return;
        setStatus({
          text: "Computer unavailable on this phone",
          cls: "bad",
        });
        return;
      }

      let engine: PlayEngine;
      try {
        engine =
          typeof mod.loadPlayEngine === "function"
            ? await mod.loadPlayEngine(level)
            : mod.createLiteEngine(level);
      } catch {
        // Module loaded — always play, even if the smoke search threw.
        engine = mod.createLiteEngine(level);
      }
      if (!playingOnRef.current) {
        engine.dispose();
        return;
      }
      engineRef.current = engine;
      setEngineReady(true);
      if (full.isGameOver()) {
        setStatus({
          text: playOnGameOverText(full, line.side),
          cls: "ok",
        });
        return;
      }
      if (isUserTurn(full)) {
        setStatus({ text: "Your move — playing on", cls: "" });
      }
    })();
  };


  const livePly = playingOn ? game.history().length : plyIndex;

  // Snap the view to the live ply when a new ply lands or the line resets.
  useEffect(() => {
    setViewPly((v) => (livePly > v || livePly === 0 ? livePly : v));
  }, [livePly]);

  const viewingHistory = viewPly !== livePly;
  const displayGame = playingOn
    ? replaySans(game.history(), viewPly)
    : replaySans(line.plies, viewPly);
  const displayLastMove = viewingHistory
    ? lastMoveSquares(displayGame)
    : lastMove;

  const requestPlayHint = () => {
    if (!playingOnRef.current) return;
    if (busy || slide || engineBusy || hintBusy || viewingHistory) return;
    if (!isUserTurn(game)) return;
    const fen = game.fen();
    const gen = replyGenRef.current;
    setPlayHint(null);
    setHintBusy(true);
    setStatus({ text: "…", cls: "" });
    void (async () => {
      try {
        let mv: { from: string; to: string; promotion?: string } | null = null;
        const mod = await import("@/lib/play-engine");
        if (typeof mod.pickHintMove === "function") {
          mv = await mod.pickHintMove(fen);
        } else {
          const eng = engineRef.current ?? mod.createLiteEngine("advanced");
          mv = await eng.pickMove(fen, 2500, "advanced");
        }
        if (gen !== replyGenRef.current || !playingOnRef.current) return;
        if (!mv) {
          setStatus({ text: "Your move — playing on", cls: "" });
          return;
        }
        const legal = new Chess(fen)
          .moves({ verbose: true })
          .find(
            (m) =>
              m.from === mv!.from &&
              m.to === mv!.to &&
              (!mv!.promotion || m.promotion === mv!.promotion),
          );
        if (legal) {
          setPlayHint(legal);
          setStatus({ text: t("Hint ready"), cls: "" });
        } else {
          setStatus({ text: "Your move — playing on", cls: "" });
        }
      } catch {
        if (gen !== replyGenRef.current || !playingOnRef.current) return;
        setStatus({ text: "Your move — playing on", cls: "" });
      } finally {
        if (gen === replyGenRef.current) setHintBusy(false);
      }
    })();
  };

  const jumpToPly = (nextPly: number) => {
    if (busy || slide) return;
    // View-only. Does not undo progress / SM-2 / miss flags / a completed line.
    const target = Math.max(0, Math.min(nextPly, livePly));
    setSelected(null);
    setViewPly(target);
  };

  const stepBack = () => {
    if (busy || slide) return;

    // Rejected book try never landed — just clear the pick / red flash.
    if (wrongUntil || status.cls === "bad") {
      if (wrongTimer.current) {
        clearTimeout(wrongTimer.current);
        wrongTimer.current = null;
      }
      setSelected(null);
      setPendingPromo(null);
      setWrongUntil(null);
      setStatus({
        text: playingOnRef.current
          ? "Your move — playing on"
          : mode === "learn"
            ? "Your move (Practice)"
            : "Your move",
        cls: "",
      });
      return;
    }

    if (pendingPromo) {
      setPendingPromo(null);
      setSelected(null);
      return;
    }

    if (viewPly > 0) setViewPly((p) => p - 1);
    else setSelected(null);
  };

  const stepForward = () => {
    if (busy || slide) return;
    if (viewPly < livePly) setViewPly((p) => Math.min(livePly, p + 1));
  };

  const bookExp =
    playingOn || viewingHistory ? null : expectedMove(game, plyIndex);
  const userTurn =
    isUserTurn(game) && !busy && !slide && !engineBusy && !viewingHistory;
  const showHints = playingOn
    ? Boolean(playHint) && userTurn
    : !viewingHistory &&
      mode === "learn" &&
      userTurn &&
      hintsReady &&
      plyIndex < line.plies.length;
  const exp = playingOn ? playHint : bookExp;

  const hint =
    !playingOn && showHints && bookExp
      ? `Play: ${line.plies[plyIndex]}`
      : "";

  const historySans = playingOn ? game.history() : line.plies;
  const historyCount = livePly;
  const notationPairs = buildNotationPairs(historySans, historyCount, viewPly);
  const n = pack.lines.findIndex((l) => l.id === line.id) + 1;
  const bookLen = line.plies.length;
  const pct = bookLen <= 0
    ? 0
    : Math.min(
        100,
        Math.max(
          0,
          plyIndex >= bookLen || status.cls === "done"
            ? 100
            : Math.round((plyIndex / bookLen) * 100),
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

  const bookDone = status.cls === "done" && !playingOn;
  const showPlayOn = bookDone;

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


  const canBack =
    !busy &&
    !slide &&
    (Boolean(wrongUntil) ||
      status.cls === "bad" ||
      Boolean(pendingPromo) ||
      viewPly > 0);
  const canForward = !busy && !slide && viewPly < livePly;

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
      {!playingOn ? (
        <div className="mt-0.5 text-[0.78rem] text-fg-subtle">
          {t("{pct}% complete", { pct })}
        </div>
      ) : null}
      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.95rem] font-semibold">
        <span>{line.name}</span>
      </div>
      {line.idea ? (
        <p className="mt-1 text-[0.88rem] text-fg-muted">{line.idea}</p>
      ) : null}
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
            interactive={
              !busy &&
              !slide &&
              !engineBusy &&
              !pendingPromo &&
              !viewingHistory
            }
            promotion={
              pendingPromo
                ? {
                    color: line.side,
                    onPick: (piece: PromotionPiece) => {
                      const dest = pendingPromo;
                      setPendingPromo(null);
                      tryPlay(dest.from, dest.to, piece);
                    },
                    onCancel: () => setPendingPromo(null),
                  }
                : null
            }
          />
        </div>
        {boardExpanded ? (
          <>
            <p className={`board-fs-status text-center text-[0.9rem] ${statusColor}`}>
              {status.text}
            </p>
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
              {playingOn ? (
                <button
                  type="button"
                  onClick={requestPlayHint}
                  disabled={busy || !!slide || engineBusy || hintBusy || viewingHistory || !isUserTurn(game)}
                  aria-label={t("Hint")}
                  className="board-fs-action"
                >
                  {t("Hint")}
                </button>
              ) : null}
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

      {/* Move history — single-row horizontal scroller (no wrap → no board jump) */}
      <div
        ref={notationStripRef}
        className="mt-2.5 mb-1 flex flex-nowrap gap-x-1.5 overflow-x-auto rounded-xl border border-border bg-bg-elevated px-2.5 py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Move history"
      >
        {notationPairs.length === 0 ? (
          <span className="text-[0.78rem] text-fg-subtle">Moves will appear here…</span>
        ) : (
          notationPairs.map((pair) => (
            <span
              key={pair.num}
              ref={pair.active ? activeMoveRef : undefined}
              role="button"
              tabIndex={0}
              onClick={() =>
                jumpToPly(pair.black ? pair.num * 2 : pair.num * 2 - 1)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jumpToPly(pair.black ? pair.num * 2 : pair.num * 2 - 1);
                }
              }}
              className={`cursor-pointer whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.78rem] tabular-nums ${
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

      {playingOn ? (
        <div className="mb-2 text-center text-[0.72rem] text-fg-subtle">
          Playing on — not testing the book.
        </div>
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
          {playingOn ? (
            <button
              type="button"
              onClick={requestPlayHint}
              disabled={busy || !!slide || engineBusy || hintBusy || viewingHistory || !isUserTurn(game)}
              aria-label={t("Hint")}
              className="min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted active:scale-95 disabled:opacity-40 disabled:active:scale-100"
            >
              {t("Hint")}
            </button>
          ) : null}
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
          {showPlayOn ? (
            <>
              <p className="play-on-caption">Pick a level, then Play on</p>
              <div className="play-level-row" role="group" aria-label="Computer strength">
                {PLAY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPlayLevel(level)}
                    className={`play-level-chip${playLevel === level ? " is-on" : ""}`}
                    aria-label={PLAY_LEVEL_ARIA[level]}
                    aria-pressed={playLevel === level}
                  >
                    {PLAY_LEVEL_LABEL[level]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={startPlayOn}
                className="play-on-btn"
              >
                Play on
              </button>
            </>
          ) : null}
          {bookDone && mode === "learn" ? (
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
      {resultCard ? (
        <LineResultModal
          kind={resultCard.kind}
          title={resultCard.title}
          body={resultCard.body}
          caption={resultCard.caption}
          actionLabel={resultCard.actionLabel}
          primaryLabel={resultCard.primaryLabel}
          boardExpanded={boardExpanded}
          playOnLevels={
            resultCard.kind === "end"
              ? PLAY_LEVELS.map((id) => ({
                  id,
                  label: PLAY_LEVEL_LABEL[id],
                  aria: PLAY_LEVEL_ARIA[id],
                }))
              : undefined
          }
          playOnLevel={resultCard.kind === "end" ? (playLevel ?? "beginner") : undefined}
          onPlayOnLevel={
            resultCard.kind === "end"
              ? (id) => setPlayLevel(id as PlayLevel)
              : undefined
          }
          onPlayOn={
            resultCard.kind === "end"
              ? () => {
                  setResultCard(null);
                  startPlayOn();
                }
              : undefined
          }
          onClose={() => setResultCard(null)}
          onAction={
            resultCard.nextAction === "learn"
              ? () => changeMode("learn")
              : undefined
          }
          onPrimary={
            resultCard.primaryLabel
              ? () => {
                  if (resultCard.nextAction === "learn") {
                    setResultCard(null);
                    return;
                  }
                  if (resultCard.nextAction === "testYourself") {
                    changeMode("practice");
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