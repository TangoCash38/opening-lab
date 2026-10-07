import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chess, type Square } from "chess.js";
import type { OpeningLine } from "@/data/packs";
import type { StudyIntroCopy } from "@/lib/pack-study-intro";
import { soundMove } from "@/lib/sounds";
import { ChessBoard, SLIDE_MS, type SlideAnim } from "./chess-board";

/** Time from one intro move to the next, including the slide. */
const MOVE_MS = 700;
/** Brief look at the array, then the setup starts. The final position is held. */
const FIRST_MOVE_MS = 240;

type NoticeStep = "about" | "welcome";

type NoticeProps = {
  step: NoticeStep;
  copy: StudyIntroCopy;
  /** White at the bottom unless the pack trains Black. */
  flip: boolean;
  onNext: () => void;
  onStart: () => void;
};

function SlavStemBoard({ plies, flip }: { plies: readonly string[]; flip: boolean }) {
  const [game, setGame] = useState(() => new Chess());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const gameRef = useRef(game);
  const plyRef = useRef(0);
  const aliveRef = useRef(true);
  const timerRef = useRef(0);

  const playNext = useCallback(() => {
    if (!aliveRef.current || plyRef.current >= plies.length) return;
    const san = plies[plyRef.current];
    const current = gameRef.current;
    const probe = new Chess(current.fen());
    const move = probe.move(san);
    if (!move) return;
    const placed = current.get(move.from);
    const piece = placed ? (placed.color === "w" ? placed.type.toUpperCase() : placed.type) : "P";
    const next = new Chess(current.fen());
    next.move(san);
    gameRef.current = next;
    plyRef.current += 1;
    setGame(next);
    setLastMove({ from: move.from, to: move.to });
    setSlide({ from: move.from, to: move.to, piece });
    soundMove();
  }, [plies]);

  useEffect(() => {
    aliveRef.current = true;
    plyRef.current = 0;
    const start = new Chess();
    gameRef.current = start;
    setGame(start);
    setLastMove(null);
    setSlide(null);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const done = new Chess();
      let last: { from: Square; to: Square } | null = null;
      for (const san of plies) {
        const move = done.move(san);
        if (move) last = { from: move.from, to: move.to };
      }
      gameRef.current = done;
      plyRef.current = plies.length;
      setGame(done);
      setLastMove(last);
      return () => {
        aliveRef.current = false;
      };
    }
    timerRef.current = window.setTimeout(playNext, FIRST_MOVE_MS);
    return () => {
      aliveRef.current = false;
      window.clearTimeout(timerRef.current);
    };
  }, [playNext, plies]);

  return (
    <div className="slav-intro-board" data-slav-stem-board>
      <ChessBoard
        game={game}
        flip={flip}
        selected={null}
        wrongUntil={null}
        expected={null}
        showHints={false}
        lastMove={lastMove}
        slide={slide}
        onSlideComplete={() => {
          if (!aliveRef.current) return;
          setSlide(null);
          if (plyRef.current >= plies.length) return;
          timerRef.current = window.setTimeout(playNext, Math.max(0, MOVE_MS - SLIDE_MS));
        }}
        onSquare={() => {}}
        interactive={false}
      />
      <p className="slav-intro-caption" data-slav-setup-caption>
        Typical setup
      </p>
    </div>
  );
}

export function SlavPackNotice({ step, copy, flip, onNext, onStart }: NoticeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute("data-slav-opening", "true");
    return () => document.documentElement.removeAttribute("data-slav-opening");
  }, []);

  if (!mounted) return null;

  const notice = (
    <div
      className="slav-notice"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slav-intro-title"
      data-slav-notice={step}
    >
      <SlavStemBoard plies={copy.setup} flip={flip} />
      <div className="slav-notice-card" data-slav-card>
        <div className="slav-notice-card-body">
          {step === "about" ? (
            <>
              <p className="slav-notice-kicker">{copy.aboutTitle}</p>
              <h2 id="slav-intro-title" className="slav-notice-title">
                {copy.header}
              </h2>
              <p className="slav-notice-subtitle">{copy.subtitle}</p>
              <p className="slav-notice-start">{copy.start}</p>
              <p className="slav-notice-tagline">{copy.tagline}</p>
              <div data-slav-intro-body>
                <p className="slav-notice-paragraph">{copy.lead}</p>
                <p className="slav-notice-paragraph">{copy.rest}</p>
              </div>
            </>
          ) : (
            <>
              <h2 id="slav-intro-title" className="slav-notice-title">
                {copy.welcomeTitle}
              </h2>
              <ol className="slav-notice-steps" data-slav-howto>
                {copy.howTo.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            </>
          )}
        </div>
        {step === "about" ? (
          <button type="button" className="slav-notice-primary" data-slav-next onClick={onNext}>
            Next
          </button>
        ) : (
          <button type="button" className="slav-notice-primary" data-slav-start onClick={onStart}>
            Start
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(notice, document.body);
}

/**
 * Parked. Line notes stay in each Slav line's `drill` fields so they can
 * come back later. Nothing mounts this panel.
 */
export function SlavLineNotes({ line }: { line: OpeningLine }) {
  const notes = line.drill;
  const [open, setOpen] = useState(true);
  const [answerOpen, setAnswerOpen] = useState(false);
  if (!notes) return null;

  return (
    <section className="slav-line-notes" data-slav-line-notes data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="slav-line-notes-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>Line notes</span>
        <span className="slav-line-notes-chevron" aria-hidden>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? (
        <div className="slav-line-notes-body">
          <h3 className="slav-line-notes-label">What the moves teach</h3>
          <p>{notes.teach}</p>
          {line.next ? (
            <>
              <h3 className="slav-line-notes-label">Next plan</h3>
              <p>{line.next}</p>
            </>
          ) : null}
          <h3 className="slav-line-notes-label">Watch out</h3>
          <p>{notes.watch}</p>
          <h3 className="slav-line-notes-label">Checkpoint</h3>
          <p data-slav-checkpoint>{notes.checkpoint}</p>
          <button
            type="button"
            className="slav-line-notes-answer-toggle"
            aria-expanded={answerOpen}
            data-slav-answer-toggle
            onClick={() => setAnswerOpen((value) => !value)}
          >
            {answerOpen ? "Hide suggested answer" : "Show suggested answer"}
          </button>
          {answerOpen ? (
            <p className="slav-line-notes-answer" data-slav-answer>
              <span className="slav-line-notes-label">Suggested answer</span>
              {notes.answer}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
