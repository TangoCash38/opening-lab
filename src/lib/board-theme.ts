export const BOARD_THEMES = ["book", "paper", "future"] as const;
export type BoardTheme = (typeof BOARD_THEMES)[number];

export const BOARD_THEME_STORAGE_KEY = "opening-lab:board-theme";
export const DEFAULT_BOARD_THEME: BoardTheme = "book";

const EVENT = "opening-lab:board-theme";

export function isBoardTheme(
  value: string | null | undefined,
): value is BoardTheme {
  return value === "book" || value === "paper" || value === "future";
}

/** Unknown / missing → book. */
export function normalizeBoardTheme(
  value: string | null | undefined,
): BoardTheme {
  return isBoardTheme(value) ? value : DEFAULT_BOARD_THEME;
}

export function getBoardTheme(): BoardTheme {
  if (typeof localStorage === "undefined") return DEFAULT_BOARD_THEME;
  try {
    return normalizeBoardTheme(localStorage.getItem(BOARD_THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_BOARD_THEME;
  }
}

export function applyBoardTheme(theme: BoardTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.boardTheme = theme;
}

export function setBoardTheme(theme: BoardTheme): void {
  const next = normalizeBoardTheme(theme);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(BOARD_THEME_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }
  applyBoardTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function subscribeBoardTheme(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Read stored theme and sync dataset; keep in sync on changes. */
export function initBoardTheme(): () => void {
  applyBoardTheme(getBoardTheme());
  return subscribeBoardTheme(() => {
    applyBoardTheme(getBoardTheme());
  });
}
