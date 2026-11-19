import { useLayoutEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { creatorInitials, type CreatorHue } from "@/data/creator-packs-demo";
import { initBoardTheme } from "@/lib/board-theme";
import { creatorPacksRoutesOpen } from "@/lib/creator-packs-flag";
import { initColorScheme } from "@/lib/color-scheme";
import { I18nProvider, useT } from "@/lib/i18n";

export type CreatorPacksScreen =
  | "browse"
  | "pack"
  | "become"
  | "editor"
  | "ratings"
  | "help"
  | "dashboard"
  | "admin";

type RouteProps = {
  current: CreatorPacksScreen;
  children: ReactNode;
};

export function CreatorPacksRoute({ current, children }: RouteProps) {
  const open = creatorPacksRoutesOpen();

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
      <div data-surface="website" data-creator-packs-page>
        {open ? (
          <CreatorPacksFrame current={current}>{children}</CreatorPacksFrame>
        ) : (
          <CreatorPacksClosed />
        )}
      </div>
    </I18nProvider>
  );
}

function CreatorPacksClosed() {
  return (
    <main className="creator-packs" data-creator-packs-closed>
      <div className="creator-packs-inner">
        <Link to="/" className="creator-packs-back">
          ← Home
        </Link>
        <h1 className="creator-packs-title">Not on the live site</h1>
        <p className="creator-packs-lede">
          This preview stays off Opening Lab. The live packs are unchanged.
        </p>
      </div>
    </main>
  );
}

function CreatorPacksFrame({ current, children }: RouteProps) {
  const t = useT();
  return (
    <main className="creator-packs" data-creator-packs-screen={current}>
      <div className="creator-packs-inner">
        <Link to="/" className="creator-packs-back">
          {t("← Back")}
        </Link>
        <p className="creator-packs-kicker">Sample preview</p>
        <p className="creator-packs-sample" data-creator-packs-sample>
          Fictional coaches and packs, shown so you can see the marketplace. Nothing here is for sale.
        </p>
        <nav className="creator-packs-nav" aria-label="Creator packs preview">
          <Link
            to="/creator-packs"
            className={current === "browse" ? "is-on" : undefined}
            data-creator-nav="browse"
          >
            Packs
          </Link>
          <Link
            to="/creator-packs/become"
            className={current === "become" ? "is-on" : undefined}
            data-creator-nav="become"
          >
            Become a creator
          </Link>
          <Link
            to="/creator-packs/editor"
            className={current === "editor" ? "is-on" : undefined}
            data-creator-nav="editor"
          >
            Pack editor
          </Link>
          <Link
            to="/creator-packs/dashboard"
            className={current === "dashboard" ? "is-on" : undefined}
            data-creator-nav="dashboard"
          >
            Your packs
          </Link>
          <Link
            to="/creator-packs/ratings"
            className={current === "ratings" ? "is-on" : undefined}
            data-creator-nav="ratings"
          >
            Ratings
          </Link>
          <Link
            to="/creator-packs/help"
            className={current === "help" ? "is-on" : undefined}
            data-creator-nav="help"
          >
            Need help?
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}

export function CreatorAvatar({ name, hue }: { name: string; hue: CreatorHue }) {
  return (
    <span className={`creator-avatar creator-avatar--${hue}`} aria-hidden>
      {creatorInitials(name)}
    </span>
  );
}
