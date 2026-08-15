import { useCallback, useEffect, useState } from "react";
import { isPackFree } from "@/data/pricing";
import type { Pack } from "@/data/packs";
import { fetchPaymentsEnabled } from "@/lib/checkout";
import {
  getUnlocks,
  isPackUnlocked,
  isSubscriptionActive,
  startSubscription,
  subscribeUnlocks,
  unlockPack,
  type SubPlan,
  type UnlockState,
} from "@/lib/unlocks";

export function useUnlocks() {
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
    (pack: Pack) => isPackUnlocked(pack.id, isPackFree(pack)),
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
