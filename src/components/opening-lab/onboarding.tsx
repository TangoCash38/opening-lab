type Props = {
  onStartScotch: () => void;
  onSkip: () => void;
};

export function Onboarding({ onStartScotch, onSkip }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-2xl">
        <div className="px-5 pb-5 pt-6">
          <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-fg-subtle">
            Opening Lab
          </p>
          <h2
            id="onboard-title"
            className="mt-2 font-display text-[1.55rem] font-bold leading-tight tracking-tight"
          >
            Wrong moves are rejected. That’s the point.
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-fg-muted">
            Only the book move counts. Miss the square and it flashes red. The
            opponent replies for you. That’s how the line sticks.
          </p>
          <button
            type="button"
            onClick={onStartScotch}
            className="mt-5 min-h-12 w-full rounded-2xl bg-accent px-4 py-3.5 text-[0.95rem] font-bold text-accent-fg active:scale-[0.99]"
          >
            Start Scotch Line 1
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 min-h-11 w-full rounded-2xl px-4 py-2.5 text-[0.88rem] font-semibold text-fg-muted active:scale-[0.99]"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
