/**
 * Detect the Google Play app wrap (package uk.co.openinglab).
 *
 * The Play wrapper is an in-app WebView that appends OpeningLabPlay to its
 * user-agent, or an android-app://uk.co.openinglab referrer. Website Chrome
 * on a phone — including a visible URL bar and Add-to-Home-Screen / standalone
 * PWA — is not Play. That is Stripe. Digital Goods API alone is not Play.
 *
 * Remember a positive UA/referrer hit in sessionStorage only (not localStorage).
 * If the current UA/referrer is not Play, clear that flag so a leftover
 * session from a wrong hit cannot poison Chrome.
 *
 * Play Console one-time IAPs (Path B): `pack_<pack_id_with_underscores>` and
 * `buy_all_packs`. No Lab+ / no subscriptions. Digital Goods will not work
 * in this raw System WebView — native BillingClient is required.
 */
export const PLAY_PACKAGE = "uk.co.openinglab";
export const PLAY_UA_TOKEN = "OpeningLabPlay";

/** @deprecated Path B does not sell Lab+. Kept so existing native strings compile. */
export const PLAY_SKU_YEARLY = "lab_plus_yearly";

export const PLAY_STORE_NOTICE =
  "Some packs are available now. More are coming with Professor Potato Pie. Paid packs are billed by Google Play.";

export const PLAY_SKU_NOT_ON_SALE = "This pack isn’t on sale in the store yet";

export type PlayWrapUnlocks = {
  packs: string[];
  plan: "monthly" | "yearly" | "buy_all" | null;
  expiresAt: number | null;
  playBilled?: boolean;
};

/** Play wrap may only honour Play-billed Lab+ yearly — never website Stripe packs/plan. */
export function isPlayBilledLabPlusActive(state: PlayWrapUnlocks): boolean {
  return (
    state.playBilled === true &&
    state.plan === "yearly" &&
    typeof state.expiresAt === "number" &&
    Date.now() < state.expiresAt
  );
}

/** Play-billed one-time Buy all (plan buy_all). */
export function isPlayBilledBuyAll(state: PlayWrapUnlocks): boolean {
  return state.playBilled === true && state.plan === "buy_all";
}

/** Play-billed individual packs (token-save-only / Stripe-only must not set playBilled). */
export function isPlayBilledPacksActive(state: PlayWrapUnlocks): boolean {
  return state.playBilled === true && Array.isArray(state.packs) && state.packs.length > 0;
}

/** Play-granted Path B entitlement the wrap may honour (packs or buy_all). */
export function isPlayBilledUnlockActive(state: PlayWrapUnlocks): boolean {
  return isPlayBilledBuyAll(state) || isPlayBilledPacksActive(state);
}

/**
 * Play wrap unlocks: honour Play-billed packs[] and plan === "buy_all"
 * so GET /api/unlocks sync does not zero them. Stripe website plan/packs
 * without a Play billing marker are cleared. No Lab+.
 */
export function playWrapAccountUnlocks<T extends PlayWrapUnlocks>(state: T): T {
  if (state.playBilled !== true) {
    return { ...state, packs: [], plan: null, expiresAt: null, playBilled: false };
  }
  if (isPlayBilledBuyAll(state)) {
    return { ...state, plan: "buy_all", playBilled: true };
  }
  if (isPlayBilledPacksActive(state)) {
    return { ...state, plan: null, expiresAt: null, playBilled: true };
  }
  return { ...state, packs: [], plan: null, expiresAt: null, playBilled: false };
}

const SESSION_KEY = "opening-lab:is-play-app";

type DigitalGoodsWindow = Window & {
  getDigitalGoodsService?: (serviceId: string) => Promise<unknown>;
};

export function isPlayReferrer(referrer: string): boolean {
  const raw = referrer.trim();
  if (!raw || !/^android-app:/i.test(raw)) return false;
  try {
    const url = new URL(raw);
    return url.hostname.toLowerCase() === PLAY_PACKAGE;
  } catch {
    return new RegExp(`^android-app://${PLAY_PACKAGE.replace(/\./g, "\\.")}(/|$|\\?|#)`, "i").test(
      raw,
    );
  }
}

