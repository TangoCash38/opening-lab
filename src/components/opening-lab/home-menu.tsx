import { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useOverlayHistory } from "@/hooks/use-overlay-history";
import { useT } from "@/lib/i18n";

type Props = {
  onCreateOwn?: () => void;
  onHelp: () => void;
  onReport: () => void;
};

/** Phone-home sheet: Create your own, Help, and a line report. */
export function HomeMenu({ onCreateOwn, onHelp, onReport }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useOverlayHistory(open, () => setOpen(false), "home-menu");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const pick = (fn?: () => void) => {
    setOpen(false);
    fn?.();
  };

  return (
    <div className="home-menu">
      <button
        type="button"
        className="home-menu-btn inline-flex min-h-11 items-center gap-1 rounded-full border border-border bg-bg-elevated px-4 py-2 text-[0.88rem] font-semibold active:opacity-70"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("Menu")}
        data-home-menu
      >
        <span>{t("Menu")}</span>
        <ChevronDown className="size-4 shrink-0 text-fg-muted" strokeWidth={2.5} aria-hidden />
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
            data-home-menu-sheet
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="m-0 px-1 pb-2 font-display text-lg font-bold">
              {t("Menu")}
            </h2>
            <div className="flex flex-col gap-1.5">
              {onCreateOwn ? (
                <button
                  type="button"
                  className="home-menu-item"
                  data-menu-create
                  onClick={() => pick(onCreateOwn)}
                >
                  {t("Create your own")}
                </button>
              ) : null}
              <button
                type="button"
                className="home-menu-item"
                data-menu-help
                onClick={() => pick(onHelp)}
              >
                {t("Help")}
              </button>
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
