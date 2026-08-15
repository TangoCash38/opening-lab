import { useCallback, useEffect, useState } from "react";
import { isPackFree } from "@/data/pricing";
import type { Pack } from "@/data/packs";
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

  useEffect(() => {
    setState(getUnlocks());
    return subscribeUnlocks(() => setState(getUnlocks()));
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

  return { state, subscribed, canAccess, buyPack, subscribe };
}
