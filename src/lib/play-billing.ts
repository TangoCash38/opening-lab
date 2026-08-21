/**
 * Client helper for native Play Billing (Lab+ yearly only).
 * The System WebView has no Digital Goods API — calls go through
 * window.OpeningLabPlay (JavascriptInterface).
 */
import {
  PLAY_PACKAGE,
  PLAY_SKU_NOT_ON_SALE,
  PLAY_SKU_YEARLY,
} from "@/lib/play-app";
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

export async function confirmPlaySubscribe(input: {
  purchaseToken: string;
  productId?: string;
  packageName?: string;
  orderId?: string;
}): Promise<UnlockState> {
  const res = await fetch("/api/play/subscribe", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packageName: input.packageName ?? PLAY_PACKAGE,
      productId: input.productId ?? PLAY_SKU_YEARLY,
      purchaseToken: input.purchaseToken,
      orderId: input.orderId,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<UnlockState> & {
    error?: string;
    code?: string;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Could not confirm Lab+");
  }
  const unlocks = normalizeUnlockState({ ...data, playBilled: true });
  replaceUnlocks(unlocks);
  return unlocks;
}

function friendlyNativeError(result: PlayNativeResult): Error {
  if (result.code === "ITEM_UNAVAILABLE" || result.code === "FEATURE_NOT_SUPPORTED") {
    return new Error(PLAY_SKU_NOT_ON_SALE);
  }
  return new Error(result.error ?? PLAY_SKU_NOT_ON_SALE);
}

/** Start native yearly purchase, then verify on the server. Null if the user cancelled. */
export async function startPlayLabPlusYearly(): Promise<UnlockState | null> {
  const result = await nativeCall("buy");
  if (!result.ok) {
    if (result.code === "USER_CANCELED") return null;
    throw friendlyNativeError(result);
  }
  if (!result.purchaseToken) {
    throw new Error("Google Play did not return a purchase.");
  }
  return confirmPlaySubscribe(result);
}

export async function restorePlayLabPlus(): Promise<UnlockState> {
  const result = await nativeCall("restore");
  if (!result.ok) {
    throw friendlyNativeError(result);
  }
  if (!result.purchaseToken) {
    throw new Error("No Lab+ purchase to restore.");
  }
  return confirmPlaySubscribe(result);
}
