import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Chess, type Square } from "chess.js";
import type { OpeningLine } from "@/data/packs";
import {
  SLAV_ABOUT_TITLE,
  SLAV_HOW_TO,
  SLAV_INTRO_HEADER,
  SLAV_INTRO_LEAD,
  SLAV_INTRO_REST,
  SLAV_INTRO_START,
  SLAV_INTRO_SUBTITLE,
  SLAV_INTRO_TAGLINE,
  SLAV_STEM,
  SLAV_WELCOME_TITLE,
} from "@/lib/slav-preview";
import { soundMove } from "@/lib/sounds";
import { ChessBoard, type SlideAnim } from "./chess-board";

type NoticeStep = "about" | "welcome";

type NoticeProps = {
  step: NoticeStep;
  onNext: () => void;
  onStart: () => void;
};

function SlavStemBoard() {
  const [game, setGame] = useState(() => new Chess());
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [slide, setSlide] = useState<SlideAnim | null>(null);
  const gameRef = useRef(game);
  const plyRef = useRef(0);
  const aliveRef = useRef(true);
  const timerRef = useRef(0);

  const playNext = useCallback(() => {
    if (!aliveRef.current || plyRef.current >= SLAV_STEM.length) return;
    const san = SLAV_STEM[plyRef.current];
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
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const done = new Chess();
      let last: { from: Square; to: Square } | null = null;
      for (const san of SLAV_STEM) {
        const move = done.move(san);
        if (move) last = { from: move.from, to: move.to };
      }
      gameRef.current = done;
      plyRef.current = SLAV_STEM.length;
      setGame(done);
      setLastMove(last);
      return () => {
        aliveRef.current = false;
      };
    }
    timerRef.current = window.setTimeout(playNext, 420);
    return () => {
      aliveRef.current = false;
      window.clearTimeout(timerRef.current);
    };
  }, [playNext]);

  return (
    <div className="slav-intro-board" data-slav-stem-board>
      <ChessBoard
        game={game}
        flip
        selected={null}
        wrongUntil={null}
        expected={null}
        showHints={false}
        lastMove={lastMove}
        slide={slide}
        onSlideComplete={() => {
          if (!aliveRef.current) return;
          setSlide(null);
          timerRef.current = window.setTimeout(playNext, 420);
        }}
        onSquare={() => {}}
        interactive={false}
      />
    </div>
  );
}

export function SlavPackNotice({ step, onNext, onStart }: NoticeProps) {
  const [expanded, setExpanded] = useState(false);
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
      <SlavStemBoard />
      <div className="slav-notice-card" data-slav-card>
        <div className="slav-notice-card-body">
          {step === "about" ? (
            <>
              <p className="slav-notice-kicker">{SLAV_ABOUT_TITLE}</p>
              <h2 id="slav-intro-title" className="slav-notice-title">
                {SLAV_INTRO_HEADER}
              </h2>
              <p className="slav-notice-subtitle">{SLAV_INTRO_SUBTITLE}</p>
              <p className="slav-notice-start">{SLAV_INTRO_START}</p>
              <p className="slav-notice-tagline">{SLAV_INTRO_TAGLINE}</p>
              <div data-slav-intro-body data-expanded={expanded ? "true" : "false"}>
                <p className="slav-notice-paragraph">{SLAV_INTRO_LEAD}</p>
                {expanded ? <p className="slav-notice-paragraph">{SLAV_INTRO_REST}</p> : null}
                <button
                  type="button"
                  className="slav-notice-expand"
                  aria-expanded={expanded}
                  data-slav-intro-expand
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? "Show less" : "Read the rest"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="slav-intro-title" className="slav-notice-title">
                {SLAV_WELCOME_TITLE}
              </h2>
              <ol className="slav-notice-steps" data-slav-howto>
                {SLAV_HOW_TO.map((line) => (
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
