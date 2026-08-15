import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildDueQueue,
  firstUnusedLineId,
  getLineProgress,
  getMastery,
  getProgressStore,
  isLineComplete,
  isLineDue,
  markLineComplete,
  markLineLearned,
  markPracticeFail,
  subscribeProgress,
  type LineProgress,
  type Mastery,
  type ProgressStore,
  type QueueItem,
} from "@/lib/progress";

export function useProgress() {
  const [store, setStore] = useState<ProgressStore>(() => ({
    lines: {},
    globalStreak: 0,
    globalBestStreak: 0,
    lastGlobalDay: null,
  }));

  useEffect(() => {
    setStore(getProgressStore());
    return subscribeProgress(() => setStore(getProgressStore()));
  }, []);

  const line = useCallback((lineId: string): LineProgress => {
    return store.lines[lineId] ?? getLineProgress(lineId);
  }, [store.lines]);

  const masteryOf = useCallback(
    (lineId: string): Mastery => getMastery(line(lineId)),
    [line],
  );

  const dueOf = useCallback((lineId: string) => isLineDue(line(lineId)), [line]);

  const complete = useCallback((lineId: string) => {
    markLineComplete(lineId);
    setStore(getProgressStore());
  }, []);

  const markLearned = useCallback((lineId: string) => {
    markLineLearned(lineId);
    setStore(getProgressStore());
  }, []);

  const isComplete = useCallback(
    (lineId: string) => isLineComplete(line(lineId)),
    [line],
  );

  const failPractice = useCallback((lineId: string) => {
    markPracticeFail(lineId);
    setStore(getProgressStore());
  }, []);

  const dueQueue = useCallback(
    (candidates: { packId: string; lineId: string }[]): QueueItem[] =>
      buildDueQueue(candidates),
    [store],
  );

  const unused = useCallback(
    (candidates: { packId: string; lineId: string }[]) =>
      firstUnusedLineId(candidates),
    [store],
  );

  const dueCount = useMemo(() => {
    return Object.entries(store.lines).filter(([, p]) => isLineDue(p)).length;
  }, [store]);

  return {
    store,
    line,
    masteryOf,
    dueOf,
    complete,
    markLearned,
    isComplete,
    failPractice,
    dueQueue,
    unused,
    dueCount,
    streak: store.globalStreak,
    bestStreak: store.globalBestStreak,
  };
}
