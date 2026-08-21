/**
 * Detect the Google Play app wrap (package uk.co.openinglab).
 *
 * The Play wrapper is an in-app WebView that appends OpeningLabPlay to its
 * user-agent. A normal mobile Chrome visit to www.openinglab.co.uk is
 * display-mode:browser, has no OpeningLabPlay token, and has no
 * android-app:// referrer / Digital Goods API — that is not Play.
 * Remember a positive hit in sessionStorage only (not localStorage), so a later
 * Chrome tab on the same phone still gets website Stripe.
 *
 * Play Console: create subscription product `lab_plus_yearly` with a yearly
 * base plan in GBP. Digital Goods will
 * not work in this raw System WebView — native BillingClient is required.
 */
export const PLAY_PACKAGE = "uk.co.openinglab";
export const PLAY_UA_TOKEN = "OpeningLabPlay";

/** Play Console subscription product ID. Yearly base plan only, GBP. */
export const PLAY_SKU_YEARLY = "lab_plus_yearly";

export const PLAY_STORE_NOTICE =
  "Scotch is free. Lab+ yearly is billed by Google Play.";

export const PLAY_SKU_NOT_ON_SALE = "Lab+ isn’t on sale in the store yet";

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

export function detectPlayApp(input: {
  referrer?: string;
  hasDigitalGoods?: boolean;
  androidStandalone?: boolean;
  remembered?: boolean;
  userAgent?: string;
}): boolean {
  if (input.remembered) return true;
  if (isPlayReferrer(input.referrer ?? "")) return true;
  if (input.hasDigitalGoods) return true;
  if (isPlayUserAgent(input.userAgent ?? "")) return true;
  // TWA / standalone PWA on Android. Regular Chrome tabs are "browser".
  if (input.androidStandalone) return true;
  return false;
}

function rememberedPlayApp(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberPlayApp() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** True only inside the Play app wrap. False on the website (desktop or phone Chrome). */
export function isPlayApp(): boolean {
  if (typeof window === "undefined") return false;
  const hit = detectPlayApp({
    referrer: document.referrer ?? "",
    hasDigitalGoods: hasDigitalGoodsApi(window),
    androidStandalone: isAndroidStandaloneDisplay(window),
    remembered: rememberedPlayApp(),
    userAgent: window.navigator?.userAgent ?? "",
  });
  if (hit) rememberPlayApp();
  return hit;
}

/** Same as isPlayApp — OpeningLabPlay user agent / android-app referrer wrap. */
export function isPlayWrap(): boolean {
  return isPlayApp();
}
