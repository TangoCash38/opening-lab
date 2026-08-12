import { useState } from "react";
import { CircleHelp, UserRound } from "lucide-react";
import type { OpeningLine, Pack } from "@/data/packs";
import { soundSelect } from "@/lib/sounds";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { GuideView } from "./guide-view";
import { PackList } from "./pack-list";
import { TrainView } from "./train-view";

type View = "home" | "train" | "guide";

export function OpeningLabApp() {
  const [view, setView] = useState<View>("home");
  const [active, setActive] = useState<{ pack: Pack; line: OpeningLine } | null>(
    null,
  );

  const startLine = (pack: Pack, line: OpeningLine) => {
    setActive({ pack, line });
    setView("train");
    soundSelect();
  };

  const goHome = () => setView("home");

  return (
    <div className="app-shell min-h-dvh bg-bg text-fg">
      {/* Native-style top bar with notch safe area */}
      <header className="app-header sticky top-0 z-30 border-b border-border/80 bg-[rgba(251,248,242,.94)] backdrop-blur-xl backdrop-saturate-150">
        <div
          className="mx-auto flex max-w-[520px] items-center gap-2 px-3 pb-2.5"
          style={{ paddingTop: "max(0.65rem, env(safe-area-inset-top, 0px))" }}
        >
          {/* Brand — left */}
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

          {/* Actions — right: help + account */}
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
        className="mx-auto max-w-[520px] px-4 pt-5"
        style={{
          paddingBottom: "max(3rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        {view === "home" && <PackList onStartLine={startLine} />}
        {view === "guide" && <GuideView onBack={goHome} />}
        {view === "train" && active && (
          <TrainView
            key={`${active.pack.id}-${active.line.id}`}
            pack={active.pack}
            line={active.line}
            onBack={goHome}
          />
        )}
      </main>
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
