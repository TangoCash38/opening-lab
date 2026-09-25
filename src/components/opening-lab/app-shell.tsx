import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { CircleHelp, House, Moon, Sun, UserRound } from "lucide-react";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { isComingSoonClosed, isPackVisible, readRequestedPackId } from "@/lib/catalog";
import {
  gymPackFromLine,
  isGymPack,
  readGymLine,
  type GymLine,
} from "@/lib/gym-line";
import { soundSelect } from "@/lib/sounds";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { useUnlocks } from "@/hooks/use-unlocks";
import {
  I18nProvider,
  useT,
} from "@/lib/i18n";
import { initBoardTheme } from "@/lib/board-theme";
import {
  getColorScheme,
  initColorScheme,
  setColorScheme,
  subscribeColorScheme,
  type ColorScheme,
} from "@/lib/color-scheme";
import { isPlayWrap } from "@/lib/play-app";
import type { TrainStartOptions } from "@/lib/london-warmup";
import { GuideView } from "./guide-view";
import { LandingHome } from "./home-intro";
import { PackList } from "./pack-list";
import { ReportLineView } from "./report-line";
import { TrainView } from "./train-view";
import { CreateOwnView } from "./create-own-view";
import { Onboarding } from "./onboarding";
import { LangToggle } from "./lang-picker";
import { accessibleCandidates } from "./today-strip";

type View = "landing" | "home" | "train" | "guide" | "create" | "report";
type TrainMode = "learn" | "practice";

function scrollAppTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function OpeningLabApp() {
  useLayoutEffect(() => {
    const stopBoard = initBoardTheme();
    const stopColor = initColorScheme();
    return () => {
      stopBoard();
      stopColor();
    };
  }, []);
  return (
    <I18nProvider>
      <OpeningLabInner />
    </I18nProvider>
  );
}

