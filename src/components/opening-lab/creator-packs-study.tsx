import { useEffect, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { plyLabel, type StudyMode } from "@/data/creator-packs-demo";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";

type Props = {
  title: string;
  mode: StudyMode;
  plies: readonly string[];
  comments: readonly string[];
  side?: "w" | "b";
};

function replay(plies: readonly string[], upto: number): Chess {
  const chess = new Chess();
  for (let i = 0; i < upto && i < plies.length; i++) {
    if (!chess.move(plies[i]!)) break;
  }
  return chess;
}

function bookMove(plies: readonly string[], ply: number): Move | null {
  if (ply < 0 || ply >= plies.length) return null;
  const chess = replay(plies, ply);
  const san = plies[ply]!;
  return chess.moves({ verbose: true }).find((move) => move.san === san) ?? null;
}

export function CreatorPackStudy({ title, mode, plies, comments, side = "w" }: Props) {
  if (mode === "drill") {
    return <DrillStudy title={title} plies={plies} comments={comments} side={side} />;
  }
  return <WalkStudy title={title} plies={plies} comments={comments} />;
}

function WalkStudy({
  title,
  plies,
  comments,
}: {
  title: string;
  plies: readonly string[];
  comments: readonly string[];
}) {
  const [ply, setPly] = useState(plies.length > 0 ? 1 : 0);
  const game = replay(plies, ply);
  const verbose = game.history({ verbose: true });
  const last = verbose[verbose.length - 1];
  const comment =
    ply === 0
      ? "Starting position. Step forward to read the note on each move."
      : (comments[ply - 1] ?? "");
  const moveName = ply === 0 ? "Start" : plyLabel(ply - 1, plies[ply - 1] ?? "");

  return (
    <section className="creator-study" data-creator-study data-creator-study-mode="walk">
      <p className="creator-packs-kicker">Walk-through</p>
      <h2 className="creator-study-title">{title}</h2>
      <p className="creator-packs-note">
        Step through the moves. The creator's comment stays with the move you are on.
      </p>
      <div className="creator-packs-board">
        <ChessBoard
          game={game}
          flip={false}
          selected={null}
          wrongUntil={null}
          expected={null}
          showHints={false}
          lastMove={last ? { from: last.from as Square, to: last.to as Square } : null}
          slide={null}
          onSquare={() => undefined}
          interactive={false}
        />
      </div>
      <p className="creator-study-move" data-creator-walk-move>
        {moveName}
      </p>
      <p className="creator-study-comment" data-creator-walk-comment>
        {comment}
      </p>
      <div className="creator-editor-actions">
        <button type="button" onClick={() => setPly((current) => Math.max(0, current - 1))} disabled={ply === 0}>
          Back
        </button>
        <button
          type="button"
          className="creator-packs-primary"
          data-creator-walk-next
          onClick={() => setPly((current) => Math.min(plies.length, current + 1))}
          disabled={ply >= plies.length}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function DrillStudy({
  title,
  plies,
  comments,
  side,
}: {
  title: string;
  plies: readonly string[];
  comments: readonly string[];
  side: "w" | "b";
}) {
  const [phase, setPhase] = useState<"practice" | "test">("practice");
  const [ply, setPly] = useState(0);
  const [selected, setSelected] = useState<Square | null>(null);
  const [wrong, setWrong] = useState<Square | null>(null);
  const done = ply >= plies.length;
  const studentTurn = !done && (ply % 2 === 0) === (side === "w");
  const expected = studentTurn ? bookMove(plies, ply) : null;
  const game = replay(plies, ply);
  const verbose = game.history({ verbose: true });
  const last = verbose[verbose.length - 1];
  const comment =
    comments[Math.max(0, Math.min(comments.length - 1, ply))] ?? "";

  useEffect(() => {
    if (done || studentTurn) return;
    const at = ply;
    const timer = window.setTimeout(() => {
      setPly((current) => (current === at ? current + 1 : current));
      soundMove();
    }, 420);
    return () => window.clearTimeout(timer);
  }, [done, studentTurn, ply]);

  const playStudent = (from: Square, to: Square) => {
    if (!expected) return;
    if (from === expected.from && to === expected.to) {
      soundMove();
      setSelected(null);
      setWrong(null);
      setPly((current) => current + 1);
      return;
    }
    setWrong(to);
    window.setTimeout(() => setWrong(null), 700);
    setSelected(null);
  };

  const onSquare = (sq: Square) => {
    if (!studentTurn) return;
    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game.moves({ verbose: true }).some((move) => move.from === selected && move.to === sq);
      if (legal) {
        playStudent(selected, sq);
        return;
      }
    }
    const piece = game.get(sq);
    if (piece && piece.color === game.turn()) {
      soundSelect();
      setSelected(sq);
      return;
    }
    setSelected(null);
  };

  return (
    <section className="creator-study" data-creator-study data-creator-study-mode="drill">
      <p className="creator-packs-kicker">Drill</p>
      <h2 className="creator-study-title">{title}</h2>
      <p className="creator-packs-note">
        Practice shows the book move. Test hides it. Only that move is accepted, the same way Opening Lab drills a line.
      </p>
      <div className="creator-side" role="group" aria-label="Drill mode">
        <button
          type="button"
          aria-pressed={phase === "practice"}
          className={phase === "practice" ? "is-on" : undefined}
          data-creator-drill-phase="practice"
          onClick={() => {
            setPhase("practice");
            setPly(0);
            setSelected(null);
            setWrong(null);
          }}
        >
          Practice
        </button>
        <button
          type="button"
          aria-pressed={phase === "test"}
          className={phase === "test" ? "is-on" : undefined}
          data-creator-drill-phase="test"
          onClick={() => {
            setPhase("test");
            setPly(0);
            setSelected(null);
            setWrong(null);
          }}
        >
          Test
        </button>
      </div>
      <div className="creator-packs-board">
        <ChessBoard
          game={game}
          flip={side === "b"}
          selected={selected}
          wrongUntil={wrong}
          expected={phase === "practice" ? expected : null}
          showHints={phase === "practice" && studentTurn}
          lastMove={last ? { from: last.from as Square, to: last.to as Square } : null}
          slide={null}
          onSquare={onSquare}
          onPlay={playStudent}
          interactive={studentTurn}
        />
      </div>
      <p className="creator-study-move" data-creator-drill-move>
        {done ? "Line complete" : studentTurn ? `Your move · ${plyLabel(ply, plies[ply] ?? "")}` : "The reply plays itself"}
      </p>
      <p className="creator-study-comment" data-creator-drill-comment>
        {comment}
      </p>
    </section>
  );
}
