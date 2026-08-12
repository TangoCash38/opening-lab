type Props = { onBack: () => void };

export function GuideView({ onBack }: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        ← Back
      </button>
      <h1 className="mb-4 font-display text-[1.65rem] font-bold tracking-tight">
        User guide
      </h1>

      <Block title="What is Opening Lab?">
        Strict-line memory training. You play only the moves in the chosen
        opening; wrong moves are rejected so the line sticks.
      </Block>

      <Block title="Free pack">
        <strong>Scotch Gambit</strong> is free — all 10 lines unlock with no
        purchase. Use it to learn the app and train every day.
      </Block>

      <Block title="Premium packs & pricing">
        Every other pack is premium:
        <br />• <strong>5-line packs</strong> — £1
        <br />• <strong>Longer packs</strong> (8–10 lines) — £1.99
        <br />• <strong>All-Access Pass</strong> — £9.99 (every pack + future
        games)
        <br />
        Locked packs show a lock icon and price badge. Tap to unlock for this
        device.
      </Block>

      <Block title="White & Black sections">
        White packs train as White (you move first in the line). Black packs
        train replies as Black. Special packs mix practical club systems.
      </Block>

      <Block title="Learn mode">
        Green hints show the next move. The opponent replies automatically.
        Follow the exact line.
      </Block>

      <Block title="Practice mode">
        No hints. Play your side only. Wrong squares flash red until you find
        the book move.
      </Block>

      <Block title="Account">
        Use the profile icon (top right) to sign in. Unlocks on this device are
        stored locally for the demo.
      </Block>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 rounded-[var(--radius-card)] border border-border bg-bg-elevated px-4 py-4">
      <h3 className="m-0 mb-1.5 text-base font-semibold">{title}</h3>
      <p className="m-0 text-[0.9rem] leading-relaxed text-fg-muted">{children}</p>
    </div>
  );
}
