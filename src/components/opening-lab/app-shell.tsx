import { useEffect, useMemo, useState } from "react";
import { CircleHelp, UserRound } from "lucide-react";
import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { soundSelect } from "@/lib/sounds";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { hasSeenOnboarding, markOnboardingSeen } from "@/lib/progress";
import { useProgress } from "@/hooks/use-progress";
import { useUnlocks } from "@/hooks/use-unlocks";
import { GuideView } from "./guide-view";
import { PackList } from "./pack-list";
import { TrainView } from "./train-view";
import { Onboarding } from "./onboarding";
import { accessibleCandidates } from "./today-strip";

type View = "home" | "train" | "guide";
type TrainMode = "learn" | "practice";

export function OpeningLabApp() {
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

  const { complete, failPractice, dueQueue } = useProgress();
  const { canAccess } = useUnlocks();

  useEffect(() => {
    if (!hasSeenOnboarding()) setShowOnboarding(true);
  }, []);

  const startLine = (
    pack: Pack,
    line: OpeningLine,
    mode: TrainMode = "learn",
  ) => {
    setActive({ pack, line, mode });
    setView("train");
    soundSelect();
  };

  const goHome = () => {
    setQueue([]);
    setView("home");
  };

  const resolveQueue = (
    items: { packId: string; lineId: string; mode: TrainMode }[],
  ) => {
    const resolved: { pack: Pack; line: OpeningLine; mode: TrainMode }[] = [];
    for (const item of items) {
      const pack = PACKS.find((p) => p.id === item.packId);
      const line = pack?.lines.find((l) => l.id === item.lineId);
      if (pack && line) resolved.push({ pack, line, mode: item.mode });
    }
    return resolved;
  };

  const startDueQueue = () => {
    const items = resolveQueue(dueQueue(accessibleCandidates(canAccess)));
    if (items.length === 0) return;
    const [first, ...rest] = items;
    setQueue(rest);
    startLine(first!.pack, first!.line, first!.mode);
  };

  const trainNext = () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      startLine(next!.pack, next!.line, next!.mode);
      return;
    }
    const items = resolveQueue(dueQueue(accessibleCandidates(canAccess)));
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
    if (!pack || !line) return null;
    return { pack, line };
  }, []);

  const dismissOnboarding = () => {
    markOnboardingSeen();
    setShowOnboarding(false);
  };

  return (
    <div className="app-shell min-h-dvh overflow-x-hidden bg-bg text-fg">
      <header className="app-header sticky top-0 z-30 border-b border-border/80 bg-[rgba(251,248,242,.94)] backdrop-blur-xl backdrop-saturate-150">
        <div
          className="mx-auto flex max-w-[520px] items-center gap-2 px-3 pb-2.5"
          style={{ paddingTop: "max(0.65rem, env(safe-area-inset-top, 0px))" }}
        >
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            onClick={goHome}
            aria-label="Opening Lab home"
          >
            <div className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-accent text-[0.95rem] font-bold text-accent-fg shadow-sm">
              ♔
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[0.95rem] font-semibold tracking-tight">
                Opening Lab
              </strong>
              <span className="block truncate text-[0.65rem] font-medium text-fg-subtle">
                Strict lines · memory training
              </span>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setView("guide")}
              className="header-icon-btn"
              aria-label="Help and guide"
              title="Help"
            >
              <CircleHelp className="size-[22px]" strokeWidth={1.75} />
            </button>
            <AccountButton />
          </div>
        </div>
      </header>

      <main
        className="mx-auto max-w-[520px] overflow-x-hidden px-4 pt-5"
        style={{
          paddingBottom: "max(3rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {view === "home" && (
          <PackList onStartLine={startLine} onTrainDue={startDueQueue} />
        )}
        {view === "guide" && <GuideView onBack={goHome} />}
        {view === "train" && active && (
          <TrainView
            key={`${active.pack.id}-${active.line.id}-${active.mode}`}
            pack={active.pack}
            line={active.line}
            initialMode={active.mode}
            onBack={goHome}
            onLineComplete={() => complete(active.line.id)}
            onPracticeFail={() => failPractice(active.line.id)}
            onTrainNext={trainNext}
            hasNextDue={queue.length > 0}
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

function AccountButton() {
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
          aria-label="Account"
          title="Account"
        >
          <UserRound className="size-[22px]" strokeWidth={1.75} />
        </Link>
      </SignedOut>
      <SignedIn>
        <Link
          to="/login"
          className="header-icon-btn no-underline overflow-hidden p-0"
          aria-label={user?.displayName ?? user?.primaryEmail ?? "Account"}
          title="Account"
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
