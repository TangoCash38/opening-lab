import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Chess, type Move, type Square } from "chess.js";
import { plyLabel, type StudyMode } from "@/data/creator-packs-demo";
import { useT } from "@/lib/i18n";
import { formatPackPrice, SUGGESTED_PACK_PRICES } from "@/lib/creator-packs-review";
import { submitCreatorPack, fetchCreatorMine } from "@/lib/creator-packs-client";
import { validateCreatorPack } from "@/lib/creator-packs-content";
import { firstPurchaseLink, NO_PURCHASE_LINK, purchaseLinkMessage } from "@/lib/creator-packs-text";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";
import { ChessPiece, pieceName } from "./chess-pieces";
import { CreatorSetupBoard } from "./creator-packs-setup-board";
import { CreatorPromoteNote } from "./creator-packs-promote";
import { CreatorPackStatus } from "./creator-packs-status";
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

type SavedLine = {
  id: string;
  name: string;
  fen: string;
  moves: DraftMove[];
  mode: StudyMode;
};

type PublishStep = "idle" | "remind" | "price" | "submitted";

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

function parseSetupFen(raw: string): { fen: string; grid: Grid; turn: Side } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const chess = new Chess(trimmed);
    const grid = chess.board().map((rank) =>
      rank.map((piece) => (piece ? { type: piece.type as PieceType, color: piece.color } : null)),
    );
    return { fen: chess.fen(), grid, turn: chess.turn() };
  } catch {
    return null;
  }
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
  const [fenDraft, setFenDraft] = useState("");
  const [fenError, setFenError] = useState<string | null>(null);
  const [pastedFen, setPastedFen] = useState<string | null>(null);
  const [packName, setPackName] = useState("");
  const [savedLines, setSavedLines] = useState<SavedLine[]>([]);
  const [savedNote, setSavedNote] = useState(false);
  const [lineName, setLineName] = useState("");
  const [moves, setMoves] = useState<DraftMove[]>([]);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<Square | null>(null);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState<string | null>(null);
  const [format, setFormat] = useState<StudyMode | null>(null);
  const [publishStep, setPublishStep] = useState<PublishStep>("idle");
  const [publishLines, setPublishLines] = useState<SavedLine[]>([]);
  const [priceMode, setPriceMode] = useState<"free" | "priced" | null>(null);
  const [suggestedPrice, setSuggestedPrice] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ id: string; name: string; suggestedPrice: string } | null>(null);
  const [payoutsReady, setPayoutsReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blurb, setBlurb] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchCreatorMine().then((result) => {
      if (cancelled || !result.ok) return;
      setPayoutsReady(result.desk.profile?.payoutsReady === true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const draftFen = useMemo(() => gridToFen(grid, turn), [grid, turn]);
  const game = useMemo(
    () => (lockedFen ? playGame(lockedFen, moves) : new Chess()),
    [lockedFen, moves],
  );
  const verbose = game.history({ verbose: true });
  const last = verbose[verbose.length - 1];
  const canMove = step === 2 && !!lockedFen && !pending;

  const touchGrid = () => {
    setPastedFen(null);
    setSavedNote(false);
  };

  const place = (rank: number, file: number) => {
    if (lockedFen || !tool) return;
    touchGrid();
    setGrid((current) =>
      current.map((row, rowIndex) =>
        row.map((cell, fileIndex) => {
          if (rowIndex !== rank || fileIndex !== file) return cell;
          return tool === "erase" ? null : { ...tool };
        }),
      ),
    );
  };

  const movePiece = (fromRank: number, fromFile: number, toRank: number, toFile: number) => {
    touchGrid();
    setGrid((current) => {
      const moving = current[fromRank]?.[fromFile];
      if (!moving) return current;
      return current.map((row, rowIndex) =>
        row.map((cell, fileIndex) => {
          if (rowIndex === fromRank && fileIndex === fromFile) return null;
          if (rowIndex === toRank && fileIndex === toFile) return moving;
          return cell;
        }),
      );
    });
  };

  const removePiece = (rank: number, file: number) => {
    touchGrid();
    setGrid((current) =>
      current.map((row, rowIndex) =>
        row.map((cell, fileIndex) => (rowIndex === rank && fileIndex === file ? null : cell)),
      ),
    );
  };

  const applyFen = () => {
    const parsed = parseSetupFen(fenDraft);
    if (!parsed) {
      setPastedFen(null);
      setFenError(
        fenDraft.trim()
          ? "That position could not be read. Check the FEN and try again."
          : "Paste a FEN first.",
      );
      return;
    }
    setGrid(parsed.grid);
    setTurn(parsed.turn);
    setPastedFen(parsed.fen);
    setFenError(null);
    setSavedNote(false);
  };

  const lockPosition = () => {
    const fen = pastedFen ?? draftFen;
    if (!fen) return;
    setLockedFen(fen);
    setMoves([]);
    setPending(false);
    setFormat(null);
    setPublishStep("idle");
    setSavedNote(false);
    setStep(2);
  };

  const resetDraft = () => {
    setGrid(startGrid());
    setTurn("w");
    setTool(null);
    setLockedFen(null);
    setFenDraft("");
    setFenError(null);
    setPastedFen(null);
    setLineName("");
    setMoves([]);
    setPending(false);
    setSelected(null);
    setTyped("");
    setTypedError(null);
    setFormat(null);
    setStep(1);
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

  const currentLine = (): SavedLine | null => {
    if (!lockedFen || !format || moves.length === 0 || pending) return null;
    return {
      id: `draft-${savedLines.length + 1}`,
      name: lineName.trim() || `Line ${savedLines.length + 1}`,
      fen: lockedFen,
      moves,
      mode: format,
    };
  };

  const draftTexts = (): string[] => [packName, lineName, ...moves.map((move) => move.comment)];

  const lineTexts = (lines: readonly SavedLine[]): string[] => [
    packName,
    blurb,
    ...lines.flatMap((line) => [line.name, ...line.moves.map((move) => move.comment)]),
  ];

  const blockLinks = (values: readonly string[]): boolean => {
    const blocked = firstPurchaseLink(values);
    setLinkError(blocked);
    return blocked !== null;
  };

  const saveAndAddLine = () => {
    const line = currentLine();
    if (!line) return;
    if (blockLinks(draftTexts())) return;
    setSavedLines((current) => [
      ...current,
      { ...line, id: `line-${Date.now()}-${current.length}` },
    ]);
    resetDraft();
    setSavedNote(true);
    setPublishStep("idle");
  };

  const beginPublish = (lines: SavedLine[]) => {
    if (lines.length === 0) return;
    if (blockLinks(lineTexts(lines))) return;
    setPublishLines(lines);
    setPublishStep("remind");
    setPriceError(null);
  };

  const chosenPrice = (): string | null => {
    if (priceMode === "free") return "Free";
    if (priceMode !== "priced") return null;
    if (suggestedPrice) return suggestedPrice;
    if (!customPrice.trim()) return null;
    return formatPackPrice(customPrice);
  };

  const submitPack = () => {
    if (submitting) return;
    if (blockLinks(lineTexts(publishLines))) return;
    const price = chosenPrice();
    if (!price) {
      setPriceError(
        priceMode === "priced"
          ? "Choose a suggested amount, or enter your own, such as 4.00."
          : "Choose Free, or add a price.",
      );
      return;
    }
    const draft = {
      name: packName.trim() || publishLines[0]?.name || "Your pack",
      blurb,
      suggestedPrice: price,
      lines: publishLines.map((line) => ({
        name: line.name,
        mode: line.mode,
        fen: line.fen,
        plies: line.moves.map((move) => move.san),
        comments: line.moves.map((move) => move.comment),
      })),
    };
    const checked = validateCreatorPack(draft);
    if (!checked.ok) {
      setPriceError(checked.error);
      return;
    }
    setSubmitting(true);
    void submitCreatorPack(draft).then((result) => {
      setSubmitting(false);
      if (!result.ok) {
        setPriceError(
          result.status === 401
            ? "Sign in, then submit the pack again."
            : result.error,
        );
        return;
      }
      setSubmitted({ id: result.pack.id, name: result.pack.name, suggestedPrice: price });
      setPublishStep("submitted");
      setPriceError(null);
    });
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
        You do not have to start from an opening. When you submit, Opening Lab saves the pack. You can see it
        straight away. Other players see it only after it is approved.
      </p>
      <p className="creator-packs-note">
        If a position or a line is stuck, <Link to="/creator-packs/help">Need help?</Link> opens an email.
      </p>
      {publishStep === "idle" ? (
        <>
          <label className="creator-packs-field">
            <span>Pack name</span>
            <input
              value={packName}
              onChange={(event) => setPackName(event.target.value)}
              placeholder="My game vs Smith"
              data-creator-pack-name
            />
          </label>
          {purchaseLinkMessage(packName) ? (
            <p className="creator-packs-error" role="alert" data-creator-link-error>
              {NO_PURCHASE_LINK}
            </p>
          ) : null}
        </>
      ) : null}
      <ol className="creator-steps" aria-label="Editor steps">
        <li>
          <button
            type="button"
            data-creator-step="1"
            className={step === 1 && publishStep === "idle" ? "is-on" : undefined}
            aria-current={step === 1 && publishStep === "idle" ? "step" : undefined}
            onClick={() => {
              setPublishStep("idle");
              setStep(1);
            }}
          >
            1 Position
          </button>
        </li>
        <li>
          <button
            type="button"
            data-creator-step="2"
            className={step === 2 && publishStep === "idle" ? "is-on" : undefined}
            aria-current={step === 2 && publishStep === "idle" ? "step" : undefined}
            disabled={!lockedFen}
            onClick={() => {
              if (!lockedFen) return;
              setPublishStep("idle");
              setStep(2);
            }}
          >
            2 Moves
          </button>
        </li>
        <li>
          <button
            type="button"
            data-creator-step="3"
            className={step === 3 && publishStep === "idle" ? "is-on" : undefined}
            aria-current={step === 3 && publishStep === "idle" ? "step" : undefined}
            disabled={!lockedFen || moves.length === 0 || pending}
            onClick={() => {
              if (!lockedFen || moves.length === 0 || pending) return;
              setPublishStep("idle");
              setStep(3);
            }}
          >
            3 Format
          </button>
        </li>
      </ol>
      {publishStep === "idle" && savedLines.length > 0 ? (
        <section data-creator-saved-lines>
          <h2 className="creator-packs-subhead">Lines in this pack</h2>
          <p className="creator-packs-note">Each saved line keeps the position it started from.</p>
          <ul className="creator-kept-list">
            {savedLines.map((line) => (
              <li key={line.id}>
                <span>
                  {line.name}
                  <span className="creator-kept-moves">{line.moves.length} moves, own position</span>
                </span>
                <button type="button" aria-label={`Remove ${line.name}`} onClick={() => setSavedLines((current) => current.filter((item) => item.id !== line.id))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="creator-editor-actions">
            <button type="button" data-creator-publish-saved onClick={() => beginPublish(savedLines)}>
              Publish the lines already saved
            </button>
          </div>
        </section>
      ) : null}

      {publishStep === "idle" && step === 1 ? (
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
              {savedNote ? (
                <p className="creator-packs-check" data-creator-line-saved>
                  Line saved. Set up the next position. It can be a different moment, with its own pieces.
                </p>
              ) : null}
              <CreatorSetupBoard
                codes={grid.map((rank) => rank.map((cell) => (cell ? pieceCode(cell) : null)))}
                onPlace={place}
                onMove={movePiece}
                onRemove={removePiece}
              />
              <div className="creator-palette" role="group" aria-label="Piece palette">
                {(["w", "b"] as const).map((color) => (
                  <div key={color} className="creator-palette-row">
                    {PALETTE.map((type) => {
                      const active = tool !== "erase" && tool?.type === type && tool.color === color;
                      const code = pieceCode({ type, color });
                      return (
                        <button
                          key={`${color}${type}`}
                          type="button"
                          className={active ? "is-on" : undefined}
                          aria-pressed={active}
                          aria-label={pieceName(code)}
                          data-creator-palette={`${color}${type}`}
                          onClick={() => setTool(active ? null : { type, color })}
                        >
                          <ChessPiece code={code} />
                        </button>
                      );
                    })}
                  </div>
                ))}
                <button
                  type="button"
                  className={`creator-palette-erase${tool === "erase" ? " is-on" : ""}`}
                  aria-pressed={tool === "erase"}
                  data-creator-erase
                  onClick={() => setTool(tool === "erase" ? null : "erase")}
                >
                  Remove
                </button>
              </div>
              <p className="creator-packs-note">
                Tap a piece, then a square. Drag a piece to another square, or off the board to remove it.
              </p>
              <div className="creator-setup-controls">
                <button
                  type="button"
                  data-creator-standard
                  onClick={() => {
                    setGrid(startGrid());
                    setTurn("w");
                    setPastedFen(null);
                    setFenError(null);
                  }}
                >
                  Standard start
                </button>
                <button
                  type="button"
                  data-creator-clear-board
                  onClick={() => {
                    setGrid(emptyGrid());
                    setPastedFen(null);
                    setFenError(null);
                  }}
                >
                  Clear board
                </button>
                <button
                  type="button"
                  aria-pressed={turn === "w"}
                  className={turn === "w" ? "is-on" : undefined}
                  onClick={() => {
                    if (turn !== "w") setPastedFen(null);
                    setTurn("w");
                  }}
                >
                  {t("White")} to move
                </button>
                <button
                  type="button"
                  aria-pressed={turn === "b"}
                  className={turn === "b" ? "is-on" : undefined}
                  onClick={() => {
                    if (turn !== "b") setPastedFen(null);
                    setTurn("b");
                  }}
                >
                  {t("Black")} to move
                </button>
              </div>
              <details className="creator-advanced" data-creator-advanced>
                <summary>Advanced: paste a position</summary>
                <label className="creator-packs-field">
                  <span>Paste a FEN</span>
                  <textarea
                    value={fenDraft}
                    onChange={(event) => {
                      setFenDraft(event.target.value);
                      setFenError(null);
                    }}
                    rows={3}
                    placeholder="Paste a FEN from the middle of a game"
                    data-creator-fen
                  />
                </label>
                <div className="creator-editor-actions">
                  <button type="button" data-creator-apply-fen onClick={applyFen}>
                    Place on the board
                  </button>
                </div>
                {fenError ? (
                  <p className="creator-packs-error" role="alert" data-creator-fen-error>
                    {fenError}
                  </p>
                ) : null}
              </details>
              <p className="creator-packs-note" data-creator-position-status>
                {pastedFen
                  ? "Position placed. Lock it in when it looks right."
                  : draftFen
                    ? "This position can start a game."
                    : "Each side needs one king, and the side to move must not already be in an impossible check."}
              </p>
              <button
                type="button"
                className="creator-packs-primary"
                data-creator-lock
                disabled={!(pastedFen || draftFen)}
                onClick={lockPosition}
              >
                Lock in position
              </button>
            </>
          )}
        </section>
      ) : null}

      {publishStep === "idle" && step === 2 && lockedFen ? (
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
          {purchaseLinkMessage(lineName) ? (
            <p className="creator-packs-error" role="alert" data-creator-link-error>
              {NO_PURCHASE_LINK}
            </p>
          ) : null}
          <p className="creator-packs-count" data-creator-turn>
            {moves.length === 0
              ? "Starting position. Play the first move."
              : pending
                ? `Comment on ${plyLabel(moves.length - 1, moves[moves.length - 1]!.san, lockedFen)}, then continue.`
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
                <div key={`${index}-${move.san}`}>
                  <label
                    className={`creator-comment${index === moves.length - 1 ? " is-current" : ""}`}
                    data-creator-comment={index + 1}
                  >
                    <span>Comment for {plyLabel(index, move.san, lockedFen ?? undefined)}</span>
                    <textarea
                      value={move.comment}
                      rows={2}
                      placeholder="Optional. What should the player notice?"
                      onChange={(event) => {
                        updateComment(index, event.target.value);
                        setLinkError(null);
                      }}
                    />
                  </label>
                  {purchaseLinkMessage(move.comment) ? (
                    <p className="creator-packs-error" role="alert" data-creator-link-error>
                      {NO_PURCHASE_LINK}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {pending ? (
            <button
              type="button"
              className="creator-packs-primary"
              data-creator-next
              onClick={() => {
                if (blockLinks([moves[moves.length - 1]?.comment ?? ""])) return;
                setPending(false);
              }}
            >
              Next
            </button>
          ) : null}
          {linkError ? (
            <p className="creator-packs-error" role="alert" data-creator-link-error>
              {linkError}
            </p>
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
              onClick={() => {
                if (blockLinks(draftTexts())) return;
                setStep(3);
              }}
            >
              Choose format
            </button>
          </div>
        </section>
      ) : null}

      {publishStep === "idle" && step === 3 && lockedFen ? (
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
          <div className="creator-editor-actions">
            <button
              type="button"
              data-creator-add-line
              disabled={!format || moves.length === 0 || pending}
              onClick={saveAndAddLine}
            >
              Add another line
            </button>
            <button
              type="button"
              className="creator-packs-primary"
              data-creator-publish
              disabled={!format || moves.length === 0 || pending}
              onClick={() => {
                const line = currentLine();
                if (!line) return;
                beginPublish([...savedLines, line]);
              }}
            >
              Publish
            </button>
          </div>
        </section>
      ) : null}

      {publishStep === "remind" ? (
        <div className="creator-publish-reminder" role="status" data-creator-publish-reminder>
          <h2>Before you publish</h2>
          <p>Double-check every line is exactly how you want it.</p>
          <ul className="creator-kept-list">
            {publishLines.map((line) => (
              <li key={line.id}>
                <span>
                  {line.name}
                  <span className="creator-kept-moves">{line.moves.length} moves from its own position</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="creator-packs-primary" data-creator-continue onClick={() => setPublishStep("price")}>
            Continue
          </button>
        </div>
      ) : null}

      {publishStep === "price" ? (
        <section className="creator-publish-reminder" data-creator-price>
          <h2>How much to charge?</h2>
          <p>
            Free keeps the pack open. Or suggest a price. Opening Lab reviews the pack and sets the final price before anyone is charged.
          </p>
          <p>You keep 70% of every sale. Opening Lab keeps 30%. Players buy on Opening Lab&apos;s website or in the app.</p>
          <CreatorPromoteNote />
          <label className="creator-packs-field">
            <span>Note for players</span>
            <textarea
              value={blurb}
              onChange={(event) => setBlurb(event.target.value)}
              rows={3}
              placeholder="Optional. What this pack is for."
              data-creator-blurb
            />
          </label>
          {linkError ? (
            <p className="creator-packs-error" role="alert" data-creator-link-error>
              {linkError}
            </p>
          ) : null}
          <div className="creator-format-choices">
            <button
              type="button"
              className={priceMode === "free" ? "is-on" : undefined}
              aria-pressed={priceMode === "free"}
              data-creator-price-free
              onClick={() => {
                setPriceMode("free");
                setPriceError(null);
              }}
            >
              <span className="creator-pack-name">Free</span>
              <span className="creator-pack-bio">Players can open the whole pack without paying.</span>
            </button>
            <button
              type="button"
              className={priceMode === "priced" ? "is-on" : undefined}
              aria-pressed={priceMode === "priced"}
              data-creator-price-paid
              onClick={() => {
                setPriceMode("priced");
                setPriceError(null);
              }}
            >
              <span className="creator-pack-name">Add a price</span>
              <span className="creator-pack-bio">Suggest an amount. A few common prices are listed, or name your own.</span>
            </button>
          </div>
          {priceMode === "priced" ? (
            <>
              <div className="creator-suggest-row" role="group" aria-label="Suggested prices">
                {SUGGESTED_PACK_PRICES.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className={suggestedPrice === amount ? "is-on" : undefined}
                    aria-pressed={suggestedPrice === amount}
                    data-creator-price-suggest={amount}
                    onClick={() => {
                      setSuggestedPrice(amount);
                      setCustomPrice("");
                      setPriceError(null);
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <label className="creator-packs-field">
                <span>Or name your own</span>
                <input
                  value={customPrice}
                  onChange={(event) => {
                    setCustomPrice(event.target.value);
                    setSuggestedPrice(null);
                    setPriceError(null);
                  }}
                  inputMode="decimal"
                  placeholder="4.00"
                  data-creator-price-custom
                />
              </label>
            </>
          ) : null}
          {priceError ? (
            <p className="creator-packs-error" role="alert">
              {priceError}
            </p>
          ) : null}
          {priceMode === "priced" && !payoutsReady ? (
            <p className="creator-packs-check" data-creator-payout-prompt>
              A priced pack is paid once payouts are set up. You can still submit now, and set them up when you are
              ready. <Link to="/creator-packs/dashboard">Set up payouts</Link>
            </p>
          ) : null}
          <button
            type="button"
            className="creator-packs-primary"
            data-creator-submit-pack
            disabled={submitting}
            onClick={submitPack}
          >
            {submitting ? "Saving…" : "Submit pack"}
          </button>
        </section>
      ) : null}

      {publishStep === "submitted" && submitted ? (
        <section className="creator-publish-reminder" role="status" data-creator-submitted>
          <h2>Submitted</h2>
          <p>
            Your pack is live for you to see. Opening Lab will check it over and set it live for everyone shortly.
          </p>
          <p className="creator-packs-note">Opening Lab saves the pack for review. You can open it from your packs.</p>
          <article className="creator-pack-card" data-creator-own-pack={submitted.id}>
            <span className="creator-pack-name">{submitted.name}</span>
            <span className="creator-pack-meta">
              <span className="creator-pack-price">{submitted.suggestedPrice}</span>
              <CreatorPackStatus status="review" />
            </span>
            <p className="creator-only-note">Visible only to you</p>
          </article>
          <Link to="/creator-packs/dashboard" className="creator-packs-primary creator-packs-primary-link">
            See your packs
          </Link>
        </section>
      ) : null}
    </div>
  );
}
