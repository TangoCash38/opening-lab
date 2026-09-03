import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { Chess, Square, Move } from "chess.js";
import { resumeAudio, soundPickup } from "@/lib/sounds";
import { ChessPiece, pieceName } from "./chess-pieces";

export const SLIDE_MS = 300;
export const SLIDE_EASE = "cubic-bezier(0.25, 0.8, 0.25, 1)";

export type SlideAnim = {
  from: Square;
  to: Square;
  piece: string;
};

export type PromotionPiece = "q" | "r" | "b" | "n";

export type PromotionPrompt = {
  color: "w" | "b";
  onPick: (piece: PromotionPiece) => void;
  onCancel?: () => void;
};

type Props = {
  game: Chess;
  flip: boolean;
  selected: Square | null;
  wrongUntil: Square | null;
  expected: Move | null;
  showHints: boolean;
  lastMove: { from: Square; to: Square } | null;
  slide: SlideAnim | null;
  onSlideComplete?: () => void;
  onSquare: (sq: Square) => void;
  /** Drag-drop from→to. Same book / play-on rules as click-to-click. */
  onPlay?: (from: Square, to: Square) => void;
  interactive: boolean;
  /** Play-on only. Book Practice/Test keep auto-queen. */
  promotion?: PromotionPrompt | null;
  /** Trainer full-screen: drop the 420px cap so the parent can size the board. */
  expanded?: boolean;
};

type PlacedPiece = {
  id: string;
  code: string;
  sq: Square;
};

type DragState = {
  pointerId: number;
  from: Square;
  code: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  squarePx: number;
  canDrag: boolean;
};

function squareToRC(sq: Square, flip: boolean) {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]) - 1;
  const col = flip ? 7 - file : file;
  const row = flip ? rank : 7 - rank;
  return { row, col };
}

function parsePieces(fenBoard: string): { sq: Square; code: string }[] {
  const rows = fenBoard.split("/");
  const out: { sq: Square; code: string }[] = [];
  for (let rr = 0; rr < 8; rr++) {
    const row = rows[rr]!.replace(/\d/g, (n) => ".".repeat(+n));
    for (let cc = 0; cc < 8; cc++) {
      const ch = row[cc]!;
      if (ch === ".") continue;
      const file = "abcdefgh"[cc]!;
      const rank = 8 - rr;
      out.push({ sq: `${file}${rank}` as Square, code: ch });
    }
  }
  return out;
}

function newId(code: string, sq: Square) {
  return `${code}-${sq}-${Math.random().toString(36).slice(2, 8)}`;
}

function squareFromElement(el: EventTarget | null): Square | null {
  if (!(el instanceof Element)) return null;
  const hit = el.closest("[data-sq]");
  if (hit instanceof HTMLElement && hit.dataset.sq) {
    return hit.dataset.sq as Square;
  }
  return null;
}

function squareFromPoint(x: number, y: number): Square | null {
  if (typeof document === "undefined" || !document.elementsFromPoint) {
    const top = document.elementFromPoint?.(x, y) ?? null;
    return squareFromElement(top);
  }
  for (const el of document.elementsFromPoint(x, y)) {
    const sq = squareFromElement(el);
    if (sq) return sq;
  }
  return null;
}

const PROMO_PIECES: { key: PromotionPiece; label: string }[] = [
  { key: "q", label: "Q" },
  { key: "r", label: "R" },
  { key: "b", label: "B" },
  { key: "n", label: "N" },
];

const DRAG_PX = 8;

