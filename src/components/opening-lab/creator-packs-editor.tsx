import { useCallback, useMemo, useRef, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import { Trash2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";

type Side = "w" | "b";

type KeptLine = {
  id: string;
  name: string;
  side: Side;
  plies: string[];
};

const LINE_CAP = 10;

function replay(plies: readonly string[]): Chess {
  const chess = new Chess();
  for (const san of plies) {
    if (!chess.move(san)) break;
  }
  return chess;
}

function sanChips(plies: readonly string[]): { key: string; label: string }[] {
  return plies.map((san, index) => ({
    key: `${index}-${san}`,
    label: index % 2 === 0 ? `${index / 2 + 1}.${san}` : san,
  }));
}

export function CreatorPacksEditor() {
  const t = useT();
  const [packName, setPackName] = useState("");
  const [lineName, setLineName] = useState("");
  const [side, setSide] = useState<Side>("w");
  const [game, setGame] = useState(() => new Chess());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [kept, setKept] = useState<KeptLine[]>([]);
  const [publishNote, setPublishNote] = useState(false);
  const lineId = useRef(0);

  const plies = game.history();
  const chips = useMemo(() => sanChips(plies), [plies]);
  const full = kept.length >= LINE_CAP;

  const playMove = useCallback((from: Square, to: Square) => {
    const next = new Chess();
    for (const san of game.history()) {
      if (!next.move(san)) return;
    }
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
    soundMove();
    setGame(next);
    setSelected(null);
    setLastMove({ from: played.from as Square, to: played.to as Square });
    setPublishNote(false);
  }, [game]);

  const onSquare = (sq: Square) => {
    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game.moves({ verbose: true }).some((move) => move.from === selected && move.to === sq);
      if (legal) {
        playMove(selected, sq);
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

  const takeBack = () => {
    const history = game.history();
    if (history.length === 0) return;
    const next = replay(history.slice(0, -1));
    const verbose = next.history({ verbose: true });
    const last = verbose[verbose.length - 1];
    setGame(next);
    setSelected(null);
    setLastMove(last ? { from: last.from as Square, to: last.to as Square } : null);
  };

  const clearBoard = () => {
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
  };

  const keepLine = () => {
    if (plies.length === 0 || full) return;
    const name = lineName.trim() || `Line ${kept.length + 1}`;
    const id = `line-${++lineId.current}`;
    setKept((current) => [...current, { id, name, side, plies: [...plies] }]);
    setLineName("");
    clearBoard();
    setPublishNote(false);
  };

  const removeLine = (id: string) => {
    setKept((current) => current.filter((line) => line.id !== id));
  };

  return (
    <div data-creator-packs-editor>
      <h1 className="creator-packs-title">Pack editor</h1>
      <p className="creator-packs-lede">
        Name the pack, then enter each line move by move. This desk is a sample. Nothing you type is saved.
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
                <span className="creator-kept-moves">{sanChips(line.plies).map((chip) => chip.label).join(" ")}</span>
              </span>
              <button type="button" onClick={() => removeLine(line.id)} aria-label={`Remove ${line.name}`}>
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
          <button
            type="button"
            aria-pressed={side === "w"}
            className={side === "w" ? "is-on" : undefined}
            onClick={() => setSide("w")}
          >
            {t("White")}
          </button>
          <button
            type="button"
            aria-pressed={side === "b"}
            className={side === "b" ? "is-on" : undefined}
            onClick={() => setSide("b")}
          >
            {t("Black")}
          </button>
        </div>
      </div>

      <div className="creator-packs-board" data-creator-board>
        <ChessBoard
          game={game}
          flip={side === "b"}
          selected={selected}
          wrongUntil={null}
          expected={null}
          showHints={false}
          lastMove={lastMove}
          slide={null}
          onSquare={onSquare}
          onPlay={playMove}
          interactive={!full}
        />
      </div>
      <div className="creator-move-chips" aria-label="Moves in this line">
        {chips.length === 0 ? (
          <span className="creator-move-empty">Play the line, one move at a time.</span>
        ) : (
          chips.map((chip, index) => (
            <span key={chip.key} className={index === chips.length - 1 ? "is-on" : undefined}>
              {chip.label}
            </span>
          ))
        )}
      </div>
      <div className="creator-editor-actions">
        <button type="button" onClick={takeBack} disabled={plies.length === 0}>
          Take back
        </button>
        <button type="button" onClick={clearBoard} disabled={plies.length === 0}>
          {t("Clear")}
        </button>
        <button
          type="button"
          className="creator-packs-primary"
          onClick={keepLine}
          disabled={plies.length === 0 || full}
          data-creator-keep
        >
          Keep this line
        </button>
      </div>
      <p className="creator-packs-check" data-creator-packs-check>
        Before a pack goes live, each line is checked with Stockfish and then by an independent Line Gate.
        A line that fails either check does not go live.
      </p>
      <button
        type="button"
        className="creator-packs-primary"
        data-creator-publish
        onClick={() => setPublishNote(true)}
      >
        Preview only
      </button>
      {publishNote ? (
        <p className="creator-packs-note" role="status" data-creator-publish-note>
          Preview only. {packName.trim() ? `"${packName.trim()}" was not saved.` : "Nothing was saved."} No pack is submitted.
        </p>
      ) : null}
    </div>
  );
}
