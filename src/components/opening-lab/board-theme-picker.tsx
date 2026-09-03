import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import {
  BOARD_THEMES,
  getBoardTheme,
  setBoardTheme,
  subscribeBoardTheme,
  type BoardTheme,
} from "@/lib/board-theme";

const THEME_SWATCH: Record<
  BoardTheme,
  { light: string; dark: string; frame: string }
> = {
  book: { light: "#f3e5c8", dark: "#a97850", frame: "#6a4b32" },
  paper: { light: "#f7f2e6", dark: "#b7b0a4", frame: "#5c564c" },
  future: { light: "#d8e2ea", dark: "#3a4a5c", frame: "#1e2936" },
  newspaper: { light: "#ead9a0", dark: "#454540", frame: "#111111" },
};

function themeLabel(id: BoardTheme, t: (key: string) => string): string {
  if (id === "book") return t("Book");
  if (id === "paper") return t("Paper");
  if (id === "future") return t("Future");
  return t("Newspaper");
}

type Props = {
  compact?: boolean;
  className?: string;
};

export function BoardThemePicker({ compact, className }: Props) {
  const t = useT();
  const [theme, setTheme] = useState<BoardTheme>("book");

  useEffect(() => {
    setTheme(getBoardTheme());
    return subscribeBoardTheme(() => setTheme(getBoardTheme()));
  }, []);

  const rootClass = [
    "board-theme-picker",
    "pointer-events-auto",
    compact ? "board-theme-picker-compact" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass} role="group" aria-label={t("Board")}>
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
            aria-label={themeLabel(id, t)}
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
            <span className="board-theme-label">{themeLabel(id, t)}</span>
          </button>
        );
      })}
    </div>
  );
}
