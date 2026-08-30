import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { playableLines, visiblePacks } from "@/lib/catalog";
import { ChessBoard } from "./chess-board";
import { LineRow } from "./pack-lines";

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
  const playable = pack ? playableLines(pack) : [];

  const game = useMemo(() => {
    const g = new Chess();
    g.move("e4");
    return g;
  }, []);
  const expected = useMemo(() => {
    const g = new Chess();
    g.move("e4");
    return g.moves({ verbose: true }).find((m) => m.san === "c6") ?? null;
  }, []);

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
          <p className="mt-2 text-[0.82rem] leading-relaxed text-fg-muted">
            The Caro-Kann is Black's answer to 1.e4. You take a pawn centre, get
            the light bishop out, and keep a solid structure.
          </p>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-fg-muted">
            This pack drills the main book moves against White's usual tries.
            Learn those, then Play on from the setup and see where the game
            goes.
          </p>
        </div>

        <div className="home-board px-2">
          <ChessBoard
            game={game}
            flip={true}
            selected={null}
            wrongUntil={null}
            expected={expected}
            showHints
            lastMove={null}
            slide={null}
            onSquare={() => setLinesOpen(true)}
            interactive
          />
        </div>

        <div className="space-y-2.5 px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => setLinesOpen((v) => !v)}
            aria-expanded={linesOpen}
            className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
          >
            See 3 lines
          </button>
        </div>

        {pack && linesOpen ? (
          <div className="border-t border-border">
            {playable.map((item, i) => {
              const complete = isComplete(item.id);
              const mastery = masteryOf(item.id);
              return (
                <div key={item.id} className="px-3">
                  <LineRow
                    index={i}
                    line={item}
                    complete={complete}
                    mastery={mastery}
                    locked={false}
                    showFree
                    onClick={() => onStartLine(pack, item, "learn")}
                  />
                </div>
              );
            })}
            <div className="pb-2.5" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
