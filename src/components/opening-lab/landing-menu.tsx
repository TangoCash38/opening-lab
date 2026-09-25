import { useEffect, useId, useLayoutEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useOverlayHistory } from "@/hooks/use-overlay-history";
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
  onSupport: () => void;
  onReport: () => void;
};

/** Landing hamburger. Reuses the guide, account, language, theme, and legal routes. */
export function LandingMenu({ onSupport, onReport }: Props) {
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
        <Menu className="size-6" strokeWidth={2} aria-hidden />
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
                data-menu-support
                onClick={() => pick(onSupport)}
              >
                {t("Support")}
              </button>
              <Link
                to="/login"
                search={{ forgot: undefined }}
                className="home-menu-item no-underline"
                data-menu-account
                onClick={() => setOpen(false)}
              >
                {accountLabel}
              </Link>
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
                to="/terms"
                className="home-menu-item no-underline"
                data-menu-terms
                onClick={() => setOpen(false)}
              >
                {t("Terms")}
              </Link>
              <Link
                to="/privacy"
                className="home-menu-item no-underline"
                data-menu-privacy
                onClick={() => setOpen(false)}
              >
                {t("Privacy Policy")}
              </Link>
              <button
                type="button"
                className="home-menu-item"
                data-menu-report
                onClick={() => pick(onReport)}
              >
                {t("Report incorrect line")}
              </button>
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