function OpeningLabInner() {
  const t = useT();
  const [view, setView] = useState<View>("landing");
  const [returnView, setReturnView] = useState<View>("landing");
  const [focusPackId, setFocusPackId] = useState<string | null>(null);
  const [active, setActive] = useState<{
    pack: Pack;
    line: OpeningLine;
    mode: TrainMode;
    plyLimit?: number;
    startPly?: number;
  } | null>(null);
  const [queue, setQueue] = useState<
    { pack: Pack; line: OpeningLine; mode: TrainMode }[]
  >([]);
  const [showOnboarding, setShowOnboarding] = useState(
    false /* onboard after mount */
  );
  const [playSurface, setPlaySurface] = useState(false);

  const { complete, markLearned, failPractice, markTest, dueQueue, line: lineProgress } =
    useProgress();
  const { canAccess, state, subscribed } = useUnlocks();

  const canTrainPack = useCallback(
    (pack: Pick<Pack, "id"> | string): boolean => {
      if (isGymPack(pack)) return true;
      if (!isPackVisible(pack)) return false;
      const id = typeof pack === "string" ? pack : pack.id;
      return !isComingSoonClosed(id, state.packs, subscribed);
    },
    [state.packs, subscribed],
  );

  /** Branded landing. Pack list is the gym (`home`), not this. */
  const goHome = () => {
    setQueue([]);
    setActive(null);
    setFocusPackId(null);
    setView("landing");
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const goPacks = (packId?: string | null) => {
    setQueue([]);
    setActive(null);
    setFocusPackId(packId ?? null);
    setView("home");
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const openGuide = () => {
    setReturnView(view);
    setView("guide");
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const openReport = () => {
    setReturnView(view);
    setView("report");
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const leaveOverlay = () => {
    setView(returnView === "guide" || returnView === "report" ? "landing" : returnView);
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  useLayoutEffect(() => {
    setPlaySurface(isPlayWrap());
  }, []);

  useEffect(() => {
    /* Home shows the free Scotch board first. No blocking overlay. */
    if (!hasSeenOnboarding()) markOnboardingSeen();
  }, []);

  useEffect(() => {
    const packId = readRequestedPackId();
    if (packId && !isPackVisible(packId) && !isGymPack(packId)) {
      goHome();
    }
  }, []);

  useEffect(() => {
    if (view === "train" && active && !canTrainPack(active.pack)) {
      goHome();
    }
  }, [view, active, canTrainPack]);

  const startLine = (
    pack: Pack,
    line: OpeningLine,
    mode: TrainMode = "learn",
    options?: TrainStartOptions,
  ) => {
    if (!canTrainPack(pack)) {
      goHome();
      return;
    }
    setActive({
      pack,
      line,
      mode,
      plyLimit: options?.plyLimit,
      startPly: options?.startPly,
    });
    setView("train");
    soundSelect();
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const startGymLine = (gym: GymLine) => {
    if (playSurface) return;
    const pack = gymPackFromLine(gym);
    const opening = pack.lines[0];
    if (!opening) return;
    setActive({ pack, line: opening, mode: "learn" });
    setView("train");
    soundSelect();
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  const resolveQueue = (
    items: { packId: string; lineId: string; mode: TrainMode }[],
  ) => {
    const resolved: { pack: Pack; line: OpeningLine; mode: TrainMode }[] = [];
    for (const item of items) {
      const pack = PACKS.find((p) => p.id === item.packId);
      const line = pack?.lines.find((l) => l.id === item.lineId);
      if (pack && line && canTrainPack(pack)) {
        resolved.push({ pack, line, mode: item.mode });
      }
    }
    return resolved;
  };

  const trainNext = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      startLine(next!.pack, next!.line, next!.mode);
      return;
    }
    const items = resolveQueue(dueQueue(accessibleCandidates(canAccess, state.packs, subscribed)));
    const remaining = items.filter(
      (it) => !(active && it.line.id === active.line.id),
    );
    if (remaining.length > 0) {
      const [next, ...rest] = remaining;
      setQueue(rest);
      startLine(next!.pack, next!.line, next!.mode);
      return;
    }
    goPacks(active?.pack.id);
  };

  const scotchLine1 = useMemo(() => {
    const pack = PACKS.find((p) => p.id === "scotch");
    const line = pack?.lines.find((l) => l.id === "s1") ?? pack?.lines[0];
    if (!pack || !line || !isPackVisible(pack)) return null;
    return { pack, line };
  }, []);

  const dismissOnboarding = () => {
    markOnboardingSeen();
    setShowOnboarding(false);
  };

  const surface = playSurface ? "play" : "website";
  const showAppHeader = view !== "landing";

  return (
    <div
      className={`app-shell bg-bg text-fg${view === "landing" ? " app-shell--landing" : ""}`}
      data-surface={surface}
      data-app-view={view}
    >
      {showAppHeader ? (
      <header className="app-header z-30 border-b border-border/80">
        <div
          className="app-header-inner mx-auto flex w-full items-center gap-2 px-3 pb-2.5"
          style={{ paddingTop: "0.65rem" }}
        >
          <button
            type="button"
            className="header-home-btn"
            data-header-home
            onClick={goHome}
            aria-label={t("Home")}
          >
            <House className="header-home-icon" strokeWidth={1.75} aria-hidden />
            <span className="header-home-label">{t("Home")}</span>
          </button>
          <div className="min-w-0 flex-1">
            <strong className="block truncate text-[0.95rem] font-semibold tracking-tight">
              Opening Lab
            </strong>
            <span className="app-header-sub">
              {t("Guided practice · memory tests")}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <LangToggle />
            <ColorSchemeToggle />
            <button
              type="button"
              onClick={openGuide}
              className="header-icon-btn"
              aria-label={t("Help and guide")}
              title={t("Help")}
            >
              <CircleHelp className="size-[22px]" strokeWidth={1.75} />
            </button>
            <AccountButton />
          </div>
        </div>
      </header>
      ) : null}

      <main
        className={`app-main mx-auto w-full${view === "landing" ? " app-main--landing" : ""}`}
        style={
          view === "landing"
            ? undefined
            : {
                paddingTop: "0.55rem",
                paddingBottom: "max(2.75rem, env(safe-area-inset-bottom, 0px))",
                paddingLeft: "max(0.9rem, env(safe-area-inset-left, 0px))",
                paddingRight: "max(0.9rem, env(safe-area-inset-right, 0px))",
              }
        }
      >
        {view === "landing" && (
          <LandingHome
            onEnterGym={() => goPacks()}
            onOpenPack={(packId) => goPacks(packId)}
            onSupport={openGuide}
            onReport={openReport}
          />
        )}
        {view === "home" && (
          <PackList
            focusPackId={focusPackId}
            onStartLine={startLine}
            onHowToPlay={openGuide}
            onCreateOwn={() => {
              setView("create");
              scrollAppTop();
              requestAnimationFrame(() => scrollAppTop());
            }}
            onReportLine={openReport}
          />
        )}
        {view === "guide" && (
          <GuideView
            onBack={leaveOverlay}
            onShowIntro={goHome}
          />
        )}
        {view === "report" && <ReportLineView onBack={leaveOverlay} />}
        {view === "create" && (
          <CreateOwnView
            initial={readGymLine()}
            onPractice={startGymLine}
            onHome={goHome}
          />
        )}
        {view === "train" && active && canTrainPack(active.pack) && (
          <TrainView
            key={
              isGymPack(active.pack)
                ? `${active.pack.id}-${active.line.side}-${active.line.plies.join(",")}`
                : `${active.pack.id}-${active.line.id}-${active.startPly ?? 0}-${active.plyLimit ?? "all"}`
            }
            pack={active.pack}
            line={active.line}
            initialMode={active.mode}
            gym={isGymPack(active.pack)}
            plyLimit={active.plyLimit}
            startPly={active.startPly}
            testLocked={
              active.plyLimit != null ||
              (isGymPack(active.pack) && !lineProgress(active.line.id).learned)
            }
            onModeChange={(mode) =>
              setActive((prev) => (prev ? { ...prev, mode } : prev))
            }
            onBack={
              isGymPack(active.pack) && !playSurface
                ? () => {
                    setActive(null);
                    setView("create");
                    scrollAppTop();
                  }
                : () => goPacks(active.pack.id)
            }
            onLineComplete={() => complete(active.line.id)}
            onLearnDone={() => markLearned(active.line.id)}
            onPracticeFail={() => failPractice(active.line.id)}
            onTestPly={(plyIndex) => markTest(active.line.id, plyIndex)}
            onTrainNext={trainNext}
            hasNextDue={queue.length > 0}
            onPracticeNext={(nextLine) =>
              startLine(active.pack, nextLine, "learn")
            }
          />
        )}
      </main>

      {showOnboarding && scotchLine1 && (
        <Onboarding
          onStartScotch={() => {
            dismissOnboarding();
            startLine(scotchLine1.pack, scotchLine1.line, "learn");
          }}
          onSkip={dismissOnboarding}
        />
      )}
    </div>
  );
}

function ColorSchemeToggle() {
  const t = useT();
  const [scheme, setScheme] = useState<ColorScheme>("light");

  useLayoutEffect(() => {
    setScheme(getColorScheme());
    return subscribeColorScheme(() => setScheme(getColorScheme()));
  }, []);

  const dark = scheme === "dark";
  const label = dark ? t("Light mode") : t("Dark mode");

  return (
    <button
      type="button"
      className="header-icon-btn"
      aria-label={label}
      title={label}
      onClick={() => setColorScheme(dark ? "light" : "dark")}
    >
      {dark ? (
        <Sun className="size-[22px]" strokeWidth={1.75} />
      ) : (
        <Moon className="size-[22px]" strokeWidth={1.75} />
      )}
    </button>
  );
}

function AccountButton() {
  const t = useT();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <div
        className="header-icon-btn animate-pulse bg-bg-subtle"
        aria-hidden
      />
    );
  }

  return (
    <>
      <SignedOut>
        <Link
          to="/login"
          className="header-icon-btn no-underline"
          aria-label={t("Account")}
          title={t("Account")}
        >
          <UserRound className="size-[22px]" strokeWidth={1.75} />
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          to="/login"
          className="header-icon-btn no-underline overflow-hidden p-0"
          aria-label={user?.displayName ?? user?.primaryEmail ?? t("Account")}
          title={t("Account")}
        >
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center bg-accent/15 text-[0.8rem] font-bold text-accent">
              {(user?.displayName ?? user?.primaryEmail ?? "A")
                .charAt(0)
                .toUpperCase()}
            </span>
          )}
        </Link>
      </SignedIn>
    </>
  );
}
