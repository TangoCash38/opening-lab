import { useEffect, useRef, useState, type FormEvent } from "react";
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
  LONDON_MEMORY_LINE,
  LONDON_MEMORY_PACK_ID,
} from "@/lib/square-memory-london";
import {
  begin,
  formatClearTime,
  tap,
  tick,
  titleState,
  type LitKind,
  type Snapshot,
} from "@/lib/square-memory";

const NAME_KEY = "opening-lab:square-memory-name";

type BoardRow = { name: string; ms: number };

const MUTE_KEY = "opening-lab:square-memory-muted";
const BIG_RED_PORTRAIT = "/coach/ruy-lopez-white/big-red-portrait.png";
const BOARD_BEFORE_CHEER_MS = 2000;

type MemoryChoice = {
  id: "ruy" | "london";
  pick: string;
  name: string;
  packId: string;
  packLabel: string;
  line: PlayedMemory;
  bestKey: string;
  portrait: string;
  coach: string;
  cheer: string;
  portraitWidth: number;
  portraitHeight: number;
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
    portrait: BIG_RED_PORTRAIT,
    coach: "Big Red",
    cheer:
      "You smashed it. That's the Ruy Lopez. Want to learn openings properly? Try the opening packs.",
    portraitWidth: 360,
    portraitHeight: 800,
  },
  {
    id: "london",
    pick: "London",
    name: "London System",
    packId: LONDON_MEMORY_PACK_ID,
    packLabel: "London System",
    line: LONDON_MEMORY_LINE,
    bestKey: "opening-lab:square-memory-london-best",
    portrait: "/scotch-coach/coach-seated-v2.png",
    coach: "Professor Potato Pie",
    cheer:
      "You smashed it. That's the London System. Want to learn openings properly? Try the opening packs.",
    portraitWidth: 640,
    portraitHeight: 1071,
  },
];
const FILES = "abcdefgh";
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

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
  const [cheerOn, setCheerOn] = useState(false);
  const [showClearTime, setShowClearTime] = useState(false);
  const [allTimes, setAllTimes] = useState(false);
  const [clearMs, setClearMs] = useState<number | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [boards, setBoards] = useState<Record<MemoryChoice["id"], BoardRow[]>>({
    ruy: [],
    london: [],
  });
  const [boardNote, setBoardNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const snapRef = useRef(snap);
  const bestRef = useRef(0);
  const bestAtStart = useRef(0);
  const runStartRef = useRef(0);
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
    try {
      const storedName = localStorage.getItem(NAME_KEY) ?? "";
      if (storedName) setPlayerName(storedName);
    } catch {
      /* private mode */
    }
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
    // Unlock before the clock starts. Creating the audio context used to eat
    // the opening flash, so the first squares ran shorter than the rest.
    try {
      unlockAudio();
    } catch {
      /* sound is optional */
    }
    const now = performance.now();
    runStartRef.current = now;
    bestAtStart.current = bestRef.current;
    setCheerOn(false);
    setShowClearTime(false);
    setClearMs(null);
    setAllTimes(false);
    setBoardNote("");
    commit(begin(bestRef.current, now, choiceRef.current.line.squares));
    try {
      playWatch(0);
    } catch {
      /* sound is optional */
    }
  }

  function onTap(square: string) {
    const prev = snapRef.current;
    const squares = choiceRef.current.line.squares;
    const now = performance.now();
    const next = tap(prev, square, squares, now);
    if (next === prev) return;
    if (
      next.litKind === "hit" &&
      next.length === squares.length &&
      next.cursor === squares.length
    ) {
      setClearMs(Math.round(now - runStartRef.current));
    }
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

  useEffect(() => {
    if (!(snap.phase === "reveal" && snap.perfect)) {
      setCheerOn(false);
      setShowClearTime(false);
      return;
    }
    const timeId = window.setTimeout(() => setShowClearTime(true), 1000);
    const cheerId = window.setTimeout(() => setCheerOn(true), BOARD_BEFORE_CHEER_MS);
    return () => {
      window.clearTimeout(timeId);
      window.clearTimeout(cheerId);
    };
  }, [snap.phase, snap.perfect]);

  function chooseLine(id: MemoryChoice["id"]) {
    const phase = snapRef.current.phase;
    if (phase !== "title" && phase !== "reveal") return;
    const next = CHOICES.find((item) => item.id === id);
    if (!next || next.id === choiceRef.current.id) return;
    const best = readBest(next.bestKey);
    choiceRef.current = next;
    bestRef.current = best;
    setChoiceId(id);
    setBestLabel(best);
    setCheerOn(false);
    setShowClearTime(false);
    setClearMs(null);
    setAllTimes(false);
    setBoardNote("");
    if (phase === "reveal") commit(titleState(best));
  }

  const showBoard = snap.phase === "title" || snap.phase === "reveal";

  useEffect(() => {
    if (!showBoard) return;
    const ctrl = new AbortController();
    Promise.all(
      CHOICES.map(async (item) => {
        const res = await fetch(`/api/square-memory-scores?line=${item.id}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error("down");
        const data = (await res.json()) as { scores?: BoardRow[] };
        return [item.id, Array.isArray(data.scores) ? data.scores : []] as const;
      }),
    )
      .then((pairs) => {
        setBoards({ ruy: [], london: [], ...Object.fromEntries(pairs) });
        setBoardNote("");
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setBoardNote("The board is not available right now.");
      });
    return () => ctrl.abort();
  }, [showBoard, boardVersion]);

  async function saveTime(event: FormEvent) {
    event.preventDefault();
    if (!(snap.phase === "reveal" && snap.perfect) || clearMs == null || saving) return;
    const name = playerName.replace(/\s+/g, " ").trim();
    if (!name) return;
    setSaving(true);
    setBoardNote("");
    try {
      const res = await fetch("/api/square-memory-scores", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ line: choice.id, name, ms: clearMs }),
      });
      const data = (await res.json()) as {
        error?: string;
        ms?: number;
        scores?: BoardRow[];
      };
      if (!res.ok) {
        setBoardNote(data.error || "Could not save that time.");
        return;
      }
      try {
        localStorage.setItem(NAME_KEY, name);
      } catch {
        /* private mode */
      }
      if (Array.isArray(data.scores)) {
        const saved = data.scores;
        setBoards((current) => ({ ...current, [choice.id]: saved }));
      } else setBoardVersion((n) => n + 1);
      setBoardNote(
        typeof data.ms === "number" && data.ms < clearMs
          ? `Your best is still ${formatClearTime(data.ms)}.`
          : "Saved.",
      );
    } catch {
      setBoardNote("The board is not available right now.");
    } finally {
      setSaving(false);
    }
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
      {snap.phase === "title" ? (
        <p className="sqmem-instruction">Watch the squares. Tap them back in order.</p>
      ) : null}

      <div className="sqmem-table">
        {showBoard ? (
          <div className="sqmem-boards" data-square-memory-boards>
            <div className="sqmem-plaque-col">
              <ScorePlaque lineId={CHOICES[0].id} name={CHOICES[0].name} rows={boards[CHOICES[0].id]} />
              <button
                type="button"
                className="sqmem-all-times"
                data-square-memory-all-times
                onClick={() => setAllTimes(true)}
              >
                All times
              </button>
            </div>
            <ScorePlaque lineId={CHOICES[1].id} name={CHOICES[1].name} rows={boards[CHOICES[1].id]} />
            {boardNote ? <p className="sqmem-boards-note">{boardNote}</p> : null}
          </div>
        ) : null}

        <div className="sqmem-frame">
          {snap.phase === "title" || revealing ? (
            <div className="sqmem-frame-tools">
              <LinePick choiceId={choice.id} onChoose={chooseLine} />
              {snap.phase === "title" ? (
                <button type="button" data-begin="" className="sqmem-begin" onClick={start}>
                  Begin
                </button>
              ) : (
                <button type="button" data-begin="" className="sqmem-begin" onClick={start}>
                  Play again
                </button>
              )}
            </div>
          ) : null}

          {perfect && showClearTime && clearMs != null ? (
            <p className="sqmem-time" data-square-memory-time>
              <span className="sqmem-time-value">{formatClearTime(clearMs)}</span>
              <span className="sqmem-time-note">Full clear</span>
            </p>
          ) : null}

          <div className="sqmem-board">
            <MemoryBoard
              lit={playing && snap.lit && snap.litKind ? { square: snap.lit, kind: snap.litKind } : null}
              interactive={snap.phase === "input" && snap.cursor < snap.length}
              position={position}
              lastMove={last ? { from: last.from, to: last.to } : null}
              found={partial ? partial.from : null}
              onTap={onTap}
            />
            {perfect && cheerOn ? <PerfectCheer choice={choice} /> : null}
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
        ) : snap.phase === "title" && bestLabel > 0 ? (
          <p className="sqmem-best" data-square-memory-best>
            Best · {bestLabel} {bestLabel === 1 ? "square" : "squares"}
          </p>
        ) : null}
        {perfect && showClearTime && clearMs != null ? (
          <form className="sqmem-score-form" data-square-memory-score-form onSubmit={saveTime}>
            <input
              className="sqmem-score-name"
              data-square-memory-name
              aria-label="Name"
              placeholder="Name"
              maxLength={16}
              autoComplete="nickname"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />
            <button type="submit" className="sqmem-score-save" disabled={saving || !playerName.trim()}>
              {saving ? "Saving" : "Save time"}
            </button>
          </form>
        ) : null}
        {showPackLink ? <PackLink choice={choice} /> : null}
      </footer>
      {allTimes ? (
        <AllTimes boards={boards} onClose={() => setAllTimes(false)} />
      ) : null}
    </main>
  );
}

function ScorePlaque({
  lineId,
  name,
  rows,
}: {
  lineId: MemoryChoice["id"];
  name: string;
  rows: readonly BoardRow[];
}) {
  const shown = rows.slice(0, 3);
  return (
    <section className="sqmem-plaque" data-square-memory-leaderboard={lineId} aria-label={`${name} times`}>
      <h2 className="sqmem-plaque-name">{name}</h2>
      {shown.length === 0 ? (
        <p className="sqmem-plaque-empty">No times yet.</p>
      ) : (
        <ol className="sqmem-plaque-list">
          {shown.map((row, index) => (
            <li className="sqmem-plaque-row" key={`${row.name}-${row.ms}`} data-place={index + 1}>
              <span className="sqmem-plaque-person">{row.name}</span>
              <span className="sqmem-plaque-time">{formatClearTime(row.ms)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function AllTimes({
  boards,
  onClose,
}: {
  boards: Record<MemoryChoice["id"], readonly BoardRow[]>;
  onClose: () => void;
}) {
  return (
    <div className="sqmem-sheet-back" data-square-memory-sheet>
      <div className="sqmem-sheet" role="dialog" aria-label="All times">
        <div className="sqmem-sheet-bar">
          <h2>All times</h2>
          <button type="button" className="sqmem-sheet-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sqmem-sheet-cols">
          {CHOICES.map((item) => (
            <section key={item.id} aria-label={`${item.name} times`}>
              <h3>{item.name}</h3>
              {boards[item.id].length === 0 ? (
                <p className="sqmem-plaque-empty">No times yet.</p>
              ) : (
                <ol className="sqmem-sheet-list">
                  {boards[item.id].map((row, index) => (
                    <li key={`${item.id}-${row.name}-${row.ms}`} data-place={index + 1}>
                      <span>{row.name}</span>
                      <span>{formatClearTime(row.ms)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
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

function PerfectCheer({ choice }: { choice: MemoryChoice }) {
  return (
    <section className="sqmem-cheer" data-square-memory-cheer aria-label={choice.coach}>
      <img
        className="sqmem-cheer-portrait"
        src={choice.portrait}
        alt={choice.coach}
        width={choice.portraitWidth}
        height={choice.portraitHeight}
        decoding="async"
        draggable={false}
      />
      <div className="sqmem-cheer-card">
        <p className="sqmem-cheer-name">{choice.coach}</p>
        <p className="sqmem-cheer-bubble" data-square-memory-cheer-line>
          {choice.cheer}
        </p>
        <a
          className="sqmem-cheer-btn"
          data-square-memory-pack={choice.packId}
          href={`/#pack/${choice.packId}`}
        >
          {choice.packLabel}
        </a>
        <a className="sqmem-cheer-btn sqmem-cheer-btn-gym" data-square-memory-gym href="/#gym">
          Opening packs
        </a>
      </div>
    </section>
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
