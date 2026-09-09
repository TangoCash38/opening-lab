import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useT } from "@/lib/i18n";
import {
  dailyChoices,
  loadDailySession,
  saveDailyPick,
  saveGuessIndex,
  type DailySession,
} from "@/lib/daily-guess";
import { ChessBoard } from "./chess-board";

type Props = { onBack: () => void };

const REPLAY_MS = 720;

function applyPlies(game: Chess, plies: readonly string[]) {
  let last: { from: Square; to: Square } | null = null;
  for (const ply of plies) {
    const mv = game.move(ply);
    if (!mv) break;
    last = { from: mv.from, to: mv.to };
  }
  return last;
}

export function DailyGuess({ onBack }: Props) {
  const t = useT();
  const [session, setSession] = useState<DailySession | null>(() => loadDailySession());
  if (!session) {
    return (
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
        >
          {t("← Back")}
        </button>
      </div>
    );
  }
  if (session.done || !session.pack || !session.line) {
    return <GuessDone session={session} onBack={onBack} />;
  }
  return (
    <GuessRound
      key={`${session.index}:${session.line.id}`}
      session={session}
      onBack={onBack}
      onNext={() => {
        const nextIndex = session.index + 1;
        saveGuessIndex(session.date, nextIndex);
        setSession(loadDailySession());
      }}
    />
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
    >
      {t("← Back")}
    </button>
  );
}

function GuessDone({ session, onBack }: { session: DailySession; onBack: () => void }) {
  const t = useT();
  return (
    <div>
      <BackButton onBack={onBack} />
      <h1 className="mb-3 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Guess the opening")}
      </h1>
      <p className="mb-3 text-[0.8rem] font-semibold text-fg-muted">
        {t("{n} of {total}", { n: session.total, total: session.total })}
      </p>
      <div className="rounded-2xl bg-success-soft px-4 py-3.5" role="status">
        <p className="m-0 text-[0.95rem] font-bold text-success">{t("Done")}</p>
      </div>
    </div>
  );
}

function GuessRound({
  session,
  onBack,
  onNext,
}: {
  session: DailySession;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();
  const pack = session.pack!;
  const line = session.line!;
  const alreadyDone = session.pickId != null;
  const gameRef = useRef(new Chess());
  const [, bumpBoard] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ready, setReady] = useState(alreadyDone);
  const [pickId, setPickId] = useState<string | null>(session.pickId);
  const choices = useMemo(
    () => dailyChoices(pack, `${session.date}:${session.index}`),
    [pack, session.date, session.index],
  );
  const last = session.index + 1 >= session.total;

  useEffect(() => {
    const game = new Chess();
    gameRef.current = game;
    const plies = line.plies;

    if (alreadyDone) {
      const lastMv = applyPlies(game, plies);
      setLastMove(lastMv);
      setReady(true);
      bumpBoard((n) => n + 1);
      return;
    }

    setLastMove(null);
    setReady(false);
    bumpBoard((n) => n + 1);
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= plies.length) {
        window.clearInterval(timer);
        setReady(true);
        return;
      }
      const mv = game.move(plies[i]!);
      i += 1;
      if (!mv) {
        window.clearInterval(timer);
        setReady(true);
        bumpBoard((n) => n + 1);
        return;
      }
      setLastMove({ from: mv.from, to: mv.to });
      bumpBoard((n) => n + 1);
      if (i >= plies.length) {
        window.clearInterval(timer);
        setReady(true);
      }
    }, REPLAY_MS);
    return () => window.clearInterval(timer);
  }, [alreadyDone, line.id, line.plies]);

  const answered = pickId != null;
  const correct = pickId === pack.id;

  const choose = (packId: string) => {
    if (!ready || answered) return;
    setPickId(packId);
    saveDailyPick(session.date, session.index, packId);
  };

  return (
    <div>
      <BackButton onBack={onBack} />

      <h1 className="mb-1 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Guess the opening")}
      </h1>
      <p className="mb-3 text-[0.8rem] font-semibold text-fg-muted">
        {t("{n} of {total}", { n: session.index + 1, total: session.total })}
      </p>

      <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-border bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="pointer-events-none px-2 pb-3 pt-2">
          <ChessBoard
            key={line.id}
            game={gameRef.current}
            flip={line.side === "b"}
            selected={null}
            wrongUntil={null}
            expected={null}
            showHints={false}
            lastMove={lastMove}
            slide={null}
            onSquare={() => {}}
            interactive={false}
          />
        </div>
      </div>

      {ready && !answered ? (
        <div className="mt-4">
          <p className="mb-2.5 text-[0.95rem] font-semibold">{t("Which opening was that?")}</p>
          <div className="flex flex-col gap-2">
            {choices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => choose(choice.id)}
                className="min-h-12 w-full rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-left text-[0.92rem] font-semibold active:scale-[0.99]"
              >
                {choice.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {answered ? (
        <div
          className={`mt-4 rounded-2xl px-4 py-3.5 ${
            correct ? "bg-success-soft" : "bg-danger-soft"
          }`}
          role="status"
        >
          <p className={`m-0 text-[0.95rem] font-bold ${correct ? "text-success" : "text-danger"}`}>
            {correct ? t("Correct") : t("Not quite")}
          </p>
          {!correct ? (
            <p className="m-0 mt-1 text-[0.92rem] font-semibold text-fg">{pack.name}</p>
          ) : null}
          {last ? (
            <p className="m-0 mt-1 text-[0.8rem] text-fg-muted">{t("Done")}</p>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="mt-3 min-h-11 rounded-full bg-accent px-4 py-2 text-[0.92rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              {t("Next")}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
