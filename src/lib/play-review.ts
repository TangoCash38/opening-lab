/**
 * Google Play In-App Review gate.
 * The site never shows a rating dialog. The Play WebView calls
 * OpeningLabPlay.requestReview(), and Google decides whether a sheet appears.
 * No "do you like us" question. No reward.
 */

export const PLAY_REVIEW_STORAGE_KEY = "opening-lab:play-review:v1";
export const PLAY_REVIEW_GAP_MS = 30 * 24 * 60 * 60 * 1000;
export const PLAY_REVIEW_MAX_ASKS = 3;

export type PlayReviewState = {
  asks: number;
  lastAskedAt: number | null;
};

export const EMPTY_PLAY_REVIEW: PlayReviewState = { asks: 0, lastAskedAt: null };

export function parsePlayReviewState(raw: string | null): PlayReviewState {
  if (!raw) return { ...EMPTY_PLAY_REVIEW };
  try {
    const parsed = JSON.parse(raw) as Partial<PlayReviewState>;
    const asks = Math.max(0, Math.floor(Number(parsed.asks) || 0));
    const last = Number(parsed.lastAskedAt);
    return {
      asks,
      lastAskedAt: Number.isFinite(last) && last > 0 ? last : null,
    };
  } catch {
    return { ...EMPTY_PLAY_REVIEW };
  }
}

export function loadPlayReviewState(): PlayReviewState {
  if (typeof localStorage === "undefined") return { ...EMPTY_PLAY_REVIEW };
  try {
    return parsePlayReviewState(localStorage.getItem(PLAY_REVIEW_STORAGE_KEY));
  } catch {
    return { ...EMPTY_PLAY_REVIEW };
  }
}

export function savePlayReviewState(state: PlayReviewState): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PLAY_REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}

/** True when this completion is a whole pack, or the 3rd completed line. */
export function playReviewMoment(input: {
  completedLineCount: number;
  packReviewable: boolean;
  packLineCount: number;
  packLinesComplete: number;
}): boolean {
  if (
    input.packReviewable &&
    input.packLineCount > 0 &&
    input.packLinesComplete === input.packLineCount
  ) {
    return true;
  }
  return input.completedLineCount === 3;
}

export function shouldRequestPlayReview(state: PlayReviewState, now: number): boolean {
  if (state.asks >= PLAY_REVIEW_MAX_ASKS) return false;
  if (state.lastAskedAt != null && now - state.lastAskedAt < PLAY_REVIEW_GAP_MS) return false;
  return true;
}

/**
 * Ask only inside the Play app, and only when the bridge exists.
 * A false result means the web (or an old build) shows nothing.
 */
export function considerPlayReview(input: {
  playApp: boolean;
  hasBridge: boolean;
  now: number;
  state: PlayReviewState;
  completedLineCount: number;
  packReviewable: boolean;
  packLineCount: number;
  packLinesComplete: number;
}): { ask: boolean; next: PlayReviewState } {
  if (!input.playApp || !input.hasBridge) return { ask: false, next: input.state };
  if (
    !playReviewMoment({
      completedLineCount: input.completedLineCount,
      packReviewable: input.packReviewable,
      packLineCount: input.packLineCount,
      packLinesComplete: input.packLinesComplete,
    })
  ) {
    return { ask: false, next: input.state };
  }
  if (!shouldRequestPlayReview(input.state, input.now)) {
    return { ask: false, next: input.state };
  }
  return {
    ask: true,
    next: { asks: input.state.asks + 1, lastAskedAt: input.now },
  };
}
