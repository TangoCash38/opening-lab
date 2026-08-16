import { PACKS, type OpeningLine, type Pack } from "@/data/packs";
import { useProgress } from "@/hooks/use-progress";
import { useUnlocks } from "@/hooks/use-unlocks";

type Props = {
  onStartLine: (pack: Pack, line: OpeningLine, mode?: "learn" | "practice") => void;
  onTrainDue: () => void;
};

export function accessibleCandidates(
  canAccess: (pack: Pack) => boolean,
): { packId: string; lineId: string }[] {
  const out: { packId: string; lineId: string }[] = [];
  for (const pack of PACKS) {
    if (!canAccess(pack)) continue;
    for (const line of pack.lines) out.push({ packId: pack.id, lineId: line.id });
  }
  return out;
}

function findLine(packId: string, lineId: string): { pack: Pack; line: OpeningLine } | null {
  const pack = PACKS.find((p) => p.id === packId);
  const line = pack?.lines.find((l) => l.id === lineId);
  if (!pack || !line) return null;
  return { pack, line };
}

export function TodayStrip({ onStartLine, onTrainDue }: Props) {
  const { streak, unused, dueQueue } = useProgress();
  const { canAccess } = useUnlocks();
  const candidates = accessibleCandidates(canAccess);
  const queue = dueQueue(candidates);
  const dueCount = queue.length;
  const suggestion = unused(candidates);
  const suggested = suggestion ? findLine(suggestion.packId, suggestion.lineId) : null;

  return (
    <section
      className="mb-5 overflow-hidden rounded-[calc(var(--radius-card)+2px)] border-[1.5px] border-accent/25 bg-bg-elevated shadow-[var(--shadow-card)]"
      aria-label="Today"
    >
      <div className="px-4 pb-4 pt-3.5">
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          Today
        </p>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <div>
            <div className="font-display text-[2rem] font-bold leading-none tracking-tight">
              {streak}
            </div>
            <div className="mt-1 text-[0.78rem] font-semibold text-fg-muted">
              day streak
            </div>
          </div>
          <div className="pb-0.5">
            <div className="text-[1.05rem] font-bold">
              {dueCount === 0
                ? "Caught up"
                : dueCount === 1
                  ? "1 line due"
                  : `${dueCount} lines due`}
            </div>
            <div className="text-[0.75rem] text-fg-subtle">
              {dueCount === 0
                ? "No reviews waiting"
                : "Missed Practice lines come first"}
            </div>
          </div>
        </div>

        {dueCount > 0 ? (
          <button
            type="button"
            onClick={onTrainDue}
            className="mt-3.5 min-h-12 w-full rounded-2xl bg-accent px-4 py-3 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
          >
            Train due lines
          </button>
        ) : (
          <div className="mt-3.5 rounded-2xl bg-success-soft px-4 py-3">
            <p className="m-0 text-[0.92rem] font-bold text-success">
              Nice — you’re caught up
            </p>
            {suggested ? (
              <button
                type="button"
                onClick={() => onStartLine(suggested.pack, suggested.line, "learn")}
                className="mt-2 min-h-11 w-full rounded-xl bg-bg-elevated px-3 py-2.5 text-left text-[0.85rem] font-semibold text-fg active:scale-[0.99]"
              >
                Try a new line · {suggested.pack.name} · {suggested.line.name}
              </button>
            ) : (
              <p className="m-0 mt-1 text-[0.8rem] text-fg-muted">
                Every unlocked line has been started. Open a pack to keep going.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
