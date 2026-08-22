import { Link } from "@tanstack/react-router";
import { LegalFooter } from "./legal-footer";

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

      <Block title="Free openings">
        <strong>Scotch Gambit</strong> — 5 book lines + 2 traps.
        <br />
        <strong>Italian Game</strong> — 5 book lines + 3 traps.
        <br />
        <strong>Ruy Lopez</strong> — 5 book lines + 2 traps.
        <br />
        <strong>King’s Gambit</strong> — 5 book lines + 1 trap.
        <br />
        <strong>Vienna Game</strong> — 5 book lines + 1 trap.
        <br />
        <strong>Scotch Game</strong> — 5 book lines + 1 trap.
        <br />
        <strong>Open Sicilian</strong> — 5 book lines + 1 trap.
        <br />
        <strong>French Defence</strong> — 5 book lines + 1 trap.
        <br />
        All eight are free.
      </Block>

      <Block title="White & Black / Special packs">
        Each pack trains one opening. You play the book side.
      </Block>

      <Block title="Practice mode">
        Yellow hints show the next move. The opponent replies automatically.
        Follow the exact line. Practice does not complete the line.
      </Block>

      <Block title="Test mode">
        No hints. Play your side only. Wrong squares flash red until you find
        the book move. A clean Test (zero mistakes) turns the line green.
      </Block>

      <Block title="Reviews">
        A clean Test turns the line green. You can train it again anytime.
      </Block>

      <Block title="Account">
        Use the profile icon (top right) to sign in. See{" "}
        <Link to="/privacy" className="font-semibold text-accent">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="font-semibold text-accent">
          Terms
        </Link>
        .
      </Block>

      <LegalFooter />
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