export function ChessBoard({
  game,
  flip,
  selected,
  wrongUntil,
  expected,
  showHints,
  lastMove,
  slide,
  onSlideComplete,
  onSquare,
  onPlay,
  interactive,
  promotion,
  expanded = false,
}: Props) {
  const completeRef = useRef(onSlideComplete);
  completeRef.current = onSlideComplete;
  const onSquareRef = useRef(onSquare);
  onSquareRef.current = onSquare;
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const ignoreClickRef = useRef(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const fenBoard = game.fen().split(" ")[0]!;

  const [pieces, setPieces] = useState<PlacedPiece[]>(() =>
    parsePieces(fenBoard).map((p) => ({
      id: newId(p.code, p.sq),
      code: p.code,
      sq: p.sq,
    })),
  );

  const moverIdRef = useRef<string | null>(null);
  const lastSlideRef = useRef<SlideAnim | null>(null);

  useLayoutEffect(() => {
    setPieces((prev) => {
      const next = parsePieces(fenBoard);

      if (slide) {
        lastSlideRef.current = slide;
        const base = next.filter((p) => p.sq !== slide.to);
        if (!base.some((p) => p.sq === slide.from)) {
          base.push({ sq: slide.from, code: slide.piece });
        }

        const prevMover = prev.find(
          (x) => x.sq === slide.from && x.code === slide.piece,
        );
        if (prevMover) moverIdRef.current = prevMover.id;

        return base.map((p) => {
          if (p.sq === slide.from && p.code === slide.piece) {
            const id =
              moverIdRef.current ?? prevMover?.id ?? newId(p.code, p.sq);
            moverIdRef.current = id;
            return { id, code: p.code, sq: p.sq };
          }
          const old = prev.find((x) => x.sq === p.sq && x.code === p.code);
          return {
            id: old?.id ?? newId(p.code, p.sq),
            code: p.code,
            sq: p.sq,
          };
        });
      }

      const used = new Set<string>();
      const result: PlacedPiece[] = [];
      const committed = lastSlideRef.current;

      for (const p of next) {
        if (
          committed &&
          moverIdRef.current &&
          p.sq === committed.to &&
          p.code === committed.piece &&
          !used.has(moverIdRef.current)
        ) {
          used.add(moverIdRef.current);
          result.push({
            id: moverIdRef.current,
            code: p.code,
            sq: p.sq,
          });
          continue;
        }

        const stationary = prev.find(
          (x) =>
            !used.has(x.id) &&
            x.sq === p.sq &&
            x.code === p.code &&
            x.id !== moverIdRef.current,
        );
        if (stationary) {
          used.add(stationary.id);
          result.push({ id: stationary.id, code: p.code, sq: p.sq });
          continue;
        }

        const fallback = prev.find(
          (x) =>
            !used.has(x.id) &&
            x.code === p.code &&
            x.id !== moverIdRef.current,
        );
        if (fallback) {
          used.add(fallback.id);
          result.push({ id: fallback.id, code: p.code, sq: p.sq });
          continue;
        }

        result.push({ id: newId(p.code, p.sq), code: p.code, sq: p.sq });
      }

      if (!slide) {
        lastSlideRef.current = null;
        moverIdRef.current = null;
      }

      return result;
    });
  }, [fenBoard, slide]);

  const [glideOn, setGlideOn] = useState(false);
  const slideGen = useRef(0);

  useLayoutEffect(() => {
    if (!slide) {
      setGlideOn(false);
      return;
    }
    const gen = ++slideGen.current;
    setGlideOn(false);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (slideGen.current === gen) setGlideOn(true);
      });
    });
    const done = window.setTimeout(() => {
      if (slideGen.current === gen) completeRef.current?.();
    }, SLIDE_MS + 40);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(done);
    };
  }, [slide?.from, slide?.to, slide?.piece]);

  useLayoutEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const blockScroll = (e: TouchEvent) => {
      if (dragRef.current?.moved) e.preventDefault();
    };
    el.addEventListener("touchmove", blockScroll, { passive: false });
    return () => el.removeEventListener("touchmove", blockScroll);
  }, []);

  const dragOrigin = drag?.moved ? drag.from : null;
  const origin = selected ?? dragOrigin;
  const legalTargets = origin
    ? new Set(game.moves({ square: origin, verbose: true }).map((m) => m.to))
    : new Set<string>();

  const clearDrag = () => {
    dragRef.current = null;
    setDrag(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (dragRef.current) return;
    resumeAudio();

    const sq =
      squareFromElement(e.target) ?? squareFromPoint(e.clientX, e.clientY);
    if (!sq) return;

    const piece = game.get(sq);
    const canDrag = !!(piece && piece.color === game.turn());
    const placed = parsePieces(fenBoard).find((p) => p.sq === sq);
    const rect = surfaceRef.current?.getBoundingClientRect();
    const next: DragState = {
      pointerId: e.pointerId,
      from: sq,
      code: placed?.code ?? "",
      startX: e.clientX,
      startY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      moved: false,
      squarePx: rect ? rect.width / 8 : 48,
      canDrag,
    };
    dragRef.current = next;
    ignoreClickRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture is optional — point-up still resolves via coordinates.
    }
    if (canDrag) e.preventDefault();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    d.x = e.clientX;
    d.y = e.clientY;
    if (!d.moved) {
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.canDrag || dx * dx + dy * dy < DRAG_PX * DRAG_PX) return;
      d.moved = true;
      soundPickup();
    }
    setDrag({ ...d });
    if (d.moved) e.preventDefault();
  };

  const finishPointer = (e: ReactPointerEvent<HTMLDivElement>, cancel: boolean) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
    clearDrag();
    if (cancel || !interactive) return;

    if (d.moved && d.canDrag) {
      const dest = squareFromPoint(e.clientX, e.clientY);
      if (dest && dest !== d.from) {
        onPlayRef.current?.(d.from, dest);
      }
      return;
    }
    onSquareRef.current(d.from);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    finishPointer(e, false);
  };

  const onPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    finishPointer(e, true);
  };

  const squares: ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const rr = flip ? 7 - r : r;
      const cc = flip ? 7 - c : c;
      const file = "abcdefgh"[cc]!;
      const rank = 8 - rr;
      const sq = `${file}${rank}` as Square;
      const light = (rr + cc) % 2 === 0;
      const occPiece = game.get(sq);
      const isDraggablePiece = interactive && !!occPiece && occPiece.color === game.turn();

      const isSelected = selected === sq || dragOrigin === sq;
      const isWrong = wrongUntil === sq;
      const isFrom = showHints && expected?.from === sq;
      const isTo = showHints && expected?.to === sq;
      const isLegal = legalTargets.has(sq);
      const isLastFrom = lastMove?.from === sq;
      const isLastTo = lastMove?.to === sq;

      const rows = fenBoard.split("/");
      const fenRow = rows[rr]!.replace(/\d/g, (n) => ".".repeat(+n));
      const fenOcc = fenRow[cc] !== ".";

      squares.push(
        <button
          key={sq}
          type="button"
          data-sq={sq}
          disabled={!interactive}
          style={isDraggablePiece ? { touchAction: "none" } : undefined}
          onClick={() => {
            if (ignoreClickRef.current) {
              ignoreClickRef.current = false;
              return;
            }
            if (interactive) onSquare(sq);
          }}
          aria-label={fenOcc ? `${sq} ${pieceName(fenRow[cc]!)}` : sq}
          className={[
            "relative select-none overflow-hidden",
            "transition-[box-shadow,background] duration-200 ease-out",
            light ? "sq-light" : "sq-dark",
            isSelected ? "sq-selected" : "",
            isWrong ? "sq-wrong" : "",
            isFrom ? "sq-hint-from" : "",
            isTo ? "sq-hint-to" : "",
            !isFrom && !isTo && !isWrong && !isSelected && isLastFrom
              ? "sq-last-from"
              : "",
            !isFrom && !isTo && !isWrong && !isSelected && isLastTo
              ? "sq-last-to"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isLegal && !fenOcc && interactive && (
            <span
              className="legal-dot absolute left-1/2 top-1/2 z-[1] size-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full"
              aria-hidden
            />
          )}
          {isLegal && fenOcc && interactive && (
            <span
              className="legal-capture pointer-events-none absolute inset-[6%] z-[1] rounded-full"
              aria-hidden
            />
          )}
          {r === 7 && (
            <span
              className={`sq-coord pointer-events-none absolute bottom-0.5 right-1 z-[2] text-[0.72rem] font-bold leading-none ${
                light ? "sq-coord--on-light" : "sq-coord--on-dark"
              }`}
            >
              {file}
            </span>
          )}
          {c === 0 && (
            <span
              className={`sq-coord pointer-events-none absolute left-1 top-0.5 z-[2] text-[0.72rem] font-bold leading-none ${
                light ? "sq-coord--on-light" : "sq-coord--on-dark"
              }`}
            >
              {rank}
            </span>
          )}
        </button>,
      );
    }
  }

  const pieceNodes = useMemo(() => {
    return pieces.map((p) => {
      if (slide && p.sq === slide.to) return null;

      const isMover = !!(
        slide &&
        p.sq === slide.from &&
        p.code === slide.piece
      );
      const isDragging = !!(drag?.moved && p.sq === drag.from);

      const visualSq = isMover && glideOn && slide ? slide.to : p.sq;
      const { row, col } = squareToRC(visualSq, flip);

      return (
        <div
          key={p.id}
          data-piece-id={p.id}
          data-piece-sq={visualSq}
          data-moving={isMover ? "1" : undefined}
          data-dragging={isDragging ? "1" : undefined}
          className="piece-abs"
          style={{
            left: `${col * 12.5}%`,
            top: `${row * 12.5}%`,
            width: "12.5%",
            height: "12.5%",
            zIndex: isMover ? 40 : 5,
            transition: isMover
              ? `left ${SLIDE_MS}ms ${SLIDE_EASE}, top ${SLIDE_MS}ms ${SLIDE_EASE}`
              : undefined,
            willChange: isMover ? "left, top" : undefined,
          }}
        >
          <span className="piece-abs-inner">
            <ChessPiece code={p.code} />
          </span>
        </div>
      );
    });
  }, [pieces, slide, glideOn, flip, drag]);

  return (
    <div className={`relative mx-auto w-full ${expanded ? "mb-0 max-w-none" : "mb-4 max-w-[420px]"}`}>
      <div className="board-frame" dir="ltr">
        <div className="board-frame-inner">
          <div
            ref={surfaceRef}
            className={`board-play relative aspect-square w-full${wrongUntil ? " board-wrong-dim" : ""}`}
            onPointerDown={interactive ? onPointerDown : undefined}
            onPointerMove={interactive ? onPointerMove : undefined}
            onPointerUp={interactive ? onPointerUp : undefined}
            onPointerCancel={interactive ? onPointerCancel : undefined}
            onLostPointerCapture={interactive ? onPointerCancel : undefined}
          >
            {/* Squares receive all pointer events */}
            <div
              className="absolute inset-0 z-0 grid overflow-hidden"
              style={{
                gridTemplateColumns: "repeat(8,1fr)",
                gridTemplateRows: "repeat(8,1fr)",
              }}
            >
              {squares}
            </div>

            {/* Pieces paint above squares but never steal clicks */}
            <div className="pointer-events-none absolute inset-0 z-10 overflow-visible">
              {pieceNodes}
            </div>
          </div>
        </div>
      </div>
      {drag?.moved && drag.code ? (
        <div
          className="piece-drag-ghost"
          style={{
            left: drag.x,
            top: drag.y,
            width: drag.squarePx,
            height: drag.squarePx,
            marginLeft: -drag.squarePx / 2,
            marginTop: -drag.squarePx / 2,
          }}
          aria-hidden
        >
          <span className="piece-abs-inner">
            <ChessPiece code={drag.code} />
          </span>
        </div>
      ) : null}
      {promotion ? (
        <div
          className="promo-picker"
          role="dialog"
          aria-label="Choose promotion"
          onClick={() => promotion.onCancel?.()}
        >
          <div
            className="promo-picker-row"
            onClick={(e) => e.stopPropagation()}
          >
            {PROMO_PIECES.map((p) => {
              const code = promotion.color === "w" ? p.key.toUpperCase() : p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  className="promo-picker-btn"
                  onClick={() => promotion.onPick(p.key)}
                  aria-label={`Promote to ${p.label}`}
                >
                  <ChessPiece code={code} />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
