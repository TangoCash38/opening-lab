/**
 * Square Memory rounds.
 *
 * Each square stays lit for 1.2s so it is readable on a phone, then goes
 * dark for 0.2s before the next square. A 3s flash is clear but drags once
 * the line is long; 380ms was too fast to see.
 */

export const FLASH_MS = 1200;
export const GAP_MS = 200;
export const HIT_MS = 280;
export const MISS_MS = 680;

export type Phase = "title" | "watch" | "input" | "punish" | "reveal";
export type LitKind = "flash" | "hit" | "miss";

export type Snapshot = {
  phase: Phase;
  /** How many squares are in this round. */
  length: number;
  /** Watch: index of the flash. Input: how many taps were correct. */
  cursor: number;
  lit: string | null;
  litKind: LitKind | null;
  litUntil: number;
  gapUntil: number;
  score: number;
  perfect: boolean;
  best: number;
};

export function titleState(best: number): Snapshot {
  return {
    phase: "title",
    length: 0,
    cursor: 0,
    lit: null,
    litKind: null,
    litUntil: 0,
    gapUntil: 0,
    score: 0,
    perfect: false,
    best,
  };
}

export function begin(best: number, now: number, squares: readonly string[]): Snapshot {
  return startWatch(titleState(best), Math.min(2, squares.length), now, squares);
}

function startWatch(
  prev: Snapshot,
  length: number,
  now: number,
  squares: readonly string[],
): Snapshot {
  return {
    phase: "watch",
    length,
    cursor: 0,
    lit: squares[0] ?? null,
    litKind: "flash",
    litUntil: now + FLASH_MS,
    gapUntil: 0,
    score: 0,
    perfect: false,
    best: prev.best,
  };
}

function reveal(prev: Snapshot, score: number, perfect: boolean): Snapshot {
  return {
    ...prev,
    phase: "reveal",
    lit: null,
    litKind: null,
    gapUntil: 0,
    score,
    perfect,
    best: Math.max(prev.best, score),
  };
}

export function tick(state: Snapshot, now: number, squares: readonly string[]): Snapshot {
  if (state.phase === "watch") {
    if (state.lit && now >= state.litUntil) {
      return { ...state, lit: null, litKind: null, gapUntil: now + GAP_MS };
    }
    if (!state.lit && state.gapUntil > 0 && now >= state.gapUntil) {
      const next = state.cursor + 1;
      if (next < state.length) {
        return {
          ...state,
          cursor: next,
          lit: squares[next] ?? null,
          litKind: "flash",
          litUntil: now + FLASH_MS,
          gapUntil: 0,
        };
      }
      return { ...state, phase: "input", cursor: 0, lit: null, litKind: null, gapUntil: 0 };
    }
    return state;
  }

  if (state.phase === "input") {
    if (state.cursor === state.length && now >= state.litUntil) {
      if (state.length >= squares.length) return reveal(state, squares.length, true);
      return startWatch(state, Math.min(state.length + 2, squares.length), now, squares);
    }
    if (state.lit && state.cursor < state.length && now >= state.litUntil) {
      return { ...state, lit: null, litKind: null };
    }
    return state;
  }

  if (state.phase === "punish" && now >= state.litUntil) {
    return { ...state, phase: "reveal", lit: null, litKind: null };
  }

  return state;
}

export function tap(
  state: Snapshot,
  square: string,
  squares: readonly string[],
  now: number,
): Snapshot {
  if (state.phase !== "input" || state.cursor >= state.length) return state;
  const expected = squares[state.cursor];
  if (square === expected) {
    return {
      ...state,
      cursor: state.cursor + 1,
      lit: square,
      litKind: "hit",
      litUntil: now + HIT_MS,
    };
  }
  const score = Math.max(state.length - 2, state.cursor);
  return {
    ...state,
    phase: "punish",
    lit: square,
    litKind: "miss",
    litUntil: now + MISS_MS,
    score,
    perfect: false,
    best: Math.max(state.best, score),
  };
}
