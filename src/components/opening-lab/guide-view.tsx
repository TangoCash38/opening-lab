import { Link } from "@tanstack/react-router";
import { LegalFooter } from "./legal-footer";
import { useT } from "@/lib/i18n";

type Props = { onBack: () => void };

export function GuideView({ onBack }: Props) {
  const t = useT();

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 rounded-full bg-bg-subtle px-4 py-2 text-[0.82rem] font-semibold text-fg-muted"
      >
        {t("← Back")}
      </button>
      <h1 className="mb-4 font-display text-[1.65rem] font-bold tracking-tight">
        {t("User guide")}
      </h1>

      <Block title={t("What is Opening Lab?")}>
        {t("Strict-line memory training. You play only the moves in the chosen opening; wrong moves are rejected so the line sticks.")}
      </Block>

      <Block title={t("White & Black / Special packs")}>
        {t("Each pack trains one opening. You play the book side.")}
      </Block>

      <Block title={t("Practice mode")}>
        {t("Green hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.")}
      </Block>

      <Block title={t("Test mode")}>
        {t("No hints. Play your side only. Wrong squares flash red until you find the book move. Pack-list % is a Test streak of correct book moves from the start of that Test; a wrong move freezes the % there. 100% / green only after a clean Test with zero mistakes. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.")}
      </Block>

      <Block title={t("Play on")}>
        {t("After Practice or Test, pick Level 1, 2, or 3 and Play on from the setup. Level 1 is about 800 strength, Level 2 about 1200, Level 3 about 1800. A clean Test still turns the line green. Play on does not complete the line. Play on is also on the finish sheet. Hint shows a stronger suggestion from the same engine (not Stockfish).")}
      </Block>

      <Block title={t("Reviews")}>
        {t("A clean Test turns the line green. You can train it again anytime.")}
      </Block>

      <Block title={t("Account")}>
        {t("Use the profile icon (top right) to sign in. See")}{" "}
        <Link to="/privacy" className="font-semibold text-accent">
          {t("Privacy Policy")}
        </Link>{" "}
        {t("and")}{" "}
        <Link to="/terms" className="font-semibold text-accent">
          {t("Terms")}
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
      {typeof children === "string" ? (
        <p className="m-0 text-[0.9rem] leading-relaxed text-fg-muted">
          {children}
        </p>
      ) : (
        <div className="text-[0.9rem] leading-relaxed text-fg-muted">
          {children}
        </div>
      )}
    </div>
  );
}
