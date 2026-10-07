import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SCOTCH_LESSON_SLUG, scotchLessons } from "@/data/lessons/scotch-course";
import { PACKS, type Pack } from "@/data/packs";
import { PRICE_LESSON_SCOTCH, packPrice } from "@/data/pricing";
import {
  FREE_SAMPLE_LINE_IDS,
  LIVE_PACK_IDS,
  canPurchaseBuyAll,
  isPackComingSoon,
  isPackVisible,
  packHasPlayableFreeLines,
} from "@/lib/catalog";
import { useUnlocks } from "@/hooks/use-unlocks";
import { packShortLabel } from "@/lib/featured-pack";
import { useT } from "@/lib/i18n";
import { LESSON_SCOTCH_PRODUCT_ID, LESSONS_ENABLED } from "@/lib/lesson-products";
import {
  isPlayApp,
  nextSquareMemoryPreviewTaps,
  toggleSquareMemoryPlayPreview,
} from "@/lib/play-app";
import { BuyAllOffer } from "./buy-all-offer";
import { ColorSchemeToggle } from "./color-scheme-toggle";
import { LandingMateDemo } from "./landing-mate-demo";
import { LandingMenu } from "./landing-menu";

type Props = {
  onOpenPack: (packId: string) => void;
  onSupport: () => void;
  onFeedback: () => void;
  onCreateOwn: () => void;
  onReport: () => void;
  onBuyAll: () => void;
};

/** Sketch labels for real coming-soon packs. Ids stay the catalog ids. */
const CHIP_LABEL: Record<string, string> = {
  "italian-white": "Italian",
  "ruy-white": "Ruy Lopez",
  "french-white": "French",
  "anti-sicilian-black": "Anti-Sicilian",
  "qg-white": "Queen's Gambit",
  "english-white": "English",
  "kings-indian-black": "King's Indian",
  "catalan-white": "Catalan",
  "nimzo-indian-black": "Nimzo-Indian",
  "petroff-black": "Petroff",
  "berlin-black": "Berlin",
};

/** Highlight chips. Names come from the visible catalog, not a fake list. */
const COMING_SOON_CHIP_IDS = [
  "italian-white",
  "ruy-white",
  "french-white",
  "anti-sicilian-black",
  "qg-white",
  "english-white",
  "kings-indian-black",
  "catalan-white",
  "nimzo-indian-black",
  "petroff-black",
  "berlin-black",
] as const;

function openNowTitle(pack: Pack): string {
  if (pack.id === "scotch") return "Scotch Gambit";
  if (pack.id === "london") return "London System";
  return pack.name;
}

/**
 * Branded landing. One screen after a cold open — the old brand page and
 * splash poster are folded into this, so Home does not run two intros.
 */
