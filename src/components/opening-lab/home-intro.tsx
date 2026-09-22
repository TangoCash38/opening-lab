import { useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  onContinue: () => void;
};

type IntroPage = 1 | 2 | 3 | 4;

function scrollIntroTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
}

/** Four-page first visit. Return visits skip it via opening-lab:home-intro. */
export function HomeIntro({ onContinue }: Props) {
  const [page, setPage] = useState<IntroPage>(1);

  const showPage = (next: IntroPage) => {
    setPage(next);
    scrollIntroTop();
  };

  return (
    <section
      className="home-intro"
      data-home-intro
      data-home-intro-page={page}
      aria-labelledby="home-intro-title"
    >
      {page === 1 ? <BrandPage onNext={() => showPage(2)} /> : null}
      {page === 2 ? (
        <KnightPage onBack={() => showPage(1)} onNext={() => showPage(3)} />
      ) : null}
      {page === 3 ? (
        <WelcomePage onBack={() => showPage(2)} onNext={() => showPage(4)} />
      ) : null}
      {page === 4 ? <HowPage onBack={() => showPage(3)} onContinue={onContinue} /> : null}
      <div className="home-intro-dots" aria-hidden="true">
        {([1, 2, 3, 4] as const).map((n) => (
          <span key={n} data-on={page === n ? "true" : "false"} />
        ))}
      </div>
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

function KnightPage({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const t = useT();

  return (
    <>
      <button type="button" className="home-intro-back" onClick={onBack}>
        {t("← Back")}
      </button>
      <h1 id="home-intro-title" className="sr-only">
        Opening Lab
      </h1>
      <figure className="home-intro-art home-intro-art-knight" data-art="learn-test">
        <img
          src="/intro/learn-with-help.webp"
          width={900}
          height={1194}
          alt={t("Learn with help, then test without.")}
          decoding="async"
        />
      </figure>
      <button type="button" className="home-intro-go" onClick={onNext}>
        {t("Continue")}
      </button>
    </>
  );
}

function WelcomePage({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const t = useT();

  return (
    <>
      <button type="button" className="home-intro-back" onClick={onBack}>
        {t("← Back")}
      </button>
      <h1
        id="home-intro-title"
        className="home-intro-title font-display text-[1.7rem] font-bold leading-tight tracking-tight"
      >
        {t("Welcome to Opening Lab")}
      </h1>
      <div className="home-intro-welcome">
        <p>
          {t(
            "This app was created by a hobbyist with a strong technical curiosity. Your support and feedback is invaluable and appreciated.",
          )}
        </p>
      </div>
      <button type="button" className="home-intro-go" onClick={onNext}>
        {t("Continue")}
      </button>
    </>
  );
}

function HowPage({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: () => void;
}) {
  const t = useT();

  return (
    <>
      <button type="button" className="home-intro-back" onClick={onBack}>
        {t("← Back")}
      </button>
      <h1
        id="home-intro-title"
        className="home-intro-title font-display text-[1.7rem] font-bold leading-tight tracking-tight"
      >
        {t("Practise. Remember. Recognise.")}
      </h1>
      <ol className="home-intro-steps">
        <li>
          <strong>{t("First, learn the line")}</strong>
          <span>
            {t(
              "Play through the moves with guidance and repeat them until they become familiar.",
            )}
          </span>
        </li>
        <li>
          <strong>{t("Then, test your memory")}</strong>
          <span>
            {t(
              "Play the same line again without help. If you forget a move, practise the line and try again.",
            )}
          </span>
        </li>
        <li>
          <strong>{t("Finally, complete the pack")}</strong>
          <span>
            {t(
              "Work through its key lines and variations to build a fuller picture of the opening.",
            )}
          </span>
        </li>
      </ol>
      <button type="button" className="home-intro-go" onClick={onContinue}>
        {t("Choose a pack")}
      </button>
      <p className="home-intro-again">
        {t("You can read this again from Menu, then Help.")}
      </p>
    </>
  );
}
