import { Lock, X } from "lucide-react";
import { ALL_ACCESS_LABEL, ALL_ACCESS_PRICE } from "@/data/pricing";

type Props = {
  packName: string;
  price: string;
  onClose: () => void;
  onUnlockPack: () => void;
  onUnlockAll: () => void;
};

export function UnlockModal({
  packName,
  price,
  onClose,
  onUnlockPack,
  onUnlockAll,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-title"
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
                Train every line in this pack on this device.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-bg-subtle text-fg-muted"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <p className="m-0 text-[0.92rem] leading-relaxed text-fg">
            Unlock <strong>{packName}</strong> for{" "}
            <strong className="text-accent">{price}</strong>
            {" "}OR get the{" "}
            <strong>{ALL_ACCESS_LABEL}</strong> for{" "}
            <strong className="text-accent">{ALL_ACCESS_PRICE}</strong>
            {" "}(Unlocks All Packs + Future Games).
          </p>

          <button
            type="button"
            onClick={onUnlockPack}
            className="flex w-full items-center justify-between rounded-xl bg-accent px-4 py-3.5 text-left text-accent-fg active:scale-[0.99]"
          >
            <span>
              <span className="block text-[0.92rem] font-bold">
                Unlock {packName}
              </span>
              <span className="block text-[0.75rem] opacity-90">
                This pack only
              </span>
            </span>
            <span className="text-base font-bold">{price}</span>
          </button>

          <button
            type="button"
            onClick={onUnlockAll}
            className="flex w-full items-center justify-between rounded-xl border-2 border-accent/30 bg-success-soft px-4 py-3.5 text-left active:scale-[0.99]"
          >
            <span>
              <span className="block text-[0.92rem] font-bold text-accent">
                {ALL_ACCESS_LABEL}
              </span>
              <span className="block text-[0.75rem] text-fg-muted">
                All packs + future games
              </span>
            </span>
            <span className="text-base font-bold text-accent">
              {ALL_ACCESS_PRICE}
            </span>
          </button>

          <p className="m-0 text-center text-[0.72rem] text-fg-subtle">
            Demo unlock stores access on this device. No card charged.
          </p>
        </div>
      </div>
    </div>
  );
}
