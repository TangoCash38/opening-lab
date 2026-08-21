import { ChevronDown } from "lucide-react";
import { isPunishLine, type OpeningLine } from "@/data/packs";
import type { Mastery } from "@/lib/progress";
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
  const label = open
    ? "Tap to hide"
    : closedLabel
      ? closedLabel
      : free
        ? "Free · tap to see lines"
        : "Tap to see lines";

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
  onClick: () => void;
};

/** Shared line row — red until a clean Test, no moves on the card. */
export function LineRow({
  index,
  line,
  complete,
  mastery,
  locked,
  showFree = false,
  onClick,
}: LineRowProps) {
  return (
    <button
      type="button"
      className={`mb-1.5 flex w-full items-start gap-2.5 rounded-xl border-[1.5px] px-3 py-2.5 text-left active:scale-[0.99] ${
        complete
          ? "border-success/35 bg-success-soft/55"
          : "border-danger bg-danger-soft"
      }`}
      onClick={onClick}
    >
      <span
        className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${
          complete ? "bg-success" : "bg-danger"
        }`}
      >
        {index + 1}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-[0.88rem] font-semibold">
          <span className="min-w-0 break-words">{line.name}</span>
          {isPunishLine(line) ? (
            <span className="rounded-full bg-accent/14 px-1.5 py-0.5 text-[0.65rem] font-semibold text-accent">
              Spot the move
            </span>
          ) : null}
          {showFree ? (
            <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[0.65rem] font-semibold text-success">
              Free
            </span>
          ) : null}
          {!locked && !complete ? <MasteryChip mastery={mastery} /> : null}
        </div>
        {line.players ? (
          <div className="mt-0.5 text-[0.72rem] text-fg-muted">
            White {line.players.white} · Black {line.players.black}
          </div>
        ) : null}
        {!locked ? (
          <p
            className={`mt-0.5 text-[0.72rem] font-semibold ${
              complete ? "text-success" : "text-danger"
            }`}
          >
            {complete
              ? "Complete — train any time"
              : "Test with no mistakes to complete"}
          </p>
        ) : null}
      </div>
    </button>
  );
}
