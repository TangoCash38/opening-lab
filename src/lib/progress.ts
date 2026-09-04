/**
 * Per-line memory progress (localStorage).
 * Simple SM-2: Good advances 1d → 3d → 7d → 21d. A Practice fail resets to 1d.
 */

const STORAGE_KEY = "opening-lab:progress:v1";
const ONBOARDING_KEY = "opening-lab:onboarding:v1";
const EVENT = "opening-lab:progress";

export type Mastery = "new" | "learning" | "fresh" | "due" | "weak";

export type LineProgress = {
  timesCompleted: number;
  lastTrainedAt: string | null;
  currentStreak: number;
  bestStreak: number;
  interval: number;
  dueAt: string | null;
  failCount: number;
  recentFails: string[];
  /** True only after a Practice run finished with zero mistakes. */
  cleanPractice: boolean;
  /** True after Learn mode is finished (does not complete the line). */
  learned: boolean;
  /** Highest book plyIndex reached during Test (practice) for this line. */
  testBestPly: number;
};

export type ProgressStore = {
  lines: Record<string, LineProgress>;
  globalStreak: number;
  globalBestStreak: number;
  lastGlobalDay: string | null;
};

const EMPTY_LINE: LineProgress = {
  timesCompleted: 0,
  lastTrainedAt: null,
  currentStreak: 0,
  bestStreak: 0,
  interval: 0,
  dueAt: null,
  failCount: 0,
  recentFails: [],
  cleanPractice: false,
  learned: false,
  testBestPly: 0,
};

const EMPTY_STORE: ProgressStore = {
  lines: {},
  globalStreak: 0,
  globalBestStreak: 0,
  lastGlobalDay: null,
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

function dayDiff(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / 86400000);
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function nextInterval(current: number): number {
  if (current <= 0) return 1;
  if (current < 3) return 3;
  if (current < 7) return 7;
  return 21;
}

function pruneFails(fails: string[], now: Date): string[] {
  const cut = now.getTime() - WEEK_MS;
  return fails.filter((iso) => {
    const t = new Date(iso).getTime();
    return !Number.isNaN(t) && t >= cut;
  });
}

function normalizeLine(raw: Partial<LineProgress> | undefined | null): LineProgress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_LINE };
  return {
    timesCompleted: Number(raw.timesCompleted) || 0,
    lastTrainedAt: raw.lastTrainedAt ?? null,
    currentStreak: Number(raw.currentStreak) || 0,
    bestStreak: Number(raw.bestStreak) || 0,
    interval: Number(raw.interval) || 0,
    dueAt: raw.dueAt ?? null,
    failCount: Number(raw.failCount) || 0,
    recentFails: Array.isArray(raw.recentFails) ? raw.recentFails : [],
    // Missing flags (old Learn completions) must not count as complete.
    cleanPractice: raw.cleanPractice === true,
    learned: raw.learned === true,
    testBestPly: Math.max(0, Number(raw.testBestPly) || 0),
  };
}

function normalizeLines(raw: unknown): Record<string, LineProgress> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, LineProgress> = {};
  for (const [id, line] of Object.entries(raw as Record<string, Partial<LineProgress>>)) {
    out[id] = normalizeLine(line);
  }
  return out;
}

function read(): ProgressStore {
  if (typeof window === "undefined") return { ...EMPTY_STORE, lines: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STORE, lines: {} };
    const parsed = JSON.parse(raw) as Partial<ProgressStore>;
    return {
      lines: normalizeLines(parsed.lines),
      globalStreak: Number(parsed.globalStreak) || 0,
      globalBestStreak: Number(parsed.globalBestStreak) || 0,
      lastGlobalDay: parsed.lastGlobalDay ?? null,
    };
  } catch {
    return { ...EMPTY_STORE, lines: {} };
  }
}

