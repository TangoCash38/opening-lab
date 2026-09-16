import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Star, Trash2 } from "lucide-react";
import { Chess, type Move, type Square } from "chess.js";
import { useT } from "@/lib/i18n";
import {
  arrowsFromPvs,
  evalBarWhitePct,
  firstMoveSquares,
  fetchPracticeReviewEval,
  formatEvalLabel,
  formatPvLine,
  whiteEvalCp,
  type PracticeReviewOk,
} from "@/lib/practice-review-eval";
import {
  formatOpeningIdentity,
  lookupOpeningIdentityPrefix,
} from "@/lib/opening-identity";
import {
  GYM_AUTHOR_DEBOUNCE_MS,
  GYM_AUTHOR_DEPTH,
  GYM_LINE_ID,
  formatGymSan,
  gymSanChips,
  readGymLine,
  rememberGymLine,
  sameGymLine,
  type GymLine,
} from "@/lib/gym-line";
import { clearLineProgress } from "@/lib/progress";
import { soundMove, soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";

type Side = "w" | "b";

type Props = {
  onPractice: (line: GymLine) => void;
  initial?: GymLine | null;
};

export function CreateOwnView({ onPractice, initial }: Props) {
  const t = useT();
  const [side, setSide] = useState<Side>(initial?.side ?? "b");
  const [game, setGame] = useState(() => replay(initial?.plies ?? []));
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(
    null,
  );
  const [remembered, setRemembered] = useState<GymLine | null>(null);
  const [evalOk, setEvalOk] = useState<PracticeReviewOk | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const fen = game.fen();
  const plies = game.history();
  const genRef = useRef(0);
  const opening = lookupOpeningIdentityPrefix(plies);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const gen = ++genRef.current;
    setSuggesting(true);
    setEvalOk(null);
    const timer = window.setTimeout(() => {
      void fetchPracticeReviewEval(fen, { depth: GYM_AUTHOR_DEPTH }).then(
        (result) => {
          if (gen !== genRef.current) return;
          if (!result.ok) {
            setEvalOk(null);
            setSuggesting(false);
            return;
          }
          setEvalOk(result);
          setSuggesting(false);
        },
      );
    }, GYM_AUTHOR_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fen]);

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
  }, [game]);

  const onSquare = (sq: Square) => {
    if (selected) {
      if (selected === sq) {
        setSelected(null);
        return;
      }
      const legal = game.moves({ verbose: true }).some(
        (m) => m.from === selected && m.to === sq,
      );
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

  const clearLine = () => {
    genRef.current += 1;
    setGame(new Chess());
    setSelected(null);
    setLastMove(null);
    setEvalOk(null);
    setSuggesting(false);
    setRemembered(null);
  };

  const lockLine = () => {
    const prev = readGymLine();
    const locked = rememberGymLine(plies, side);
    if (!locked) return;
    if (!sameGymLine(prev, locked)) clearLineProgress(GYM_LINE_ID);
    setRemembered(locked);
  };

  const chips = useMemo(() => gymSanChips(plies), [plies]);
  const showEval = evalOk != null;
  const showEngine = suggesting || showEval;
  const pvs = showEval
    ? [...evalOk.pvs].sort((a, b) => a.multipv - b.multipv)
    : [];
  const hintMoves = showEval ? arrowsFromPvs(fen, evalOk.pvs) : [];
  const pv1 = pvs.find((p) => p.multipv === 1);
  const suggest = useMemo((): Move | null => {
    const san = pv1?.san[0];
    if (!san || !showEval) return null;
    try {
      const probe = new Chess(fen);
      const mv = probe.move(san);
      return mv || null;
    } catch {
      const sq = firstMoveSquares(fen, san);
      return sq ? ({ from: sq.from, to: sq.to } as Move) : null;
    }
  }, [fen, pv1, showEval]);
  const barCp = showEval
    ? whiteEvalCp(evalOk.evalCp, evalOk.mate, fen)
    : null;
  const barPct = evalBarWhitePct(barCp);
  const barLabel = showEval
    ? formatEvalLabel(evalOk.evalCp, evalOk.mate, fen)
    : "";
  const openingLabel = opening ? formatOpeningIdentity(opening) : t("Opening…");

  return (
    <div className="create-own" data-create-own data-board-theme="book">
      <div className="create-own-head">
        <h1 className="create-own-title">{t("Create your own")}</h1>
        <p className="create-own-sub">{t("Build a line, then train it.")}</p>
        <div className="create-own-side" role="group" aria-label={t("Create your own")}>
          <button
            type="button"
            data-create-own-side="w"
            aria-pressed={side === "w"}
            className={`create-own-side-btn${side === "w" ? " is-on" : ""}`}
            onClick={() => setSide("w")}
          >
            <span className="create-own-side-dot is-white" aria-hidden />
            {t("White")}
          </button>
          <button
            type="button"
            data-create-own-side="b"
            aria-pressed={side === "b"}
            className={`create-own-side-btn${side === "b" ? " is-on" : ""}`}
            onClick={() => setSide("b")}
          >
            <span className="create-own-side-dot is-black" aria-hidden />
            {t("Black")}
          </button>
        </div>
      </div>

      <p
        className="create-own-identity"
        data-create-own-identity={opening ? `${opening.name}|${opening.eco}` : "unknown"}
      >
        {openingLabel}
      </p>

      <div className="create-own-board-row">
        <div className="create-own-board">
          <ChessBoard
            game={game}
            flip={side === "b"}
            selected={selected}
            wrongUntil={null}
            expected={suggest}
            showHints={showEval}
            hintMoves={hintMoves}
            lastMove={lastMove}
            slide={null}
            onSquare={onSquare}
            onPlay={playMove}
            interactive
          />
        </div>
        {showEval ? (
          <div
            className="create-own-eval"
            data-create-own-eval-bar
            aria-label={t("Engine")}
          >
            <div className="create-own-eval-track" aria-hidden>
              <div
                className="create-own-eval-white"
                style={{ height: `${barPct}%` }}
              />
            </div>
            <span className="create-own-eval-score">{barLabel}</span>
          </div>
        ) : null}
      </div>

      <p
        className="create-own-engine"
        data-create-own-engine={
          showEval ? "ok" : suggesting ? "loading" : "hidden"
        }
        aria-live="polite"
      >
        {showEngine ? t("Engine · suggesting…") : "\u00a0"}
      </p>

      {showEval && pvs.length > 0 ? (
        <div className="create-own-multipv" data-create-own-pvs>
          <p className="create-own-multipv-kicker">{t("MultiPV · Top lines")}</p>
          <ul className="create-own-pvs">
            {pvs.map((pv) => {
              const score = formatEvalLabel(pv.scoreCp, pv.mate, fen);
              const line = formatPvLine(fen, pv.san);
              return (
                <li key={pv.multipv}>
                  <div
                    className={`create-own-pv${pv.multipv === 1 ? " is-pv1" : ""}`}
                    data-create-own-pv={pv.multipv}
                  >
                    <span className="create-own-pv-score">{score}</span>
                    <span className="create-own-pv-line">{line}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="create-own-line-kicker">{t("Your line · build move by move")}</p>
      <div className="create-own-chips" aria-label={t("Create your own")}>
        {chips.length === 0 ? (
          <span className="create-own-chips-empty">…</span>
        ) : (
          chips.map((chip, i) => (
            <span
              key={chip.key}
              data-create-own-chip={chip.ply}
              className={`create-own-chip${i === chips.length - 1 ? " is-on" : ""}`}
            >
              {chip.label}
            </span>
          ))
        )}
      </div>

      <div className="create-own-actions">
        <button
          type="button"
          data-create-own-remember
          disabled={plies.length === 0}
          onClick={lockLine}
          className="create-own-remember"
        >
          <Star className="size-4" strokeWidth={2.25} aria-hidden />
          {t("Remember this line")}
          <ChevronRight className="size-4" strokeWidth={2.25} aria-hidden />
        </button>

        <button
          type="button"
          data-create-own-clear
          onClick={clearLine}
          className="create-own-clear"
        >
          <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden />
          {t("Clear")}
        </button>
      </div>

      <p className="create-own-footer">
        {t("Curated packs stay in the store — this is your gym line.")}
      </p>

      {remembered ? (
        <RememberModal
          line={remembered}
          onPractice={() => onPractice(remembered)}
          onKeepEditing={() => setRemembered(null)}
        />
      ) : null}
    </div>
  );
}

export function CreateOwnEntry({
  remembered,
  onOpen,
  onPractice,
}: {
  remembered: GymLine | null;
  onOpen: () => void;
  onPractice?: (line: GymLine) => void;
}) {
  const t = useT();
  const san = remembered ? formatGymSan(remembered.plies) : "";
  return (
    <section className="create-own-entry" data-create-own-entry>
      <p className="create-own-entry-kicker">{t("Create your own")}</p>
      <h2 className="create-own-entry-title">
        {remembered ? t("Your gym line") : t("Build a line, then train it.")}
      </h2>
      {remembered ? (
        <p className="create-own-entry-san">{san}</p>
      ) : (
        <p className="create-own-entry-copy">
          {t("Curated packs stay in the store — this is your gym line.")}
        </p>
      )}
      <div className="create-own-entry-actions">
        {remembered && onPractice ? (
          <button
            type="button"
            data-create-own-entry-practice
            onClick={() => onPractice(remembered)}
            className="create-own-entry-primary"
          >
            {t("Practice this line")}
          </button>
        ) : null}
        <button
          type="button"
          data-create-own-entry-open
          onClick={onOpen}
          className={
            remembered ? "create-own-entry-secondary" : "create-own-entry-primary"
          }
        >
          {remembered ? t("Keep editing") : t("Create your own")}
        </button>
      </div>
    </section>
  );
}

function RememberModal({
  line,
  onPractice,
  onKeepEditing,
}: {
  line: GymLine;
  onPractice: () => void;
  onKeepEditing: () => void;
}) {
  const t = useT();
  const onKeepRef = useRef(onKeepEditing);
  onKeepRef.current = onKeepEditing;
  /**
   * Own history entry so Back/Escape close the modal first.
   * Do not use useOverlayHistory: its unmount history.back() races
   * Practice navigation and can blank the page (same as the old review sheet).
   */
  useEffect(() => {
    window.history.pushState({ olOverlay: "gym-remember" }, "");
    const onPop = () => onKeepRef.current();
    window.addEventListener("popstate", onPop);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (isRememberState(window.history.state)) {
        window.history.back();
        return;
      }
      onKeepRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const goPractice = () => {
    if (isRememberState(window.history.state)) {
      window.history.replaceState(null, "");
    }
    onPractice();
  };

  const san = formatGymSan(line.plies);
  const chips = gymSanChips(line.plies);
  const opening = lookupOpeningIdentityPrefix(line.plies);

  return (
    <div
      className="create-own-remember-overlay z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-own-remembered-title"
      data-create-own-remembered
      onClick={onKeepEditing}
    >
      <div
        className="create-own-remember-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="create-own-remembered-title" className="create-own-remember-title">
          {t("Remembered")}
        </h2>
        {opening ? (
          <p
            className="create-own-remember-identity"
            data-create-own-remembered-identity={`${opening.name}|${opening.eco}`}
          >
            {formatOpeningIdentity(opening)}
          </p>
        ) : null}
        <p
          className="create-own-remember-copy"
          data-create-own-remembered-body
          data-create-own-remembered-san={san}
        >
          {t("Remembered — {san} — locked as your gym line. Train it like a pack.", { san })}
        </p>
        <div className="create-own-remember-sans" data-create-own-locked-san={san}>
          {pairLines(chips).map((row) => (
            <div key={row}>{row}</div>
          ))}
        </div>
        <button
          type="button"
          data-create-own-practice
          onClick={goPractice}
          className="create-own-remember-go"
        >
          {t("Practice this line")}
        </button>
        <button
          type="button"
          data-create-own-keep-editing
          onClick={onKeepEditing}
          className="create-own-remember-edit"
        >
          {t("Keep editing")}
        </button>
        <p className="create-own-remember-tip">
          {t("Test unlocks after a clean Practice.")}
        </p>
      </div>
    </div>
  );
}

function isRememberState(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === "object" &&
      (state as { olOverlay?: string }).olOverlay === "gym-remember",
  );
}

function replay(plies: readonly string[]): Chess {
  const g = new Chess();
  for (const san of plies) {
    try {
      if (!g.move(san)) break;
    } catch {
      break;
    }
  }
  return g;
}

function pairLines(chips: { label: string; ply: number }[]): string[] {
  const rows: string[] = [];
  for (let i = 0; i < chips.length; i += 2) {
    const white = chips[i]!.label;
    const black = chips[i + 1]?.label;
    rows.push(black ? `${white} ${black}` : white);
  }
  return rows;
}
