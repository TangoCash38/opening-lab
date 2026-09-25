import { PACKS, type Pack } from "@/data/packs";
import { packPrice } from "@/data/pricing";
import { FREE_SAMPLE_LINE_IDS, LIVE_PACK_IDS, isPackComingSoon, isPackVisible } from "@/lib/catalog";
import { packShortLabel } from "@/lib/featured-pack";
import { useT } from "@/lib/i18n";
import { ChessPiece } from "./chess-pieces";
import { LandingMenu } from "./landing-menu";

type Props = {
  onEnterGym: () => void;
  onOpenPack: (packId: string) => void;
  onSupport: () => void;
  onCreateOwn: () => void;
  onReport: () => void;
};

const START_RANKS = [
  "rnbqkbnr",
  "pppppppp",
  "........",
  "........",
  "........",
  "........",
  "PPPPPPPP",
  "RNBQKBNR",
];

/** Sketch labels for real coming-soon packs. Ids stay the catalog ids. */
const CHIP_LABEL: Record<string, string> = {
  "italian-white": "Italian",
  "ruy-white": "Ruy Lopez",
  "french-white": "French",
  "anti-sicilian-black": "Sicilian",
  "queens-gambit-white": "Queen's Gambit",
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
  "queens-gambit-white",
  "english-white",
  "kings-indian-black",
  "catalan-white",
  "nimzo-indian-black",
  "petroff-black",
  "berlin-black",
] as const;

function openNowTitle(pack: Pack): string {
  if (pack.id === "scotch") return "Scotch Gambit";
  return pack.name;
}

/**
 * Branded landing. One screen after a cold open — the old brand page and
 * splash poster are folded into this, so Home does not run two intros.
 */
export function LandingHome({
  onEnterGym,
  onOpenPack,
  onSupport,
  onCreateOwn,
  onReport,
}: Props) {
  const t = useT();
  const openPacks = LIVE_PACK_IDS.map((id) => PACKS.find((pack) => pack.id === id)).filter(
    (pack): pack is Pack => !!pack && isPackVisible(pack),
  );
  const chips = COMING_SOON_CHIP_IDS.map((id) => PACKS.find((pack) => pack.id === id)).filter(
    (pack): pack is Pack => !!pack && isPackVisible(pack) && isPackComingSoon(pack),
  );

  const priceLabel = (pack: Pack): string => {
    const freeCount = FREE_SAMPLE_LINE_IDS[pack.id]?.length ?? 0;
    const price = packPrice(pack);
    if (freeCount > 0 && price) return t("{n} free · {price}", { n: freeCount, price });
    return price ?? t("Free");
  };

  return (
    <section className="landing-page" data-landing aria-labelledby="landing-title">
      <header className="landing-bar">
        <div className="landing-brand">
          <BrandMark />
          <span className="landing-wordmark">Opening Lab</span>
        </div>
        <nav className="landing-nav" aria-label={t("Drill packs")}>
          <button
            type="button"
            className="landing-nav-link"
            data-landing-packs
            onClick={onEnterGym}
          >
            {t("Drill packs")}
          </button>
          <button
            type="button"
            className="landing-nav-link"
            data-landing-support
            onClick={onSupport}
          >
            {t("Support")}
          </button>
        </nav>
        <LandingMenu onCreateOwn={onCreateOwn} onReport={onReport} />
      </header>

      <div className="landing-inner">
        <div className="landing-hero">
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
            <LandingBoard />
          </div>
          <div className="landing-copy">
            <p id="landing-title" className="landing-sub">
              {t("Practice with hints. Test with none.")}
            </p>
            <button type="button" className="landing-cta" data-landing-cta onClick={onEnterGym}>
              {t("Enter the gym")}
            </button>
          </div>
        </div>

        <section className="landing-section" aria-labelledby="landing-open-now">
          <h2 id="landing-open-now" className="landing-section-title">
            {t("Open now")}
          </h2>
          <div className="landing-open-grid" data-open-now>
            {openPacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className="landing-pack-card"
                data-open-pack={pack.id}
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

        <section className="landing-section" aria-labelledby="landing-soon">
          <h2 id="landing-soon" className="landing-section-title">
            {t("Coming soon")}
          </h2>
          <ul className="landing-chips">
            {chips.map((pack) => (
              <li key={pack.id} className="landing-chip" data-coming-soon-chip={pack.id}>
                {CHIP_LABEL[pack.id] ?? packShortLabel(pack)}
              </li>
            ))}
          </ul>
        </section>

        <p className="landing-footer">{t("Strict book-move trainer")}</p>
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

function LandingBoard() {
  return (
    <div className="landing-board" aria-hidden="true">
      <div className="landing-board-grid">
        {START_RANKS.map((rank, y) =>
          rank.split("").map((code, x) => {
            const light = (x + y) % 2 === 0;
            return (
              <div
                key={`${x}-${y}`}
                className={light ? "landing-sq landing-sq-light" : "landing-sq landing-sq-dark"}
              >
                {code !== "." ? <ChessPiece code={code} /> : null}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}
