import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Chess } from "chess.js";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { FREE_SAMPLE_LINE_IDS, isLineUnlocked, visiblePacks } from "@/lib/catalog";
import {
  formatUnlockRemaining,
  mateDoneToday,
  mateUnlockRemainingMs,
} from "@/lib/find-mate";
import { useUnlocks } from "@/hooks/use-unlocks";
import { useT } from "@/lib/i18n";
import { ChessBoard } from "./chess-board";
import { BoardThemePicker } from "./board-theme-picker";
import { LineRow } from "./pack-lines";
import { PackAboutModal } from "./pack-about-modal";

type TrainMode = "learn" | "practice";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: TrainMode) => void;
  onHowToPlay: () => void;
  onOpenMate: () => void;
  onSubscribe: () => void;
  onRequestUnlock?: (pack: Pack) => void;
  playApp?: boolean;
};

export function HomeHero({
  onStartLine,
  onHowToPlay,
  onOpenMate,
  onRequestUnlock,
  playApp,
}: Props) {
  const t = useT();
  const { masteryOf, isComplete, testPercentOf } = useProgress();
  const { state, subscribed } = useUnlocks();
  const purchased = state.packs;
  const catalog = visiblePacks(PACKS);
  const pack = catalog.find((p) => p.id === "caro-kann-black");
  const shownLines = pack ? pack.lines : [];
  const [linesOpen, setLinesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pendingLine, setPendingLine] = useState<OpeningLine | null>(null);

  const websiteSplit = !playApp;

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

  const game = useMemo(() => new Chess(), []);

  const startAdvance = () => {
    const line = pack?.lines.find((l) => l.id === "ckb1");
    if (pack && line) onStartLine(pack, line, "learn");
  };

  const openIntroThenPractice = () => {
    if (pack?.about) setAboutOpen(true);
    else startAdvance();
  };

  return (
    <section className={`home-hero mb-5${websiteSplit ? " home-hero-split" : ""}`}>
      <div className="home-heading-row">
        <h1 className="font-display text-[1.65rem] font-bold tracking-tight">
          {t("Train openings the strict way")}
        </h1>
        <div className="home-heading-actions">
          <button
            type="button"
            onClick={onHowToPlay}
            className="how-to-play inline-flex min-h-11 items-center rounded-full border border-border bg-bg-elevated px-4 py-2 text-[0.88rem] font-semibold active:opacity-70"
          >
            {t("How to play")}
          </button>
          <MoreGamesMenu onMate={onOpenMate} />
        </div>
      </div>

      <div className="home-sample-card overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/30 bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="home-hero-split-inner">
          <div className="home-hero-board-col">
            <div className="home-sample-meta px-4 pb-2 pt-3.5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
                {t("Free sample")}
              </p>
              <h2 className="mt-1 font-display text-[1.25rem] font-bold tracking-tight">
                Caro-Kann for Black
              </h2>
              <p className="mt-0.5 text-[0.82rem] text-fg-muted">
                {pack?.blurb ?? "Advance, Classical, Exchange"}
              </p>
            </div>

            <div className="home-board pointer-events-none px-2">
              <ChessBoard
                game={game}
                flip={true}
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
                {linesOpen ? t("Tap to hide") : t("See {n} lines", { n: shownLines.length })}
              </button>
            </div>

            {pack && linesOpen ? (
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
                        testPercent={
                          unlocked ? testPercentOf(item.id, item.plies.length) : null
                        }
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

      {pack?.about && aboutOpen ? (
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

function MoreGamesMenu({ onMate }: { onMate: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mateDone, setMateDone] = useState(false);
  const [mateWait, setMateWait] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const refresh = () => {
      const done = mateDoneToday();
      setMateDone(done);
      setMateWait(done ? formatUnlockRemaining(mateUnlockRemainingMs()) : "");
    };
    refresh();
    const id = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="more-games relative z-20" ref={rootRef}>
      <button
        type="button"
        className="more-games-btn inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-bg-elevated px-4 py-2 text-[0.88rem] font-semibold active:opacity-70"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("More games")}
      >
        <span>{t("More games")}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-fg-muted transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={2.5}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-40 mt-1.5 flex min-w-[14rem] flex-col gap-1 rounded-2xl border-[1.5px] border-accent/25 bg-bg-elevated p-1.5 shadow-[var(--shadow-card)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onMate();
            }}
            className="min-h-11 w-full rounded-xl px-3 py-2 text-left active:bg-bg-subtle"
          >
            <span className="block text-[0.88rem] font-semibold">{t("Find the mate")}</span>
            {mateDone ? (
              <span className="mt-0.5 block text-[0.72rem] font-semibold text-fg-muted">
                {mateWait
                  ? t("Next 5 unlock in {time}", { time: mateWait })
                  : t("Done for today")}
              </span>
            ) : null}
          </button>
        </div>
      ) : null}
    </div>
  );
}
