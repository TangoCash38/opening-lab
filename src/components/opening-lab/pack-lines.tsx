import { ChevronDown, Lock } from "lucide-react";
import type { OpeningLine } from "@/data/packs";
import type { Mastery } from "@/lib/progress";
import { useT } from "@/lib/i18n";
import { MasteryChip } from "./mastery-chip";

/** Shared expand cue — same look on Scotch and every paid pack. */
export function PackExpandHint({
  open,
  free = false,
  closedLabel,
}: {
  open: boolean;
  free?: boolean;
  closedLabel?: string;
}) {
  const t = useT();
  const label = open
    ? t("Tap to hide")
    : closedLabel
      ? closedLabel
      : free
        ? t("Free · tap to see lines")
        : t("Tap to see lines");

  return (
    <span
      className={`mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 px-3 text-[0.95rem] font-bold ${
        open
          ? "border-border bg-bg-subtle text-fg-muted"
          : "border-accent bg-accent/14 text-accent"
      }`}
    >
      <ChevronDown
        className={`size-5 shrink-0 transition-transform duration-150 ${
          open ? "rotate-180" : ""
        }`}
        strokeWidth={2.75}
        aria-hidden
      />
      {label}
    </span>
  );
}

type LineRowProps = {
  index: number;
  line: OpeningLine;
  complete: boolean;
  mastery: Mastery;
  locked: boolean;
  showFree?: boolean;
  /** Test progress % from lineTestPercent; null = not started in Test. */
  testPercent?: number | null;
  onClick: () => void;
};

/** Shared line row — locked red, natural until a clean Test, then green. */
export function LineRow({
  index,
  line,
  complete,
  mastery,
  locked,
  showFree = false,
  testPercent = null,
  onClick,
}: LineRowProps) {
  const t = useT();
  const showPct = !locked && testPercent != null;
  return (
    <button
      type="button"
      className={`mb-1.5 flex w-full items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-left ${
        locked
          ? "border-danger bg-danger-soft text-fg active:scale-[0.99]"
          : complete
            ? "border-success/35 bg-success-soft/55 active:scale-[0.99]"
            : "border-border bg-bg-elevated active:scale-[0.99]"
      }`}
      onClick={onClick}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${
          locked
            ? "bg-danger text-white"
            : complete
              ? "bg-success text-white"
              : "bg-bg-subtle text-fg"
        }`}
      >
        {index + 1}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-[0.88rem] font-semibold">
          <span className="min-w-0 break-words">{line.name}</span>
          {locked ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger px-1.5 py-0.5 text-[0.65rem] font-semibold text-white">
              <Lock className="size-3" strokeWidth={2.5} aria-hidden />
              {t("Locked")}
            </span>
          ) : showFree ? (
            <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-success">
              {t("Free")}
            </span>
          ) : null}
          {!locked && !complete ? <MasteryChip mastery={mastery} /> : null}
          {showPct ? (
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold tabular-nums ${
                complete
                  ? "bg-success text-white"
                  : "bg-accent/14 text-accent"
              }`}
            >
              {t("{pct}%", { pct: testPercent })}
            </span>
          ) : null}
        </div>
        {line.players ? (
          <div className="mt-0.5 text-[0.72rem] text-fg-muted">
            White {line.players.white} · Black {line.players.black}
          </div>
        ) : null}
        {!locked ? (
          <p
            className={`mt-0.5 text-[0.72rem] font-semibold ${
              complete ? "text-success" : "text-fg-muted"
            }`}
          >
            {complete
              ? t("Complete — train any time")
              : t("Test with no mistakes to complete")}
          </p>
        ) : null}
      </div>
    </button>
  );
}