export function hasDigitalGoodsApi(
  win: DigitalGoodsWindow | undefined = typeof window === "undefined" ? undefined : window,
): boolean {
  return typeof win?.getDigitalGoodsService === "function";
}

export function isPlayUserAgent(ua: string): boolean {
  return typeof ua === "string" && ua.includes(PLAY_UA_TOKEN);
}

export function isAndroidStandaloneDisplay(
  win: Window | undefined = typeof window === "undefined" ? undefined : window,
): boolean {
  if (!win) return false;
  const ua = win.navigator?.userAgent ?? "";
  if (!/Android/i.test(ua)) return false;
  try {
    return (
      win.matchMedia("(display-mode: standalone)").matches ||
      win.matchMedia("(display-mode: fullscreen)").matches
    );
  } catch {
    return false;
  }
}

/**
 * Play wrap is OpeningLabPlay user-agent or android-app://uk.co.openinglab referrer only.
 *
 * Ignore remembered AND androidStandalone AND hasDigitalGoods. Those are not the
 * Play wrap: leftover sessionStorage, website Add-to-Home-Screen, or Digital Goods.
 * isPlayApp remembers a hard UA/referrer hit in sessionStorage, then clears it
 * when the current UA/referrer is not Play so Chrome cannot stay poisoned.
 */
export function detectPlayApp(input: {
  referrer?: string;
  hasDigitalGoods?: boolean;
  androidStandalone?: boolean;
  remembered?: boolean;
  userAgent?: string;
}): boolean {
  // Ignore remembered AND androidStandalone AND hasDigitalGoods.
  return isPlayUserAgent(input.userAgent ?? "") || isPlayReferrer(input.referrer ?? "");
}

function rememberPlayApp() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

function forgetPlayApp() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/** True only inside the Play app wrap. False on the website (desktop or phone Chrome). */
export function isPlayApp(): boolean {
  if (typeof window === "undefined") return false;
  const hit = detectPlayApp({
    referrer: document.referrer ?? "",
    userAgent: window.navigator?.userAgent ?? "",
  });
  if (hit) {
    rememberPlayApp();
    return true;
  }
  forgetPlayApp();
  return false;
}

/** Same as isPlayApp — OpeningLabPlay user agent / android-app referrer wrap. */
export function isPlayWrap(): boolean {
  return isPlayApp();
}

/**
 * Play Square Memory switch. The card is on unless this phone has hidden it.
 * Seven taps still toggles that. The public website ignores the flag.
 */
export const SQUARE_MEMORY_PLAY_PREVIEW_KEY = "opening-lab:square-memory-play-preview";
export const SQUARE_MEMORY_PREVIEW_TAPS = 7;
export const SQUARE_MEMORY_PREVIEW_TAP_WINDOW_MS = 8000;

export function readSquareMemoryPlayPreview(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    return localStorage.getItem(SQUARE_MEMORY_PLAY_PREVIEW_KEY) !== "0";
  } catch {
    return true;
  }
}

export function toggleSquareMemoryPlayPreview(): boolean {
  const next = !readSquareMemoryPlayPreview();
  try {
    localStorage.setItem(SQUARE_MEMORY_PLAY_PREVIEW_KEY, next ? "1" : "0");
  } catch {
    return readSquareMemoryPlayPreview();
  }
  return next;
}

/** Seven taps inside the window toggle the preview. A slower gap starts again. */
export function nextSquareMemoryPreviewTaps(
  previous: readonly number[],
  now: number,
): { taps: number[]; toggled: boolean } {
  const taps = previous.filter((stamp) => now - stamp < SQUARE_MEMORY_PREVIEW_TAP_WINDOW_MS);
  taps.push(now);
  if (taps.length >= SQUARE_MEMORY_PREVIEW_TAPS) return { taps: [], toggled: true };
  return { taps, toggled: false };
}
