import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { Chess, Square, Move } from "chess.js";
import { getBoardTheme, subscribeBoardTheme } from "@/lib/board-theme";
import { resumeAudio, soundPickup } from "@/lib/sounds";
import { ChessPiece, pieceName } from "./chess-pieces";

export const SLIDE_MS = 300;
export const SLIDE_EASE = "cubic-bezier(0.25, 0.8, 0.25, 1)";
export const ARCADE_SLIDE_MS = 240;
export const ARCADE_SLIDE_EASE = "cubic-bezier(0.34, 1.45, 0.64, 1)";

/** Chess.js piece letter: uppercase = white, lowercase = black. */
function pieceSide(code: string): "w" | "b" {
  return code === code.toUpperCase() ? "w" : "b";
}

export type SlideAnim = {
  from: Square;
  to: Square;
  piece: string;
  /** Captured piece code (KQRBN uppercase white / lowercase black). Arcade blasts it off. */
  captured?: string;
};

export type PromotionPiece = "q" | "r" | "b" | "n";

export type PromotionPrompt = {
  color: "w" | "b";
  onPick: (piece: PromotionPiece) => void;
  onCancel?: () => void;
};

export type BoardArrow = {
  from: Square;
  to: Square;
  /** pv1 blue, pv2 grey, option = spoken potential move (green with a cream edge). */
  kind: "pv1" | "pv2" | "option";
};

/** Deep green body plus a cream edge, readable on cream and on green or brown squares. */
const OPTION_ARROW = "#1b6b3a";
const OPTION_ARROW_HALO = "#f7f3ea";

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
  /** Drag-drop from→to. Same book-trainer rules as click-to-click. */
  onPlay?: (from: Square, to: Square) => void;
  interactive: boolean;
  /** Optional promotion picker. Book Practice/Test keep auto-queen. */
  promotion?: PromotionPrompt | null;
  /** Trainer full-screen: drop the 420px cap so the parent can size the board. */
  expanded?: boolean;
  /** Arcade mate: king on this square blasts off before the finish sheet. */
  mateBlast?: { code: string; sq: Square } | null;
  onMateBlastDone?: () => void;
  /** Practice-review MultiPV arrows, or lesson potential-move arrows. */
  arrows?: BoardArrow[];
  /** Extra soft-green hint moves (authoring MultiPV first plies). */
  hintMoves?: { from: Square; to: Square }[];
  /**
   * File/rank on the wood margin (book diagram). In-square labels stay the
   * default everywhere else — the pack frame only opts in when they fit.
   */
  frameCoords?: boolean;
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

