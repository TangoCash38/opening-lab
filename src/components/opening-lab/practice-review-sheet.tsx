import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import { useT } from "@/lib/i18n";
import {
  arrowsFromPvs,
  evalBarWhitePct,
  fetchPracticeReviewEval,
  formatEvalLabel,
  formatPvLine,
  whiteEvalCp,
  type PracticeReviewOk,
} from "@/lib/practice-review-eval";
import { ChessBoard } from "./chess-board";

type Props = {
  fen: string;
  whyText: string;
  flip: boolean;
  onBackToPractice: () => void;
  onClose: () => void;
};

const REVIEW_STATE = "practice-review";

function isReviewState(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === "object" &&
      (state as { olOverlay?: string }).olOverlay === REVIEW_STATE,
  );
}

/** Survives React Strict Mode remount so we only push one history entry. */
let reviewHistoryHeld = false;

export function PracticeReviewSheet({
  fen,
  whyText,
  flip,
  onBackToPractice,
  onClose,
}: Props) {
  const t = useT();
  const [evalOk, setEvalOk] = useState<PracticeReviewOk | null>(null);
  const [ready, setReady] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onBackRef = useRef(onBackToPractice);
  onBackRef.current = onBackToPractice;

  const dismiss = () => {
    if (typeof window !== "undefined" && isReviewState(window.history.state)) {
      window.history.back();
      return;
    }
    reviewHistoryHeld = false;
    onCloseRef.current();
  };

  const backToPractice = () => {
    if (typeof window !== "undefined" && isReviewState(window.history.state)) {
      reviewHistoryHeld = false;
      window.history.replaceState(null, "");
    }
    onBackRef.current();
  };

  /**
   * Own history entry so Android Back / Escape close this sheet first.
   * Do not use useOverlayHistory here: its cleanup history.back() races
   * React Strict Mode and can pop the Practice result sheet (or the page).
   */
  useEffect(() => {
    if (!reviewHistoryHeld) {
      window.history.pushState({ olOverlay: REVIEW_STATE }, "");
      reviewHistoryHeld = true;
    }
    const onPop = () => {
      reviewHistoryHeld = false;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setEvalOk(null);
    void fetchPracticeReviewEval(fen).then((result) => {
      if (cancelled) return;
      setEvalOk(result.ok ? result : null);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [fen]);

  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);

  const showEval = ready && evalOk != null;
  const arrows = showEval ? arrowsFromPvs(fen, evalOk.pvs) : [];
  const barCp = showEval
    ? whiteEvalCp(evalOk.evalCp, evalOk.mate, fen)
    : null;
  const barPct = evalBarWhitePct(barCp);
  const barLabel = showEval
    ? formatEvalLabel(evalOk.evalCp, evalOk.mate, fen)
    : "";
  const pvs = showEval
    ? [...evalOk.pvs].sort((a, b) => a.multipv - b.multipv)
    : [];

  return (
    <div
      className="practice-review-overlay z-[90]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="practice-review-title"
      data-practice-review-sheet
      data-practice-review-eval={showEval ? "ok" : ready ? "hidden" : "loading"}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="practice-review-sheet" data-board-theme="book">
        <header className="practice-review-header">
          <p className="practice-review-kicker">{t("Practice · review")}</p>
          <h2 id="practice-review-title" className="practice-review-title">
            {t("Why this move?")}
          </h2>
          {whyText ? (
            <p className="practice-review-why" data-practice-review-why>
              {whyText}
            </p>
          ) : null}
        </header>

        <div className="practice-review-board-row">
          <div className="practice-review-board">
            <ChessBoard
              game={game}
              flip={flip}
              selected={null}
              wrongUntil={null}
              expected={null}
              showHints={false}
              lastMove={null}
              slide={null}
              onSquare={() => {}}
              interactive={false}
              arrows={arrows}
            />
          </div>
          {showEval ? (
            <div
              className="practice-review-eval"
              data-practice-review-eval-bar
              aria-label={t("Engine")}
            >
              <div className="practice-review-eval-track" aria-hidden>
                <div
                  className="practice-review-eval-white"
                  style={{ height: `${barPct}%` }}
                />
              </div>
              <span className="practice-review-eval-score">{barLabel}</span>
            </div>
          ) : null}
        </div>

        {showEval && pvs.length > 0 ? (
          <ul className="practice-review-pvs" data-practice-review-pvs>
            {pvs.map((pv) => {
              const score = formatEvalLabel(pv.scoreCp, pv.mate, fen);
              const line = formatPvLine(fen, pv.san);
              return (
                <li key={pv.multipv}>
                  <div
                    className={`practice-review-pv${
                      pv.multipv === 1 ? " is-pv1" : ""
                    }`}
                    data-practice-review-pv={pv.multipv}
                  >
                    <span className="practice-review-pv-score">{score}</span>
                    <span className="practice-review-pv-line">{line}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="practice-review-actions">
          <button
            type="button"
            data-practice-review-back
            onClick={backToPractice}
            className="practice-review-back"
          >
            {t("Back to Practice")}
          </button>
          <button
            type="button"
            data-practice-review-close
            onClick={dismiss}
            className="practice-review-close"
          >
            {t("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
