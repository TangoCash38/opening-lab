import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { playWoodSnap, unlockGrandmasterAudio } from "@/lib/grandmaster-vision-audio";
import type { SquareMemoryPosition } from "@/lib/square-memory-positions";
import {
  MEMORY_LEVELS,
  PIECE_COUNTS,
  boardsMatch,
  isMemoryLevel,
  pickPosition,
  piecesFromFen,
  showMs,
} from "@/lib/square-memory-levels";
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

type Phase = "pick" | "show" | "rebuild" | "success" | "fail";
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

/**
 * Level mode. The opening-line game stays behind "Opening lines".
 * Placement matches Grandmaster Vision: drag from the tray, or tap a piece then a square.
 */
export function SquareMemoryLevels({ onOpenLines }: { onOpenLines: () => void }) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [level, setLevel] = useState<number>(1);
  const [position, setPosition] = useState<SquareMemoryPosition | null>(null);
  const [attempt, setAttempt] = useState<Record<string, string>>({});
  const [selection, setSelection] = useState<Selection>(null);
  const [round, setRound] = useState(0);
  const attemptRef = useRef(attempt);
  const selectionRef = useRef(selection);
  const phaseRef = useRef(phase);
  function go(next: Phase) {
    phaseRef.current = next;
    setPhase(next);
  }
  const dragRef = useRef<Drag | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);
  function choose(next: Selection) {
    selectionRef.current = next;
    setSelection(next);
  }
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "show" || !position) return;
    const timer = window.setTimeout(() => {
      setAttempt({});
      attemptRef.current = {};
      choose(null);
      go("rebuild");
    }, showMs(position.level));
    return () => window.clearTimeout(timer);
  }, [phase, position, round]);

  useEffect(() => {
    if (phase === "success" || phase === "fail") primaryRef.current?.focus();
  }, [phase, round]);

  const original = position ? piecesFromFen(position.fen) : {};
  const placing = phase === "rebuild";

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
    const hit = document.elementFromPoint(x, y)?.closest?.("[data-sml-square]");
    if (hit instanceof HTMLElement && hit.dataset.smlSquare) return hit.dataset.smlSquare;
    return null;
  }

  function insideBoard(x: number, y: number): boolean {
    const board = boardRef.current;
    if (!board) return false;
    const rect = board.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function place(sq: string, code: string) {
    setAttempt((prev) => {
      const next = { ...prev, [sq]: code };
      attemptRef.current = next;
      return next;
    });
    unlockGrandmasterAudio();
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
    unlockGrandmasterAudio();
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
    choose(null);
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, drag: Drag) {
    dragRef.current = drag;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (phaseRef.current !== "rebuild" || event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const tray = target.closest("[data-sml-tray]");
    const squareEl = target.closest("[data-sml-square]");
    const sq = squareEl instanceof HTMLElement ? squareEl.dataset.smlSquare : undefined;
    const point = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    if (tray instanceof HTMLElement && tray.dataset.smlTray) {
      beginDrag(event, { kind: "tray", code: tray.dataset.smlTray, ...point });
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
        if (sel?.kind === "tray" && sel.code === drag.code) choose(null);
        else choose({ kind: "tray", code: drag.code });
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
          choose(null);
          return;
        }
        choose({ kind: "board", sq: drag.sq });
        return;
      }
      if (drag.kind === "empty" && drag.sq) {
        if (sel?.kind === "tray") place(drag.sq, sel.code);
        else if (sel?.kind === "board") {
          movePiece(sel.sq, drag.sq);
          choose(null);
        }
      }
      return;
    }

    if (drag.kind === "tray" && drag.code && dropped) {
      place(dropped, drag.code);
      choose({ kind: "tray", code: drag.code });
      return;
    }
    if (drag.kind === "board" && drag.sq) {
      if (dropped && dropped !== drag.sq) {
        movePiece(drag.sq, dropped);
        choose(null);
        return;
      }
      if (!dropped && !insideBoard(event.clientX, event.clientY)) removePiece(drag.sq);
      return;
    }
    if (drag.kind === "empty" && dropped) {
      if (sel?.kind === "tray") place(dropped, sel.code);
      else if (sel?.kind === "board" && sel.sq !== dropped) {
        movePiece(sel.sq, dropped);
        choose(null);
      }
    }
  }

  function startLevel(nextLevel: number, avoidId?: string | null) {
    if (!isMemoryLevel(nextLevel)) return;
    hideGhost();
    dragRef.current = null;
    const next = pickPosition(nextLevel, avoidId);
    setLevel(nextLevel);
    setPosition(next);
    setAttempt({});
    attemptRef.current = {};
    choose(null);
    setRound((n) => n + 1);
    go("show");
  }

  function finish(correct: boolean) {
    hideGhost();
    dragRef.current = null;
    choose(null);
    go(correct ? "success" : "fail");
  }

  function exitToPicker() {
    hideGhost();
    dragRef.current = null;
    choose(null);
    go("pick");
  }

  const popOrder = Object.keys(original).sort();

  return (
    <main
      className="sml"
      data-square-memory-levels
      data-sml-phase={phase}
      data-sml-level={phase === "pick" ? "" : String(level)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {phase === "pick" ? (
        <section className="sml-pick" data-sml-picker>
          <header className="sml-bar">
            <Link to="/" className="sml-home" data-sml-home>
              Home
            </Link>
            <h1 className="sml-title">Square Memory</h1>
          </header>
          <div className="sml-pick-body">
            <p className="sml-lead">A position flashes up. Put the pieces back.</p>
            <p className="sml-note">Ten in each level. Stay on one, or move on.</p>
            <ul className="sml-levels">
              {MEMORY_LEVELS.map((item) => (
                <li key={item}>
                  <button type="button" className="sml-level" data-sml-level={item} onClick={() => startLevel(item)}>
                    <span className="sml-level-name">Level {item}</span>
                    <span className="sml-level-count">{PIECE_COUNTS[item]} pieces</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="sml-lines-link" data-sml-lines onClick={onOpenLines}>
              Opening lines
            </button>
            <p className="sml-lines-note">The square-by-square game.</p>
          </div>
        </section>
      ) : (
        <section className="sml-play">
          <div className="sml-top">
            <header className="sml-bar">
              <Link to="/" className="sml-home" data-sml-home>
                Home
              </Link>
              <div className="sml-pills" role="tablist" aria-label="Levels">
                {MEMORY_LEVELS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="tab"
                    className={`sml-pill${item === level ? " is-current" : ""}`}
                    data-sml-level={item}
                    aria-selected={item === level}
                    onClick={() => startLevel(item, item === level ? position?.id : null)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </header>
            <p className="sml-status" data-sml-status={phase} aria-live="polite">
              {phase === "show" ? "Watch." : null}
              {phase === "rebuild" ? "Put the pieces back." : null}
              {phase === "success" ? "Well done!" : null}
              {phase === "fail" ? "Not quite" : null}
            </p>
          </div>

          <div className="sml-stage">
            <div className="sml-arena" data-sml-placing={placing ? "true" : "false"}>
              <div className="sml-stack">
                <div className="sml-board" data-sml-board ref={boardRef}>
                  <div className="sml-grid" role="grid" aria-label="Chessboard">
                    {RANKS.map((rank) =>
                      FILES.map((file) => {
                        const sq = squareName(file, rank);
                        const light = (file.charCodeAt(0) + rank) % 2 === 1;
                        const shown = phase === "show" ? original[sq] : attempt[sq];
                        const armed = placing && selection?.kind === "board" && selection.sq === sq;
                        const popAt = popOrder.indexOf(sq);
                        return (
                          <button
                            key={sq}
                            type="button"
                            role="gridcell"
                            className={`sml-sq ${light ? "is-light" : "is-dark"}${armed ? " is-armed" : ""}`}
                            data-sml-square={sq}
                            data-sml-piece={shown ?? ""}
                            aria-label={shown ? `${sq}, ${pieceName(shown)}` : `${sq}, empty`}
                            aria-disabled={placing ? undefined : true}
                          >
                            {shown ? (
                              <span
                                className={`sml-live${phase === "show" ? " is-pop" : ""}`}
                                style={phase === "show" && popAt >= 0 ? { animationDelay: `${popAt * 45}ms` } : undefined}
                              >
                                <ChessPiece code={shown} />
                              </span>
                            ) : null}
                            {file === "a" ? (
                              <span className="sml-coord sml-coord-rank" aria-hidden="true">
                                {rank}
                              </span>
                            ) : null}
                            {rank === 1 ? (
                              <span className="sml-coord sml-coord-file" aria-hidden="true">
                                {file}
                              </span>
                            ) : null}
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>

                {placing ? (
                  <div className="sml-dock" data-sml-tray-box aria-label="Pieces">
                    <TrayRow
                      label="White pieces"
                      codes={WHITE_TRAY}
                      selected={selection?.kind === "tray" ? selection.code : null}
                    />
                    <TrayRow
                      label="Black pieces"
                      codes={BLACK_TRAY}
                      selected={selection?.kind === "tray" ? selection.code : null}
                    />
                  </div>
                ) : null}

                {placing ? (
                  <button
                    type="button"
                    className="sml-done"
                    data-sml-done
                    onClick={() => finish(boardsMatch(original, attemptRef.current))}
                  >
                    Done
                  </button>
                ) : null}
              </div>
            </div>

            {phase === "success" ? (
              <div className="sml-modal" role="dialog" aria-modal="true" aria-labelledby="sml-result-title" data-sml-result="success">
                <div className="sml-modal-card">
                  <h2 id="sml-result-title" className="sml-result-title">
                    Well done!
                  </h2>
                  <div className="sml-modal-actions">
                    {level < 5 ? (
                      <button
                        ref={primaryRef}
                        type="button"
                        className="sml-btn sml-btn-primary"
                        data-sml-next
                        onClick={() => startLevel(level + 1)}
                      >
                        Next level
                      </button>
                    ) : null}
                    <button
                      ref={level >= 5 ? primaryRef : undefined}
                      type="button"
                      className={level >= 5 ? "sml-btn sml-btn-primary" : "sml-btn sml-btn-quiet"}
                      data-sml-new
                      onClick={() => startLevel(level, position?.id)}
                    >
                      New puzzle
                    </button>
                    <button type="button" className="sml-btn sml-btn-quiet" data-sml-exit onClick={exitToPicker}>
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {phase === "fail" ? (
              <div className="sml-modal" role="dialog" aria-modal="true" aria-labelledby="sml-fail-title" data-sml-result="fail">
                <div className="sml-modal-card">
                  <h2 id="sml-fail-title" className="sml-result-title">
                    Not quite
                  </h2>
                  <div className="sml-modal-actions">
                    <button
                      ref={primaryRef}
                      type="button"
                      className="sml-btn sml-btn-primary"
                      data-sml-retry
                      onClick={() => {
                        if (!position) return;
                        hideGhost();
                        setAttempt({});
                        attemptRef.current = {};
                        choose(null);
                        setRound((n) => n + 1);
                        go("show");
                      }}
                    >
                      Retry
                    </button>
                    <button type="button" className="sml-btn sml-btn-quiet" data-sml-exit onClick={exitToPicker}>
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      )}

      <div className="sml-float" ref={ghostRef} hidden>
        <img alt="" draggable={false} />
      </div>
    </main>
  );
}

function TrayRow({
  label,
  codes,
  selected,
}: {
  label: string;
  codes: readonly string[];
  selected: string | null;
}) {
  return (
    <div className="sml-tray-row" role="group" aria-label={label}>
      {codes.map((code) => (
        <button
          key={code}
          type="button"
          className={`sml-tray-piece${selected === code ? " is-on" : ""}`}
          data-sml-tray={code}
          aria-label={pieceName(code)}
          aria-pressed={selected === code}
        >
          <ChessPiece code={code} />
        </button>
      ))}
    </div>
  );
}
