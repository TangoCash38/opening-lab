/**
 * Packs, profiles, and comments stay on Opening Lab.
 * A website address in those fields is treated as a purchase link.
 * Email fields are not passed here, because an address contains a host.
 */

const SCHEME = /(?:https?:\/\/|www\.)/i;
const TRACKING = /\b(?:ref|aff)=|\butm_/i;
const HOST =
  /\b(?:[a-z0-9-]+\.)+(?:co\.uk|com|org|net|io|uk|app|shop|store|gg|tv|me|link|ly|info|biz|xyz|online|site|club|page|dev)\b/i;

export const NO_PURCHASE_LINK =
  "Leave website addresses out. Players buy on Opening Lab, on the website or in the app.";

export function hasPurchaseLink(value: string): boolean {
  return SCHEME.test(value) || TRACKING.test(value) || HOST.test(value);
}

export function purchaseLinkMessage(value: string): string | null {
  return hasPurchaseLink(value) ? NO_PURCHASE_LINK : null;
}

export function firstPurchaseLink(values: readonly string[]): string | null {
  for (const value of values) {
    const message = purchaseLinkMessage(value);
    if (message) return message;
  }
  return null;
}
