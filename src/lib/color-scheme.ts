import { isPlayWrap, PLAY_PACKAGE, PLAY_UA_TOKEN } from "@/lib/play-app";

export const COLOR_SCHEMES = ["light", "dark"] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_SCHEME_STORAGE_KEY = "opening-lab:color-scheme";
export const DEFAULT_COLOR_SCHEME: ColorScheme = "light";

const EVENT = "opening-lab:color-scheme";

/**
 * Runs before first paint. Stored light/dark wins. When the key is missing,
 * the Play wrap (OpeningLabPlay UA or android-app referrer) starts dark and
 * the website stays light. Does not write localStorage.
 */
export const COLOR_SCHEME_BOOT_SCRIPT = `(() => {
  try {
    var stored = localStorage.getItem(${JSON.stringify(COLOR_SCHEME_STORAGE_KEY)});
    var ua = navigator.userAgent || "";
    var ref = document.referrer || "";
    var play = ua.indexOf(${JSON.stringify(PLAY_UA_TOKEN)}) !== -1 || /^android-app:\\/\\/${PLAY_PACKAGE.replace(/\./g, "\\.")}([/?#]|$)/i.test(ref);
    var scheme = stored === "light" || stored === "dark" ? stored : (play ? "dark" : ${JSON.stringify(DEFAULT_COLOR_SCHEME)});
    document.documentElement.dataset.colorScheme = scheme;
  } catch (e) {}
})();`;

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

function readStoredColorScheme(): ColorScheme | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    return isColorScheme(value) ? value : null;
  } catch {
    return null;
  }
}

/** Website default is light. Play wrap defaults to dark only when unset. */
export function defaultColorScheme(): ColorScheme {
  if (typeof window !== "undefined" && isPlayWrap()) return "dark";
  return DEFAULT_COLOR_SCHEME;
}

export function getColorScheme(): ColorScheme {
  return readStoredColorScheme() ?? defaultColorScheme();
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

/** Read stored scheme (or the surface default) and sync dataset. Does not write storage. */
export function initColorScheme(): () => void {
  applyColorScheme(getColorScheme());
  return subscribeColorScheme(() => {
    applyColorScheme(getColorScheme());
  });
}