export function LandingHome({
  onOpenPack,
  onSupport,
  onFeedback,
  onCreateOwn,
  onReport,
  onBuyAll,
}: Props) {
  const t = useT();
  const { subscribed } = useUnlocks();
  const showBuyAll = canPurchaseBuyAll() && !subscribed;
  const [showLessons, setShowLessons] = useState(LESSONS_ENABLED);
  const previewTaps = useRef<number[]>([]);
  useLayoutEffect(() => {
    setShowLessons(LESSONS_ENABLED && !isPlayApp());
  }, []);
  const onWordmarkClick = () => {
    if (!isPlayApp()) return;
    const next = nextSquareMemoryPreviewTaps(previewTaps.current, Date.now());
    previewTaps.current = next.taps;
    if (!next.toggled) return;
    toggleSquareMemoryPlayPreview();
  };
  const openPacks = LIVE_PACK_IDS.map((id) => PACKS.find((pack) => pack.id === id)).filter(
    (pack): pack is Pack => !!pack && isPackVisible(pack),
  );
  const chips = COMING_SOON_CHIP_IDS.map((id) => PACKS.find((pack) => pack.id === id)).filter(
    (pack): pack is Pack => !!pack && isPackVisible(pack) && isPackComingSoon(pack),
  );

  const lessonFreeCount = scotchLessons.filter((lesson) => lesson.free).length;

  const priceLabel = (pack: Pack): string => {
    const freeCount = FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0;
    const price = packPrice(pack);
    if (!price) return t("Free");
    if (freeCount > 0) {
      return t("{n} free · {price} unlocks the whole pack", { n: freeCount, price });
    }
    return t("Whole pack · {price} — all {n} lines", {
      price,
      n: pack.lines.length,
    });
  };

  return (
    <section className="landing-page" data-landing aria-labelledby="landing-title">
      <header className="landing-bar">
        <div className="landing-brand">
          <BrandMark />
          <span className="landing-wordmark" data-play-memory-preview="" onClick={onWordmarkClick}>
            Opening Lab
          </span>
        </div>
        <nav className="landing-nav" aria-label={t("Site")}>
          <span className="landing-nav-links">
            <button
              type="button"
              className="landing-nav-link"
              data-landing-feedback
              onClick={onFeedback}
            >
              {t("Feedback")}
            </button>
          </span>
        </nav>
        <div className="landing-tools">
          <ColorSchemeToggle labeled />
          <LandingMenu
            onCreateOwn={onCreateOwn}
            onReport={onReport}
            onSupport={onSupport}
            onFeedback={onFeedback}
          />
        </div>
      </header>

      <div className="landing-inner">
        <div className="landing-hero">
          <div className="landing-hero-main">
          <div className="landing-hero-art">
            <div className="landing-coach-wrap">
              <img
                className="landing-coach"
                src="/scotch-coach/coach-seated-v2.png"
                width={640}
                height={1071}
                alt={t("Professor Potato Pie")}
                decoding="async"
                draggable={false}
              />
              <span className="landing-coach-lid landing-coach-lid--left" data-coach-blink aria-hidden />
              <span className="landing-coach-lid landing-coach-lid--right" data-coach-blink aria-hidden />
              <img
                className="landing-mug-logo"
                src="/brand/opening-lab-logo.png"
                width={72}
                height={72}
                alt=""
                decoding="async"
                draggable={false}
              />
            </div>
            <LandingMateDemo />
          </div>
          <div className="landing-under-board" data-landing-under-board>
            <section className="landing-square-memory" aria-label="Square Memory">
              <Link
                to="/square-memory"
                className="landing-puzzle-card"
                data-landing-square-memory
              >
                <span className="landing-puzzle-kicker">{t("Free")}</span>
                <span className="landing-puzzle-title">
                  Square Memory game
                  <span className="landing-nav-new" data-landing-memory-new>
                    New
                  </span>
                </span>
              </Link>
            </section>
            <section className="landing-recall" aria-label="Position Recall Training">
              <Link
                to="/grandmaster-vision"
                className="landing-puzzle-card"
                data-landing-recall
              >
                <span className="landing-puzzle-kicker">{t("Free")}</span>
                <span className="landing-puzzle-title">
                  Position Recall Training
                  <span className="landing-nav-new" data-landing-recall-new>
                    New
                  </span>
                </span>
              </Link>
            </section>
          </div>
          </div>
          <div className="landing-copy">
            {showLessons ? (
              <section className="landing-lessons" aria-labelledby="landing-lessons-title">
                <h2 id="landing-lessons-title" className="landing-lessons-title">
                  {t("Chess opening lessons")}
                </h2>
                <Link
                  to="/lessons/$courseId"
                  params={{ courseId: SCOTCH_LESSON_SLUG }}
                  className="landing-pack-card landing-lessons-card"
                  data-landing-lessons
                  data-lesson-product={LESSON_SCOTCH_PRODUCT_ID}
                >
                  <span className="landing-pack-name">{t("Scotch Gambit Lessons")}</span>
                  <span className="landing-pack-price" data-lesson-price>
                    {t("{n} free · {price}", {
                      n: lessonFreeCount,
                      price: PRICE_LESSON_SCOTCH,
                    })}
                  </span>
                  <span className="landing-lessons-count">
                    {t("{n} lessons", { n: scotchLessons.length })}
                  </span>
                </Link>
                <p className="landing-lessons-note">
                  {t("Separate from drill packs. Buy all does not include lessons.")}
                </p>
              </section>
            ) : null}
            <section className="landing-open-here" aria-labelledby="landing-open-now">
              <div className="landing-section-head">
                <h2 id="landing-open-now" className="landing-section-title">
                  {t("Open now")}
                </h2>
                <p className="landing-section-aside">{t("Chess opening packs available now")}</p>
              </div>
              <p id="landing-title" className="landing-sub">
                {t("Practice with hints. Test with none.")}
              </p>
              {showBuyAll ? (
                <section aria-labelledby="landing-buy-all">
                  <h2 id="landing-buy-all" className="sr-only">
                    {t("On sale")}
                  </h2>
                  <BuyAllOffer onBuy={onBuyAll} />
                </section>
              ) : null}
              <div className="landing-open-grid" data-open-now>
                {openPacks.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    className="landing-pack-card"
                    data-open-pack={pack.id}
                    data-free-lines={packHasPlayableFreeLines(pack) ? "true" : "false"}
                    onClick={() => onOpenPack(pack.id)}
                  >
                    <span className="landing-pack-name">{openNowTitle(pack)}</span>
                    <span className="landing-pack-price" data-open-pack-price={pack.id}>
                      {priceLabel(pack)}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="landing-section" aria-labelledby="landing-soon">
          <h2 id="landing-soon" className="landing-section-title">
            {t("Coming soon")}
          </h2>
          <p className="landing-soon-ask">
            <a
              href="mailto:support@openinglab.co.uk?subject=Opening%20Lab%20feedback"
              data-coming-soon-feedback
            >
              {t("Please leave feedback for openings you’d like to see")}
            </a>
          </p>
          <ul className="landing-chips">
            {chips.map((pack) => (
              <li key={pack.id} className="landing-chip" data-coming-soon-chip={pack.id}>
                {CHIP_LABEL[pack.id] ?? packShortLabel(pack)}
              </li>
            ))}
          </ul>
        </section>

        <p className="landing-footer">{t("Study first. Then test yourself from memory")}</p>
      </div>
    </section>
  );
}

function BrandMark() {
  return (
    <img
      className="brand-mark"
      src="/brand/opening-lab-logo.png"
      alt=""
      width={48}
      height={48}
      draggable={false}
    />
  );
}
