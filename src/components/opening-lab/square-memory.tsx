import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  SQUARE_MEMORY_PACK_ID,
  type MemoryBoard,
  type MemoryPly,
  type PlayedMemory,
} from "@/lib/square-memory-line";
import {
  CARO_MEMORY_LINE,
  CARO_MEMORY_NAME,
  CARO_MEMORY_ORIENTATION,
  CARO_MEMORY_PACK_ID,
} from "@/lib/square-memory-caro";
import {
  ITALIAN_MEMORY_LINE,
  ITALIAN_MEMORY_NAME,
  ITALIAN_MEMORY_PACK_ID,
} from "@/lib/square-memory-italian";
import { LONDON_MEMORY_LINE, LONDON_MEMORY_PACK_ID } from "@/lib/square-memory-london";
import {
  ORTHODOX_MEMORY_LINE,
  ORTHODOX_MEMORY_NAME,
  ORTHODOX_MEMORY_ORIENTATION,
  ORTHODOX_MEMORY_PACK_ID,
} from "@/lib/square-memory-orthodox";
import { QG_MEMORY_LINE, QG_MEMORY_NAME, QG_MEMORY_PACK_ID } from "@/lib/square-memory-qg";
import {
  begin,
  nextInOrder,
  tap,
  tick,
  titleState,
  type LitKind,
  type Snapshot,
} from "@/lib/square-memory";

const MUTE_KEY = "opening-lab:square-memory-muted";

type MemoryChoice = {
  id: "ruy" | "london" | "qg" | "orthodox" | "italian" | "caro";
  pick: string;
  name: string;
  packId: string;
  packLabel: string;
  line: PlayedMemory;
  bestKey: string;
  /** Black repertoire lines sit with Black at the bottom. */
  orientation: "white" | "black";
};

