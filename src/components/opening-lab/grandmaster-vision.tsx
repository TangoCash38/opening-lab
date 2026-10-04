import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  dismissOnboarding,
  emptyProgress,
  formatStudyTime,
  HIGH_ACCURACY,
  isLevelUnlocked,
  LEVEL_INFO,
  loadProgress,
  onboardingDismissed,
  piecesFromFen,
  positionsForLevel,
  recordResult,
  saveProgress,
  scoreAttempt,
  scoreLevel,
  scoreRound,
  type AttemptScore,
  type LevelRound,
  type RoundScore,
  type VisionPosition,
  type VisionProgress,
} from "@/lib/grandmaster-vision";
import {
  playErrorTone,
  playShutter,
  playVictoryChord,
  playWoodSnap,
  unlockGrandmasterAudio,
} from "@/lib/grandmaster-vision-audio";
import { ChessPiece, pieceName } from "./chess-pieces";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1] as const;
const WHITE_TRAY = ["P", "N", "B", "R", "Q", "K"] as const;
const BLACK_TRAY = ["p", "n", "b", "r", "q", "k"] as const;
const PIECE_SRC: Record<string, string> = {
  P: "/pieces/wP.svg",
  N: "/pieces/wN.svg",
  B: "/pieces/wB.svg",
  R: "/pieces/wR.svg",
  Q: "/pieces/wQ.svg",
  K: "/pieces/wK.svg",
  p: "/pieces/bP.svg",
  n: "/pieces/bN.svg",
  b: "/pieces/bB.svg",
  r: "/pieces/bR.svg",
  q: "/pieces/bQ.svg",
  k: "/pieces/bK.svg",
};

type Phase = "study" | "clearing" | "rebuild" | "feedback";
type Selection = { kind: "tray"; code: string } | { kind: "board"; sq: string } | null;
type Drag = {
  kind: "tray" | "board" | "empty";
  code?: string;
  sq?: string;
  pointerId: number;
  x: number;
  y: number;
  moved: boolean;
};

function squareName(file: string, rank: number) {
  return `${file}${rank}`;
}

function wipeDelay(): number {
  if (typeof window === "undefined" || !window.matchMedia) return 320;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 320;
}

function starMarks(stars: number) {
  const filled = Math.max(0, Math.min(3, stars));
  return `${"★".repeat(filled)}${"☆".repeat(3 - filled)}`;
}

