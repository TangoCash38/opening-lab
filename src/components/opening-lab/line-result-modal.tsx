import { ChevronDown, Maximize2, Minimize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

type PlayOnLevelOption = {
  id: string;
  label: string;
  aria?: string;
};

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
  /** Stronger dim when the trainer board is fullscreen behind the popup. */
  boardExpanded?: boolean;
  /** Play on controls for end sheets only (Line complete / Practice done / missed). */
  playOnLevels?: PlayOnLevelOption[];
  playOnLevel?: string;
  onPlayOnLevel?: (id: string) => void;
  onPlayOn?: () => void;
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
  boardExpanded = false,
  playOnLevels,
  playOnLevel,
  onPlayOnLevel,
  onPlayOn,
}: Props) {
  const t = useT();
  const showPrimary = Boolean(primaryLabel && onPrimary);
  const showPlayOn =
    kind === "end" &&
    Boolean(playOnLevels?.length && onPlayOn && onPlayOnLevel);
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
      <div
        className={`line-result-dim${boardExpanded ? " line-result-dim--board-fs" : ""}`}
        aria-hidden
        data-result-dim-board-fs={boardExpanded ? "1" : undefined}
      />
      <div
        className={`line-result-sheet${isWrong ? " line-result-sheet--wrong" : ""}${
          showPlayOn ? " line-result-sheet--play-on" : ""
        }${expanded ? " line-result-sheet--expanded" : ""}`}
        data-result-sheet
        data-result-expanded={expanded ? "1" : undefined}
        data-result-has-play-on={showPlayOn ? "1" : undefined}
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
          className={`shrink-0 border-t border-border px-5${
            showPlayOn ? " py-2 space-y-1.5" : showPrimary ? " py-3 space-y-2" : " py-3"
          }`}
        >
          {showPlayOn ? (
            <div className="line-result-play-on" data-result-play-on>
              <div
                className="play-level-row"
                role="group"
                aria-label="Computer strength"
              >
                {playOnLevels!.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => onPlayOnLevel?.(level.id)}
                    className={`play-level-chip${
                      playOnLevel === level.id ? " is-on" : ""
                    }`}
                    aria-label={level.aria ?? level.label}
                    aria-pressed={playOnLevel === level.id}
                  >
                    {level.label}
                  </button>
                ))}
                <button
                  type="button"
                  data-result-play-on-btn
                  onClick={onPlayOn}
                  className="play-on-btn"
                >
                  Play on
                </button>
              </div>
            </div>
          ) : null}
          {showPrimary ? (
            <button
              type="button"
              data-result-primary
              onClick={onPrimary}
              className={
                showPlayOn
                  ? "min-h-10 w-full rounded-xl bg-accent px-3 py-2 text-[0.85rem] font-bold text-accent-fg active:scale-[0.99]"
                  : "min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
              }
            >
              {primaryLabel}
            </button>
          ) : null}
          <button
            type="button"
            data-result-dismiss
            onClick={handleAction}
            className={
              showPlayOn
                ? "min-h-8 w-full rounded-xl px-3 py-1.5 text-[0.8rem] font-semibold text-fg-muted active:opacity-70"
                : showPrimary
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