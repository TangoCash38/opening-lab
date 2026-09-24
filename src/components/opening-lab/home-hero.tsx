import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  SCOTCH_CANAL_PRACTICE_START_PLY,
  markScotchCanalCoachSeen,
  markScotchCoachSeen,
  scotchCanalCoachAlreadySeen,
  scotchCanalCoachApplies,
  scotchCoachAlreadySeen,
  scotchCoachApplies,
} from "@/lib/scotch-coach";
import {
  startScotchCanalNarration,
  startScotchCoachNarration,
  stopScotchCoachNarration,
} from "@/lib/scotch-coach-audio";
import { soundSelect } from "@/lib/sounds";
import { ChessBoard } from "./chess-board";
import { BoardThemePicker } from "./board-theme-picker";
import { LondonWarmupChip } from "./london-warmup-chip";
import { LineRow } from "./pack-lines";
import { PackAboutModal } from "./pack-about-modal";
import { ScotchCoachBoard } from "./scotch-coach-board";
import { ScotchCoachCard, ScotchCoachFigure } from "./scotch-coach-intro";
import { TrainView } from "./train-view";

type TrainMode = "learn" | "practice";
type CoachTalk = "intro" | "canal";

type FrameSession = {
  line: OpeningLine;
  mode: TrainMode;
  plyLimit?: number;
  startPly?: number;
};

type CoachSession = FrameSession & {
  talk: CoachTalk;
};

