import { Lock, X } from "lucide-react";
import {
  LAB_PLUS_LABEL,
  PRICE_MONTHLY,
  PRICE_MONTHLY_NOTE,
  PRICE_YEARLY,
  PRICE_YEARLY_NOTE,
} from "@/data/pricing";

type Props = {
  packName: string;
  price: string;
  onClose: () => void;
  onUnlockPack: () => void;
  onSubscribeMonthly: () => void;
  onSubscribeYearly: () => void;
  paymentsEnabled?: boolean | null;
  busy?: boolean;
  error?: string | null;
};

export function UnlockModal({
  packName,
  price,
  onClose,
  onUnlockPack,
  onSubscribeMonthly,
  onSubscribeYearly,
  paymentsEnabled = false,
  busy = false,
  error = null,
}: Props) {
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
              <h2
                id="unlock-title"
                className="m-0 font-display text-lg font-bold leading-snug"
              >
                Unlock {packName}
              </h2>
              <p className="m-0 mt-1 text-[0.85rem] text-fg-muted">
                Pay as you go for this pack, or unlock everything with Lab+.
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
          <button
            type="button"
            onClick={onUnlockPack}
            disabled={busy}
            className="flex w-full items-center justify-between rounded-xl border-[1.5px] border-border bg-bg-elevated px-4 py-3.5 text-left active:scale-[0.99] disabled:opacity-60"
          >
            <span>
              <span className="block text-[0.72rem] font-semibold uppercase tracking-wide text-fg-subtle">
                Pay as you go
              </span>
              <span className="block text-[0.92rem] font-bold">
                {packName} forever
              </span>
              <span className="block text-[0.75rem] text-fg-muted">
                This pack only. Yours to keep.
              </span>
            </span>
            <span className="text-base font-bold">{price}</span>
          </button>

          <button
            type="button"
            onClick={onSubscribeMonthly}
            disabled={busy}
            className="flex w-full items-center justify-between rounded-xl bg-accent px-4 py-3.5 text-left text-accent-fg active:scale-[0.99] disabled:opacity-60"
          >
            <span>
              <span className="block text-[0.92rem] font-bold">
                {LAB_PLUS_LABEL} monthly
              </span>
              <span className="block text-[0.75rem] opacity-90">
                Every pack · {PRICE_MONTHLY_NOTE}
              </span>
            </span>
            <span className="text-base font-bold">{PRICE_MONTHLY}</span>
          </button>

          <button
            type="button"
            onClick={onSubscribeYearly}
            disabled={busy}
            className="flex w-full items-center justify-between rounded-xl border-2 border-accent/35 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99] disabled:opacity-60"
          >
            <span>
              <span className="block text-[0.92rem] font-bold text-accent">
                {LAB_PLUS_LABEL} yearly
              </span>
              <span className="block text-[0.75rem] text-fg-muted">
                Every pack · {PRICE_YEARLY_NOTE}
              </span>
            </span>
            <span className="text-base font-bold text-accent">{PRICE_YEARLY}</span>
          </button>

          {error ? (
            <p className="m-0 text-center text-[0.75rem] font-semibold text-danger" role="alert">
              {error}
            </p>
          ) : busy ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              Opening checkout…
            </p>
          ) : paymentsEnabled === true ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              You will pay securely with Stripe.
            </p>
          ) : paymentsEnabled === false ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              Demo unlock stores access on this device. No card charged.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
