import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Chess } from "chess.js";
import { type OpeningLine, type Pack } from "@/data/packs";
import { packPrice } from "@/data/pricing";
import { useProgress } from "@/hooks/use-progress";
import { FREE_SAMPLE_LINE_IDS, isLineUnlocked } from "@/lib/catalog";
import { packShortLabel } from "@/lib/featured-pack";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useT } from "@/lib/i18n";
import type { TrainStartOptions } from "@/lib/london-warmup";
import { ChessBoard } from "./chess-board";
import { BoardThemePicker } from "./board-theme-picker";
import { LondonWarmupChip } from "./london-warmup-chip";
import { LineRow } from "./pack-lines";
import { PackAboutModal } from "./pack-about-modal";

type TrainMode = "learn" | "practice";

type Props = {
  pack: Pack;
  onStartLine: (
    pack: Pack,
    line: OpeningLine,
    mode?: TrainMode,
    options?: TrainStartOptions,
  ) => void;
  onRequestUnlock?: (pack: Pack) => void;
  playApp?: boolean;
  /** Expanded pack card: lines start open so the structure is visible. */
  linesInitiallyOpen?: boolean;
  embedded?: boolean;
};

export function HomeHero({
  pack,
  onStartLine,
  onRequestUnlock,
  playApp,
  linesInitiallyOpen = false,
  embedded = false,
}: Props) {
  const t = useT();
  const { masteryOf, isComplete, testPercentOf } = useProgress();
  const { state, subscribed } = useUnlocks();
  const purchased = state.packs;
  const shownLines = pack.lines;
  const [linesOpen, setLinesOpen] = useState(linesInitiallyOpen);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pendingLine, setPendingLine] = useState<OpeningLine | null>(null);

  const websiteSplit = !playApp;
  const hasFreeSample = (FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0) > 0;
  const price = packPrice(pack);
  const shortPack = packShortLabel(pack);
  // Keep default Caro-Kann for Black / Advance, Classical, Exchange strings for tests.
  const title = pack.name || "Caro-Kann for Black";
  const blurb = pack.blurb || "Advance, Classical, Exchange";

  useEffect(() => {
    if (!websiteSplit || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 960px)");
    const sync = () => {
      if (mq.matches) setLinesOpen(true);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [websiteSplit]);

  useEffect(() => {
    setLinesOpen(linesInitiallyOpen);
    setAboutOpen(false);
    setPendingLine(null);
  }, [pack.id, linesInitiallyOpen]);

  const game = useMemo(() => new Chess(), []);

  const pickPracticeLine = (): OpeningLine | undefined => {
    if (pack.id === "caro-kann-black") {
      return pack.lines.find((l) => l.id === "ckb1");
    }
    const samples = FREE_SAMPLE_LINE_IDS[pack.id];
    if (samples?.length) {
      const sample = pack.lines.find((l) => l.id === samples[0]);
      if (sample) return sample;
    }
    const unlocked = pack.lines.find(
      (l) => subscribed || isLineUnlocked(pack, l.id, purchased),
    );
    return unlocked;
  };

  const startAdvance = () => {
    const line = pickPracticeLine();
    if (line) onStartLine(pack, line, "learn");
    else onRequestUnlock?.(pack);
  };

  const openIntroThenPractice = () => {
    if (pack?.about) setAboutOpen(true);
    else startAdvance();
  };

  return (
    <section
      className={`home-hero${embedded ? " home-hero-embedded" : " mb-5"}${
        websiteSplit ? " home-hero-split" : ""
      }`}
    >
      <div className="home-sample-card overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/30 bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="home-hero-split-inner">
          <div className="home-hero-board-col">
            <div className="home-sample-meta px-4 pb-2 pt-3.5">
              {hasFreeSample ? (
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                  {t("Free sample")}
                </p>
              ) : price ? (
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                  {price}
                </p>
              ) : null}
              <h2 className="mt-1 font-display text-[1.25rem] font-bold tracking-tight">
                {title}
              </h2>
              <p className="mt-0.5 text-[0.82rem] text-fg-muted">{blurb}</p>
              <LondonWarmupChip pack={pack} onStartLine={onStartLine} />
            </div>

            <div className="home-board pointer-events-none px-2">
              <ChessBoard
                game={game}
                flip={pack.side === "Black"}
                selected={null}
                wrongUntil={null}
                expected={null}
                showHints={false}
                lastMove={null}
                slide={null}
                onSquare={() => {}}
                interactive={false}
              />
              <div className="pointer-events-auto px-1 pb-0.5 pt-1.5">
                <BoardThemePicker compact className="w-full" />
              </div>
            </div>

            <div className="space-y-2.5 px-4 pb-3 pt-1">
              <button
                type="button"
                onClick={openIntroThenPractice}
                className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
              >
                {t("Tap to practice")}
              </button>
            </div>
          </div>

          <div className="home-hero-copy-col">
            <div className="space-y-2.5 px-4 pb-3 pt-3.5">
              <button
                type="button"
                onClick={() => setLinesOpen((v) => !v)}
                aria-expanded={linesOpen}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-[0.95rem] font-bold active:scale-[0.99] ${
                  linesOpen
                    ? "border-border bg-bg-subtle text-fg-muted"
                    : "border-accent bg-accent/14 text-accent"
                }`}
              >
                <ChevronDown
                  className={`size-5 shrink-0 transition-transform duration-150 ${
                    linesOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={2.75}
                  aria-hidden
                />
                {linesOpen
                  ? t("Tap to hide")
                  : t("See {n} {pack} lines", {
                      n: shownLines.length,
                      pack: shortPack,
                    })}
              </button>
            </div>

            {linesOpen ? (
              <div className="home-lines-panel border-t border-border">
                {shownLines.map((item, i) => {
                  const unlocked = subscribed || isLineUnlocked(pack, item.id, purchased);
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
                        showFree={!!FREE_SAMPLE_LINE_IDS[pack.id]?.includes(item.id)}
                        testPercent={unlocked ? testPercentOf(item.id, item.plies.length) : null}
                        onClick={() => {
                          if (unlocked) {
                            if (pack.about) {
                              setPendingLine(item);
                              setAboutOpen(true);
                            } else onStartLine(pack, item, "learn");
                          } else onRequestUnlock?.(pack);
                        }}
                      />
                    </div>
                  );
                })}
                <div className="pb-2.5" />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {pack.about && aboutOpen ? (
        <PackAboutModal
          title={pack.name}
          about={pack.about}
          packId={pack.id}
          startLabel={t("Start")}
          onClose={() => {
            setAboutOpen(false);
            setPendingLine(null);
          }}
          onStart={() => {
            setAboutOpen(false);
            const line = pendingLine;
            setPendingLine(null);
            if (line) onStartLine(pack, line, "learn");
            else startAdvance();
          }}
        />
      ) : null}
    </section>
  );
}