export function GrandmasterVision() {
  const [level, setLevel] = useState(1);
  const [position, setPosition] = useState<VisionPosition | null>(null);
  const [phase, setPhase] = useState<Phase>("study");
  const [attempt, setAttempt] = useState<Record<string, string>>({});
  const [studyMs, setStudyMs] = useState(0);
  const [result, setResult] = useState<AttemptScore | null>(null);
  const [round, setRound] = useState<RoundScore | null>(null);
  const [roundLog, setRoundLog] = useState<LevelRound[]>([]);
  const roundLogRef = useRef<LevelRound[]>([]);
  const [progress, setProgress] = useState<VisionProgress>(emptyProgress);
  const [showIntro, setShowIntro] = useState(true);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [hideNext, setHideNext] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const selectionRef = useRef<Selection>(null);
  const attemptRef = useRef(attempt);
  const phaseRef = useRef(phase);
  const studyRef = useRef(0);
  const studyFrozen = useRef(0);
  const studying = useRef(false);
  const dragRef = useRef<Drag | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);
  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const original = position ? piecesFromFen(position.fen) : {};

  useLayoutEffect(() => {
    setProgress(loadProgress());
    if (onboardingDismissed()) setShowIntro(false);
  }, []);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    openLevel(1);
  }, []);

  useEffect(() => {
    if (phase !== "study" || !position || showIntro) {
      studying.current = false;
      return;
    }
    studying.current = true;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      if (!studying.current) return;
      const ms = now - started;
      studyRef.current = ms;
      setStudyMs(ms);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      studying.current = false;
      cancelAnimationFrame(frame);
    };
  }, [phase, position, showIntro]);

  useEffect(() => {
    if (phase !== "clearing") return;
    const timer = window.setTimeout(() => {
      setPhase("rebuild");
    }, wipeDelay());
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    const root = pillsRef.current;
    const pill = root?.querySelector(`[data-gmv-level="${level}"]`);
    if (!root || !(pill instanceof HTMLElement)) return;
    const left = pill.offsetLeft - root.clientWidth / 2 + pill.clientWidth / 2;
    root.scrollTo({ left: Math.max(0, left) });
  }, [level, progress]);

  function openLevel(nextLevel: number, index = 0) {
    const rounds = positionsForLevel(nextLevel);
    const next = rounds[index] ?? rounds[0];
    if (index === 0) {
      roundLogRef.current = [];
      setRoundLog([]);
    }
    hideGhost();
    dragRef.current = null;
    setLevel(nextLevel);
    setPosition(next);
    attemptRef.current = {};
    setAttempt({});
    setResult(null);
    setRound(null);
    setSelection(null);
    studyRef.current = 0;
    studyFrozen.current = 0;
    setStudyMs(0);
    setPhase("study");
  }

  function startLevel(nextLevel: number) {
    if (!isLevelUnlocked(progress, nextLevel)) return;
    unlockGrandmasterAudio();
    openLevel(nextLevel, 0);
  }

  function goNextRound() {
    unlockGrandmasterAudio();
    openLevel(level, roundLogRef.current.length);
  }

  function retryStudy() {
    if (!position) return;
    unlockGrandmasterAudio();
    hideGhost();
    dragRef.current = null;
    attemptRef.current = {};
    setAttempt({});
    setResult(null);
    setRound(null);
    setSelection(null);
    studyRef.current = 0;
    studyFrozen.current = 0;
    setStudyMs(0);
    setPhase("study");
  }

  function markReady() {
    if (phaseRef.current !== "study" || showIntro) return;
    studying.current = false;
    const frozen = studyRef.current;
    studyFrozen.current = frozen;
    setStudyMs(frozen);
    unlockGrandmasterAudio();
    playShutter();
    setPhase("clearing");
  }

  function dismissIntro() {
    if (hideNext) dismissOnboarding();
    setShowIntro(false);
    unlockGrandmasterAudio();
  }

  function place(sq: string, code: string) {
    setAttempt((prev) => {
      const next = { ...prev, [sq]: code };
      attemptRef.current = next;
      return next;
    });
    playWoodSnap();
  }

  function movePiece(from: string, to: string) {
    if (from === to) return;
    setAttempt((prev) => {
      const moving = prev[from];
      if (!moving) return prev;
      const next = { ...prev };
      const occupant = next[to];
      delete next[from];
      next[to] = moving;
      if (occupant) next[from] = occupant;
      attemptRef.current = next;
      return next;
    });
    playWoodSnap();
  }

  function removePiece(sq: string) {
    setAttempt((prev) => {
      if (!prev[sq]) return prev;
      const next = { ...prev };
      delete next[sq];
      attemptRef.current = next;
      return next;
    });
    setSelection(null);
  }

  function hideGhost() {
    const ghost = ghostRef.current;
    if (!ghost) return;
    ghost.hidden = true;
  }

  function showGhost(code: string, x: number, y: number) {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const img = ghost.querySelector("img");
    if (img && PIECE_SRC[code]) img.src = PIECE_SRC[code];
    ghost.hidden = false;
    ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  }

  function squareFromPoint(x: number, y: number): string | null {
    const hit = document.elementFromPoint(x, y)?.closest?.("[data-gmv-square]");
    if (hit instanceof HTMLElement && hit.dataset.gmvSquare) return hit.dataset.gmvSquare;
    return null;
  }

  function insideBoard(x: number, y: number): boolean {
    const board = boardRef.current;
    if (!board) return false;
    const rect = board.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, drag: Drag) {
    dragRef.current = drag;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (phaseRef.current !== "rebuild" || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    unlockGrandmasterAudio();
    const tray = target.closest("[data-gmv-tray]");
    const squareEl = target.closest("[data-gmv-square]");
    const sq = squareEl instanceof HTMLElement ? squareEl.dataset.gmvSquare : undefined;
    const point = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };

    if (tray instanceof HTMLElement && tray.dataset.gmvTray) {
      beginDrag(event, { kind: "tray", code: tray.dataset.gmvTray, ...point });
      return;
    }
    if (!sq) return;
    const code = attemptRef.current[sq];
    if (code) beginDrag(event, { kind: "board", sq, code, ...point });
    else beginDrag(event, { kind: "empty", sq, ...point });
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && dx * dx + dy * dy < 36) return;
    drag.moved = true;
    if (drag.code) showGhost(drag.code, event.clientX, event.clientY);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    hideGhost();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const dropped = squareFromPoint(event.clientX, event.clientY);
    const sel = selectionRef.current;

    if (!drag.moved) {
      if (drag.kind === "tray" && drag.code) {
        if (sel?.kind === "tray" && sel.code === drag.code) setSelection(null);
        else setSelection({ kind: "tray", code: drag.code });
        return;
      }
      if (drag.kind === "board" && drag.sq) {
        if (sel?.kind === "tray") {
          place(drag.sq, sel.code);
          return;
        }
        if (sel?.kind === "board" && sel.sq === drag.sq) {
          removePiece(drag.sq);
          return;
        }
        if (sel?.kind === "board") {
          movePiece(sel.sq, drag.sq);
          setSelection(null);
          return;
        }
        setSelection({ kind: "board", sq: drag.sq });
        return;
      }
      if (drag.kind === "empty" && drag.sq) {
        if (sel?.kind === "tray") place(drag.sq, sel.code);
        else if (sel?.kind === "board") {
          movePiece(sel.sq, drag.sq);
          setSelection(null);
        }
      }
      return;
    }

    if (drag.kind === "tray" && drag.code && dropped) {
      place(dropped, drag.code);
      setSelection({ kind: "tray", code: drag.code });
      return;
    }
    if (drag.kind === "board" && drag.sq) {
      if (dropped && dropped !== drag.sq) {
        movePiece(drag.sq, dropped);
        setSelection(null);
        return;
      }
      if (!dropped && !insideBoard(event.clientX, event.clientY)) removePiece(drag.sq);
      return;
    }
    if (drag.kind === "empty" && dropped) {
      if (sel?.kind === "tray") place(dropped, sel.code);
      else if (sel?.kind === "board" && sel.sq !== dropped) {
        movePiece(sel.sq, dropped);
        setSelection(null);
      }
    }
  }

  function submitBoard() {
    if (phase !== "rebuild" || !position || level == null) return;
    unlockGrandmasterAudio();
    const scored = scoreAttempt(original, attemptRef.current);
    const roundScore = scoreRound(scored.accuracy, studyFrozen.current);
    const history = [...roundLogRef.current, { correct: scored.correct, total: scored.total, score: roundScore }];
    roundLogRef.current = history;
    setRoundLog(history);
    const done = history.length >= positionsForLevel(level).length;
    const levelScore = done ? scoreLevel(history) : null;
    const correct = history.reduce((sum, entry) => sum + entry.correct, 0);
    const total = history.reduce((sum, entry) => sum + entry.total, 0);
    setResult(
      done && levelScore
        ? { ...scored, correct, total, accuracy: levelScore.accuracy }
        : scored,
    );
    setRound(levelScore ?? roundScore);
    setSelection(null);
    if (done && levelScore) {
      setProgress((prev) => {
        const next = recordResult(prev, level, levelScore.stars, levelScore.total);
        saveProgress(next);
        return next;
      });
    }
    setScoreOpen(true);
    setPhase("feedback");
    const heard = levelScore ? levelScore.accuracy : scored.accuracy;
    if (heard >= HIGH_ACCURACY) playVictoryChord();
    else playErrorTone();
  }

  const showPieces = phase === "study" || phase === "clearing" || phase === "feedback" || phase === "rebuild";
  const roundCount = positionsForLevel(level).length;
  const levelDone = roundLog.length >= roundCount;
  const nextLevel = level + 1;
  const canNext = nextLevel <= 10 && isLevelUnlocked(progress, nextLevel);
  const trayLive = phase === "rebuild";
  const primaryReady = phase === "study" || phase === "clearing";

  return (
    <main
      className="gmv"
      data-grandmaster-vision
      data-gmv-phase={phase}
      data-gmv-view="board"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <h1 className="gmv-sr">Grandmaster Vision</h1>
      <header className="gmv-bar">
        <Link to="/" className="gmv-home" data-gmv-home aria-label="Home">
          Home
        </Link>
        <div className="gmv-pills" ref={pillsRef} data-gmv-levels role="tablist" aria-label="Levels">
          {LEVEL_INFO.map((info) => {
            const unlocked = isLevelUnlocked(progress, info.level);
            const stars = progress.levels[String(info.level)]?.stars ?? 0;
            return (
              <button
                key={info.level}
                type="button"
                role="tab"
                className={`gmv-pill${level === info.level ? " is-current" : ""}`}
                data-gmv-level={info.level}
                data-gmv-locked={unlocked ? "false" : "true"}
                aria-selected={level === info.level}
                aria-label={`L${info.level}, ${info.name}, ${info.range}, ${stars} stars${unlocked ? "" : ", locked"}`}
                disabled={!unlocked}
                onClick={() => startLevel(info.level)}
              >
                <span className="gmv-pill-id">L{info.level}</span>
                <span className="gmv-pill-stars" data-gmv-pill-stars={stars} aria-hidden="true">
                  <span className="is-on">{starMarks(stars).slice(0, stars)}</span>
                  <span className="is-off">{starMarks(stars).slice(stars)}</span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="gmv-study-time" data-gmv-study-time data-gmv-time>
          {formatStudyTime(studyMs)}
        </p>
      </header>
      <p className="gmv-sr" data-gmv-status={phase} aria-live="polite">
        {phase === "study" && `Level ${level}, round ${Math.min(roundCount, roundLog.length + 1)} of ${roundCount}. Study the position.`}
        {phase === "clearing" && "The board clears."}
        {phase === "rebuild" && "Rebuild the position from the dock."}
        {phase === "feedback" && position && `${position.title}. ${result?.accuracy ?? 0}% accurate.`}
      </p>

      <div className="gmv-arena">
          <div className="gmv-stage">
            <div className={`gmv-frame ${phase === "clearing" ? "is-wipe" : ""}`} data-gmv-board ref={boardRef}>
              <div className="gmv-grid" role="grid" aria-label="Chessboard">
                {RANKS.flatMap((rank) =>
                  FILES.map((file) => {
                    const sq = squareName(file, rank);
                    const light = (file.charCodeAt(0) + rank) % 2 === 1;
                    const want = original[sq];
                    const got = attempt[sq];
                    const mark = phase === "feedback" ? result?.marks[sq] : undefined;
                    const shown =
                      phase === "study" || phase === "clearing"
                        ? want
                        : phase === "feedback"
                          ? mark === "miss"
                            ? undefined
                            : got || (mark === "ok" ? want : undefined)
                          : got;
                    const ghost = phase === "feedback" && want && mark && mark !== "ok" ? want : undefined;
                    const armed = phase === "rebuild" && selection?.kind === "board" && selection.sq === sq;
                    return (
                      <button
                        key={sq}
                        type="button"
                        role="gridcell"
                        className={`gmv-sq ${light ? "is-light" : "is-dark"}${mark === "ok" ? " is-ok" : ""}${
                          mark === "miss" || mark === "wrong" ? " is-bad" : ""
                        }${armed ? " is-armed" : ""}`}
                        data-gmv-square={sq}
                        data-gmv-piece={shown ?? ""}
                        data-gmv-mark={mark ?? ""}
                        aria-label={`${sq}${shown ? `, ${pieceName(shown)}` : ghost ? `, missed ${pieceName(ghost)}` : ", empty"}`}
                        aria-disabled={phase !== "rebuild"}
                      >
                        {ghost ? (
                          <span className="gmv-ghost" data-gmv-ghost={ghost}>
                            <ChessPiece code={ghost} />
                          </span>
                        ) : null}
                        {shown && showPieces ? (
                          <span className="gmv-live">
                            <ChessPiece code={shown} />
                          </span>
                        ) : null}
                        {file === "a" ? (
                          <span className="gmv-coord gmv-coord-rank" aria-hidden="true">
                            {rank}
                          </span>
                        ) : null}
                        {rank === 1 ? (
                          <span className="gmv-coord gmv-coord-file" aria-hidden="true">
                            {file}
                          </span>
                        ) : null}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

        {phase === "rebuild" ? (
          <aside className="gmv-dock" data-gmv-tray-box data-live="true" aria-label="Piece dock">
            <TrayColumn
              label="White pieces"
              codes={WHITE_TRAY}
              selected={selection?.kind === "tray" ? selection.code : null}
              live={trayLive}
            />
            <TrayColumn
              label="Black pieces"
              codes={BLACK_TRAY}
              selected={selection?.kind === "tray" ? selection.code : null}
              live={trayLive}
            />
          </aside>
        ) : null}

        <div className="gmv-bottom">
          <button type="button" className="gmv-retry" data-gmv-retry onClick={retryStudy}>
            Retry
          </button>
          <button
            type="button"
            className="gmv-gold"
            data-gmv-ready={primaryReady ? "true" : undefined}
            data-gmv-submit={!primaryReady ? "true" : undefined}
            disabled={showIntro || (phase !== "study" && phase !== "rebuild")}
            onClick={() => {
              if (phase === "study") markReady();
              else if (phase === "rebuild") submitBoard();
            }}
          >
            {primaryReady ? "I'm Ready!" : "Submit Position"}
          </button>
        </div>
      </div>

      {showIntro ? (
        <div className="gmv-modal gmv-intro" data-gmv-intro role="dialog" aria-modal="true" aria-labelledby="gmv-intro-title">
          <section className="gmv-modal-card gmv-intro-card">
            <h2 id="gmv-intro-title">Position Recall Training</h2>
            <p>
              Position Recall training was popularized in the 1960s by Dutch psychologist and chess master Adriaan de Groot
              and later expanded by Nobel laureate Herbert Simon.
            </p>
            <ul>
              <li>
                <strong>Blindfold Visualization:</strong> Reconstructing a position forces the brain to sharpen its internal
                3D visual board.
              </li>
              <li>
                <strong>Calculation Anchoring:</strong> Before calculating deep tactical lines, players must have a
                rock-solid mental snapshot of the starting position so they don't get lost.
              </li>
              <li>
                <strong>Pawn Structure Intuition:</strong> Grandmasters train themselves to memorize pawn skeletons, which
                dictate where every piece belongs.
              </li>
            </ul>
            <label className="gmv-intro-check">
              <input
                type="checkbox"
                checked={hideNext}
                data-gmv-hide-intro
                onChange={(event) => setHideNext(event.target.checked)}
              />
              Don't show again
            </label>
            <button type="button" className="gmv-gold" data-gmv-intro-start onClick={dismissIntro}>
              Got It / Start
            </button>
          </section>
        </div>
      ) : null}

      {phase === "feedback" && scoreOpen && round && result ? (
        <div
          className="gmv-modal"
          data-gmv-modal
          role="dialog"
          aria-modal="true"
          aria-label="Score"
          onClick={(event) => {
            const target = event.target;
            if (!(target instanceof Element) || target.closest("button, a")) return;
            setScoreOpen(false);
          }}
        >
          <section className="gmv-modal-card" data-gmv-score>
            <div className="gmv-stars" data-gmv-stars={round.stars} aria-label={`${round.stars} stars`}>
              {[1, 2, 3].map((n) => (
                <span key={n} className={n <= round.stars ? "gmv-star is-on" : "gmv-star"} aria-hidden="true">
                  ★
                </span>
              ))}
            </div>
            <p className="gmv-round-score" data-gmv-round-score>
              {round.total}
            </p>
            <dl className="gmv-breakdown">
              <div>
                <dt>Base</dt>
                <dd data-gmv-base>{round.base}</dd>
              </div>
              <div>
                <dt>Speed bonus</dt>
                <dd data-gmv-speed>{round.speed}</dd>
              </div>
              {round.perfect > 0 ? (
                <div>
                  <dt>Perfect</dt>
                  <dd data-gmv-perfect>{round.perfect}</dd>
                </div>
              ) : null}
              <div>
                <dt>Accuracy</dt>
                <dd className="gmv-accuracy" data-gmv-accuracy>
                  {result.accuracy}%
                </dd>
              </div>
            </dl>
            <p className="gmv-score-note">
              {levelDone
                ? `${result.correct} of ${result.total} pieces across ${roundCount} rounds · studied ${formatStudyTime(round.studyMs)}`
                : `Round ${roundLog.length} of ${roundCount} · ${result.correct} of ${result.total} pieces · studied ${formatStudyTime(round.studyMs)}`}
            </p>
            <div className="gmv-score-actions">
              <button
                type="button"
                className="gmv-next"
                data-gmv-next
                disabled={levelDone && !canNext}
                onClick={() => {
                  if (!levelDone) goNextRound();
                  else if (canNext) startLevel(nextLevel);
                }}
              >
                {levelDone ? "Next Level" : "Next round"}
              </button>
              <button type="button" className="gmv-retry gmv-replay" data-gmv-again onClick={() => startLevel(level)}>
                Replay
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="gmv-float" ref={ghostRef} hidden>
        <img alt="" draggable={false} />
      </div>
    </main>
  );
}

function TrayColumn({
  label,
  codes,
  selected,
  live,
}: {
  label: string;
  codes: readonly string[];
  selected: string | null;
  live: boolean;
}) {
  return (
    <div className="gmv-tray-col" role="group" aria-label={label}>
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          className={`gmv-tray-piece${selected === code ? " is-on" : ""}`}
          data-gmv-tray={code}
          aria-label={pieceName(code)}
          aria-pressed={selected === code}
          disabled={!live}
        >
          <ChessPiece code={code} />
        </button>
      ))}
    </div>
  );
}
