import { useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  onContinue: () => void;
};

/** Two-page first visit. Return visits skip it via opening-lab:home-intro. */
export function HomeIntro({ onContinue }: Props) {
  const [page, setPage] = useState<1 | 2>(1);

  return (
    <section
      className="home-intro"
      data-home-intro
      data-home-intro-page={page}
      aria-labelledby="home-intro-title"
    >
      {page === 1 ? (
        <WelcomePage onNext={() => setPage(2)} />
      ) : (
        <HowPage onBack={() => setPage(1)} onContinue={onContinue} />
      )}
      <div className="home-intro-dots" aria-hidden="true">
        <span data-on={page === 1 ? "true" : "false"} />
        <span data-on={page === 2 ? "true" : "false"} />
      </div>
    </section>
  );
}

function WelcomePage({ onNext }: { onNext: () => void }) {
  const t = useT();

  return (
    <>
      <figure className="home-intro-art" data-art="drill">
        <img
          src="/intro/opening-drill.webp"
          width={900}
          height={1350}
          alt={t("Poster: opening drill, learn with help, test without.")}
          decoding="async"
        />
      </figure>
      <h1
        id="home-intro-title"
        className="home-intro-title font-display text-[1.85rem] font-bold leading-tight tracking-tight"
      >
        Opening Lab
      </h1>
      <div className="home-intro-copy">
        <p>{t("Learn openings through practice and recall.")}</p>
        <p>
          {t(
            "Learn each line with guidance, then repeat it from memory without help. Work through each pack to build familiarity, recognise the opening in real games, and create a strong foundation for further study.",
          )}
        </p>
      </div>
      <button type="button" className="home-intro-go" onClick={onNext}>
        {t("Start training")}
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
      <p className="home-intro-close">
        {t(
          "With repetition, you'll become familiar with the moves, recognise the opening in real games, and be ready to take your study further.",
        )}
      </p>
      <figure className="home-intro-art home-intro-art-second" data-art="shield">
        <img
          src="/intro/learn-drill.webp"
          width={900}
          height={1350}
          alt={t("Poster: learn, drill, and remember the line.")}
          decoding="async"
        />
      </figure>
      <div className="home-intro-pair">
        <p>{t("Learn with help")}</p>
        <p>{t("Test without")}</p>
      </div>
      <button type="button" className="home-intro-go" onClick={onContinue}>
        {t("Choose a pack")}
      </button>
      <p className="home-intro-again">
        {t("You can read this again from Menu, then Help.")}
      </p>
    </>
  );
}
