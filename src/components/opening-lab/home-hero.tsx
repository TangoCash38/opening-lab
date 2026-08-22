import { useMemo, useState } from "react";
import { Chess } from "chess.js";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { visiblePacks } from "@/lib/catalog";
import { ChessBoard } from "./chess-board";
import { LineRow, PackExpandHint } from "./pack-lines";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
  onSubscribe: () => void;
  playApp?: boolean;
};

export function HomeHero({ onStartLine }: Props) {
  const { masteryOf, isComplete } = useProgress();
  const catalog = visiblePacks(PACKS);
  const scotch = catalog.find((p) => p.id === "scotch");
  const line = scotch?.lines[0];
  const [linesOpen, setLinesOpen] = useState(false);

  const game = useMemo(() => new Chess(), []);
  const expected = useMemo(() => {
    const g = new Chess();
    return g.moves({ verbose: true }).find((m) => m.san === "e4") ?? null;
  }, []);

  const startFirst = () => {
    if (scotch && line) onStartLine(scotch, line, "learn");
  };

  return (
    <section className="mb-5">
      <h1 className="mb-1.5 font-display text-[1.65rem] font-bold tracking-tight">
        Train openings the strict way
      </h1>
      <p className="mb-4 text-[0.95rem] text-fg-muted">
        Scotch Gambit, Italian Game, Ruy Lopez, King’s Gambit, Vienna Game, Scotch Game, Open Sicilian, and French Defence are free. Follow the yellow
        hint. Wrong moves are rejected.
      </p>

      <div className="overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/30 bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="px-4 pb-2 pt-3.5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            Free pack · ready to train
          </p>
          <h2 className="mt-1 font-display text-[1.25rem] font-bold tracking-tight">
            Scotch Gambit
          </h2>
          <p className="mt-0.5 text-[0.82rem] text-fg-muted">
            5 book lines + 2 traps
          </p>
        </div>

        <div className="home-board px-2">
          <ChessBoard
            game={game}
            flip={false}
            selected={null}
            wrongUntil={null}
            expected={expected}
            showHints
            lastMove={null}
            slide={null}
            onSquare={startFirst}
            interactive
          />
        </div>

        <div className="space-y-2.5 px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={startFirst}
            className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
          >
            Start free Scotch Line 1
          </button>
        </div>

        {scotch ? (
          <div className="border-t border-border">
            <button
              type="button"
              className="w-full px-3 py-3 text-left"
              onClick={() => setLinesOpen((v) => !v)}
              aria-expanded={linesOpen}
            >
              <span className="block px-1 text-[0.88rem] font-bold">
                Scotch lines · {scotch.lines.length}
              </span>
              <PackExpandHint open={linesOpen} free />
            </button>
            {linesOpen
              ? scotch.lines.map((item, i) => {
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
                        onClick={() => onStartLine(scotch, item, "learn")}
                      />
                    </div>
                  );
                })
              : null}
            {linesOpen ? <div className="pb-2.5" /> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
