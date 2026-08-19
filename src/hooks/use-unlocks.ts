import { useCallback, useEffect, useState } from "react";
import { isPackFree } from "@/data/pricing";
import { isWebsiteReviewFree } from "@/lib/review-free";
import type { Pack } from "@/data/packs";
import { fetchPaymentsEnabled } from "@/lib/checkout";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  claimAccountUnlocks,
  fetchAccountUnlocks,
  getUnlocks,
  isPackUnlocked,
  isSubscriptionActive,
  replaceUnlocks,
  startSubscription,
  subscribeUnlocks,
  unlockPack,
  type SubPlan,
  type UnlockState,
} from "@/lib/unlocks";

const CLAIMED_USER_KEY = "opening-lab:unlocks-claimed-user";

let accountSyncUserId: string | null = null;
let accountSyncPromise: Promise<void> | null = null;

function readClaimedUser(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CLAIMED_USER_KEY);
  } catch {
    return null;
  }
}

function writeClaimedUser(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CLAIMED_USER_KEY, userId);
  } catch {
    /* ignore */
  }
}

function syncAccountUnlocks(userId: string): Promise<void> {
  if (accountSyncUserId === userId && accountSyncPromise) return accountSyncPromise;
  accountSyncUserId = userId;
  accountSyncPromise = (async () => {
    const last = readClaimedUser();
    const local = getUnlocks();
    const canClaim = last == null || last === userId;
    let next: UnlockState | null = null;
    if (canClaim && (local.packs.length > 0 || local.plan)) {
      try {
        next = await claimAccountUnlocks(local);
      } catch {
        /* still load the account copy */
      }
    }
    writeClaimedUser(userId);
    if (!next) next = await fetchAccountUnlocks();
    if (next) replaceUnlocks(next);
  })().catch(() => {
    if (accountSyncUserId === userId) {
      accountSyncUserId = null;
      accountSyncPromise = null;
    }
  });
  return accountSyncPromise;
}

export function useUnlocks() {
  const { user, isPending } = useCurrentUserState();
  const [state, setState] = useState<UnlockState>({
    packs: [],
    plan: null,
    expiresAt: null,
  });
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    setState(getUnlocks());
    return subscribeUnlocks(() => setState(getUnlocks()));
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!user || user.isDevFallback) return;
    void syncAccountUnlocks(user.id);
  }, [user, isPending]);

  useEffect(() => {
    let cancelled = false;
    fetchPaymentsEnabled()
      .then((on) => {
        if (!cancelled) setPaymentsEnabled(on);
      })
      .catch(() => {
        if (!cancelled) setPaymentsEnabled(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subscribed = isSubscriptionActive(state);

  const canAccess = useCallback(
    (pack: Pack) =>
      isWebsiteReviewFree() || isPackUnlocked(pack.id, isPackFree(pack)),
    [state.packs, state.plan, state.expiresAt],
  );

  const buyPack = useCallback((packId: string) => {
    unlockPack(packId);
    setState(getUnlocks());
  }, []);

  const subscribe = useCallback((plan: SubPlan) => {
    startSubscription(plan);
    setState(getUnlocks());
  }, []);

  return { state, subscribed, canAccess, buyPack, subscribe, paymentsEnabled };
}