/** Website desktop split card. Play wrap and narrow website keep the train route. */
function websiteDesktopFrame(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 960px)").matches
  );
}

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
  const {
    masteryOf,
    isComplete,
    testPercentOf,
    complete: markComplete,
    markLearned,
    failPractice,
    markTest,
  } = useProgress();
  const { state, subscribed } = useUnlocks();
  const purchased = state.packs;
  const shownLines = pack.lines;
  const [linesOpen, setLinesOpen] = useState(linesInitiallyOpen);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pendingLine, setPendingLine] = useState<OpeningLine | null>(null);
  const [frame, setFrame] = useState<FrameSession | null>(null);
  const [coach, setCoach] = useState<CoachSession | null>(null);
  const coachRef = useRef<CoachSession | null>(null);

  const websiteSplit = !playApp;
  const hasFreeSample = (FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0) > 0;
  const price = packPrice(pack);
  const shortPack = packShortLabel(pack);
  // Keep default Caro-Kann for Black / Advance, Classical, Exchange strings for tests.
  // An empty blurb is an intentional omit, not the Caro fallback.
  const title = pack.name || "Caro-Kann for Black";
  const blurb = pack.blurb ?? "Advance, Classical, Exchange";

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
    return () => stopScotchCoachNarration();
  }, []);

  useEffect(() => {
    setLinesOpen(linesInitiallyOpen);
    setAboutOpen(false);
    setPendingLine(null);
    setFrame(null);
    coachRef.current = null;
    setCoach(null);
    stopScotchCoachNarration();
  }, [pack.id, linesInitiallyOpen]);

  const preferInFrame = () => {
    if (playApp) return false;
    if (websiteDesktopFrame()) return true;
    return frame !== null;
  };

  const openInFrame = (
    line: OpeningLine,
    options?: TrainStartOptions,
    mode?: TrainMode,
  ) => {
    coachRef.current = null;
    setCoach(null);
    stopScotchCoachNarration();
    setFrame((prev) => ({
      line,
      mode: mode ?? prev?.mode ?? "learn",
      plyLimit: options?.plyLimit,
      startPly: options?.startPly,
    }));
  };

  const launchLine = (
    line: OpeningLine,
    options?: TrainStartOptions,
    practiceEntry = false,
  ) => {
    // Pack Practice button only. Line taps, line switches, and Test pass false.
    if (
      practiceEntry &&
      scotchCoachApplies({
        packId: pack.id,
        practiceEntry,
      }) &&
      !scotchCoachAlreadySeen()
    ) {
      markScotchCoachSeen();
      startScotchCoachNarration();
      const session: CoachSession = {
        line,
        mode: "learn",
        plyLimit: options?.plyLimit,
        startPly: options?.startPly,
        talk: "intro",
      };
      coachRef.current = session;
      setCoach(session);
      soundSelect();
      return;
    }
    // Line 1 (sg1) only. Later Scotch lines, Test, and other packs fall through.
    if (
      !practiceEntry &&
      scotchCanalCoachApplies({
        packId: pack.id,
        lineId: line.id,
        lineIndex: pack.lines.findIndex((item) => item.id === line.id),
        practiceEntry,
      }) &&
      !scotchCanalCoachAlreadySeen()
    ) {
      stopScotchCoachNarration();
      markScotchCanalCoachSeen();
      startScotchCanalNarration();
      const session: CoachSession = {
        line,
        mode: "learn",
        plyLimit: options?.plyLimit,
        startPly: options?.startPly,
        talk: "canal",
      };
      coachRef.current = session;
      setCoach(session);
      soundSelect();
      return;
    }
    stopScotchCoachNarration();
    if (preferInFrame()) {
      openInFrame(line, options);
      soundSelect();
      return;
    }
    if (options?.plyLimit != null || options?.startPly != null) {
      onStartLine(pack, line, "learn", options);
      return;
    }
    onStartLine(pack, line, "learn");
  };

  const finishCoach = () => {
    const current = coachRef.current;
    coachRef.current = null;
    stopScotchCoachNarration();
    setCoach(null);
    if (!current) return;
    // Canal demo playback stops here. Line 1 Practice starts on ply 0
    // with hints, the same as a line tap after the talk has already played.
    const options = {
      plyLimit: current.plyLimit,
      startPly:
        current.talk === "canal" ? SCOTCH_CANAL_PRACTICE_START_PLY : current.startPly,
    };
    // Desktop stays in the pack card. Phone and Play continue on the train route.
    if (preferInFrame()) {
      openInFrame(current.line, options, "learn");
      return;
    }
    if (options.plyLimit != null || options.startPly != null) {
      onStartLine(pack, current.line, "learn", options);
      return;
    }
    onStartLine(pack, current.line, "learn");
  };

  const activeLineId = frame?.line.id ?? coach?.line.id ?? null;
  const game = useMemo(() => new Chess(), []);
  const showLinesToggle = !embedded;
  const linesVisible = embedded || linesOpen;

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
    if (line) launchLine(line, undefined, true);
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
      }${frame || coach ? " home-hero--live" : ""}${coach ? " home-hero--coach" : ""}`}
    >
      <div className="home-sample-card overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/30 bg-bg-elevated shadow-[var(--shadow-card)]">
        <div className="home-hero-split-inner">
          <div className="home-hero-board-col">
            <div className={`home-sample-meta px-4 pb-2 pt-3.5${frame ? " hidden" : ""}`}>
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
              {blurb ? (
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">{blurb}</p>
              ) : null}
              <LondonWarmupChip
                pack={pack}
                onStartLine={(nextPack, nextLine, mode, options) => {
                  if (preferInFrame()) {
                    setFrame({
                      line: nextLine,
                      mode: mode ?? "learn",
                      plyLimit: options?.plyLimit,
                      startPly: options?.startPly,
                    });
                    soundSelect();
                    return;
                  }
                  onStartLine(nextPack, nextLine, mode, options);
                }}
              />
            </div>

            {frame ? (
              <div className="home-frame-train px-2 pb-1">
                <TrainView
                  key={`${pack.id}-${frame.line.id}-${frame.startPly ?? 0}-${frame.plyLimit ?? "all"}`}
                  pack={pack}
                  line={frame.line}
                  initialMode={frame.mode}
                  plyLimit={frame.plyLimit}
                  startPly={frame.startPly}
                  testLocked={frame.plyLimit != null}
                  embedded
                  frameCoords={!playApp}
                  onBack={() => setFrame(null)}
                  onModeChange={(mode) =>
                    setFrame((prev) => (prev ? { ...prev, mode } : prev))
                  }
                  onLineComplete={() => markComplete(frame.line.id)}
                  onLearnDone={() => markLearned(frame.line.id)}
                  onPracticeFail={() => failPractice(frame.line.id)}
                  onTestPly={(plyIndex) => markTest(frame.line.id, plyIndex)}
                  onPracticeNext={(nextLine) =>
                    setFrame({ line: nextLine, mode: "learn" })
                  }
                />
                <div className="pointer-events-auto px-1 pb-0.5 pt-1">
                  <BoardThemePicker compact className="w-full" />
                </div>
              </div>
            ) : coach ? (
              <div
                className="home-coach-practice"
                data-scotch-coach-dock
                data-scotch-coach-talk={coach.talk}
              >
                <div className="scotch-coach-plate" data-scotch-coach-plate>
                  <ScotchCoachFigure key={`${coach.talk}-${coach.line.id}`} />
                  <ScotchCoachCard
                    key={`${coach.talk}-${coach.line.id}`}
                    talk={coach.talk}
                    onDone={finishCoach}
                  />
                </div>
                <div className="home-board pointer-events-none">
                  {coach.talk === "intro" ? (
                    <ScotchCoachBoard
                      key={coach.line.id}
                      flip={pack.side === "Black"}
                      frameCoords={!playApp}
                    />
                  ) : (
                    <ScotchCoachBoard
                      key={`canal-${coach.line.id}`}
                      talk="canal"
                      flip={pack.side === "Black"}
                      frameCoords={!playApp}
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
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
                    frameCoords={!playApp}
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
              </>
            )}
          </div>

          <div className="home-hero-copy-col">
            {showLinesToggle ? (
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
            ) : null}

            {linesVisible ? (
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
                        selected={item.id === activeLineId}
                        onClick={() => {
                          if (unlocked) {
                            if (pack.about) {
                              setPendingLine(item);
                              setAboutOpen(true);
                            } else launchLine(item);
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
            if (line) launchLine(line);
            else startAdvance();
          }}
        />
      ) : null}
    </section>
  );
}
