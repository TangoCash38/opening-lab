import { useLayoutEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  onContinue: () => void;
  onPhaseChange?: (phase: IntroPhase) => void;
};

type IntroPhase = "brand" | "splash";

function scrollIntroTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

/**
 * Every open and Help reopen: brand + hobbyist note → full-bleed poster +
 * Start → home. The page stays on home until the next full load.
 */
export function HomeIntro({ onContinue, onPhaseChange }: Props) {
  const [phase, setPhase] = useState<IntroPhase>("brand");

  useLayoutEffect(() => {
    onPhaseChange?.("brand");
  }, [onPhaseChange]);

  const showPhase = (next: IntroPhase) => {
    setPhase(next);
    onPhaseChange?.(next);
    scrollIntroTop();
  };

  return (
    <section
      className="home-intro"
      data-home-intro
      data-home-intro-page={phase === "brand" ? 1 : 2}
      data-home-intro-phase={phase}
      aria-labelledby="home-intro-title"
    >
      {phase === "brand" ? <BrandPage onNext={() => showPhase("splash")} /> : null}
      {phase === "splash" ? <SplashPage onStart={onContinue} /> : null}
    </section>
  );
}

function BrandPage({ onNext }: { onNext: () => void }) {
  const t = useT();

  return (
    <div className="home-intro-brand" data-intro="brand">
      <div className="home-intro-brand-lockup">
        <div className="home-intro-brand-mark" aria-hidden="true">
          ♔
        </div>
        <div>
          <h1 id="home-intro-title" className="home-intro-brand-name">
            Opening Lab
          </h1>
          <p className="home-intro-brand-sub">{t("Guided practice · memory tests")}</p>
        </div>
      </div>
      <p className="home-intro-hobbyist">
        {t(
          "Welcome to Opening Lab. This app was developed by a hobbyist with a strong technical curiosity. Please report any inaccuracy to support@openinglab.co.uk. Thank you for your support — enjoy.",
        )}
      </p>
      <button type="button" className="home-intro-go" onClick={onNext}>
        {t("Continue")}
      </button>
    </div>
  );
}

function SplashPage({ onStart }: { onStart: () => void }) {
  const t = useT();

  return (
    <div className="home-intro-splash" data-intro="splash">
      <h1 id="home-intro-title" className="sr-only">
        Opening Lab
      </h1>
      <figure className="home-intro-splash-art" data-art="learn-drill">
        <img
          src="/intro/learn-drill-splash.webp"
          width={1008}
          height={1792}
          alt={t("Learn with help, then test without.")}
          decoding="async"
        />
      </figure>
      <button type="button" className="home-intro-start" onClick={onStart}>
        {t("Start")}
      </button>
    </div>
  );
}
