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
import { hasSeenPackIntro } from "@/lib/pack-intro";
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
  onLineComplete?: () => void;
  onLearnDone?: () => void;
  onPracticeFail?: () => void;
  onTrainNext?: () => void;
  hasNextDue?: boolean;
  onPracticeNext?: (line: OpeningLine) => void;
  pack: Pack;
  line: OpeningLine;
  onBack: () => void;
};

function endResultCard(
  line: OpeningLine,
  pack: Pack,
  purchased: readonly string[],
  caption: string,
  t: Translate,
) {
  const nextLine = nextUnlockedLine(pack, line.id, purchased);
  return {
    kind: "end" as const,
    title: line.name,
    caption,
    body: (line.next ?? line.idea ?? "").trim(),
    actionLabel: t("Well done"),
    primaryLabel: nextLine ? t("Practice next line") : undefined,
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
  beginner: "800",
  intermediate: "1200",
  advanced: "1800",
};

const PLAY_LEVEL_ARIA: Record<PlayLevel, string> = {
  beginner: "Beginner, about 800.",
  intermediate: "Intermediate, about 1200.",
  advanced: "Advanced, about 1800.",
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
function firstPlayableReply(fen: string): PlayableReply | null {
  try {
    const g = new Chess(fen);
    const moves = g.moves({ verbose: true });
    if (moves.length === 0) return null;
    const m = moves.find((mv) => mv.captured) ?? moves[0]!;
    const pieceCode = fenPieceAt(g, m.from as Square);
    const next = new Chess(fen);
    const ok = next.move({
      from: m.from,
      to: m.to,
      promotion: m.promotion || "q",
    });
    if (!pieceCode || !ok) return null;
    return {
      from: m.from as Square,
      to: m.to as Square,
      pieceCode,
      next,
    };
  } catch {
    return null;
  }
}


function replaySans(sans: string[], count: number): Chess {
  const g = new Chess();
  for (let i = 0; i < count; i++) {
    const san = sans[i];
    if (!san || !g.move(san)) break;
  }
  return g;
}

function lastMoveSquares(g: Chess): { from: Square; to: Square } | null {
  const hist = g.history({ verbose: true });
  const m = hist[hist.length - 1];
  if (!m) return null;
  return { from: m.from as Square, to: m.to as Square };
}

/** Plies one Take back tap removes. 0 = at start of the line / Play on. */
function takeBackPlyCount(
  playingOn: boolean,
  plyIndex: number,
  bookLen: number,
  userSide: "w" | "b",
  userToMove: boolean,
  lineFloor?: number,
): number {
  const floor = playingOn
    ? bookLen
    : lineFloor !== undefined
      ? lineFloor
      : userSide === "w"
        ? 0
        : 1;
  if (plyIndex <= floor) return 0;
  // Computer moved first in Play on — no user ply to undo yet.
  if (playingOn && userToMove && plyIndex - floor < 2) return 0;
  return Math.min(userToMove ? 2 : 1, plyIndex - floor);
}

export function TrainView({ pack, line, onBack, initialMode = "learn", onLineComplete, onLearnDone, onPracticeFail, onTrainNext, hasNextDue, onPracticeNext }: Props) {
  const t = useT();
  const { state } = useUnlocks();
  const purchased = state.packs;
  const [mode, setMode] = useState<Mode>(initialMode);
  const completedRef = useRef(false);
  const practiceMissedRef = useRef(false);
  const [game, setGame] = useState(() => new Chess());
  const [plyIndex, setPlyIndex] = useState(0);
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
  const [pendingPromo, setPendingPromo] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [playLevel, setPlayLevel] = useState<PlayLevel | null>("beginner");
  const [aboutOpen, setAboutOpen] = useState(
    () => Boolean(pack.about) && !hasSeenPackIntro(pack.id),
  );
  const [boardExpanded, setBoardExpanded] = useState(false);
  const [resultCard, setResultCard] = useState<{
    kind: "wrong" | "end";
    title: string;
    body: string;
    caption?: string;
    actionLabel: string;
    primaryLabel?: string;
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
    setPendingPromo(null);
    setPlayLevel("beginner");
  }, []);

  const expectedMove = useCallback(
    (g: Chess, idx: number): Move | null => {
      if (idx >= line.plies.length) return null;
      const san = line.plies[idx]!;
      const tmp = new Chess(g.fen());
      const moves = tmp.moves({ verbose: true });
      return moves.find((m) => m.san === san) || tmp.move(san) || null;
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
      setHintsReady(true);
      setGame(new Chess());
      setPlyIndex(0);
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

    if (pending.nextPly >= line.plies.length) {
      if (mode === "learn") {
        setNudgeTest(true);
        setStatus({
          text: "Practice done — Play on, or Test with no hints",
          cls: "done",
        });
        soundWin();
        setResultCard(endResultCard(line, pack, purchased, t("Practice done"), t));
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
          endResultCard(line, pack, purchased, t("Finished, but you missed a move"), t),
        );
        return;
      }

      setStatus({
        text: "Line complete — well done!",
        cls: "done",
      });
      soundWin();
      setResultCard(endResultCard(line, pack, purchased, t("Line complete"), t));
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
  }, [line, pack, purchased, t, mode, scheduleHints, onLineComplete, onLearnDone]);

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
      const fb = firstPlayableReply(fenNow);
      if (fb) {
        applyReply(fb.from, fb.to, fb.pieceCode, fb.next);
        return;
      }
      setEngineBusy(false);
      const g = new Chess(fenNow);
      setStatus({
        text: playOnGameOverText(g, line.side),
        cls: "ok",
      });
    };

    engine
      .pickMove(fenNow, thinkMsRef.current, playLevelRef.current)
      .then((mv) => {
        if (cancelled || !playingOnRef.current || gen !== replyGenRef.current) return;
        if (mv) {
          const g = new Chess(fenNow);
          const pieceCode = fenPieceAt(g, mv.from as Square);
          const next = new Chess(fenNow);
          const ok = next.move({
            from: mv.from,
            to: mv.to,
            promotion: mv.promotion || "q",
          });
          if (pieceCode && ok) {
            applyReply(mv.from as Square, mv.to as Square, pieceCode, next);
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
      const next = new Chess(game.fen());
      const move = next.move({
        from,
        to,
        promotion: promotion || "q",
      });
      if (!move) return;
      beginSlide(from, to, pieceCode, next, plyIndex + 1, true);
      return;
    }

    const exp = expectedMove(game, plyIndex);
    if (!exp) return;
    if (exp.from !== from || exp.to !== to) {
      soundBad();
      setWrongUntil(to);
      setStatus({ text: "Wrong move — try again", cls: "bad" });
      setSelected(null);
      setResultCard({
        kind: "wrong",
        title: t("Wrong move"),
        body: t("The book move is {san}.", { san: exp.san }),
        actionLabel: t("Try again"),
      });
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
    playingOnRef.current = true;
    playOnStartPlyRef.current = game.history().length;
    setPlayingOn(true);
    setSelected(null);
    setPendingPromo(null);
    setEngineBusy(false);
    setEngineReady(false);
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
      if (game.isGameOver()) {
        setStatus({
          text: playOnGameOverText(game, line.side),
          cls: "ok",
        });
        return;
      }
      if (isUserTurn(game)) {
        setStatus({ text: "Your move — playing on", cls: "" });
      }
    })();
  };


  const jumpToPly = (nextPly: number) => {
    if (busy || slide) return;

    const onPlay = playingOnRef.current;
    const currentPly = onPlay ? game.history().length : plyIndex;
    const floor = onPlay
      ? playOnStartPlyRef.current
      : line.side === "w"
        ? 0
        : 1;
    const target = Math.max(floor, Math.min(nextPly, currentPly));
    if (target >= currentPly) {
      setSelected(null);
      return;
    }

    // Board-only. Do not write progress / SM-2, and do not clear a recorded miss.
    replyGenRef.current += 1;
    clearAllTimers();
    pendingCommit.current = null;
    setEngineBusy(false);
    setSlide(null);
    setBusy(false);
    setSelected(null);
    setPendingPromo(null);
    setWrongUntil(null);

    const next = onPlay
      ? replaySans(game.history(), target)
      : replaySans(line.plies, target);

    setGame(next);
    setPlyIndex(target);
    setLastMove(lastMoveSquares(next));

    if (onPlay) {
      setHintsReady(false);
      setStatus({ text: "Your move — playing on", cls: "" });
      return;
    }
    setStatus({
      text:
        mode === "learn"
          ? "Your move (Practice)"
          : "Your move",
      cls: "",
    });
    if (mode === "learn") scheduleHints();
    else setHintsReady(true);
  };

  const takeBack = () => {
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

    const onPlay = playingOnRef.current;
    const currentPly = onPlay ? game.history().length : plyIndex;
    const undo = takeBackPlyCount(
      onPlay,
      currentPly,
      playOnStartPlyRef.current,
      line.side,
      isUserTurn(game),
    );
    if (undo <= 0) {
      setSelected(null);
      return;
    }

    jumpToPly(currentPly - undo);
  };

  const exp = playingOn ? null : expectedMove(game, plyIndex);
  const userTurn = isUserTurn(game) && !busy && !slide && !engineBusy;
  const showHints =
    !playingOn &&
    mode === "learn" &&
    userTurn &&
    hintsReady &&
    plyIndex < line.plies.length;

  const hint =
    showHints && exp
      ? `Play: ${line.plies[plyIndex]}`
      : "";

  const historySans = playingOn ? game.history() : line.plies;
  const historyCount = playingOn ? game.history().length : plyIndex;
  const notationPairs = buildNotationPairs(historySans, historyCount);
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

  const bookDone = status.cls === "done" && !playingOn;
  const showPlayOn = bookDone;

  useEffect(() => {
    if (!boardExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBoardExpanded(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [boardExpanded]);


  const canTakeBack =
    !busy &&
    !slide &&
    (Boolean(wrongUntil) ||
      status.cls === "bad" ||
      Boolean(pendingPromo) ||
      takeBackPlyCount(
        playingOn,
        playingOn ? game.history().length : plyIndex,
        playOnStartPlyRef.current,
        line.side,
        isUserTurn(game),
      ) > 0);

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
        <div className="mb-1 flex justify-end">
          <button
            type="button"
            onClick={() => setBoardExpanded(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-bg-elevated px-3 py-2 text-[0.82rem] font-semibold text-fg-muted active:scale-95"
          >
            <Maximize2 className="size-4" strokeWidth={2.25} aria-hidden />
            Expand
          </button>
        </div>
      ) : null}

      <div className={boardExpanded ? "board-fs-overlay" : "relative"}>
        {boardExpanded ? (
          <button
            type="button"
            onClick={() => setBoardExpanded(false)}
            className="board-fs-toggle"
            aria-label="Close full screen"
          >
            <Minimize2 className="size-5" strokeWidth={2.25} aria-hidden />
            Close
          </button>
        ) : null}
        {boardExpanded ? (
          <p
            className={`board-fs-hint text-center text-[0.85rem] font-semibold text-accent ${
              hint ? "opacity-100" : "opacity-0"
            }`}
          >
            {hint || " "}
          </p>
        ) : null}
        <div className={boardExpanded ? "board-fs-stage" : undefined}>
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
            onPlay={playFromTo}
            expanded={boardExpanded}
            interactive={
              !busy &&
              !slide &&
              !engineBusy &&
              !pendingPromo
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
          <p className={`board-fs-status text-center text-[0.9rem] ${statusColor}`}>
            {status.text}
          </p>
        ) : null}
      </div>

      {/* Move history — wrap so the current ply stays readable */}
      <div
        ref={notationStripRef}
        className="mt-2.5 mb-1 flex flex-wrap gap-x-1.5 gap-y-1 rounded-xl border border-border bg-bg-elevated px-2.5 py-2"
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
            onClick={takeBack}
            disabled={!canTakeBack}
            aria-label="Take back"
            className="min-h-11 rounded-full border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            Take back
          </button>
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
              <p className="play-on-caption">Pick strength, then Play on</p>
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
          onClose={() => setResultCard(null)}
          onPrimary={
            resultCard.primaryLabel
              ? () => {
                  const nextLine = nextUnlockedLine(pack, line.id, purchased);
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
