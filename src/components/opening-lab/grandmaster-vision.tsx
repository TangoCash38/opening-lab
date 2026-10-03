import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import {
  formatRebuildTime,
  HIGH_ACCURACY,
  LEVEL_INFO,
  piecesFromFen,
  pickPosition,
  scoreAttempt,
  SNAPSHOT_MS,
  type AttemptScore,
  type VisionPosition,
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
const LEVEL_GROUPS = [
  { id: "beginner", label: "Beginner", from: 1, to: 3 },
  { id: "intermediate", label: "Intermediate", from: 4, to: 7 },
  { id: "advanced", label: "Advanced", from: 8, to: 10 },
] as const;
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

type Phase = "menu" | "snapshot" | "clearing" | "rebuild" | "feedback";
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

export function GrandmasterVision() {
  const [level, setLevel] = useState<number | null>(null);
  const [position, setPosition] = useState<VisionPosition | null>(null);
  const [phase, setPhase] = useState<Phase>("menu");
  const [attempt, setAttempt] = useState<Record<string, string>>({});
  const [remain, setRemain] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AttemptScore | null>(null);
  const [selection, setSelection] = useState<Selection>(null);
  const selectionRef = useRef<Selection>(null);
  const attemptRef = useRef(attempt);
  const phaseRef = useRef(phase);
  const rebuildStart = useRef(0);
  const dragRef = useRef<Drag | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (phase !== "snapshot" || !position) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / SNAPSHOT_MS);
      setRemain(1 - t);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      playShutter();
      setPhase("clearing");
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, position]);

  useEffect(() => {
    if (phase !== "clearing") return;
    const timer = window.setTimeout(() => {
      rebuildStart.current = performance.now();
      setPhase("rebuild");
    }, wipeDelay());
    return () => window.clearTimeout(timer);
  }, [phase]);

  function startLevel(nextLevel: number) {
    unlockGrandmasterAudio();
    const avoid = position && position.level === nextLevel ? position.id : undefined;
    const next = pickPosition(nextLevel, avoid);
    hideGhost();
    dragRef.current = null;
    setLevel(nextLevel);
    setPosition(next);
    attemptRef.current = {};
    setAttempt({});
    setResult(null);
    setSelection(null);
    setRemain(1);
    setElapsed(0);
    setPhase("snapshot");
  }

  function leaveToLevels() {
    hideGhost();
    dragRef.current = null;
    setSelection(null);
    setPhase("menu");
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
    if (phase !== "rebuild" || !position) return;
    unlockGrandmasterAudio();
    const ms = performance.now() - rebuildStart.current;
    const scored = scoreAttempt(original, attemptRef.current);
    setElapsed(ms);
    setResult(scored);
    setSelection(null);
    setPhase("feedback");
    if (scored.accuracy >= HIGH_ACCURACY) playVictoryChord();
    else playErrorTone();
  }

  const showPieces = phase === "snapshot" || phase === "clearing" || phase === "feedback" || phase === "rebuild";
  const levelInfo = LEVEL_INFO.find((info) => info.level === level);
  const trayLive = phase === "rebuild";

  return (
    <main
      className="gmv"
      data-grandmaster-vision
      data-gmv-phase={phase}
      data-gmv-view={phase === "menu" ? "levels" : "board"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <header className="gmv-bar">
        <Link to="/" className="gmv-home" data-gmv-home>
          Opening Lab
        </Link>
        <h1 className="gmv-title">Grandmaster Vision</h1>
        {phase !== "menu" ? (
          <button type="button" className="gmv-back" data-gmv-back onClick={leaveToLevels}>
            Levels
          </button>
        ) : null}
      </header>

      {phase === "menu" ? (
        <LevelPicker onPick={startLevel} />
      ) : (
        <div className="gmv-play">
          <div className="gmv-readout">
            <p className="gmv-status" data-gmv-status={phase} aria-live="polite">
              {phase === "snapshot" &&
                `Level ${level} · ${levelInfo?.name ?? "Board"} · memorise the position`}
              {phase === "clearing" && "The board clears."}
              {phase === "rebuild" && "Set the pieces from the tray. Drag one off the board to remove it."}
              {phase === "feedback" && position && `${position.title}. ${result?.accuracy ?? 0}% accurate.`}
            </p>
            {phase === "snapshot" ? (
              <div className="gmv-count" data-gmv-countdown aria-hidden>
                <div className="gmv-count-fill" style={{ transform: `scaleX(${remain})` }} />
              </div>
            ) : (
              <div className="gmv-count gmv-count-idle" aria-hidden />
            )}
          </div>

          <div className="gmv-stage">
            <div
              className={`gmv-frame ${phase === "clearing" ? "is-wipe" : ""}`}
              data-gmv-board
              ref={boardRef}
            >
              <div className="gmv-grid" role="grid" aria-label="Chessboard">
                {RANKS.flatMap((rank) =>
                  FILES.map((file) => {
                    const sq = squareName(file, rank);
                    const light = (file.charCodeAt(0) + rank) % 2 === 1;
                    const want = original[sq];
                    const got = attempt[sq];
                    const mark = phase === "feedback" ? result?.marks[sq] : undefined;
                    const shown =
                      phase === "snapshot" || phase === "clearing"
                        ? want
                        : phase === "feedback"
                          ? mark === "miss"
                            ? undefined
                            : got || (mark === "ok" ? want : undefined)
                          : got;
                    const ghost = phase === "feedback" && want && mark && mark !== "ok" ? want : undefined;
                    const armed =
                      phase === "rebuild" &&
                      ((selection?.kind === "board" && selection.sq === sq) || false);
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

          <div className="gmv-drawer">
            <div className="gmv-drawer-inner">
              {phase === "feedback" && result ? (
                <section className="gmv-score" data-gmv-score aria-label="Score">
                  <p className="gmv-accuracy" data-gmv-accuracy>
                    {result.accuracy}%
                  </p>
                  <p className="gmv-score-note">
                    {result.correct} of {result.total} pieces on the right square
                  </p>
                  <p className="gmv-time" data-gmv-time>
                    Time to rebuild {formatRebuildTime(elapsed)}
                  </p>
                  <div className="gmv-score-actions">
                    <button
                      type="button"
                      className="gmv-next"
                      data-gmv-next
                      onClick={() => startLevel(level === 10 ? 10 : (level ?? 1) + 1)}
                    >
                      Next Level
                    </button>
                    <button
                      type="button"
                      className="gmv-again"
                      data-gmv-again
                      onClick={() => level && startLevel(level)}
                    >
                      Try Again
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  <div
                    className="gmv-tray"
                    data-gmv-tray-box
                    data-live={trayLive ? "true" : "false"}
                    aria-label="Piece tray"
                  >
                    <TrayRow
                      label="White"
                      codes={WHITE_TRAY}
                      selected={selection?.kind === "tray" ? selection.code : null}
                      live={trayLive}
                    />
                    <TrayRow
                      label="Black"
                      codes={BLACK_TRAY}
                      selected={selection?.kind === "tray" ? selection.code : null}
                      live={trayLive}
                    />
                  </div>
                  <div className="gmv-actions">
                    <button
                      type="button"
                      className="gmv-submit"
                      data-gmv-submit
                      disabled={!trayLive}
                      onClick={submitBoard}
                    >
                      Submit Board
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="gmv-float" ref={ghostRef} hidden>
        <img alt="" draggable={false} />
      </div>
    </main>
  );
}

function LevelPicker({ onPick }: { onPick: (level: number) => void }) {
  return (
    <section className="gmv-picker" data-gmv-levels aria-label="Choose a level">
      <p className="gmv-picker-lead">Look for five seconds. Rebuild the position.</p>
      <div className="gmv-picker-bands">
        {LEVEL_GROUPS.map((group) => (
          <div className="gmv-band" key={group.id} data-gmv-band={group.id}>
            <h2 className="gmv-band-label">
              {group.label}
              <span>
                {group.from}–{group.to}
              </span>
            </h2>
            <div className="gmv-band-grid" role="group" aria-label={`${group.label} levels ${group.from} to ${group.to}`}>
              {LEVEL_INFO.filter((info) => info.level >= group.from && info.level <= group.to).map((info) => (
                <button
                  key={info.level}
                  type="button"
                  data-gmv-level={info.level}
                  aria-label={`Level ${info.level}, ${info.name}, ${info.range}`}
                  onClick={() => onPick(info.level)}
                >
                  <span className="gmv-lv-num">{info.level}</span>
                  <span className="gmv-lv-name">{info.name}</span>
                  <span className="gmv-lv-range">{info.range.replace(" pieces", "")}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrayRow({
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
    <div className="gmv-tray-row">
      <span className="gmv-tray-label">{label}</span>
      <div className="gmv-tray-pieces">
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
    </div>
  );
}
