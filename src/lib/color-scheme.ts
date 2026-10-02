export const COLOR_SCHEMES = ["light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_SCHEME_STORAGE_KEY = "opening-lab:color-scheme";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "dark";

const EVENT = "opening-lab:color-scheme";

const THEME_COLOR: Record<ColorScheme, string> = {
  dark: "#141210",
  light: "#f4efe6",
};

/**
 * Runs before first paint. A stored light or dark choice wins, including
 * inside the Play wrap. When the key is missing, the website and the Play
 * wrap both start dark. Does not write localStorage.
 */
export const COLOR_SCHEME_BOOT_SCRIPT = `(() => {
  var scheme = ${JSON.stringify(DEFAULT_COLOR_SCHEME)};
  try {
    var stored = localStorage.getItem(${JSON.stringify(COLOR_SCHEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") scheme = stored;
  } catch (e) {}
  try {
    document.documentElement.dataset.colorScheme = scheme;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", scheme === "light" ? "#f4efe6" : "#141210");
  } catch (e) {}
})();`;

export function isColorScheme(
  value: string | null | undefined,
): value is ColorScheme {
  return value === "light" || value === "dark";
}

/** Unknown / missing → dark. A stored "light" stays light. */
export function normalizeColorScheme(
  value: string | null | undefined,
): ColorScheme {
  return isColorScheme(value) ? value : DEFAULT_COLOR_SCHEME;
}

function readStoredColorScheme(): ColorScheme | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    return isColorScheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Website and Play wrap both start dark until this device stores a choice. */
export function defaultColorScheme(): ColorScheme {
  return DEFAULT_COLOR_SCHEME;
}

export function getColorScheme(): ColorScheme {
  return readStoredColorScheme() ?? defaultColorScheme();
}

export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.colorScheme = scheme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLOR[scheme]);
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

/** Read stored scheme (or the surface default) and sync dataset. Does not write storage. */
export function initColorScheme(): () => void {
  applyColorScheme(getColorScheme());
  return subscribeColorScheme(() => {
    applyColorScheme(getColorScheme());
  });
}