const CHOICES: readonly MemoryChoice[] = [
  {
    id: "ruy",
    pick: "Ruy Lopez",
    name: "Ruy Lopez",
    packId: SQUARE_MEMORY_PACK_ID,
    packLabel: "Ruy Lopez for White",
    line: SQUARE_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-best",
    orientation: "white",
  },
  {
    id: "london",
    pick: "London",
    name: "London System",
    packId: LONDON_MEMORY_PACK_ID,
    packLabel: "London System",
    line: LONDON_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-london-best",
    orientation: "white",
  },
  {
    id: "qg",
    pick: "Declined",
    name: QG_MEMORY_NAME,
    packId: QG_MEMORY_PACK_ID,
    packLabel: "Queen's Gambit for White",
    line: QG_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-qg-best",
    orientation: "white",
  },
  {
    id: "orthodox",
    pick: "Orthodox",
    name: ORTHODOX_MEMORY_NAME,
    packId: ORTHODOX_MEMORY_PACK_ID,
    packLabel: "Queen's Gambit Declined for Black",
    line: ORTHODOX_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-orthodox-best",
    orientation: ORTHODOX_MEMORY_ORIENTATION,
  },
  {
    id: "italian",
    pick: "Italian",
    name: ITALIAN_MEMORY_NAME,
    packId: ITALIAN_MEMORY_PACK_ID,
    packLabel: "Italian Game for White",
    line: ITALIAN_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-italian-best",
    orientation: "white",
  },
  {
    id: "caro",
    pick: "Caro-Kann",
    name: CARO_MEMORY_NAME,
    packId: CARO_MEMORY_PACK_ID,
    packLabel: "Caro-Kann for Black",
    line: CARO_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-caro-best",
    orientation: CARO_MEMORY_ORIENTATION,
  },
];
function readBest(key: string): number {
  try {
    const n = Number(localStorage.getItem(key));
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeBest(key: string, n: number): void {
  try {
    if (n > readBest(key)) localStorage.setItem(key, String(Math.floor(n)));
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
  const [choiceId, setChoiceId] = useState<MemoryChoice["id"]>("ruy");
  const [snap, setSnap] = useState<Snapshot>(() => titleState(0));
  const [bestLabel, setBestLabel] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [burst, setBurst] = useState<{ square: string; id: number } | null>(null);
  const snapRef = useRef(snap);
  const bestRef = useRef(0);
  const choice = CHOICES.find((item) => item.id === choiceId) ?? CHOICES[0]!;
  const choiceRef = useRef(choice);
  choiceRef.current = choice;
  snapRef.current = snap;

  const commit = (next: Snapshot) => {
    snapRef.current = next;
    setSnap(next);
    if (next.best > bestRef.current) {
      bestRef.current = next.best;
      writeBest(choiceRef.current.bestKey, next.best);
      setBestLabel(next.best);
    }
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const stored = readBest(choiceRef.current.bestKey);
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
        const next = tick(prev, now, choiceRef.current.line.squares);
        if (next !== prev) {
          commitRef.current(next);
          if (
            next.phase === "watch" &&
            next.lit &&
            next.litKind === "flash" &&
            (prev.phase !== "watch" || prev.cursor !== next.cursor)
          ) {
            playWatch(next.lit);
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

  function applyChoice(id: MemoryChoice["id"]) {
    const next = CHOICES.find((item) => item.id === id);
    if (!next) return false;
    const best = readBest(next.bestKey);
    choiceRef.current = next;
    bestRef.current = best;
    setChoiceId(next.id);
    setBestLabel(best);
    return true;
  }

  function startRun() {
    // Unlock before the clock starts. Creating the audio context used to eat
    // the opening flash, so the first squares ran shorter than the rest.
    try {
      unlockAudio();
    } catch {
      /* sound is optional */
    }
    const now = performance.now();
    setBurst(null);
    commit(begin(bestRef.current, now, choiceRef.current.line.squares));
    try {
      const opening = choiceRef.current.line.squares[0];
      if (opening) playWatch(opening);
    } catch {
      /* sound is optional */
    }
  }

  function start() {
    startRun();
  }

  function onTap(square: string) {
    try {
      unlockAudio();
    } catch {
      /* sound is optional */
    }
    const prev = snapRef.current;
    const squares = choiceRef.current.line.squares;
    const now = performance.now();
    const next = tap(prev, square, squares, now);
    if (next === prev) return;
    commit(next);
    try {
      if (next.phase === "punish") {
        playMiss();
        setBurst(null);
        navigator.vibrate?.(20);
      } else if (next.litKind === "hit") {
        playHit(square);
        setBurst({ square, id: now });
        if (next.cursor === next.length) playWin();
        navigator.vibrate?.(8);
      }
    } catch {
      /* visuals already committed */
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

  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => {
      setBurst((current) => (current?.id === burst.id ? null : current));
    }, 520);
    return () => window.clearTimeout(id);
  }, [burst]);

  function chooseLine(id: MemoryChoice["id"]) {
    if (!applyChoice(id)) return;
    startRun();
  }

  function exitToBoard() {
    setBurst(null);
    commit(titleState(bestRef.current));
  }

  function retryOpening() {
    if (snapRef.current.phase !== "reveal" || snapRef.current.perfect) return;
    startRun();
  }

  function nextOpening() {
    if (snapRef.current.phase !== "reveal" || !snapRef.current.perfect) return;
    const next = nextInOrder(CHOICES, choiceRef.current);
    if (!applyChoice(next.id)) return;
    startRun();
  }

  const playing = snap.phase === "watch" || snap.phase === "input" || snap.phase === "punish";
  const revealing = snap.phase === "reveal";
  const line = choice.line;
  const plyCount = revealing ? Math.floor(snap.score / 2) : 0;
  const position = revealing ? (line.positions[plyCount] ?? line.positions[0]!) : null;
  const last = revealing && plyCount > 0 ? line.plies[plyCount - 1] : undefined;
  const partial = revealing && snap.score % 2 === 1 ? line.plies[plyCount] : undefined;
  const foundPiece = partial && position ? pieceAt(position, partial.from) : null;
  const perfect = revealing && snap.perfect;
  const showPackLink = snap.phase === "title" || (revealing && !snap.perfect);

  return (
    <main className="sqmem" data-square-memory data-phase={snap.phase}>
      <header className="sqmem-bar">
        <Link to="/" className="sqmem-home" data-square-memory-home>
          Home
        </Link>
        {snap.phase === "title" ? <h1 className="sqmem-title">Square Memory</h1> : null}
        {revealing ? (
          <p className="sqmem-opening" data-square-memory-opening>
            {choice.name}
          </p>
        ) : null}
        {playing ? <PlayStatus snap={snap} /> : null}
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
      {snap.phase === "title" || playing ? (
        <p
          className="sqmem-instruction"
          data-held={playing ? "" : undefined}
          aria-hidden={playing ? true : undefined}
        >
          Watch the squares. Tap them back in order.
        </p>
      ) : null}

      <div className="sqmem-table">
        <div className="sqmem-frame">
          <div className="sqmem-frame-tools">
            <LinePick choiceId={choice.id} onChoose={chooseLine} />
          </div>

          <div className="sqmem-play">
            <div className="sqmem-board">
              <MemoryBoard
                lit={
                  playing && snap.lit && snap.litKind
                    ? { square: snap.lit, kind: snap.litKind }
                    : null
                }
                burst={burst}
                interactive={snap.phase === "input" && snap.cursor < snap.length}
                position={position}
                lastMove={last ? { from: last.from, to: last.to } : null}
                found={partial ? partial.from : null}
                orientation={choice.orientation}
                onTap={onTap}
                startLabel={snap.phase === "title" ? "Start" : null}
                onStart={start}
              />
            </div>
            {perfect ? <WinEnd onNext={nextOpening} onExit={exitToBoard} /> : null}
            {revealing && !snap.perfect ? (
              <MissEnd onRetry={retryOpening} onExit={exitToBoard} />
            ) : null}
          </div>
        </div>
      </div>

      <footer className="sqmem-dock">
        {revealing ? (
          <RevealNotes
            name={choice.name}
            plies={line.plies}
            score={snap.score}
            plyCount={plyCount}
            found={
              partial && foundPiece
                ? `You also found the ${pieceName(pieceCode(foundPiece))} on ${partial.from}.`
                : null
            }
          />
        ) : bestLabel > 0 ? (
          <p className="sqmem-best" data-square-memory-best>
            Best · {bestLabel} {bestLabel === 1 ? "square" : "squares"}
          </p>
        ) : null}
        {showPackLink || playing ? <PackLink choice={choice} /> : null}
      </footer>
    </main>
  );
}

function LinePick({
  choiceId,
  onChoose,
}: {
  choiceId: MemoryChoice["id"];
  onChoose: (id: MemoryChoice["id"]) => void;
}) {
  return (
    <div className="sqmem-pick" data-square-memory-choice={choiceId}>
      {CHOICES.map((item) => (
        <button
          key={item.id}
          type="button"
          className="sqmem-pick-line"
          data-memory-line={item.id}
          aria-pressed={item.id === choiceId}
          onClick={() => onChoose(item.id)}
        >
          {item.pick}
        </button>
      ))}
    </div>
  );
}

function PackLink({ choice }: { choice: MemoryChoice }) {
  return (
    <a
      className="sqmem-pack-link"
      data-square-memory-pack={choice.packId}
      href={`/#pack/${choice.packId}`}
    >
      {choice.packLabel}
    </a>
  );
}

function WinEnd({ onNext, onExit }: { onNext: () => void; onExit: () => void }) {
  return (
    <div className="sqmem-end-back" data-square-memory-end="win">
      <div className="sqmem-end" role="dialog" aria-label="Well done, you did it!">
        <p className="sqmem-end-title">Well done, you did it!</p>
        <div className="sqmem-end-actions">
          <button type="button" className="sqmem-end-btn" data-square-memory-next onClick={onNext}>
            Next
          </button>
          <button
            type="button"
            className="sqmem-end-btn sqmem-end-btn-quiet"
            data-square-memory-exit
            onClick={onExit}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

function MissEnd({ onRetry, onExit }: { onRetry: () => void; onExit: () => void }) {
  return (
    <div className="sqmem-end-back" data-square-memory-end="miss">
      <div className="sqmem-end" role="dialog" aria-label="Not this time.">
        <p className="sqmem-end-title">Not this time.</p>
        <div className="sqmem-end-actions">
          <button
            type="button"
            className="sqmem-end-btn"
            data-square-memory-retry
            onClick={onRetry}
          >
            Retry
          </button>
          <button
            type="button"
            className="sqmem-end-btn sqmem-end-btn-quiet"
            data-square-memory-exit
            onClick={onExit}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
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
    <p className="sqmem-status" data-square-memory-status={snap.phase} aria-live="polite">
      <span className="sqmem-status-word">{word}</span>
      <span className="sqmem-status-detail">{detail}</span>
    </p>
  );
}

function RevealNotes({
  name,
  plies,
  score,
  plyCount,
  found,
}: {
  name: string;
  plies: readonly MemoryPly[];
  score: number;
  plyCount: number;
  found: string | null;
}) {
  const rows = moveRows(plies, plyCount);
  return (
    <div className="sqmem-moves" data-square-memory-moves>
      <p className="sr-only">
        {name}. Position after {plyCount} {plyCount === 1 ? "move" : "moves"}. Score {score}.
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

function HitRipple({ id }: { id: number }) {
  return (
    <span className="sqmem-ripple" data-ripple={id} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} style={{ "--sqmem-i": i } as CSSProperties} />
      ))}
    </span>
  );
}

function boardAxes(orientation: MemoryChoice["orientation"]) {
  if (orientation === "black") {
    return {
      files: ["h", "g", "f", "e", "d", "c", "b", "a"],
      ranks: ["1", "2", "3", "4", "5", "6", "7", "8"],
      rankEdge: "h",
      fileEdge: "8",
      label: "Chessboard, Black at the bottom",
    };
  }
  return {
    files: ["a", "b", "c", "d", "e", "f", "g", "h"],
    ranks: ["8", "7", "6", "5", "4", "3", "2", "1"],
    rankEdge: "a",
    fileEdge: "1",
    label: "Chessboard, White at the bottom",
  };
}

function MemoryBoard({
  lit,
  burst,
  interactive,
  position,
  lastMove,
  found,
  orientation,
  onTap,
  startLabel,
  onStart,
}: {
  lit: { square: string; kind: LitKind } | null;
  burst: { square: string; id: number } | null;
  interactive: boolean;
  position: MemoryBoard | null;
  lastMove: { from: string; to: string } | null;
  found: string | null;
  orientation: MemoryChoice["orientation"];
  onTap: (square: string) => void;
  startLabel: string | null;
  onStart: () => void;
}) {
  const axes = boardAxes(orientation);
  return (
    <div className="board-frame">
      <div className="board-frame-inner">
        <div
          className="sqmem-grid"
          role="group"
          aria-label={axes.label}
          data-board-orientation={orientation}
        >
          {axes.ranks.map((rank) =>
            axes.files.map((file) => {
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
                  {burst?.square === name ? <HitRipple id={burst.id} /> : null}
                  {piece ? <ChessPiece code={pieceCode(piece)} /> : null}
                  {file === axes.rankEdge ? (
                    <span className="sqmem-coord sqmem-coord-rank" aria-hidden="true">
                      {rank}
                    </span>
                  ) : null}
                  {rank === axes.fileEdge ? (
                    <span className="sqmem-coord sqmem-coord-file" aria-hidden="true">
                      {file}
                    </span>
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
        {startLabel ? (
          <button type="button" className="sqmem-start" data-begin="" onClick={onStart}>
            {startLabel}
          </button>
        ) : null}
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
