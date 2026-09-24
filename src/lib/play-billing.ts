/**
 * Client helper for native Play Billing (Path B INAPP packs + buy all).
 * The System WebView has no Digital Goods API — calls go through
 * window.OpeningLabPlay (JavascriptInterface).
 *
 * Confirm posts productId + purchaseToken to the existing Play confirm
 * endpoint (`/api/play/subscribe`). Engine owns products verify +
 * applyPurchase for pack / buy_all — this is not a second grant path.
 */
import { canPurchaseBuyAll, canPurchasePack } from "@/lib/catalog";
import {
  PLAY_PATH_B_PACK_IDS,
  PLAY_SKU_BUY_ALL,
  playSkuForPackId,
} from "@/lib/play-skus";
import {
  PLAY_PACKAGE,
  PLAY_SKU_NOT_ON_SALE,
} from "@/lib/play-app";
import {
  normalizeUnlockState,
  replaceUnlocks,
  type UnlockState,
} from "@/lib/unlocks";

export type PlayNativePurchase = {
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
};

export type PlayNativeResult = {
  ok: boolean;
  action?: string;
  packageName?: string;
  productId?: string;
  purchaseToken?: string;
  orderId?: string;
  purchases?: PlayNativePurchase[];
  code?: string;
  error?: string;
};

type PlayBridge = {
  buyPack?: (packId: string) => void;
  buyAll?: () => void;
  restorePurchases?: () => void;
  restorePacks?: () => void;
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
  const bridge = win?.OpeningLabPlay;
  return (
    typeof bridge?.buyPack === "function" &&
    typeof bridge?.buyAll === "function" &&
    (typeof bridge?.restorePurchases === "function" ||
      typeof bridge?.restorePacks === "function")
  );
}

function nativeCall(
  run: (bridge: PlayBridge) => void,
): Promise<PlayNativeResult> {
  const w = window as PlayWindow;
  const bridge = w.OpeningLabPlay;
  if (!bridge) {
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
      run(bridge);
    } catch (err) {
      cleanup();
      reject(err instanceof Error ? err : new Error("Play Billing failed"));
    }
  });
}

function purchasesFromResult(result: PlayNativeResult): PlayNativePurchase[] {
  if (Array.isArray(result.purchases) && result.purchases.length > 0) {
    return result.purchases.filter((row) => !!row?.purchaseToken);
  }
  if (result.purchaseToken) {
    return [
      {
        productId: result.productId,
        purchaseToken: result.purchaseToken,
        orderId: result.orderId,
      },
    ];
  }
  return [];
}

/**
 * Confirm a Play INAPP token via the existing Play confirm API.
 * Engine extends this handler for pack / buy_all applyPurchase.
 */
export async function confirmPlayPurchase(input: {
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

async function confirmNativeResult(result: PlayNativeResult): Promise<UnlockState> {
  const rows = purchasesFromResult(result);
  if (rows.length === 0) {
    throw new Error("Google Play did not return a purchase.");
  }
  let last: UnlockState | null = null;
  for (const row of rows) {
    if (!row.purchaseToken) continue;
    last = await confirmPlayPurchase({
      purchaseToken: row.purchaseToken,
      productId: row.productId ?? result.productId,
      packageName: result.packageName,
      orderId: row.orderId ?? result.orderId,
    });
  }
  if (!last) throw new Error("Google Play did not return a purchase.");
  return last;
}

function friendlyNativeError(result: PlayNativeResult): Error {
  if (result.code === "ITEM_UNAVAILABLE" || result.code === "FEATURE_NOT_SUPPORTED") {
    return new Error(PLAY_SKU_NOT_ON_SALE);
  }
  return new Error(result.error ?? PLAY_SKU_NOT_ON_SALE);
}

async function afterNative(result: PlayNativeResult): Promise<UnlockState | null> {
  if (!result.ok) {
    if (result.code === "USER_CANCELED") return null;
    throw friendlyNativeError(result);
  }
  return confirmNativeResult(result);
}

const PATH_B_PACK_SET = new Set<string>(PLAY_PATH_B_PACK_IDS);

/** Start native pack purchase, then verify on the server. Null if the user cancelled. */
export async function startPlayPackBuy(packId: string): Promise<UnlockState | null> {
  if (!canPurchasePack(packId) || !PATH_B_PACK_SET.has(packId)) {
    throw new Error(PLAY_SKU_NOT_ON_SALE);
  }
  const sku = playSkuForPackId(packId);
  const result = await nativeCall((bridge) => {
    if (typeof bridge.buyPack !== "function") {
      throw new Error("This app build cannot open Google Play Billing yet.");
    }
    bridge.buyPack(sku);
  });
  return afterNative(result);
}

export async function startPlayBuyAll(): Promise<UnlockState | null> {
  if (!canPurchaseBuyAll()) {
    throw new Error(PLAY_SKU_NOT_ON_SALE);
  }
  const result = await nativeCall((bridge) => {
    if (typeof bridge.buyAll !== "function") {
      throw new Error("This app build cannot open Google Play Billing yet.");
    }
    bridge.buyAll();
  });
  return afterNative(result);
}

export async function restorePlayPacks(): Promise<UnlockState> {
  const result = await nativeCall((bridge) => {
    if (typeof bridge.restorePurchases === "function") {
      bridge.restorePurchases();
      return;
    }
    if (typeof bridge.restorePacks === "function") {
      bridge.restorePacks();
      return;
    }
    throw new Error("This app build cannot open Google Play Billing yet.");
  });
  if (!result.ok) {
    throw friendlyNativeError(result);
  }
  return confirmNativeResult(result);
}

/** @deprecated Path B does not sell Lab+. Kept so old calls fail closed. */
export async function startPlayLabPlusYearly(): Promise<UnlockState | null> {
  return null;
}

/** @deprecated Path B restores INAPP packs via restorePlayPacks. */
export async function restorePlayLabPlus(): Promise<UnlockState> {
  return restorePlayPacks();
}

export { PLAY_SKU_BUY_ALL as PLAY_BUY_ALL_SKU };
