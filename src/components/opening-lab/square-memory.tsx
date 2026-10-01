import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { ChessPiece, pieceName } from "./chess-pieces";
import {
  isMuted,
  playHit,
  playMiss,
  playWatch,
  playWin,
  resumeAudio,
  setMuted,
  unlockAudio,
} from "@/lib/square-memory-audio";
import {
  SQUARE_MEMORY_LINE,
  SQUARE_MEMORY_NAME,
  SQUARE_MEMORY_PACK_ID,
  type MemoryBoard,
  type MemoryPly,
} from "@/lib/square-memory-line";
import { begin, tap, tick, titleState, type LitKind, type Snapshot } from "@/lib/square-memory";

const LINE = SQUARE_MEMORY_LINE;
const SQUARES = LINE.squares;
const BEST_KEY = "opening-lab:square-memory-best";
const MUTE_KEY = "opening-lab:square-memory-muted";
const FILES = "abcdefgh";
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function readBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeBest(n: number): void {
  try {
    if (n > readBest()) localStorage.setItem(BEST_KEY, String(Math.floor(n)));
  } catch {
    /* private mode */
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function SquareMemory() {
  const [snap, setSnap] = useState<Snapshot>(() => titleState(0));
  const [bestLabel, setBestLabel] = useState(0);
  const [muted, setMutedState] = useState(false);
  const snapRef = useRef(snap);
  const bestRef = useRef(0);
  const bestAtStart = useRef(0);
  snapRef.current = snap;

  const commit = (next: Snapshot) => {
    snapRef.current = next;
    setSnap(next);
    if (next.best > bestRef.current) {
      bestRef.current = next.best;
      writeBest(next.best);
      setBestLabel(next.best);
    }
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const stored = readBest();
    bestRef.current = stored;
    setBestLabel(stored);
    setSnap((current) => (current.phase === "title" ? titleState(stored) : current));
    const quiet = readMuted();
    setMutedState(quiet);
    setMuted(quiet);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") resumeAudio();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    let raf = 0;
    let alive = true;
    const frame = () => {
      if (!alive) return;
      const now = performance.now();
      try {
        const prev = snapRef.current;
        const next = tick(prev, now, SQUARES);
        if (next !== prev) {
          commitRef.current(next);
          if (
            next.phase === "watch" &&
            next.lit &&
            next.litKind === "flash" &&
            (prev.phase !== "watch" || prev.cursor !== next.cursor)
          ) {
            playWatch(next.cursor);
          }
          if (next.phase === "reveal" && prev.phase !== "reveal" && next.perfect) {
            playWin();
          }
        }
      } finally {
        if (alive) raf = requestAnimationFrame(frame);
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  function start() {
    const phase = snapRef.current.phase;
    if (phase !== "title" && phase !== "reveal") return;
    bestAtStart.current = bestRef.current;
    commit(begin(bestRef.current, performance.now(), SQUARES));
    try {
      unlockAudio();
      playWatch(0);
    } catch {
      /* sound is optional */
    }
  }

  function onTap(square: string) {
    const prev = snapRef.current;
    const next = tap(prev, square, SQUARES, performance.now());
    if (next === prev) return;
    commit(next);
    if (next.phase === "punish") {
      playMiss();
      navigator.vibrate?.(20);
    } else {
      playHit();
      navigator.vibrate?.(8);
    }
  }

  function toggleMute() {
    const next = !isMuted();
    setMuted(next);
    setMutedState(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  const playing = snap.phase === "watch" || snap.phase === "input" || snap.phase === "punish";
  const revealing = snap.phase === "reveal";
  const plyCount = revealing ? Math.floor(snap.score / 2) : 0;
  const position = revealing ? (LINE.positions[plyCount] ?? LINE.positions[0]!) : null;
  const last = revealing && plyCount > 0 ? LINE.plies[plyCount - 1] : undefined;
  const partial = revealing && snap.score % 2 === 1 ? LINE.plies[plyCount] : undefined;
  const foundPiece = partial && position ? pieceAt(position, partial.from) : null;
  const showPackLink = snap.phase === "title" || revealing;

  return (
    <main className="sqmem" data-square-memory>
      <header className="sqmem-bar">
        <div className="min-w-0">
          <Link to="/" className="sqmem-home" data-square-memory-home>
            Home
          </Link>
          {snap.phase === "title" ? (
            <>
              <h1 className="sqmem-title">Square Memory</h1>
              <p className="sqmem-instruction">Watch the squares. Tap them back in order.</p>
            </>
          ) : null}
          {playing ? <PlayStatus snap={snap} /> : null}
          {revealing ? (
            <>
              <p className="sqmem-score" data-square-memory-score>
                {snap.score}
              </p>
              <p className="sqmem-score-note">
                {snap.score === 1 ? "Square remembered" : "Squares remembered"}
                {snap.score > bestAtStart.current && snap.score > 0 ? " · New best" : ""}
              </p>
              <p className="sqmem-opening" data-square-memory-opening>
                {SQUARE_MEMORY_NAME}
              </p>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="sqmem-mute"
          data-mute=""
          onClick={toggleMute}
          aria-pressed={muted}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? (
            <VolumeX className="size-5" aria-hidden="true" />
          ) : (
            <Volume2 className="size-5" aria-hidden="true" />
          )}
        </button>
      </header>

      <div className="sqmem-board">
        <MemoryBoard
          lit={playing && snap.lit && snap.litKind ? { square: snap.lit, kind: snap.litKind } : null}
          interactive={snap.phase === "input" && snap.cursor < snap.length}
          position={position}
          lastMove={last ? { from: last.from, to: last.to } : null}
          found={partial ? partial.from : null}
          onTap={onTap}
        />
      </div>

      <footer className="sqmem-dock">
        {revealing ? (
          <RevealNotes
            score={snap.score}
            plyCount={plyCount}
            found={
              partial && foundPiece
                ? `You also found the ${pieceName(pieceCode(foundPiece))} on ${partial.from}.`
                : null
            }
          />
        ) : snap.phase === "title" && bestLabel > 0 ? (
          <p className="sqmem-best" data-square-memory-best>
            Best · {bestLabel} {bestLabel === 1 ? "square" : "squares"}
          </p>
        ) : null}
        {snap.phase === "title" ? (
          <button type="button" data-begin="" className="sqmem-begin" onClick={start}>
            Begin
          </button>
        ) : null}
        {revealing ? (
          <button type="button" data-begin="" className="sqmem-begin" onClick={start}>
            Play again
          </button>
        ) : null}
        {showPackLink ? <PackLink /> : null}
      </footer>
    </main>
  );
}

function PackLink() {
  return (
    <a
      className="sqmem-pack-link"
      data-square-memory-pack={SQUARE_MEMORY_PACK_ID}
      href={`/#pack/${SQUARE_MEMORY_PACK_ID}`}
    >
      Ruy Lopez for White
    </a>
  );
}

function PlayStatus({ snap }: { snap: Snapshot }) {
  const watching = snap.phase === "watch";
  const word = snap.phase === "punish" ? "Miss" : watching ? "Watch" : "Your turn";
  const detail =
    snap.phase === "punish"
      ? "That was not the next square."
      : watching
        ? `${snap.cursor + 1} of ${snap.length}`
        : `${snap.cursor} of ${snap.length}`;
  return (
    <p className="sqmem-status" aria-live="polite">
      <span className="sqmem-status-word">{word}</span>
      <span className="sqmem-status-detail">{detail}</span>
    </p>
  );
}

function RevealNotes({
  score,
  plyCount,
  found,
}: {
  score: number;
  plyCount: number;
  found: string | null;
}) {
  const rows = moveRows(LINE.plies, plyCount);
  return (
    <div className="sqmem-moves" data-square-memory-moves>
      <p className="sr-only">
        {SQUARE_MEMORY_NAME}. Position after {plyCount} {plyCount === 1 ? "move" : "moves"}. Score{" "}
        {score}.
      </p>
      {found ? <p className="sqmem-found">{found}</p> : null}
      <p className="sqmem-moves-label">
        {rows.length === 0 ? "The pieces had not moved yet." : "Moves you remembered"}
      </p>
      {rows.length > 0 ? (
        <ol>
          {rows.map((row) => (
            <li key={row.n} className="sqmem-move">
              <span>{row.n}.</span>
              <span>{row.white}</span>
              <span>{row.black ?? ""}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function moveRows(
  plies: readonly MemoryPly[],
  count: number,
): { n: number; white: string; black?: string }[] {
  const rows: { n: number; white: string; black?: string }[] = [];
  for (let i = 0; i < count; i += 2) {
    const black = i + 1 < count ? plies[i + 1]?.san : undefined;
    rows.push({ n: i / 2 + 1, white: plies[i]?.san ?? "", black });
  }
  return rows;
}

function MemoryBoard({
  lit,
  interactive,
  position,
  lastMove,
  found,
  onTap,
}: {
  lit: { square: string; kind: LitKind } | null;
  interactive: boolean;
  position: MemoryBoard | null;
  lastMove: { from: string; to: string } | null;
  found: string | null;
  onTap: (square: string) => void;
}) {
  return (
    <div className={interactive ? "board-frame board-frame--margin-coords sqmem-live" : "board-frame board-frame--margin-coords"}>
      <div className="board-margin-ranks" aria-hidden="true">
        {RANKS.map((rank) => (
          <span key={rank} className="board-margin-label">
            {rank}
          </span>
        ))}
      </div>
      <div className="board-frame-inner">
        <div className="sqmem-grid" role="group" aria-label="Chessboard, White at the bottom">
          {RANKS.map((rank) =>
            FILES.split("").map((file) => {
              const name = `${file}${rank}`;
              const light = (file.charCodeAt(0) + Number(rank)) % 2 === 1;
              const kind = kindFor(name, lit, found, lastMove);
              const piece = position ? pieceAt(position, name) : null;
              const className = [
                "sqmem-sq",
                light ? "sqmem-sq-light" : "sqmem-sq-dark",
                kind ? `is-${kind}` : "",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <button
                  key={name}
                  type="button"
                  className={className}
                  data-square={name}
                  aria-label={`Square ${name}`}
                  tabIndex={interactive ? 0 : -1}
                  onPointerDown={(event) => {
                    if (!interactive) return;
                    event.preventDefault();
                    onTap(name);
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  {piece ? <ChessPiece code={pieceCode(piece)} /> : null}
                </button>
              );
            }),
          )}
        </div>
      </div>
      <div className="board-margin-files" aria-hidden="true">
        {FILES.split("").map((file) => (
          <span key={file} className="board-margin-label">
            {file}
          </span>
        ))}
      </div>
    </div>
  );
}

function kindFor(
  name: string,
  lit: { square: string; kind: LitKind } | null,
  found: string | null,
  lastMove: { from: string; to: string } | null,
): LitKind | "found" | "last" | null {
  if (lit?.square === name) return lit.kind;
  if (found === name) return "found";
  if (lastMove && (lastMove.from === name || lastMove.to === name)) return "last";
  return null;
}

function pieceAt(board: MemoryBoard, square: string) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return board[7 - rank]?.[file] ?? null;
}

function pieceCode(piece: { type: string; color: "w" | "b" }): string {
  return piece.color === "w" ? piece.type.toUpperCase() : piece.type;
}
