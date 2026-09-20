/**
 * Client helper for native Play Billing (Path B).
 * Mobile POSTs one-time tokens to POST /api/play/subscribe (same-origin, session).
 */
import { PLAY_PACKAGE, PLAY_SKU_NOT_ON_SALE } from "@/lib/play-app";
import {
  normalizeUnlockState,
  replaceUnlocks,
  type UnlockState,
} from "@/lib/unlocks";

export type PlayNativeResult = {
  ok: boolean;
  action?: string;
  packageName?: string;
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  code?: string;
  error?: string;
};

type PlayBridge = {
  buyLabPlusYearly?: () => void;
  restoreLabPlus?: () => void;
};

type PlayWindow = Window & {
  OpeningLabPlay?: PlayBridge;
  __openingLabPlayBilling?: (result: PlayNativeResult) => void;
};

export function hasPlayBillingBridge(
  win: PlayWindow | undefined = typeof window === "undefined" ? undefined : window,
): boolean {
  return typeof win?.OpeningLabPlay?.buyLabPlusYearly === "function";
}

function nativeCall(method: "buy" | "restore"): Promise<PlayNativeResult> {
  const w = window as PlayWindow;
  const bridge = w.OpeningLabPlay;
  if (!bridge || typeof bridge.buyLabPlusYearly !== "function") {
    return Promise.reject(new Error("This app build cannot open Google Play Billing yet."));
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("Google Play did not respond. Try again."));
    }, 180_000);
    const handler = (result: PlayNativeResult) => {
      cleanup();
      resolve(result && typeof result === "object" ? result : { ok: false, error: "Bad billing result" });
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      if (w.__openingLabPlayBilling === handler) {
        try {
          delete w.__openingLabPlayBilling;
        } catch {
          w.__openingLabPlayBilling = undefined;
        }
      }
    };
    w.__openingLabPlayBilling = handler;
    try {
      if (method === "buy") bridge.buyLabPlusYearly?.();
      else bridge.restoreLabPlus?.();
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error("Play Billing failed"));
    }
  });
}

/**
 * Confirm a Play purchase. Mobile POSTs
 * `{ packageName, productId, purchaseToken, orderId? }` to /api/play/subscribe.
 * Restore is one POST per { productId, purchaseToken }.
 */
export async function confirmPlayPurchase(input: {
  purchaseToken: string;
  productId: string;
  packageName?: string;
  orderId?: string;
}): Promise<UnlockState> {
  const res = await fetch("/api/play/subscribe", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packageName: input.packageName ?? PLAY_PACKAGE,
      productId: input.productId,
      purchaseToken: input.purchaseToken,
      orderId: input.orderId,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<UnlockState> & {
    error?: string;
    code?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not confirm this Google Play purchase");
  }
  const unlocks = normalizeUnlockState({
    ...data,
    playBilled: data.playBilled !== false,
  });
  replaceUnlocks(unlocks);
  return unlocks;
}

export async function confirmPlaySubscribe(input: {
  purchaseToken: string;
  productId: string;
  packageName?: string;
  orderId?: string;
}): Promise<UnlockState> {
  return confirmPlayPurchase(input);
}

function friendlyNativeError(result: PlayNativeResult): Error {
  if (result.code === "ITEM_UNAVAILABLE" || result.code === "FEATURE_NOT_SUPPORTED") {
    return new Error(PLAY_SKU_NOT_ON_SALE);
  }
  return new Error(result.error ?? PLAY_SKU_NOT_ON_SALE);
}

/** Native yearly helpers remain for the existing bridge; Path B does not grant Lab+. */
export async function startPlayLabPlusYearly(): Promise<UnlockState | null> {
  const result = await nativeCall("buy");
  if (!result.ok) {
    if (result.code === "USER_CANCELED") return null;
    throw friendlyNativeError(result);
  }
  if (!result.purchaseToken || !result.productId) {
    throw new Error("Google Play did not return a purchase.");
  }
  return confirmPlayPurchase({
    purchaseToken: result.purchaseToken,
    productId: result.productId,
    packageName: result.packageName,
    orderId: result.orderId,
  });
}

export async function restorePlayLabPlus(): Promise<UnlockState> {
  const result = await nativeCall("restore");
  if (!result.ok) {
    throw friendlyNativeError(result);
  }
  if (!result.purchaseToken || !result.productId) {
    throw new Error("No Play purchase to restore.");
  }
  return confirmPlayPurchase({
    purchaseToken: result.purchaseToken,
    productId: result.productId,
    packageName: result.packageName,
    orderId: result.orderId,
  });
}