function write(store: ProgressStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getProgressStore(): ProgressStore {
  return read();
}

export function getLineProgress(lineId: string): LineProgress {
  return normalizeLine(read().lines[lineId]);
}

export function isLineComplete(p: LineProgress): boolean {
  return p.cleanPractice === true;
}

export function getMastery(p: LineProgress, now = new Date()): Mastery {
  // Complete lines stay green-only. Chip is hidden; never Weak/Due.
  if (p.cleanPractice) return "fresh";
  const recent = pruneFails(p.recentFails, now);
  if (recent.length >= 2) return "weak";
  if (p.learned || p.lastTrainedAt) return "learning";
  return "new";
}

export function isLineDue(p: LineProgress, now = new Date()): boolean {
  if (p.cleanPractice) return false;
  const mastery = getMastery(p, now);
  if (mastery === "weak") return true;
  if (mastery === "due") return true;
  return false;
}

export function markLineComplete(lineId: string, now = new Date()): LineProgress {
  const store = read();
  const prev = store.lines[lineId] ?? { ...EMPTY_LINE };
  const today = localDay(now);
  const lastDay = prev.lastTrainedAt ? localDay(new Date(prev.lastTrainedAt)) : null;

  let streak = prev.currentStreak;
  if (!lastDay) streak = 1;
  else {
    const diff = dayDiff(lastDay, today);
    if (diff === 0) streak = Math.max(1, prev.currentStreak);
    else if (diff === 1) streak = prev.currentStreak + 1;
    else streak = 1;
  }

  let globalStreak = store.globalStreak;
  if (!store.lastGlobalDay) globalStreak = 1;
  else {
    const diff = dayDiff(store.lastGlobalDay, today);
    if (diff === 0) globalStreak = Math.max(1, store.globalStreak);
    else if (diff === 1) globalStreak = store.globalStreak + 1;
    else globalStreak = 1;
  }

  const interval = nextInterval(prev.interval);
  const updated: LineProgress = {
    ...prev,
    timesCompleted: prev.timesCompleted + 1,
    lastTrainedAt: now.toISOString(),
    currentStreak: streak,
    bestStreak: Math.max(prev.bestStreak, streak),
    interval,
    dueAt: addDays(now, interval).toISOString(),
    recentFails: pruneFails(prev.recentFails, now),
    cleanPractice: true,
  };

  store.lines[lineId] = updated;
  store.globalStreak = globalStreak;
  store.globalBestStreak = Math.max(store.globalBestStreak, globalStreak);
  store.lastGlobalDay = today;
  write(store);
  return updated;
}

export function markLineLearned(lineId: string, now = new Date()): LineProgress {
  const store = read();
  const prev = store.lines[lineId] ?? { ...EMPTY_LINE };
  const updated: LineProgress = {
    ...prev,
    learned: true,
    lastTrainedAt: now.toISOString(),
  };
  store.lines[lineId] = updated;
  write(store);
  return updated;
}

export function markPracticeFail(lineId: string, now = new Date()): LineProgress {
  const store = read();
  const prev = store.lines[lineId] ?? { ...EMPTY_LINE };
  const recentFails = pruneFails([...prev.recentFails, now.toISOString()], now);
  const updated: LineProgress = {
    ...prev,
    failCount: prev.failCount + 1,
    recentFails,
    interval: 1,
    dueAt: addDays(now, 1).toISOString(),
  };
  store.lines[lineId] = updated;
  write(store);
  return updated;
}

export function markTestPly(lineId: string, plyIndex: number): LineProgress {
  const store = read();
  const prev = store.lines[lineId] ?? { ...EMPTY_LINE };
  const nextPly = Math.max(0, Math.floor(Number(plyIndex) || 0));
  const updated: LineProgress = {
    ...prev,
    testBestPly: Math.max(prev.testBestPly, nextPly),
  };
  store.lines[lineId] = updated;
  write(store);
  return updated;
}

/** Percent through Test for pack list. null = not started in Test (or invalid book). */
export function lineTestPercent(p: LineProgress, bookLen: number): number | null {
  if (bookLen <= 0) return null;
  if (p.cleanPractice) return 100;
  if (p.testBestPly <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((p.testBestPly / bookLen) * 100)));
}

export type QueueItem = {
  packId: string;
  lineId: string;
  mode: "learn" | "practice";
  weak: boolean;
};

export function buildDueQueue(
  candidates: { packId: string; lineId: string }[],
  now = new Date(),
): QueueItem[] {
  const store = read();
  const items: QueueItem[] = [];
  for (const c of candidates) {
    const p = store.lines[c.lineId] ?? { ...EMPTY_LINE };
    if (!isLineDue(p, now)) continue;
    const mastery = getMastery(p, now);
    items.push({
      packId: c.packId,
      lineId: c.lineId,
      mode: !p.cleanPractice && !p.learned ? "learn" : "practice",
      weak: mastery === "weak",
    });
  }
  items.sort((a, b) => Number(b.weak) - Number(a.weak));
  return items;
}

export function firstUnusedLineId(
  candidates: { packId: string; lineId: string }[],
): { packId: string; lineId: string } | null {
  const store = read();
  for (const c of candidates) {
    const p = store.lines[c.lineId];
    if (!p || !p.cleanPractice) return c;
  }
  return null;
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingSeen() {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, "1");
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function subscribeProgress(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
