import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ChessPiece, pieceName } from "./chess-pieces";

const FILES = "abcdefgh";

type Drag = {
  pointerId: number;
  rank: number;
  file: number;
  code: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  moved: boolean;
  squarePx: number;
};

type Props = {
  /** Piece codes in rank-8 to rank-1 order, file a to h. Empty squares are null. */
  codes: readonly (readonly (string | null)[])[];
  onPlace: (rank: number, file: number) => void;
  onMove: (fromRank: number, fromFile: number, toRank: number, toFile: number) => void;
  onRemove: (rank: number, file: number) => void;
};

function squareName(rank: number, file: number): string {
  return `${FILES[file]}${8 - rank}`;
}

export function CreatorSetupBoard({ codes, onPlace, onMove, onRemove }: Props) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const ignoreClickRef = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);

  const squareFromPoint = (clientX: number, clientY: number): { rank: number; file: number } | null => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return null;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
    return {
      file: Math.min(7, Math.floor((x / rect.width) * 8)),
      rank: Math.min(7, Math.floor((y / rect.height) * 8)),
    };
  };

  const onPiecePointerDown = (event: ReactPointerEvent<HTMLButtonElement>, rank: number, file: number, code: string) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const squarePx = rect ? rect.width / 8 : 40;
    const next: Drag = {
      pointerId: event.pointerId,
      rank,
      file,
      code,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      squarePx,
    };
    dragRef.current = next;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPiecePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    const dy = event.clientY - current.startY;
    if (!current.moved && dx * dx + dy * dy < 36) return;
    current.moved = true;
    current.x = event.clientX;
    current.y = event.clientY;
    setDrag({ ...current });
    event.preventDefault();
  };

  const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>, cancel: boolean) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    dragRef.current = null;
    setDrag(null);
    if (cancel) return;
    if (!current.moved) return;
    ignoreClickRef.current = true;
    window.setTimeout(() => {
      ignoreClickRef.current = false;
    }, 0);
    const dest = squareFromPoint(event.clientX, event.clientY);
    if (!dest) {
      onRemove(current.rank, current.file);
      return;
    }
    if (dest.rank === current.rank && dest.file === current.file) return;
    onMove(current.rank, current.file, dest.rank, dest.file);
  };

  return (
    <div className="creator-packs-board creator-setup-wrap" data-creator-setup-board>
      <div className="relative mx-auto w-full max-w-[420px]">
        <div className="board-frame" dir="ltr">
          <div className="board-frame-inner">
            <div ref={surfaceRef} className="board-play creator-setup-play relative aspect-square w-full">
              <div className="creator-setup-grid" role="grid" aria-label="Position editor">
                {codes.map((rank, rankIndex) =>
                  rank.map((code, fileIndex) => {
                    const light = (rankIndex + fileIndex) % 2 === 0;
                    const name = squareName(rankIndex, fileIndex);
                    const draggingHere = drag?.moved && drag.rank === rankIndex && drag.file === fileIndex;
                    return (
                      <button
                        key={name}
                        type="button"
                        role="gridcell"
                        data-creator-setup-sq={name}
                        className={`creator-setup-sq ${light ? "sq-light" : "sq-dark"}${draggingHere ? " sq-selected" : ""}`}
                        aria-label={code ? `${name} ${pieceName(code)}` : name}
                        onClick={() => {
                          if (ignoreClickRef.current) return;
                          onPlace(rankIndex, fileIndex);
                        }}
                      >
                        {rankIndex === 7 ? (
                          <span
                            className={`sq-coord pointer-events-none absolute bottom-0.5 right-1 z-[2] text-[0.72rem] font-bold leading-none ${
                              light ? "sq-coord--on-light" : "sq-coord--on-dark"
                            }`}
                            aria-hidden
                          >
                            {FILES[fileIndex]}
                          </span>
                        ) : null}
                        {fileIndex === 0 ? (
                          <span
                            className={`sq-coord pointer-events-none absolute left-1 top-0.5 z-[2] text-[0.72rem] font-bold leading-none ${
                              light ? "sq-coord--on-light" : "sq-coord--on-dark"
                            }`}
                            aria-hidden
                          >
                            {8 - rankIndex}
                          </span>
                        ) : null}
                      </button>
                    );
                  }),
                )}
              </div>
              <div className="piece-layer pointer-events-none absolute inset-0 z-10">
                {codes.map((rank, rankIndex) =>
                  rank.map((code, fileIndex) => {
                    if (!code) return null;
                    const name = squareName(rankIndex, fileIndex);
                    const draggingHere = drag?.moved && drag.rank === rankIndex && drag.file === fileIndex;
                    return (
                      <button
                        key={name}
                        type="button"
                        className="piece-abs creator-setup-piece"
                        data-dragging={draggingHere ? "1" : undefined}
                        data-creator-setup-piece={name}
                        style={{
                          left: `${fileIndex * 12.5}%`,
                          top: `${rankIndex * 12.5}%`,
                          width: "12.5%",
                          height: "12.5%",
                          touchAction: "none",
                        }}
                        aria-label={`Drag ${pieceName(code)} on ${name}`}
                        onPointerDown={(event) => onPiecePointerDown(event, rankIndex, fileIndex, code)}
                        onPointerMove={onPiecePointerMove}
                        onPointerUp={(event) => finishDrag(event, false)}
                        onPointerCancel={(event) => finishDrag(event, true)}
                        onClick={() => {
                          if (ignoreClickRef.current) return;
                          onPlace(rankIndex, fileIndex);
                        }}
                      >
                        <span className="piece-abs-inner">
                          <ChessPiece code={code} />
                        </span>
                      </button>
                    );
                  }),
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {drag?.moved ? (
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
    </div>
  );
}
