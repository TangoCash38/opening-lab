import { ChevronDown, Maximize2, Minimize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

type Props = {
  kind: "wrong" | "end";
  title: string;
  body: string;
  caption?: string;
  actionLabel: string;
  onClose: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  onAction?: () => void;
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
  onAction,
}: Props) {
  const t = useT();
  const showPrimary = Boolean(primaryLabel && onPrimary);
  const handleAction = onAction ?? onClose;
  const isWrong = kind === "wrong";
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [moreBelow, setMoreBelow] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const updateScrollCue = useCallback(() => {
    const el = bodyRef.current;
    if (!el) {
      setHasOverflow(false);
      setMoreBelow(false);
      return;
    }
    const overflow = el.scrollHeight > el.clientHeight + 4;
    const more = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    setHasOverflow(overflow);
    setMoreBelow(overflow && more);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    updateScrollCue();
    const ro = new ResizeObserver(() => updateScrollCue());
    ro.observe(el);
    el.addEventListener("scroll", updateScrollCue, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", updateScrollCue);
    };
  }, [body, updateScrollCue]);

  useEffect(() => {
    updateScrollCue();
  }, [expanded, updateScrollCue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (expanded) {
        e.preventDefault();
        setExpanded(false);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onClose]);

  return (
    <div
      className="line-result-overlay z-[80]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="line-result-title"
      data-result-kind={kind}
      data-result-actions={showPrimary ? 2 : 1}
      onClick={onClose}
    >
      <div className="line-result-dim" aria-hidden />
      <div
        className={`line-result-sheet${isWrong ? " line-result-sheet--wrong" : ""}${
          expanded ? " line-result-sheet--expanded" : ""
        }`}
        data-result-sheet
        data-result-expanded={expanded ? "1" : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div>
            <h2
              id="line-result-title"
              className={`m-0 pr-2 font-display text-lg font-bold leading-snug${
                isWrong ? " text-danger" : ""
              }`}
            >
              {title}
            </h2>
            {caption ? (
              <p className="m-0 mt-1 text-[0.82rem] font-semibold text-fg-muted">
                {caption}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg-muted"
              aria-label={expanded ? t("Shrink") : t("Expand")}
              data-result-expand
            >
              {expanded ? (
                <Minimize2 className="size-4" strokeWidth={2.25} aria-hidden />
              ) : (
                <Maximize2 className="size-4" strokeWidth={2.25} aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-bg-subtle text-fg-muted"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {body ? (
          <div
            className="line-result-body-wrap"
            data-result-scrollable={hasOverflow ? "1" : undefined}
          >
            <div ref={bodyRef} className="line-result-body space-y-3 px-5 py-3">
              {body.split(/\n\n+/).map((para) => (
                <p
                  key={para.slice(0, 48)}
                  className="m-0 text-[0.92rem] leading-relaxed text-fg-muted"
                >
                  {para}
                </p>
              ))}
            </div>
            {moreBelow ? (
              <div className="line-result-scroll-cue" aria-hidden>
                <div className="line-result-scroll-fade" />
                <div className="line-result-scroll-hint">
                  <span>{t("Scroll for more")}</span>
                  <ChevronDown className="size-3.5" strokeWidth={2.25} />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        <div
          className={`shrink-0 border-t border-border px-5 py-3${showPrimary ? " space-y-2" : ""}`}
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
            onClick={handleAction}
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