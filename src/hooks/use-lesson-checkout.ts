import { useCallback, useEffect, useRef, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  clearPendingCheckout,
  confirmCheckoutSession,
  fetchPaymentsEnabled,
  readPendingCheckout,
  savePendingCheckout,
  startCheckout,
} from "@/lib/checkout";
import { LESSON_SCOTCH_PRODUCT_ID } from "@/lib/lesson-products";
import { isPlayApp } from "@/lib/play-app";
import { useUnlocks } from "@/hooks/use-unlocks";

/** Website Stripe unlock for lesson-scotch. Same pack checkout as drill packs. */
export function useLessonCheckout(returnPath: string) {
  const { user, isPending } = useCurrentUserState();
  const { buyPack, paymentsEnabled, state } = useUnlocks();
  const signedIn = !!user && !user.isDevFallback;
  const owned = state.packs.includes(LESSON_SCOTCH_PRODUCT_ID);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resumed = useRef(false);

  const pay = useCallback(async () => {
    if (isPlayApp()) return;
    setError(null);
    setBusy(true);
    try {
      const live =
        paymentsEnabled === true
          ? true
          : paymentsEnabled === false
            ? false
            : await fetchPaymentsEnabled();
      if (live) {
        if (isPending) {
          setError("Please wait…");
          return;
        }
        if (!signedIn) {
          savePendingCheckout({ kind: "pack", packId: LESSON_SCOTCH_PRODUCT_ID });
          window.location.href = "/login?next=checkout";
          return;
        }
        const url = await startCheckout("pack", LESSON_SCOTCH_PRODUCT_ID, returnPath);
        window.location.href = url;
        return;
      }
      buyPack(LESSON_SCOTCH_PRODUCT_ID);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      if (message === "Sign in required") {
        savePendingCheckout({ kind: "pack", packId: LESSON_SCOTCH_PRODUCT_ID });
        window.location.href = "/login?next=checkout";
        return;
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  }, [buyPack, isPending, paymentsEnabled, returnPath, signedIn]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await confirmCheckoutSession(sessionId);
        if (cancelled) return;
        if (result.ok && result.kind === "pack" && result.packId === LESSON_SCOTCH_PRODUCT_ID) {
          buyPack(LESSON_SCOTCH_PRODUCT_ID);
        }
      } catch {
        if (!cancelled) setError("Could not confirm payment");
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("paid");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [buyPack]);

  useEffect(() => {
    if (resumed.current) return;
    if (isPlayApp()) return;
    if (isPending || !signedIn || paymentsEnabled !== true) return;
    if (new URLSearchParams(window.location.search).get("paid") === "1") return;
    const pending = readPendingCheckout();
    if (!pending || pending.kind !== "pack" || pending.packId !== LESSON_SCOTCH_PRODUCT_ID) {
      return;
    }
    resumed.current = true;
    clearPendingCheckout();
    void pay();
  }, [isPending, pay, paymentsEnabled, signedIn]);

  return { owned, pay, busy, error, packs: state.packs };
}
