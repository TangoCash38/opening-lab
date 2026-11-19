import { useMemo, useRef, useState, type FormEvent } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Trash2 } from "lucide-react";
import { plyLabel, type StudyMode } from "@/data/creator-packs-demo";
import { useT } from "@/lib/i18n";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";

type Side = "w" | "b";

type DraftMove = {
  san: string;
  comment: string;
};

type KeptLine = {
  id: string;
  name: string;
  side: Side;
  mode: StudyMode;
  moves: DraftMove[];
};

const LINE_CAP = 10;

function replay(moves: readonly DraftMove[]): Chess {
  const chess = new Chess();
  for (const move of moves) {
    if (!chess.move(move.san)) break;
  }
  return chess;
}

function parseTypedMove(chess: Chess, raw: string): Move | null {
  const trimmed = raw.trim().replace(/[+#?!]/g, "");
  if (!trimmed) return null;
  const coord = trimmed.toLowerCase().match(/^([a-h][1-8])[-x]?([a-h][1-8])([qrbn])?$/);
  try {
    if (coord) {
      const from = coord[1] as Square;
      const to = coord[2] as Square;
      const piece = chess.get(from);
      const promo = coord[3] as "q" | "r" | "b" | "n" | undefined;
      const promotes = piece?.type === "p" && (to[1] === "8" || to[1] === "1");
      return (
        chess.move({
          from,
          to,
          ...(promotes ? { promotion: promo ?? "q" } : {}),
        }) || null
      );
    }
    return chess.move(trimmed) || null;
  } catch {
    return null;
  }
}

export function CreatorPacksEditor() {
  const t = useT();
  const [packName, setPackName] = useState("");
  const [lineName, setLineName] = useState("");
  const [side, setSide] = useState<Side>("w");
  const [mode, setMode] = useState<StudyMode>("walk");
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [kept, setKept] = useState<KeptLine[]>([]);
  const [publishStep, setPublishStep] = useState<"idle" | "remind" | "done">("idle");
  const lineId = useRef(0);

  const game = useMemo(() => replay(moves), [moves]);
  const verbose = game.history({ verbose: true });
  const last = verbose[verbose.length - 1];
  const full = kept.length >= LINE_CAP;
  const canMove = !pending && !full;

  const addSan = (san: string) => {
    soundMove();
    setMoves((current) => [...current, { san, comment: "" }]);
    setPending(true);
    setSelected(null);
    setTyped("");
    setTypedError(null);
    setPublishStep("idle");
  };

  const playFromSquares = (from: Square, to: Square) => {
    if (!canMove) return;
    const next = replay(moves);
    let played: Move | null = null;
    try {
      played = next.move({ from, to, promotion: "q" });
    } catch {
      played = null;
    }
    if (!played) {
      setSelected(null);
      return;
    }
    addSan(played.san);
  };

  const onSquare = (sq: Square) => {
    if (!canMove) return;
    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game.moves({ verbose: true }).some((move) => move.from === selected && move.to === sq);
      if (legal) {
        playFromSquares(selected, sq);
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

  const submitTyped = (event: FormEvent) => {
    event.preventDefault();
    if (!canMove) return;
    const played = parseTypedMove(replay(moves), typed);
    if (!played) {
      setTypedError("That move is not legal from here. Try SAN, such as Nf3, or coordinates, such as e2e4.");
      return;
    }
    addSan(played.san);
  };

  const updateComment = (index: number, comment: string) => {
    setMoves((current) => current.map((move, i) => (i === index ? { ...move, comment } : move)));
  };

  const takeBack = () => {
    if (moves.length === 0) return;
    setMoves((current) => current.slice(0, -1));
    setPending(false);
    setSelected(null);
  };

  const clearBoard = () => {
    setMoves([]);
    setPending(false);
    setSelected(null);
    setTyped("");
    setTypedError(null);
  };

  const keepLine = () => {
    if (moves.length === 0 || full || pending) return;
    const name = lineName.trim() || `Line ${kept.length + 1}`;
    const id = `line-${++lineId.current}`;
    setKept((current) => [
      ...current,
      { id, name, side, mode, moves: moves.map((move) => ({ ...move })) },
    ]);
    setLineName("");
    clearBoard();
    setPublishStep("idle");
  };

  const continuePublish = () => {
    setPublishStep("done");
  };

  return (
    <div data-creator-packs-editor>
      <h1 className="creator-packs-title">Pack editor</h1>
      <p className="creator-packs-lede">
        Build an opening pack, a puzzle, or any part of a game. Enter the moves on the board, or type SAN or coordinates.
        A comment box opens for each move. This desk is a sample. Nothing you type is stored.
      </p>
      <label className="creator-packs-field">
        <span>Pack name</span>
        <input
          value={packName}
          onChange={(event) => setPackName(event.target.value)}
          placeholder="A name players will see"
          data-creator-pack-name
        />
      </label>
      <p className="creator-packs-count" data-creator-line-count>
        {kept.length} of 10 lines
      </p>
      {kept.length > 0 ? (
        <ul className="creator-kept-list">
          {kept.map((line, index) => (
            <li key={line.id} data-creator-kept={index + 1}>
              <span>
                <strong>
                  {index + 1}. {line.name}
                </strong>
                <span className="creator-kept-moves">
                  {line.mode === "drill" ? "Drill" : "Walk-through"}
                  {" · "}
                  {line.moves.map((move, moveIndex) => plyLabel(moveIndex, move.san)).join(" ")}
                </span>
              </span>
              <button type="button" onClick={() => setKept((current) => current.filter((item) => item.id !== line.id))} aria-label={`Remove ${line.name}`}>
                <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="creator-editor-linehead">
        <label className="creator-packs-field">
          <span>Line name</span>
          <input
            value={lineName}
            onChange={(event) => setLineName(event.target.value)}
            placeholder={full ? "The pack already has 10 lines" : `Line ${kept.length + 1}`}
            disabled={full}
            data-creator-line-name
          />
        </label>
        <div className="creator-side" role="group" aria-label="Side the student plays">
          <button type="button" aria-pressed={side === "w"} className={side === "w" ? "is-on" : undefined} onClick={() => setSide("w")}>
            {t("White")}
          </button>
          <button type="button" aria-pressed={side === "b"} className={side === "b" ? "is-on" : undefined} onClick={() => setSide("b")}>
            {t("Black")}
          </button>
        </div>
        <div className="creator-side" role="group" aria-label="How players use this line">
          <button
            type="button"
            aria-pressed={mode === "drill"}
            className={mode === "drill" ? "is-on" : undefined}
            data-creator-mode="drill"
            onClick={() => setMode("drill")}
          >
            Drill
          </button>
          <button
            type="button"
            aria-pressed={mode === "walk"}
            className={mode === "walk" ? "is-on" : undefined}
            data-creator-mode="walk"
            onClick={() => setMode("walk")}
          >
            Walk-through
          </button>
        </div>
      </div>

      <p className="creator-packs-count" data-creator-turn>
        {moves.length === 0
          ? "Starting position. Play the first move."
          : pending
            ? `Comment on ${plyLabel(moves.length - 1, moves[moves.length - 1]!.san)}, then continue.`
            : "Play the next move."}
      </p>
      <div className="creator-packs-board" data-creator-board>
        <ChessBoard
          game={game}
          flip={side === "b"}
          selected={selected}
          wrongUntil={null}
          expected={null}
          showHints={false}
          lastMove={last ? { from: last.from as Square, to: last.to as Square } : null}
          slide={null}
          onSquare={onSquare}
          onPlay={playFromSquares}
          interactive={canMove}
        />
      </div>

      <form className="creator-typed-move" onSubmit={submitTyped}>
        <label className="creator-packs-field">
          <span>Or type the move</span>
          <input
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setTypedError(null);
            }}
            placeholder="e4 or e2e4"
            disabled={!canMove}
            data-creator-typed-move
          />
        </label>
        <button type="submit" disabled={!canMove || typed.trim().length === 0}>
          Add move
        </button>
        {typedError ? (
          <p className="creator-packs-error" role="alert">
            {typedError}
          </p>
        ) : null}
      </form>

      <div className="creator-comment-list" data-creator-comments>
        {moves.length === 0 ? (
          <p className="creator-move-empty">Each move gets its own comment box, including a whole game.</p>
        ) : (
          moves.map((move, index) => (
            <label
              key={`${index}-${move.san}`}
              className={`creator-comment${index === moves.length - 1 ? " is-current" : ""}`}
              data-creator-comment={index + 1}
            >
              <span>Comment for {plyLabel(index, move.san)}</span>
              <textarea
                value={move.comment}
                rows={2}
                placeholder="Optional. What should the player notice?"
                onChange={(event) => updateComment(index, event.target.value)}
              />
            </label>
          ))
        )}
      </div>
      {pending ? (
        <button type="button" className="creator-packs-primary" data-creator-next onClick={() => setPending(false)}>
          Next
        </button>
      ) : null}

      <div className="creator-editor-actions">
        <button type="button" onClick={takeBack} disabled={moves.length === 0}>
          Take back
        </button>
        <button type="button" onClick={clearBoard} disabled={moves.length === 0}>
          {t("Clear")}
        </button>
        <button
          type="button"
          className="creator-packs-primary"
          onClick={keepLine}
          disabled={moves.length === 0 || full || pending}
          data-creator-keep
        >
          Keep this line
        </button>
      </div>

      {publishStep === "idle" ? (
        <button type="button" className="creator-packs-primary" data-creator-publish onClick={() => setPublishStep("remind")}>
          Publish
        </button>
      ) : null}
      {publishStep === "remind" ? (
        <div className="creator-publish-reminder" role="status" data-creator-publish-reminder>
          <h2>Before you publish</h2>
          <p>Double-check every line is exactly how you want it.</p>
          <button type="button" className="creator-packs-primary" data-creator-continue onClick={continuePublish}>
            Continue
          </button>
        </div>
      ) : null}
      {publishStep === "done" ? (
        <p className="creator-packs-note" role="status" data-creator-published>
          Published to your creator pack{packName.trim() ? `, "${packName.trim()}"` : ""}. This preview did not store it.
        </p>
      ) : null}
    </div>
  );
}
