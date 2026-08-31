import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { isLineUnlocked, visiblePacks } from "@/lib/catalog";
import { shouldSkipPackIntro } from "@/lib/pack-intro";
import { ChessBoard } from "./chess-board";
import { LineRow } from "./pack-lines";
import { PackAboutModal } from "./pack-about-modal";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
  onHowToPlay: () => void;
  onSubscribe: () => void;
  playApp?: boolean;
};

export function HomeHero({ onStartLine, onHowToPlay }: Props) {
  const { masteryOf, isComplete } = useProgress();
  const catalog = visiblePacks(PACKS);
  const pack = catalog.find((p) => p.id === "caro-kann-black");
  const [linesOpen, setLinesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const game = useMemo(() => new Chess(), []);

  const startAdvance = () => {
    const line = pack?.lines.find((l) => l.id === "ckb1");
    if (pack && line) onStartLine(pack, line, "learn");
  };

  const openIntroThenPractice = () => {
    if (shouldSkipPackIntro()) startAdvance();
    else if (pack?.about) setAboutOpen(true);
    else startAdvance();
  };

  return (
    <section className="mb-5">
      <h1 className="mb-1.5 font-display text-[1.65rem] font-bold tracking-tight">
        Train openings the strict way
      </h1>
      <button
        type="button"
        onClick={onHowToPlay}
        className="mb-4 inline-flex min-h-11 items-center rounded-full border border-border bg-bg-elevated px-4 py-2 text-[0.88rem] font-semibold active:opacity-70"
      >
        How to play
      </button>

      <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/30 bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="px-4 pb-2 pt-3.5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            Free sample
          </p>
          <h2 className="mt-1 font-display text-[1.25rem] font-bold tracking-tight">
            Caro-Kann for Black
          </h2>
          <p className="mt-0.5 text-[0.82rem] text-fg-muted">
            {pack?.blurb ?? "Advance, Classical, Exchange"}
          </p>
        </div>

        <div className="home-board px-2">
          <ChessBoard
            game={game}
            flip={true}
            selected={null}
            wrongUntil={null}
            expected={null}
            showHints={false}
            lastMove={null}
            slide={null}
            onSquare={() => openIntroThenPractice()}
            interactive
          />
        </div>

        <div className="space-y-2.5 px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={openIntroThenPractice}
            className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
          >
            Tap to practice
          </button>
          <button
            type="button"
            onClick={() => {
              setLinesOpen((v) => {
                const next = !v;
                if (next && pack?.about && !shouldSkipPackIntro()) setAboutOpen(true);
                return next;
              });
            }}
            aria-expanded={linesOpen}
            className="min-h-12 w-full rounded-2xl border-[1.5px] border-border bg-bg-subtle px-4 py-3 text-[0.95rem] font-bold text-fg active:scale-[0.99]"
          >
            See 18 lines
          </button>
        </div>

        {pack && linesOpen ? (
          <div className="border-t border-border">
            {pack.lines.map((item, i) => {
              const unlocked = isLineUnlocked(pack, item.id);
              const complete = unlocked && isComplete(item.id);
              const mastery = masteryOf(item.id);
              return (
                <div key={item.id} className="px-3">
                  <LineRow
                    index={i}
                    line={item}
                    complete={complete}
                    mastery={mastery}
                    locked={!unlocked}
                    showFree={unlocked}
                    onClick={() => {
                      if (unlocked) onStartLine(pack, item, "learn");
                    }}
                  />
                </div>
              );
            })}
            <div className="pb-2.5" />
          </div>
        ) : null}
      </div>

      {pack?.about && aboutOpen ? (
        <PackAboutModal
          title={pack.name}
          about={pack.about}
          packId={pack.id}
          startLabel="Start"
          onClose={() => setAboutOpen(false)}
          onStart={() => {
            setAboutOpen(false);
            startAdvance();
          }}
        />
      ) : null}
    </section>
  );
}