function arrowShaft(from: Square, to: Square, flip: boolean) {
  const a = squareToRC(from, flip);
  const b = squareToRC(to, flip);
  const x1 = a.col + 0.5;
  const y1 = a.row + 0.5;
  const x2 = b.col + 0.5;
  const y2 = b.row + 0.5;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const start = Math.min(0.42, len * 0.36);
  const end = Math.min(0.18, len * 0.14);
  const sx = x1 + ux * start;
  const sy = y1 + uy * start;
  const ex = x2 - ux * end;
  const ey = y2 - uy * end;
  const head = Math.min(0.34, Math.max(0.22, len * 0.28));
  const hx = ex - ux * head;
  const hy = ey - uy * head;
  const px = -uy * head * 0.42;
  const py = ux * head * 0.42;
  return { sx, sy, hx, hy, ex, ey, px, py };
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

function placementKey(pieces: { code: string; sq: string }[]) {
  return pieces
    .map((p) => `${p.code}@${p.sq}`)
    .sort()
    .join("|");
}

const PROMO_PIECES: { key: PromotionPiece; label: string }[] = [
  { key: "q", label: "Q" },
  { key: "r", label: "R" },
  { key: "b", label: "B" },
  { key: "n", label: "N" },
];

const DRAG_PX = 8;

function ArcadeCaptureBlast({
  code,
  from,
  sq,
  flip,
}: {
  code: string;
  from: Square;
  sq: Square;
  flip: boolean;
}) {
  const fromRC = squareToRC(from, flip);
  const toRC = squareToRC(sq, flip);
  let dx = toRC.col - fromRC.col;
  let dy = toRC.row - fromRC.row;
  if (dx === 0 && dy === 0) {
    dx = 1;
    dy = -1;
  }
  const len = Math.hypot(dx, dy) || 1;
  const blastX = `${(dx / len) * 130}%`;
  const blastY = `${(dy / len) * 130}%`;
  const rot = `${dx >= 0 ? 42 : -42}deg`;
  const style = {
    left: `${toRC.col * 12.5}%`,
    top: `${toRC.row * 12.5}%`,
    width: "12.5%",
    height: "12.5%",
    zIndex: 50,
    ["--blast-x"]: blastX,
    ["--blast-y"]: blastY,
    ["--blast-rot"]: rot,
  } as CSSProperties;
  return (
    <div
      className="piece-abs piece-arcade-blast"
      data-arcade-blast="1"
      data-piece-color={pieceSide(code)}
      style={style}
    >
      <span className="piece-abs-inner">
        <ChessPiece code={code} />
      </span>
    </div>
  );
}

function mateShardClip(index: number, count: number) {
  const step = (Math.PI * 2) / count;
  const mid = index * step - Math.PI / 2;
  const a0 = mid - step / 2 - 0.12;
  const a1 = mid + step / 2 + 0.12;
  const p0 = {
    x: 50 + Math.cos(a0) * 85,
    y: 50 + Math.sin(a0) * 85,
  };
  const p1 = {
    x: 50 + Math.cos(a1) * 85,
    y: 50 + Math.sin(a1) * 85,
  };
  return `polygon(50% 50%, ${p0.x.toFixed(1)}% ${p0.y.toFixed(1)}%, ${p1.x.toFixed(1)}% ${p1.y.toFixed(1)}%)`;
}

function buildMateShards(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = 110 + (i % 3) * 28;
    return {
      clip: mateShardClip(i, count),
      x: `${(Math.cos(angle) * dist).toFixed(1)}%`,
      y: `${(Math.sin(angle) * dist).toFixed(1)}%`,
      rot: `${(((i * 53) % 90) - 45).toFixed(0)}deg`,
      stagger: `${(i % 4) * 20}ms`,
    };
  });
}

const MATE_SHARD_COUNT = 8;
const MATE_SHATTER_MS = 520;
const MATE_TOTAL_MS = 1450;

