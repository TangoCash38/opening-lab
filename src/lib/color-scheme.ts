export const COLOR_SCHEMES = ["light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_SCHEME_STORAGE_KEY = "opening-lab:color-scheme";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

const EVENT = "opening-lab:color-scheme";

export function isColorScheme(
  value: string | null | undefined,
): value is ColorScheme {
  return value === "light" || value === "dark";
}

/** Unknown / missing → light. */
export function normalizeColorScheme(
  value: string | null | undefined,
): ColorScheme {
  return isColorScheme(value) ? value : DEFAULT_COLOR_SCHEME;
}

export function getColorScheme(): ColorScheme {
  if (typeof localStorage === "undefined") return DEFAULT_COLOR_SCHEME;
  try {
    return normalizeColorScheme(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY));
  } catch {
    return DEFAULT_COLOR_SCHEME;
  }
}

export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.colorScheme = scheme;
}

export function setColorScheme(scheme: ColorScheme): void {
  const next = normalizeColorScheme(scheme);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }
  applyColorScheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

export function subscribeColorScheme(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** Read stored scheme and sync dataset; keep in sync on changes. */
export function initColorScheme(): () => void {
  applyColorScheme(getColorScheme());
  return subscribeColorScheme(() => {
    applyColorScheme(getColorScheme());
  });
}
