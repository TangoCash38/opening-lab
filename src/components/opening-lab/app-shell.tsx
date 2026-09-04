import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleHelp, Moon, Sun, UserRound } from "lucide-react";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { isPackVisible, readRequestedPackId } from "@/lib/catalog";
import { soundSelect } from "@/lib/sounds";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { useUnlocks } from "@/hooks/use-unlocks";
import {
  I18nProvider,
  LANG_OPTIONS,
  isLang,
  useI18n,
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
import { GuideView } from "./guide-view";
import { PackList } from "./pack-list";
import { TrainView } from "./train-view";
import { Onboarding } from "./onboarding";
import {
  AppSplash,
  hasSeenAppSplash,
  markAppSplashSeen,
} from "./app-splash";
import { accessibleCandidates } from "./today-strip";

type View = "home" | "train" | "guide";
type TrainMode = "learn" | "practice";


function scrollAppTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

export function OpeningLabApp() {
  useEffect(() => {
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
  const [view, setView] = useState<View>("home");
  const [active, setActive] = useState<{
    pack: Pack;
    line: OpeningLine;
    mode: TrainMode;
  } | null>(null);
  const [queue, setQueue] = useState<
    { pack: Pack; line: OpeningLine; mode: TrainMode }[]
  >([]);
  const [showOnboarding, setShowOnboarding] = useState(
    false /* onboard after mount */
  );
  const [showSplash, setShowSplash] = useState(true);
  const [playSurface, setPlaySurface] = useState(() => isPlayWrap());

  useEffect(() => {
    setPlaySurface(isPlayWrap());
  }, []);

  const { complete, markLearned, failPractice, markTest, dueQueue } = useProgress();
  const { canAccess, state, subscribed } = useUnlocks();

  const goHome = () => {
    setQueue([]);
    setActive(null);
    setView("home");
    scrollAppTop();
    requestAnimationFrame(() => scrollAppTop());
  };

  useEffect(() => {
    if (hasSeenAppSplash()) setShowSplash(false);
  }, []);

  useEffect(() => {
    /* Home shows the free Scotch board first. No blocking overlay. */
    if (!hasSeenOnboarding()) markOnboardingSeen();
  }, []);

  useEffect(() => {
    const packId = readRequestedPackId();
    if (packId && !isPackVisible(packId)) {
      goHome();
    }
  }, []);

  useEffect(() => {
    if (view === "train" && active && !isPackVisible(active.pack)) {
      goHome();
    }
  }, [view, active]);

  const startLine = (
    pack: Pack,
    line: OpeningLine,
    mode: TrainMode = "learn",
  ) => {
    if (!isPackVisible(pack)) {
      goHome();
      return;
    }
    setActive({ pack, line, mode });
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
      if (pack && line && isPackVisible(pack)) {
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
    goHome();
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

  const finishSplash = useCallback(() => {
    markAppSplashSeen();
    setShowSplash(false);
  }, []);

  const surface = playSurface ? "play" : "website";

  if (showSplash) {
    return (
      <div className="app-shell bg-bg text-fg" data-surface={surface}>
        <AppSplash onDone={finishSplash} />
      </div>
    );
  }

  return (
    <div className="app-shell bg-bg text-fg" data-surface={surface}>
      <header className="app-header z-30 border-b border-border/80">
        <div
          className="app-header-inner mx-auto flex w-full items-center gap-2 px-3 pb-2.5"
          style={{ paddingTop: "0.65rem" }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            onClick={goHome}
            aria-label={t("Opening Lab home")}
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-accent text-[0.95rem] font-bold text-accent-fg shadow-sm">
              ♔
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[0.95rem] font-semibold tracking-tight">
                Opening Lab
              </strong>
              <span className="block truncate text-[0.65rem] font-medium text-fg-subtle">
                {t("Strict lines · memory training")}
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <LangToggle />
            <ColorSchemeToggle />
            <button
              type="button"
              onClick={() => {
              setView("guide");
              scrollAppTop();
              requestAnimationFrame(() => scrollAppTop());
            }}
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

      <main
        className="app-main mx-auto w-full px-4 pt-5"
        style={{
          paddingBottom: "max(3rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {view === "home" && (
          <PackList
            onStartLine={startLine}
            onHowToPlay={() => {
              setView("guide");
              scrollAppTop();
              requestAnimationFrame(() => scrollAppTop());
            }}
          />
        )}
        {view === "guide" && <GuideView onBack={goHome} />}
        {view === "train" && active && isPackVisible(active.pack) && (
          <TrainView
            key={`${active.pack.id}-${active.line.id}-${active.mode}`}
            pack={active.pack}
            line={active.line}
            initialMode={active.mode}
            onBack={goHome}
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

  useEffect(() => {
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

function LangToggle() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="lang-toggle-wrap">
      <span className="sr-only">{t("Language")}</span>
      <select
        className="lang-toggle"
        value={lang}
        aria-label={t("Language")}
        onChange={(event) => {
          const next = event.target.value;
          if (isLang(next)) setLang(next);
        }}
      >
        {LANG_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.short}
          </option>
        ))}
      </select>
    </label>
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
