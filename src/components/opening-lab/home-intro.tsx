import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  onContinue: () => void;
};

type IntroPhase = "brand" | "splash" | "welcome";

const WELCOME_MS = 5000;

function scrollIntroTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

/**
 * First-run / Help reopen: Opening Lab brand → full-bleed splash + Start →
 * slim welcome banner (~5s, Skip) → home. Seen flag via opening-lab:home-intro.
 */
export function HomeIntro({ onContinue }: Props) {
  const [phase, setPhase] = useState<IntroPhase>("brand");

  const showPhase = (next: IntroPhase) => {
    setPhase(next);
    scrollIntroTop();
  };

  return (
    <section
      className="home-intro"
      data-home-intro
      data-home-intro-page={phase === "brand" ? 1 : phase === "splash" ? 2 : 3}
      data-home-intro-phase={phase}
      aria-labelledby="home-intro-title"
    >
      {phase === "brand" ? <BrandPage onNext={() => showPhase("splash")} /> : null}
      {phase === "splash" ? <SplashPage onStart={() => showPhase("welcome")} /> : null}
      {phase === "welcome" ? <WelcomeBanner onDone={onContinue} /> : null}
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
      <button type="button" className="home-intro-start" onClick={onStart}>
        {t("Start")}
      </button>
      <figure className="home-intro-splash-art" data-art="learn-drill">
        <img
          src="/intro/learn-drill-splash.webp"
          width={1008}
          height={1792}
          alt={t("Learn with help, then test without.")}
          decoding="async"
        />
      </figure>
    </div>
  );
}

function WelcomeBanner({ onDone }: { onDone: () => void }) {
  const t = useT();

  useEffect(() => {
    const id = window.setTimeout(() => onDone(), WELCOME_MS);
    return () => window.clearTimeout(id);
    // Fire once on mount; parent onContinue is not stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only welcome timer
  }, []);

  return (
    <div className="home-intro-welcome-phase" data-intro="welcome" role="status">
      <div className="home-intro-welcome-banner">
        <img
          className="home-intro-horse"
          src="/pieces/wN.svg"
          width={28}
          height={28}
          alt=""
          aria-hidden="true"
        />
        <p className="home-intro-welcome-copy">
          {t(
            "Welcome to Opening Lab. This app was developed by a hobbyist with a strong technical curiosity. Please report any inaccuracy to support@openinglab.co.uk. Thank you for your support — enjoy.",
          )}
        </p>
        <button type="button" className="home-intro-skip" onClick={onDone}>
          {t("Skip")}
        </button>
      </div>
    </div>
  );
}
