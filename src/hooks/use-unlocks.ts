import { useCallback, useEffect, useState } from "react";
import { isPackFree } from "@/data/pricing";
import type { Pack } from "@/data/packs";
import {
  getUnlocks,
  isPackUnlocked,
  subscribeUnlocks,
  unlockAllAccess,
  unlockPack,
  type UnlockState,
} from "@/lib/unlocks";

export function useUnlocks() {
  const [state, setState] = useState<UnlockState>(() => getUnlocks());

  useEffect(() => {
    setState(getUnlocks());
    return subscribeUnlocks(() => setState(getUnlocks()));
  }, []);

  const canAccess = useCallback(
    (pack: Pack) =>
      isPackUnlocked(pack.id, isPackFree(pack)) || state.allAccess,
    [state.allAccess, state.packs],
  );

  const buyPack = useCallback((packId: string) => {
    unlockPack(packId);
    setState(getUnlocks());
  }, []);

  const buyAllAccess = useCallback(() => {
    unlockAllAccess();
    setState(getUnlocks());
  }, []);

  return { state, canAccess, buyPack, buyAllAccess };
}
