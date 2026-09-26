import { useEffect, useId, useLayoutEffect, useState, type MouseEvent } from "react";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useOverlayHistory } from "@/hooks/use-overlay-history";
import { OVERLAY_HISTORY_KEY } from "@/lib/overlay-history";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getColorScheme,
  setColorScheme,
  subscribeColorScheme,
  type ColorScheme,
} from "@/lib/color-scheme";
import { useT } from "@/lib/i18n";
import { LangToggle } from "./lang-picker";

type Props = {
  onCreateOwn: () => void;
  onReport: () => void;
  onSupport: () => void;
};

function historyHasOverlay(): boolean {
  const state = window.history.state;
  return !!state && typeof state === "object" && OVERLAY_HISTORY_KEY in state;
}

/**
 * Menu links sit on an overlay history entry. TanStack Link flushSyncs the
 * sheet closed before navigate(), and that cleanup calls history.back() in
 * the same turn, so the route change never sticks. Pop the overlay entry
 * first, then load the href once that entry is gone.
 */
function leaveOverlay(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey
  ) {
    return;
  }
  const href = event.currentTarget.href;
  event.preventDefault();
  if (!historyHasOverlay()) {
    window.location.assign(href);
    return;
  }
  window.history.back();
  let tries = 0;
  const go = () => {
    if (historyHasOverlay() && tries < 10) {
      tries += 1;
      window.setTimeout(go, 0);
      return;
    }
    window.location.assign(href);
  };
  window.setTimeout(go, 0);
}

/** Site menu. Support uses the same destination as the home-bar link. */
export function LandingMenu({ onCreateOwn, onReport, onSupport }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const { user, isPending } = useCurrentUserState();
  const signedIn = !!user && !user.isDevFallback;
  const [scheme, setScheme] = useState<ColorScheme>("light");

  useOverlayHistory(open, () => setOpen(false), "landing-menu");

  useLayoutEffect(() => {
    setScheme(getColorScheme());
    return subscribeColorScheme(() => setScheme(getColorScheme()));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const dark = scheme === "dark";
  const accountLabel = isPending ? t("Account") : signedIn ? t("Account") : t("Log in");

  return (
    <div className="landing-menu">
      <button
        type="button"
        className="landing-menu-btn"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("Menu")}
        data-landing-menu
      >
        <Menu className="size-5" strokeWidth={2} aria-hidden />
        <span>{t("Menu")}</span>
      </button>
      {open ? (
        <div
          className="home-menu-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="home-menu-panel"
            data-landing-menu-sheet
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="m-0 px-1 pb-2 font-display text-lg font-bold">
              {t("Menu")}
            </h2>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="home-menu-item"
                data-menu-create
                onClick={() => pick(onCreateOwn)}
              >
                {t("Create your own")}
              </button>
              <button
                type="button"
                className="home-menu-item"
                data-menu-support
                onClick={() => pick(onSupport)}
              >
                {t("Support")}
              </button>
              <button
                type="button"
                className="home-menu-item"
                data-menu-report
                onClick={() => pick(onReport)}
              >
                {t("Report incorrect line")}
              </button>
              <div className="landing-menu-row" data-menu-language>
                <span>{t("Language")}</span>
                <LangToggle />
              </div>
              <button
                type="button"
                className="home-menu-item landing-menu-split"
                data-menu-theme
                onClick={() => setColorScheme(dark ? "light" : "dark")}
              >
                <span>{t("Theme")}</span>
                <span className="landing-menu-aside">
                  {dark ? t("Light mode") : t("Dark mode")}
                </span>
              </button>
              <Link
                to="/login"
                search={{ forgot: undefined }}
                className="home-menu-item no-underline"
                data-menu-account
                onClick={leaveOverlay}
              >
                {accountLabel}
              </Link>
              <Link
                to="/terms"
                className="home-menu-item no-underline"
                data-menu-terms
                onClick={leaveOverlay}
              >
                {t("Terms")}
              </Link>
              <Link
                to="/privacy"
                className="home-menu-item no-underline"
                data-menu-privacy
                onClick={leaveOverlay}
              >
                {t("Privacy Policy")}
              </Link>
              <button
                type="button"
                className="home-menu-close"
                onClick={() => setOpen(false)}
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
