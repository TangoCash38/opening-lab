import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LegalFooter } from "./legal-footer";
import { useT } from "@/lib/i18n";
import {
  BOARD_THEMES,
  getBoardTheme,
  setBoardTheme,
  subscribeBoardTheme,
  type BoardTheme,
} from "@/lib/board-theme";

type Props = { onBack: () => void };

const THEME_SWATCH: Record<
  BoardTheme,
  { light: string; dark: string; frame: string }
> = {
  book: { light: "#f3e5c8", dark: "#a97850", frame: "#6a4b32" },
  paper: { light: "#f7f2e6", dark: "#b7b0a4", frame: "#5c564c" },
  future: { light: "#d8e2ea", dark: "#3a4a5c", frame: "#1e2936" },
};

export function GuideView({ onBack }: Props) {
  const t = useT();
  const [theme, setTheme] = useState<BoardTheme>("book");

  useEffect(() => {
    setTheme(getBoardTheme());
    return subscribeBoardTheme(() => setTheme(getBoardTheme()));
  }, []);

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

      <Block title={t("Board")}>
        <div className="board-theme-picker" role="group" aria-label={t("Board")}>
          {BOARD_THEMES.map((id) => {
            const sw = THEME_SWATCH[id];
            const selected = theme === id;
            return (
              <button
                key={id}
                type="button"
                className={
                  selected
                    ? "board-theme-card board-theme-card-selected"
                    : "board-theme-card"
                }
                aria-pressed={selected}
                onClick={() => {
                  setBoardTheme(id);
                  setTheme(id);
                }}
              >
                <span
                  className="board-theme-preview"
                  style={{ borderColor: sw.frame, background: sw.frame }}
                  aria-hidden
                >
                  <span style={{ background: sw.light }} />
                  <span style={{ background: sw.dark }} />
                  <span style={{ background: sw.dark }} />
                  <span style={{ background: sw.light }} />
                </span>
                <span className="board-theme-label">
                  {id === "book"
                    ? t("Book")
                    : id === "paper"
                      ? t("Paper")
                      : t("Future")}
                </span>
              </button>
            );
          })}
        </div>
      </Block>

      <Block title={t("White & Black / Special packs")}>
        {t("Each pack trains one opening. You play the book side.")}
      </Block>

      <Block title={t("Practice mode")}>
        {t("Yellow hints show the next move. The opponent replies automatically. Follow the exact line. Practice does not complete the line.")}
      </Block>

      <Block title={t("Test mode")}>
        {t("No hints. Play your side only. Wrong squares flash red until you find the book move. A clean Test (zero mistakes) turns the line green. If you think a rejected move is book, send it with Wrong move? If we confirm it, you get a pack free.")}
      </Block>

      <Block title={t("Play on")}>
        {t("After Practice or Test, pick 800, 1200, or 1800 and Play on from the setup. A clean Test still turns the line green. Play on does not complete the line.")}
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
