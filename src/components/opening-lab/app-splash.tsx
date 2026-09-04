import { useI18n } from "@/lib/i18n";
import { LangToggle } from "./lang-picker";

const SESSION_KEY = "opening-lab:splash:v4";

export function hasSeenAppSplash(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAppSplashSeen(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

type Props = { onDone: () => void };

export function AppSplash({ onDone }: Props) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg px-8 text-fg"
      role="dialog"
      aria-modal="true"
      aria-labelledby="splash-title"
    >
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="splash-logo grid size-16 place-items-center rounded-[18px] bg-accent text-[1.85rem] font-bold text-accent-fg shadow-md">
          ♔
        </div>
        <h1
          id="splash-title"
          className="mt-5 font-display text-[1.45rem] font-bold tracking-tight"
        >
          Opening Lab
        </h1>
        <p className="splash-story mt-3 max-w-[20rem] text-center text-[1.05rem] font-semibold leading-snug text-fg">
          {t("Most people dive into opening theory before they know the basics. That is algebra before you can count.")}
        </p>
        <p className="mt-3 max-w-[20rem] text-center text-[0.95rem] leading-relaxed text-fg-muted">
          {t("They pay for deep courses and still cannot play the line. Here we keep it straight. Strict lines. You learn them, you can play them, and you can spot the opening when it appears.")}
        </p>
        <div className="splash-lang mt-6">
          <LangToggle />
        </div>
        <button
          type="button"
          onClick={onDone}
          className="mt-5 min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
        >
          {t("Play")}
        </button>
      </div>
    </div>
  );
}
