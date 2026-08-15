import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Chess, Square, Move } from "chess.js";
import { ChessPiece, pieceName } from "./chess-pieces";

export const SLIDE_MS = 300;
export const SLIDE_EASE = "cubic-bezier(0.25, 0.8, 0.25, 1)";

export type SlideAnim = {
  from: Square;
  to: Square;
  piece: string;
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
  interactive: boolean;
};

type PlacedPiece = {
  id: string;
  code: string;
  sq: Square;
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
  interactive,
}: Props) {
  const completeRef = useRef(onSlideComplete);
  completeRef.current = onSlideComplete;

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

  const legalTargets = selected
    ? new Set(game.moves({ square: selected, verbose: true }).map((m) => m.to))
    : new Set<string>();

  const squares: ReactNode[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const rr = flip ? 7 - r : r;
      const cc = flip ? 7 - c : c;
      const file = "abcdefgh"[cc]!;
      const rank = 8 - rr;
      const sq = `${file}${rank}` as Square;
      const light = (rr + cc) % 2 === 0;

      const isSelected = selected === sq;
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
          onClick={() => interactive && onSquare(sq)}
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
          <span
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: light
                ? "linear-gradient(145deg, rgba(255,255,255,.35) 0%, transparent 42%, rgba(0,0,0,.06) 100%)"
                : "linear-gradient(145deg, rgba(255,255,255,.12) 0%, transparent 45%, rgba(0,0,0,.18) 100%)",
            }}
            aria-hidden
          />
          {isLegal && !fenOcc && interactive && (
            <span
              className="legal-dot absolute left-1/2 top-1/2 z-[1] size-[26%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/40 ring-2 ring-accent/20"
              aria-hidden
            />
          )}
          {isLegal && fenOcc && interactive && (
            <span
              className="pointer-events-none absolute inset-[6%] z-[1] rounded-full border-[3px] border-accent/55"
              aria-hidden
            />
          )}
          {r === 7 && (
            <span
              className={`pointer-events-none absolute bottom-0.5 right-1 z-[2] text-[0.62rem] font-semibold leading-none ${
                light ? "text-dark-sq/70" : "text-light-sq/80"
              }`}
            >
              {file}
            </span>
          )}
          {c === 0 && (
            <span
              className={`pointer-events-none absolute left-1 top-0.5 z-[2] text-[0.62rem] font-semibold leading-none ${
                light ? "text-dark-sq/70" : "text-light-sq/80"
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
      const isHintFromPiece = !!(showHints && expected?.from === p.sq && !isMover);

      const visualSq = isMover && glideOn && slide ? slide.to : p.sq;
      const { row, col } = squareToRC(visualSq, flip);

      return (
        <div
          key={p.id}
          data-piece-id={p.id}
          data-piece-sq={visualSq}
          data-moving={isMover ? "1" : undefined}
          className={`piece-abs${isHintFromPiece ? " piece-hint-from" : ""}`}
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
  }, [pieces, slide, glideOn, flip, showHints, expected?.from]);

  return (
    <div className="relative mx-auto mb-4 w-full max-w-[420px] touch-none">
      <div
        className="rounded-2xl p-[10px]"
        style={{
          background:
            "linear-gradient(145deg, #8b6342 0%, #6b4a2e 40%, #5a3d26 70%, #7a5638 100%)",
          boxShadow:
            "0 2px 4px rgba(28,25,21,.06), 0 16px 36px rgba(28,25,21,.14), inset 0 1px 0 rgba(255,255,255,.18)",
        }}
      >
        <div
          className="rounded-[10px] p-[3px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,.2), rgba(0,0,0,.15))",
          }}
        >
          <div
            className="relative aspect-square w-full rounded-lg"
            style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,.2)" }}
          >
            {/* Squares receive all pointer events */}
            <div
              className="absolute inset-0 z-0 grid overflow-hidden rounded-lg"
              style={{
                gridTemplateColumns: "repeat(8,1fr)",
                gridTemplateRows: "repeat(8,1fr)",
              }}
            >
              {squares}
            </div>

            {/* Pieces paint above squares but never steal clicks */}
            <div className="pointer-events-none absolute inset-0 z-10 overflow-visible rounded-lg">
              {pieceNodes}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
