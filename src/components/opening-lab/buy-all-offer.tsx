import { PRICE_BUY_ALL } from "@/data/pricing";
import { canPurchaseBuyAll } from "@/lib/catalog";
import { useT } from "@/lib/i18n";

type Props = {
  onBuy: () => void;
  busy?: boolean;
  error?: string | null;
  /** Hide when this account already unlocks every drill pack. */
  hidden?: boolean;
};

/** One-time Buy all. Shared by the website and the Play wrap. */
export function BuyAllOffer({ onBuy, busy = false, error = null, hidden = false }: Props) {
  const t = useT();
  if (hidden || !canPurchaseBuyAll()) return null;
  return (
    <div className="buy-all-offer-slot">
      <button
        type="button"
        className="buy-all-offer"
        data-buy-all-offer
        onClick={onBuy}
        disabled={busy}
      >
        <span className="buy-all-offer-kicker">{t("On sale")}</span>
        <span className="buy-all-offer-title">
          {t("Buy all · {price}", { price: PRICE_BUY_ALL })}
        </span>
        <span className="buy-all-offer-copy">
          {t(
            "Unlocks every drill pack available now and any future drill packs. Not Lessons.",
          )}
        </span>
        <span className="buy-all-offer-note">
          {t("One-time purchase. Not a subscription. Not lifetime access.")}
        </span>
      </button>
      {error ? (
        <p className="buy-all-offer-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
