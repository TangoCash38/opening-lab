import { X } from "lucide-react";

type Props = {
  kind: "wrong" | "end";
  title: string;
  body: string;
  caption?: string;
  actionLabel: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
};

export function LineResultModal({
  kind,
  title,
  body,
  caption,
  actionLabel,
  onClose,
  primaryLabel,
  onPrimary,
}: Props) {
  const showPrimary = kind === "end" && Boolean(primaryLabel && onPrimary);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-result-title"
      data-result-kind={kind}
      data-result-actions={showPrimary ? 2 : 1}
      onClick={onClose}
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2
              id="line-result-title"
              className="m-0 pr-2 font-display text-lg font-bold leading-snug"
            >
              {title}
            </h2>
            {caption ? (
              <p className="m-0 mt-1 text-[0.82rem] font-semibold text-fg-muted">
                {caption}
              </p>
            ) : null}
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
        {body ? (
          <div className="max-h-[min(18rem,42vh)] space-y-3 overflow-y-auto px-5 py-5">
            {body.split(/\n\n+/).map((para) => (
              <p
                key={para.slice(0, 48)}
                className="m-0 text-[0.92rem] leading-relaxed text-fg-muted"
              >
                {para}
              </p>
            ))}
          </div>
        ) : null}
        <div
          className={`border-t border-border px-5 py-4${showPrimary ? " space-y-2" : ""}`}
        >
          {showPrimary ? (
            <button
              type="button"
              data-result-primary
              onClick={onPrimary}
              className="min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
            >
              {primaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            data-result-dismiss
            onClick={onClose}
            className={
              showPrimary
                ? "min-h-11 w-full rounded-2xl px-4 py-2.5 text-[0.88rem] font-semibold text-fg-muted active:opacity-70"
                : "min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
            }
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
