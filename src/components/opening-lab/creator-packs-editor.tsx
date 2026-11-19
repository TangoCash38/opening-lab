import { useMemo, useState, type FormEvent } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { plyLabel, type StudyMode } from "@/data/creator-packs-demo";
import { useT } from "@/lib/i18n";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";
import { ChessPiece } from "./chess-pieces";
import { CreatorPackStudy } from "./creator-packs-study";

type Side = "w" | "b";
type Step = 1 | 2 | 3;
type PieceType = "k" | "q" | "r" | "b" | "n" | "p";
type SetupPiece = { type: PieceType; color: Side };
type Grid = (SetupPiece | null)[][];
type Tool = SetupPiece | "erase";

type DraftMove = {
  san: string;
  comment: string;
};

const PALETTE: PieceType[] = ["k", "q", "r", "b", "n", "p"];

function emptyGrid(): Grid {
  return Array.from({ length: 8 }, () => Array<SetupPiece | null>(8).fill(null));
}

function startGrid(): Grid {
  return new Chess().board().map((rank) =>
    rank.map((piece) =>
      piece ? { type: piece.type as PieceType, color: piece.color } : null,
    ),
  );
}

function pieceCode(piece: SetupPiece): string {
  const letter = piece.type === "n" ? "n" : piece.type;
  return piece.color === "w" ? letter.toUpperCase() : letter.toLowerCase();
}

function castlingRights(grid: Grid): string {
  let rights = "";
  const whiteKing = grid[7]?.[4];
  const blackKing = grid[0]?.[4];
  if (whiteKing?.type === "k" && whiteKing.color === "w") {
    if (grid[7]?.[7]?.type === "r" && grid[7]?.[7]?.color === "w") rights += "K";
    if (grid[7]?.[0]?.type === "r" && grid[7]?.[0]?.color === "w") rights += "Q";
  }
  if (blackKing?.type === "k" && blackKing.color === "b") {
    if (grid[0]?.[7]?.type === "r" && grid[0]?.[7]?.color === "b") rights += "k";
    if (grid[0]?.[0]?.type === "r" && grid[0]?.[0]?.color === "b") rights += "q";
  }
  return rights || "-";
}

function gridToFen(grid: Grid, turn: Side): string | null {
  const rows = grid.map((rank) => {
    let empty = 0;
    let row = "";
    for (const cell of rank) {
      if (!cell) {
        empty += 1;
        continue;
      }
      if (empty) {
        row += String(empty);
        empty = 0;
      }
      row += pieceCode(cell);
    }
    if (empty) row += String(empty);
    return row;
  });
  const fen = `${rows.join("/")} ${turn} ${castlingRights(grid)} - 0 1`;
  try {
    return new Chess(fen).fen();
  } catch {
    return null;
  }
}

