import { X } from "lucide-react";
import {
  LAB_PLUS_LABEL,
  PRICE_MONTHLY,
  PRICE_MONTHLY_NOTE,
  PRICE_YEARLY,
  PRICE_YEARLY_NOTE,
} from "@/data/pricing";

type Props = {
  onClose: () => void;
  onSubscribeMonthly: () => void;
  onSubscribeYearly: () => void;
};

export function SubscribeModal({
  onClose,
  onSubscribeMonthly,
  onSubscribeYearly,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-title"
      onClick={onClose}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="sub-title"
              className="m-0 font-display text-lg font-bold leading-snug"
            >
              {LAB_PLUS_LABEL}
            </h2>
            <p className="m-0 mt-1 text-[0.85rem] text-fg-muted">
              Every pack, plus new lines we add. Cancel anytime. Packs you
              already bought stay yours.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <button
            type="button"
            onClick={onSubscribeMonthly}
            className="flex w-full items-center justify-between rounded-xl bg-accent px-4 py-3.5 text-left text-accent-fg active:scale-[0.99]"
          >
            <span>
              <span className="block text-[0.92rem] font-bold">Monthly</span>
              <span className="block text-[0.75rem] opacity-90">
                All packs + updates · {PRICE_MONTHLY_NOTE}
              </span>
            </span>
            <span className="text-base font-bold">{PRICE_MONTHLY}</span>
          </button>

          <button
            type="button"
            onClick={onSubscribeYearly}
            className="flex w-full items-center justify-between rounded-xl border-2 border-accent/35 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99]"
          >
            <span>
              <span className="block text-[0.92rem] font-bold text-accent">
                Yearly
              </span>
              <span className="block text-[0.75rem] text-fg-muted">
                All packs + updates · {PRICE_YEARLY_NOTE}
              </span>
            </span>
            <span className="text-base font-bold text-accent">{PRICE_YEARLY}</span>
          </button>

          <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
            Demo unlock on this device. No card charged yet.
          </p>
        </div>
      </div>
    </div>
  );
}
