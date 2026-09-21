import { useT } from "@/lib/i18n";

type Props = {
  onContinue: () => void;
};

/** First page: strict gym copy lives here so the pack list stays clean. */
export function HomeIntro({ onContinue }: Props) {
  const t = useT();

  return (
    <section className="home-intro" data-home-intro>
      <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
        Opening Lab
      </p>
      <h1 className="mt-2 font-display text-[1.7rem] font-bold leading-tight tracking-tight">
        {t("A strict opening trainer")}
      </h1>
      <div className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-fg-muted">
        <p className="m-0">
          {t(
            "Opening Lab is a strict opening trainer. Practice with hints, then Test with none.",
          )}
        </p>
        <p className="m-0">
          {t(
            "Only book moves count. Drill the line, meet the traps, and punish the error.",
          )}
        </p>
        <p className="m-0">
          {t(
            "There is no Play on and no game versus the computer. That mode is gone for good.",
          )}
        </p>
        <p className="m-0">
          {t("Two Opening Traps and three Caro lines are free to start.")}
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="mt-6 min-h-12 w-full rounded-2xl bg-accent px-4 py-3.5 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
      >
        {t("See your packs")}
      </button>
      <p className="mt-3 text-center text-[0.78rem] leading-relaxed text-fg-subtle">
        {t("You can read this again from Menu, then Help.")}
      </p>
    </section>
  );
}