function playGame(fen: string, moves: readonly DraftMove[]): Chess {
  const chess = new Chess(fen);
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
  const [step, setStep] = useState<Step>(1);
  const [grid, setGrid] = useState<Grid>(startGrid);
  const [turn, setTurn] = useState<Side>("w");
  const [tool, setTool] = useState<Tool | null>(null);
  const [lockedFen, setLockedFen] = useState<string | null>(null);
  const [lineName, setLineName] = useState("");
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [format, setFormat] = useState<StudyMode | null>(null);
  const [publishStep, setPublishStep] = useState<"idle" | "remind" | "done">("idle");

  const draftFen = useMemo(() => gridToFen(grid, turn), [grid, turn]);
  const game = useMemo(
    () => (lockedFen ? playGame(lockedFen, moves) : new Chess()),
    [lockedFen, moves],
  );
  const verbose = game.history({ verbose: true });
  const last = verbose[verbose.length - 1];
  const canMove = step === 2 && !!lockedFen && !pending;

  const place = (rank: number, file: number) => {
    if (lockedFen || !tool) return;
    setGrid((current) =>
      current.map((row, rowIndex) =>
        row.map((cell, fileIndex) => {
          if (rowIndex !== rank || fileIndex !== file) return cell;
          return tool === "erase" ? null : { ...tool };
        }),
      ),
    );
  };

  const lockPosition = () => {
    if (!draftFen) return;
    setLockedFen(draftFen);
    setMoves([]);
    setPending(false);
    setFormat(null);
    setPublishStep("idle");
    setStep(2);
  };

  const unlockPosition = () => {
    setLockedFen(null);
    setMoves([]);
    setPending(false);
    setFormat(null);
    setSelected(null);
    setPublishStep("idle");
    setStep(1);
  };

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
    if (!canMove || !lockedFen) return;
    const next = playGame(lockedFen, moves);
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
    if (!canMove || !lockedFen) return;
    const played = parseTypedMove(playGame(lockedFen, moves), typed);
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

  return (
    <div data-creator-packs-editor>
      <h1 className="creator-packs-title">Create your own Opening Lab style drill</h1>
      <p className="creator-packs-lede">
        Three steps. Set the position, play the moves, then see the drill or the walk-through a player would get.
        This desk is a sample. Nothing you enter is stored.
      </p>
      <ol className="creator-steps" aria-label="Editor steps">
        <li>
          <button
            type="button"
            data-creator-step="1"
            className={step === 1 ? "is-on" : undefined}
            aria-current={step === 1 ? "step" : undefined}
            onClick={() => setStep(1)}
          >
            1 Position
          </button>
        </li>
        <li>
          <button
            type="button"
            data-creator-step="2"
            className={step === 2 ? "is-on" : undefined}
            aria-current={step === 2 ? "step" : undefined}
            disabled={!lockedFen}
            onClick={() => lockedFen && setStep(2)}
          >
            2 Moves
          </button>
        </li>
        <li>
          <button
            type="button"
            data-creator-step="3"
            className={step === 3 ? "is-on" : undefined}
            aria-current={step === 3 ? "step" : undefined}
            disabled={!lockedFen || moves.length === 0 || pending}
            onClick={() => lockedFen && moves.length > 0 && !pending && setStep(3)}
          >
            3 Format
          </button>
        </li>
      </ol>

      {step === 1 ? (
        <section data-creator-position>
          <h2 className="creator-packs-subhead">Set up the starting position</h2>
          {lockedFen ? (
            <>
              <p className="creator-packs-note" data-creator-locked>
                Position locked. This is the start of the line. Edit it if you want a different one. Editing clears the moves.
              </p>
              <div className="creator-packs-board">
                <ChessBoard
                  game={new Chess(lockedFen)}
                  flip={false}
                  selected={null}
                  wrongUntil={null}
                  expected={null}
                  showHints={false}
                  lastMove={null}
                  slide={null}
                  onSquare={() => undefined}
                  interactive={false}
                />
              </div>
              <div className="creator-editor-actions">
                <button type="button" data-creator-unlock onClick={unlockPosition}>
                  Edit position
                </button>
                <button type="button" className="creator-packs-primary" onClick={() => setStep(2)}>
                  Continue to moves
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="creator-packs-note">
                Start from the normal opening position, or build any position you like. A middlegame and a puzzle both begin here.
              </p>
              <div className="creator-palette" role="group" aria-label="Piece palette">
                {(["w", "b"] as const).map((color) => (
                  <div key={color} className="creator-palette-row">
                    {PALETTE.map((type) => {
                      const active = tool !== "erase" && tool?.type === type && tool.color === color;
                      return (
                        <button
                          key={`${color}${type}`}
                          type="button"
                          className={active ? "is-on" : undefined}
                          aria-pressed={active}
                          data-creator-palette={`${color}${type}`}
                          onClick={() => setTool({ type, color })}
                        >
                          <ChessPiece code={pieceCode({ type, color })} />
                        </button>
                      );
                    })}
                  </div>
                ))}
                <button
                  type="button"
                  className={tool === "erase" ? "is-on" : undefined}
                  aria-pressed={tool === "erase"}
                  data-creator-erase
                  onClick={() => setTool("erase")}
                >
                  Remove
                </button>
              </div>
              <div className="creator-setup-board" data-creator-setup-board>
                {grid.map((rank, rankIndex) =>
                  rank.map((cell, fileIndex) => {
                    const light = (rankIndex + fileIndex) % 2 === 1;
                    return (
                      <button
                        key={`${rankIndex}-${fileIndex}`}
                        type="button"
                        className={`creator-setup-sq ${light ? "sq-light" : "sq-dark"}`}
                        aria-label={`${"abcdefgh"[fileIndex]}${8 - rankIndex}`}
                        onClick={() => place(rankIndex, fileIndex)}
                      >
                        {cell ? <ChessPiece code={pieceCode(cell)} /> : null}
                      </button>
                    );
                  }),
                )}
              </div>
              <div className="creator-side" role="group" aria-label="Side to move">
                <button
                  type="button"
                  aria-pressed={turn === "w"}
                  className={turn === "w" ? "is-on" : undefined}
                  onClick={() => setTurn("w")}
                >
                  {t("White")} to move
                </button>
                <button
                  type="button"
                  aria-pressed={turn === "b"}
                  className={turn === "b" ? "is-on" : undefined}
                  onClick={() => setTurn("b")}
                >
                  {t("Black")} to move
                </button>
              </div>
              <div className="creator-editor-actions">
                <button
                  type="button"
                  data-creator-standard
                  onClick={() => {
                    setGrid(startGrid());
                    setTurn("w");
                  }}
                >
                  Standard start
                </button>
                <button
                  type="button"
                  data-creator-clear-board
                  onClick={() => setGrid(emptyGrid())}
                >
                  Clear board
                </button>
              </div>
              <p className="creator-packs-note" data-creator-position-status>
                {draftFen
                  ? "This position can start a game."
                  : "Each side needs one king, and the side to move must not already be in an impossible check."}
              </p>
              <button
                type="button"
                className="creator-packs-primary"
                data-creator-lock
                disabled={!draftFen}
                onClick={lockPosition}
              >
                Lock in position
              </button>
            </>
          )}
        </section>
      ) : null}

      {step === 2 && lockedFen ? (
        <section data-creator-moves>
          <h2 className="creator-packs-subhead">Play out the moves</h2>
          <p className="creator-packs-note" data-creator-locked>
            Position locked. Only legal moves count. A comment box opens for each one.
          </p>
          <label className="creator-packs-field">
            <span>Line name</span>
            <input
              value={lineName}
              onChange={(event) => setLineName(event.target.value)}
              placeholder="A name players will see"
              data-creator-line-name
            />
          </label>
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
              flip={lockedFen.split(" ")[1] === "b"}
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
              <p className="creator-move-empty">The move list appears here, with an optional comment on each move.</p>
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
              Undo
            </button>
            <button type="button" data-creator-unlock onClick={unlockPosition}>
              Edit position
            </button>
            <button
              type="button"
              className="creator-packs-primary"
              data-creator-to-format
              disabled={moves.length === 0 || pending}
              onClick={() => setStep(3)}
            >
              Choose format
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 && lockedFen ? (
        <section data-creator-format-step>
          <h2 className="creator-packs-subhead">Choose the format</h2>
          <p className="creator-packs-note">
            See the line the way a player will meet it. You can switch between the two before you publish.
          </p>
          <div className="creator-format-choices">
            <button
              type="button"
              className={format === "drill" ? "is-on" : undefined}
              aria-pressed={format === "drill"}
              data-creator-format="drill"
              onClick={() => setFormat("drill")}
            >
              <span className="creator-pack-name">Turn it into a drill</span>
              <span className="creator-pack-bio">
                Practice with a hint, then Test with none. The same drill style as an Opening Lab pack, playable here.
              </span>
            </button>
            <button
              type="button"
              className={format === "walk" ? "is-on" : undefined}
              aria-pressed={format === "walk"}
              data-creator-format="walk"
              onClick={() => setFormat("walk")}
            >
              <span className="creator-pack-name">Walk-through</span>
              <span className="creator-pack-bio">
                The player steps through the position and each move, with your explanation beside it.
              </span>
            </button>
          </div>
          {format ? (
            <div data-creator-format-preview>
              <CreatorPackStudy
                title={lineName.trim() || "Your line"}
                mode={format}
                plies={moves.map((move) => move.san)}
                comments={moves.map((move) => move.comment)}
                fen={lockedFen}
                side={lockedFen.split(" ")[1] === "b" ? "b" : "w"}
              />
            </div>
          ) : null}
          {publishStep === "idle" ? (
            <button
              type="button"
              className="creator-packs-primary"
              data-creator-publish
              disabled={!format}
              onClick={() => setPublishStep("remind")}
            >
              Publish
            </button>
          ) : null}
          {publishStep === "remind" ? (
            <div className="creator-publish-reminder" role="status" data-creator-publish-reminder>
              <h2>Before you publish</h2>
              <p>Double-check every line is exactly how you want it.</p>
              <button type="button" className="creator-packs-primary" data-creator-continue onClick={() => setPublishStep("done")}>
                Continue
              </button>
            </div>
          ) : null}
          {publishStep === "done" ? (
            <p className="creator-packs-note" role="status" data-creator-published>
              Published to your creator pack. This preview did not store it.
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
