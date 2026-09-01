import { Lock, X } from "lucide-react";

type Props = {
  packName: string;
  price: string;
  onClose: () => void;
  onUnlockPack: () => void;
  onSubscribeMonthly: () => void;
  onSubscribeYearly: () => void;
  onRestore?: () => void;
  paymentsEnabled?: boolean | null;
  needsAccount?: boolean;
  busy?: boolean;
  error?: string | null;
  playApp?: boolean;
};

export function UnlockModal({
  packName,
  price,
  onClose,
  onUnlockPack,
  paymentsEnabled = false,
  needsAccount = false,
  busy = false,
  error = null,
  playApp = false,
}: Props) {
  const caroRest = packName.toLowerCase().includes("caro");
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
                Unlock {packName}
              </h2>
              <p className="m-0 mt-1 text-[0.85rem] text-fg-muted">
                {caroRest
                  ? "Three lines stay free. This unlocks the rest of the pack."
                  : "One-time purchase. This pack only."}
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
          {playApp ? (
            <p className="m-0 text-[0.88rem] leading-relaxed text-fg-muted">
              Pack billing in the Play app is not on sale in this build. The three free Caro lines still train here.
            </p>
          ) : (
            <button
              type="button"
              onClick={onUnlockPack}
              disabled={busy}
              className="flex w-full items-center justify-between rounded-xl border-2 border-accent/35 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99] disabled:opacity-60"
            >
              <span>
                <span className="block text-[0.92rem] font-bold text-accent">
                  {caroRest ? "Unlock the rest of this pack" : "Unlock this pack"}
                </span>
                <span className="block text-[0.75rem] text-fg-muted">
                  Yours to keep. Card via Stripe.
                </span>
              </span>
              <span className="text-base font-bold text-accent">{price}</span>
            </button>
          )}

          {error ? (
            <p className="m-0 text-center text-[0.75rem] font-semibold text-danger" role="alert">
              {error}
            </p>
          ) : busy ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">Opening checkout…</p>
          ) : playApp ? null : needsAccount ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              Sign in so this stays on your account.
            </p>
          ) : paymentsEnabled === true ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              You will pay securely with Stripe.
            </p>
          ) : paymentsEnabled === false ? (
            <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
              Payments are not live yet.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