function ArcadeMateBlast({
  code,
  sq,
  flip,
  onDone,
}: {
  code: string;
  sq: Square;
  flip: boolean;
  onDone?: () => void;
}) {
  const { row, col } = squareToRC(sq, flip);
  const shards = useMemo(() => buildMateShards(MATE_SHARD_COUNT), []);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const tBanner = window.setTimeout(() => setShowBanner(true), MATE_SHATTER_MS);
    const tDone = window.setTimeout(() => onDone?.(), MATE_TOTAL_MS);
    return () => {
      window.clearTimeout(tBanner);
      window.clearTimeout(tDone);
    };
  }, [onDone]);

  const cell = {
    left: `${col * 12.5}%`,
    top: `${row * 12.5}%`,
    width: "12.5%",
    height: "12.5%",
  } as CSSProperties;

  return (
    <>
      <div className="arcade-mate-flash" style={cell} aria-hidden />
      {!showBanner
        ? shards.map((s, i) => (
            <div
              key={i}
              className="piece-abs piece-arcade-mate-shard"
              data-arcade-mate-blast="1"
              data-piece-color={pieceSide(code)}
              style={
                {
                  ...cell,
                  zIndex: 55,
                  clipPath: s.clip,
                  ["--mate-x"]: s.x,
                  ["--mate-y"]: s.y,
                  ["--mate-rot"]: s.rot,
                  animationDelay: s.stagger,
                } as CSSProperties
              }
              aria-hidden
            >
              <span className="piece-abs-inner">
                <ChessPiece code={code} />
              </span>
            </div>
          ))
        : null}
      {showBanner ? (
        <div className="arcade-mate-banner" role="status" aria-live="polite">
          <span className="arcade-mate-banner-glow" aria-hidden />
          <span className="arcade-mate-banner-text">CHECKMATE</span>
        </div>
      ) : null}
    </>
  );
}

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
  mateBlast = null,
  onMateBlastDone,
  arrows,
  hintMoves,
  frameCoords = false,
}: Props) {
  const completeRef = useRef(onSlideComplete);
  completeRef.current = onSlideComplete;
  const onSquareRef = useRef(onSquare);
  onSquareRef.current = onSquare;
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [boardTheme, setBoardThemeState] = useState(getBoardTheme);
  useEffect(() => {
    setBoardThemeState(getBoardTheme());
    return subscribeBoardTheme(() => setBoardThemeState(getBoardTheme()));
  }, []);
  const slideMs = boardTheme === "arcade" ? ARCADE_SLIDE_MS : SLIDE_MS;
  const slideEase = boardTheme === "arcade" ? ARCADE_SLIDE_EASE : SLIDE_EASE;
  const [arcadeBlast, setArcadeBlast] = useState<{
    code: string;
    sq: Square;
    from: Square;
    key: number;
  } | null>(null);

  useEffect(() => {
    if (boardTheme !== "arcade" || !slide?.captured) return;
    setArcadeBlast({
      code: slide.captured,
      sq: slide.to,
      from: slide.from,
      key: Date.now(),
    });
  }, [boardTheme, slide?.captured, slide?.from, slide?.to]);

  useEffect(() => {
    if (!arcadeBlast) return;
    const t = window.setTimeout(() => setArcadeBlast(null), 480);
    return () => window.clearTimeout(t);
  }, [arcadeBlast]);
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
  const piecesRef = useRef(pieces);
  piecesRef.current = pieces;
  /** Bumped when the position jumps (notation, reset) so the piece DOM is replaced. */
  const [pieceEpoch, setPieceEpoch] = useState(0);

  useLayoutEffect(() => {
    const next = parsePieces(fenBoard);
    const jumped =
      !slide && !lastSlideRef.current && placementKey(piecesRef.current) !== placementKey(next);
    setPieces((prev) => {
      if (slide) {
        lastSlideRef.current = slide;
        const base = next.filter((p) => p.sq !== slide.to);
        if (!base.some((p) => p.sq === slide.from)) {
          base.push({ sq: slide.from, code: slide.piece });
        }

        const prevMover = prev.find((x) => x.sq === slide.from && x.code === slide.piece);
        if (prevMover) moverIdRef.current = prevMover.id;

        const used = new Set<string>();
        return base.map((p) => {
          if (p.sq === slide.from && p.code === slide.piece) {
            const id = moverIdRef.current ?? prevMover?.id ?? newId(p.code, p.sq);
            moverIdRef.current = id;
            used.add(id);
            return { id, code: p.code, sq: p.sq };
          }
          const old = prev.find((x) => !used.has(x.id) && x.sq === p.sq && x.code === p.code);
          const id = old?.id ?? newId(p.code, p.sq);
          used.add(id);
          return { id, code: p.code, sq: p.sq };
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
            !used.has(x.id) && x.sq === p.sq && x.code === p.code && x.id !== moverIdRef.current,
        );
        if (stationary) {
          used.add(stationary.id);
          result.push({ id: stationary.id, code: p.code, sq: p.sq });
          continue;
        }

        // New sprite. Reusing a same-type piece from another square keeps the
        // old compositor layer (dark-mode ghosts on fold and mode switch).
        result.push({ id: newId(p.code, p.sq), code: p.code, sq: p.sq });
      }

      lastSlideRef.current = null;
      moverIdRef.current = null;

      return result;
    });
    if (jumped) setPieceEpoch((n) => n + 1);
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
    }, slideMs + 40);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(done);
    };
  }, [slide?.from, slide?.to, slide?.piece, slideMs]);

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

    const sq = squareFromElement(e.target) ?? squareFromPoint(e.clientX, e.clientY);
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
      const isFrom =
        showHints && (expected?.from === sq || Boolean(hintMoves?.some((h) => h.from === sq)));
      const isTo =
        showHints &&
        !isFrom &&
        (expected?.to === sq || Boolean(hintMoves?.some((h) => h.to === sq)));
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
            !isFrom && !isTo && !isWrong && !isSelected && isLastFrom ? "sq-last-from" : "",
            !isFrom && !isTo && !isWrong && !isSelected && isLastTo ? "sq-last-to" : "",
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
          {!frameCoords && r === 7 && (
            <span
              className={`sq-coord pointer-events-none absolute bottom-0.5 right-1 z-[2] text-[0.72rem] font-bold leading-none ${
                light ? "sq-coord--on-light" : "sq-coord--on-dark"
              }`}
            >
              {file}
            </span>
          )}
          {!frameCoords && c === 0 && (
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
      if (mateBlast && p.sq === mateBlast.sq) return null;
      if (slide && p.sq === slide.to) return null;

      const isMover = !!(slide && p.sq === slide.from && p.code === slide.piece);
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
          data-piece-color={pieceSide(p.code)}
          className="piece-abs"
          style={{
            left: `${col * 12.5}%`,
            top: `${row * 12.5}%`,
            width: "12.5%",
            height: "12.5%",
            zIndex: isMover ? 40 : 5,
            transition: isMover
              ? `left ${slideMs}ms ${slideEase}, top ${slideMs}ms ${slideEase}`
              : "none",
            willChange: isMover ? "left, top" : "auto",
          }}
        >
          <span className="piece-abs-inner">
            <ChessPiece code={p.code} />
          </span>
        </div>
      );
    });
  }, [pieces, slide, glideOn, flip, drag, slideMs, slideEase, mateBlast]);

  const marginFiles = (flip ? "hgfedcba" : "abcdefgh").split("");
  const marginRanks = flip
    ? ["1", "2", "3", "4", "5", "6", "7", "8"]
    : ["8", "7", "6", "5", "4", "3", "2", "1"];

  return (
    <div
      className={`relative mx-auto w-full ${expanded ? "mb-0 max-w-none" : frameCoords ? "mb-1 max-w-[420px]" : "mb-4 max-w-[420px]"}`}
    >
      <div className={`board-frame${frameCoords ? " board-frame--margin-coords" : ""}`} dir="ltr">
        {frameCoords ? (
          <div className="board-margin-ranks" aria-hidden>
            {marginRanks.map((label) => (
              <span key={label} className="board-margin-label">
                {label}
              </span>
            ))}
          </div>
        ) : null}
        <div className="board-frame-inner">
          <div
            ref={surfaceRef}
            className={`board-play relative aspect-square w-full`}
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

            {arrows && arrows.length > 0 ? (
              <svg
                className="board-arrows pointer-events-none absolute inset-0 z-[12] h-full w-full overflow-visible"
                viewBox="0 0 8 8"
                preserveAspectRatio="none"
                aria-hidden
                data-board-arrows
              >
                {[
                  ...arrows.filter((a) => a.kind === "pv2"),
                  ...arrows.filter((a) => a.kind === "option"),
                  ...arrows.filter((a) => a.kind === "pv1"),
                ].map((arrow) => {
                  const { sx, sy, hx, hy, ex, ey, px, py } = arrowShaft(arrow.from, arrow.to, flip);
                  const option = arrow.kind === "option";
                  const color = option
                    ? OPTION_ARROW
                    : arrow.kind === "pv1"
                      ? "#3b6ea5"
                      : "#8a8278";
                  const width = arrow.kind === "pv2" ? 0.12 : 0.14;
                  const head = `M ${ex} ${ey} L ${hx + px} ${hy + py} L ${hx - px} ${hy - py} Z`;
                  const tipX = ex + (ex - hx) * 0.22;
                  const tipY = ey + (ey - hy) * 0.22;
                  const haloHead = `M ${tipX} ${tipY} L ${hx + px * 1.85} ${hy + py * 1.85} L ${hx - px * 1.85} ${hy - py * 1.85} Z`;
                  return (
                    <g
                      key={`${arrow.kind}-${arrow.from}-${arrow.to}`}
                      className={
                        option
                          ? "board-arrow board-arrow--option"
                          : arrow.kind === "pv1"
                            ? "board-arrow board-arrow--pv1"
                            : "board-arrow board-arrow--pv2"
                      }
                      data-board-arrow={`${arrow.from}${arrow.to}`}
                      data-board-arrow-kind={arrow.kind}
                    >
                      {option ? (
                        <g className="board-arrow-halo">
                          <line
                            x1={sx}
                            y1={sy}
                            x2={hx}
                            y2={hy}
                            stroke={OPTION_ARROW_HALO}
                            strokeWidth={0.28}
                            strokeLinecap="round"
                          />
                          <path d={haloHead} fill={OPTION_ARROW_HALO} />
                        </g>
                      ) : null}
                      <line
                        x1={sx}
                        y1={sy}
                        x2={hx}
                        y2={hy}
                        stroke={color}
                        strokeWidth={width}
                        strokeLinecap="round"
                      />
                      <path d={head} fill={color} />
                    </g>
                  );
                })}
              </svg>
            ) : null}

            {/* Pieces paint above squares but never steal clicks.
                Epoch remounts the layer when the position jumps so sprites
                from the previous FEN cannot linger. */}
            <div
              key={pieceEpoch}
              className="piece-layer pointer-events-none absolute inset-0 z-10 overflow-hidden"
            >
              {pieceNodes}
              {arcadeBlast ? (
                <ArcadeCaptureBlast
                  key={arcadeBlast.key}
                  code={arcadeBlast.code}
                  from={arcadeBlast.from}
                  sq={arcadeBlast.sq}
                  flip={flip}
                />
              ) : null}
              {mateBlast ? (
                <ArcadeMateBlast
                  key={`mate-${mateBlast.sq}-${mateBlast.code}`}
                  code={mateBlast.code}
                  sq={mateBlast.sq}
                  flip={flip}
                  onDone={onMateBlastDone}
                />
              ) : null}
            </div>

            {wrongUntil ? <div className="board-wrong-dim" aria-hidden /> : null}

            {/* Play-on promo: inside board-play so it centers on squares and stays above pieces */}
            {promotion ? (
              <div
                className="promo-picker"
                role="dialog"
                aria-label="Choose promotion"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => promotion.onCancel?.()}
              >
                <div
                  className="promo-picker-row"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {PROMO_PIECES.map((p) => {
                    const code = promotion.color === "w" ? p.key.toUpperCase() : p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        className="promo-picker-btn"
                        data-piece-color={promotion.color}
                        onPointerDown={(e) => {
                          // Play WebView: commit on pointerdown so the pick is not lost.
                          e.preventDefault();
                          e.stopPropagation();
                          promotion.onPick(p.key);
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        aria-label={`Promote to ${p.label}`}
                      >
                        <span className="piece-abs-inner">
                          <ChessPiece code={code} />
                        </span>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        {frameCoords ? (
          <div className="board-margin-files" aria-hidden>
            {marginFiles.map((label) => (
              <span key={label} className="board-margin-label">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {drag?.moved && drag.code ? (
        <div
          className="piece-drag-ghost"
          data-piece-color={pieceSide(drag.code)}
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
    </div>
  );
}
