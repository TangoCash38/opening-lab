import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { useT } from "@/lib/i18n";
import {
  DAILY_REPLAY_PLIES,
  dailyChoices,
  loadDailySession,
  saveDailyPick,
  type DailySession,
} from "@/lib/daily-guess";
import { ChessBoard } from "./chess-board";

type Props = { onBack: () => void };

const REPLAY_MS = 720;

function applyPlies(game: Chess, plies: readonly string[], cap: number) {
  let last: { from: Square; to: Square } | null = null;
  const n = Math.min(plies.length, cap);
  for (let i = 0; i < n; i++) {
    const mv = game.move(plies[i]!);
    if (!mv) break;
    last = { from: mv.from, to: mv.to };
  }
  return last;
}

export function DailyGuess({ onBack }: Props) {
  const t = useT();
  const session = useMemo(() => loadDailySession(), []);
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
  return <DailyGuessSession session={session} onBack={onBack} />;
}

function DailyGuessSession({
  session,
  onBack,
}: {
  session: DailySession;
  onBack: () => void;
}) {
  const t = useT();
  const alreadyDone = session.pickId != null;
  const gameRef = useRef(new Chess());
  const [, bumpBoard] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [ready, setReady] = useState(alreadyDone);
  const [pickId, setPickId] = useState<string | null>(session.pickId);
  const choices = useMemo(
    () => dailyChoices(session.pack, session.date),
    [session.pack, session.date],
  );
  const cap = Math.min(session.line.plies.length, DAILY_REPLAY_PLIES);

  useEffect(() => {
    const game = new Chess();
    gameRef.current = game;
    const plies = session.line.plies;

    if (alreadyDone) {
      const last = applyPlies(game, plies, cap);
      setLastMove(last);
      setReady(true);
      bumpBoard((n) => n + 1);
      return;
    }

    setLastMove(null);
    setReady(false);
    bumpBoard((n) => n + 1);
    let i = 0;
    const timer = window.setInterval(() => {
      if (i >= cap) {
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
      if (i >= cap) {
        window.clearInterval(timer);
        setReady(true);
      }
    }, REPLAY_MS);
    return () => window.clearInterval(timer);
  }, [alreadyDone, cap, session.line.id, session.line.plies]);

  const answered = pickId != null;
  const correct = pickId === session.pack.id;

  const choose = (packId: string) => {
    if (!ready || answered) return;
    setPickId(packId);
    saveDailyPick(session.date, session.line.id, packId);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        {t("← Back")}
      </button>

      <h1 className="mb-3 font-display text-[1.65rem] font-bold tracking-tight">
        {t("Guess the opening")}
      </h1>

      <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-border bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="pointer-events-none px-2 pb-3 pt-2">
          <ChessBoard
            key={session.line.id}
            game={gameRef.current}
            flip={session.line.side === "b"}
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
            {choices.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => choose(pack.id)}
                className="min-h-12 w-full rounded-2xl border border-border bg-bg-elevated px-4 py-3 text-left text-[0.92rem] font-semibold active:scale-[0.99]"
              >
                {pack.name}
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
            <p className="m-0 mt-1 text-[0.92rem] font-semibold text-fg">{session.pack.name}</p>
          ) : null}
          <p className="m-0 mt-1 text-[0.8rem] text-fg-muted">{t("Done for today")}</p>
        </div>
      ) : null}
    </div>
  );
}
