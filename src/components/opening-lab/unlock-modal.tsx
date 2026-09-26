import { Lock, X } from "lucide-react";
import { BuyAllOffer } from "./buy-all-offer";
import { canPurchaseBuyAll } from "@/lib/catalog";
import { isPlayWrap } from "@/lib/play-app";
import { useT } from "@/lib/i18n";

type Props = {
  packName: string;
  price: string;
  /** Lines in this pack. £1.99 buys all of them, not one line. */
  lineCount: number;
  onClose: () => void;
  onUnlockPack: () => void;
  onBuyAll?: () => void;
  onSubscribeMonthly: () => void;
  onSubscribeYearly: () => void;
  onRestore?: () => void;
  paymentsEnabled?: boolean | null;
  needsAccount?: boolean;
  busy?: boolean;
  error?: string | null;
  playApp?: boolean;
  /** True when this pack has a Path B Play INAPP SKU. */
  playSku?: boolean;
};

export function UnlockModal({
  packName,
  price,
  lineCount,
  onClose,
  onUnlockPack,
  onBuyAll,
  onRestore,
  paymentsEnabled = false,
  needsAccount = false,
  busy = false,
  error = null,
  playApp = false,
  playSku = false,
}: Props) {
  const t = useT();
  const wrap = playApp || isPlayWrap();
  const caroRest = packName.toLowerCase().includes("caro");
  const trapsRest = packName === "Opening Traps";
  const offerBuyAll = Boolean(onBuyAll) && canPurchaseBuyAll();
  const wholePack = t("{price} unlocks the whole pack", { price });
  const wholePackLines = t("Whole pack · {price} — all {n} lines", {
    price,
    n: lineCount,
  });
  const unlockLabel = trapsRest ? t("Unlock all 10 traps for £1.99") : wholePack;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
      aria-busy={busy}
      onClick={busy ? undefined : onClose}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bg-subtle text-fg-muted">
              <Lock className="size-5" strokeWidth={2.25} aria-hidden />
            </span>
            <div>
              <h2 id="unlock-title" className="m-0 font-display text-lg font-bold leading-snug">
                {t("Unlock {packName}", { packName })}
              </h2>
              <p className="m-0 mt-1 text-[0.85rem] text-fg-muted" data-whole-pack-price>
                {caroRest
                  ? t("Three lines stay free. This unlocks the rest of the pack.")
                  : wholePackLines}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="grid size-9 place-items-center rounded-full bg-bg-subtle text-fg-muted disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {wrap ? (
            <>
              <p className="m-0 text-[0.88rem] leading-relaxed text-fg-muted">
                {playSku
                  ? t("One-time purchase. Billed by Google Play.")
                  : t("This pack is not on Google Play yet. Free sample lines still train here.")}
              </p>
              {playSku ? (
                <button
                  type="button"
                  onClick={onUnlockPack}
                  disabled={busy}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-accent/35 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99] disabled:opacity-60"
                >
                  <span>
                    <span className="block text-[0.92rem] font-bold text-accent">
                      {unlockLabel}
                    </span>
                    <span className="block text-[0.75rem] text-fg-muted">
                      {t("Pay as you go. Billed by Google Play.")}
                    </span>
                  </span>
                  <span className="text-base font-bold text-accent">{price}</span>
                </button>
              ) : (
                <div className="flex w-full items-center justify-between rounded-xl border-2 border-border bg-bg-subtle px-4 py-3.5 text-left">
                  <span>
                    <span className="block text-[0.92rem] font-bold">
                      {caroRest ? t("Rest of this pack") : t("This pack")}
                    </span>
                    <span className="block text-[0.75rem] text-fg-muted">
                      {t("Pay as you go. Not for sale on Google Play yet.")}
                    </span>
                  </span>
                  <span className="text-base font-bold">{price}</span>
                </div>
              )}
              {offerBuyAll ? (
                <BuyAllOffer onBuy={() => onBuyAll?.()} busy={busy} />
              ) : null}
              {onRestore ? (
                <button
                  type="button"
                  onClick={onRestore}
                  disabled={busy}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-[0.85rem] font-semibold text-fg-muted disabled:opacity-60"
                >
                  {t("Restore purchases")}
                </button>
              ) : null}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onUnlockPack}
                disabled={busy}
                className="flex w-full items-center justify-between rounded-xl border-2 border-accent/35 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99] disabled:opacity-60"
              >
                <span>
                  <span className="block text-[0.92rem] font-bold text-accent">
                    {unlockLabel}
                  </span>
                  <span className="block text-[0.75rem] text-fg-muted">
                    {t("Card via Stripe.")}
                  </span>
                </span>
                <span className="text-base font-bold text-accent">{price}</span>
              </button>
              {offerBuyAll ? (
                <BuyAllOffer onBuy={() => onBuyAll?.()} busy={busy} />
              ) : null}
            </>
          )}

          {error ? (
            <p className="m-0 text-center text-[0.75rem] font-semibold text-danger" role="alert">
              {error}
            </p>
          ) : busy ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {wrap ? t("Opening Google Play…") : t("Opening checkout…")}
            </p>
          ) : wrap && needsAccount ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {t("Sign in so this stays on your account.")}
            </p>
          ) : wrap ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {t("Billed by Google Play. One-time purchase.")}
            </p>
          ) : needsAccount ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {t("Sign in so this stays on your account.")}
            </p>
          ) : paymentsEnabled === true ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {t("You will pay securely with Stripe.")}
            </p>
          ) : paymentsEnabled === false ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              {t("Payments are not live yet.")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
