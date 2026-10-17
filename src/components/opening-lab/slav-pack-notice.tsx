import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Chess } from "chess.js";
import type { OpeningLine } from "@/data/packs";
import { useT } from "@/lib/i18n";
import type { StudyIntroCopy } from "@/lib/pack-study-intro";
import { ChessBoard } from "./chess-board";

/** Final position of a book-line prefix. The intro board shows this still. */
function positionAfter(plies: readonly string[]): Chess {
  const game = new Chess();
  for (const san of plies) game.move(san);
  return game;
}

type NoticeStep = "about" | "welcome";

export type LineWelcome = {
  n: number;
  pack: string;
  /** Real line title. Null for a generic "Line N" and for a locked line. */
  line: string | null;
  /** Two or three sentences about this line, already in the active language. */
  about: string;
};

type NoticeProps = {
  step: NoticeStep;
  copy: StudyIntroCopy;
  /** White at the bottom unless the pack trains Black. */
  flip: boolean;
  /** Line card only. The pack card keeps the opening intro. */
  lineWelcome?: LineWelcome;
  onNext: () => void;
  onStart: () => void;
};

function LineDrillWelcome({ welcome }: { welcome: LineWelcome }) {
  const t = useT();
  return (
    <>
      <h2 id="slav-intro-title" className="slav-notice-title" data-line-welcome>
        {t("Welcome to Line {n} of the {pack} Drills!", welcome)}
      </h2>
      {welcome.line ? (
        <p className="slav-notice-paragraph" data-line-title>
          {welcome.line}
        </p>
      ) : null}
      {welcome.about ? (
        <p className="slav-notice-paragraph" data-line-about>
          {welcome.about}
        </p>
      ) : null}
      <div data-line-how-to>
        <p className="slav-notice-paragraph">
          <strong>{t("Practice Mode:")}</strong>{" "}
          {t(
            "Play your moves directly on the board. Green hints show your next move, while wrong moves flash red and reveal the correct book move so you can try again.",
          )}
        </p>
        <p className="slav-notice-paragraph">
          <strong>{t("Test Mode:")}</strong>{" "}
          {t(
            "The training wheels come off—green hints are disabled. Only the book move is accepted, and a single mistake means you won't pass. Pass cleanly to turn the line green!",
          )}
        </p>
      </div>
    </>
  );
}

function SlavStemBoard({ plies, flip }: { plies: readonly string[]; flip: boolean }) {
  const game = useMemo(() => positionAfter(plies), [plies]);

  return (
    <div className="slav-intro-board" data-slav-stem-board>
      <ChessBoard
        game={game}
        flip={flip}
        selected={null}
        wrongUntil={null}
        expected={null}
        showHints={false}
        lastMove={null}
        slide={null}
        onSlideComplete={() => {}}
        onSquare={() => {}}
        interactive={false}
      />
      <p className="slav-intro-caption" data-slav-setup-caption>
        Typical setup
      </p>
    </div>
  );
}

export function SlavPackNotice({ step, copy, flip, lineWelcome, onNext, onStart }: NoticeProps) {
  const t = useT();
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
            lineWelcome ? (
              <LineDrillWelcome welcome={lineWelcome} />
            ) : (
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
            )
          ) : (
            <>
              <h2 id="slav-intro-title" className="slav-notice-title">
                {t("Tap to practice")}
              </h2>
              <p className="slav-notice-paragraph" data-slav-practice-blurb>
                {flip
                  ? "The game starts from the first move. White's move and your reply stay together on one slide until the next pair."
                  : "The game starts from the first move. Your move and the reply stay together on one slide until the next pair."}
              </p>
            </>
          )}
        </div>
        {step === "about" ? (
          <button type="button" className="slav-notice-primary" data-slav-next onClick={onNext}>
            {t("Continue")}
          </button>
        ) : (
          <button type="button" className="slav-notice-primary" data-slav-start onClick={onStart}>
            {t("Tap to practice")}
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
