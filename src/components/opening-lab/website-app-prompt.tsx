import { useEffect, useState } from "react";
import { isPlayWrap } from "@/lib/play-app";
import { useT } from "@/lib/i18n";

/** Closed testing join. There is no public Play store page. */
export const PLAY_CLOSED_TESTING_URL =
  "https://play.google.com/apps/testing/uk.co.openinglab";

export const WEBSITE_APP_PROMPT_KEY = "opening-lab:website-app-prompt:v1";

export function hasDismissedWebsiteAppPrompt(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(WEBSITE_APP_PROMPT_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissWebsiteAppPrompt(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(WEBSITE_APP_PROMPT_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Website only. Hidden inside the Play wrap. Dismiss for this session. */
export function WebsiteAppPrompt() {
  const t = useT();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isPlayWrap()) return;
    if (hasDismissedWebsiteAppPrompt()) return;
    setOpen(true);
  }, []);

  if (!open) return null;

  const continueOnWeb = () => {
    dismissWebsiteAppPrompt();
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="website-app-prompt-title"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl">
        <div className="px-5 py-5">
          <h2
            id="website-app-prompt-title"
            className="m-0 font-display text-lg font-bold leading-snug"
          >
            Opening Lab
          </h2>
          <div className="mt-4 space-y-2">
            <a
              href={PLAY_CLOSED_TESTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-center text-[0.95rem] font-bold text-accent-fg no-underline active:scale-[0.99]"
            >
              {t("Download the app")}
            </a>
            <button
              type="button"
              onClick={continueOnWeb}
              className="min-h-11 w-full rounded-2xl px-4 py-2.5 text-[0.88rem] font-semibold text-fg-muted active:opacity-70"
            >
              {t("Continue on the web")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
