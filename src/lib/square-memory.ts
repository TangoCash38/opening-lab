/**
 * Square Memory rounds.
 *
 * 520ms is an arcade tempo: long enough to read a square on a phone, short
 * enough that a lengthening line does not drag. 1.2s felt slow. 380ms was
 * too fast when the square was only a faint tint. The gap is 100ms so each
 * flash separates without a pause.
 */

export const FLASH_MS = 520;
export const GAP_MS = 100;
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

/** A posted time longer than this is not a real sitting. */
export const MAX_CLEAR_MS = 30 * 60 * 1000;

export const SCORE_NAME_MAX = 16;

/**
 * Shortest possible full clear: every flash, every gap, and the hit pause
 * between rounds, measured to the last correct tap. Tap time is extra, so a
 * real clear cannot be faster than this.
 */
export function minimumClearMs(squareCount: number): number {
  const total = Math.max(0, Math.floor(squareCount));
  if (total <= 0) return 0;
  let ms = 0;
  let length = Math.min(2, total);
  while (true) {
    ms += length * FLASH_MS + Math.max(0, length - 1) * GAP_MS;
    if (length >= total) break;
    ms += HIT_MS;
    length = Math.min(length + 2, total);
  }
  return ms;
}

/**
 * The live clock counts from Begin through every flash, tap, and the pause
 * between lengths. It stops on a miss, and on the tap that clears the line.
 */
export function clockRunning(
  phase: Phase,
  cursor: number,
  length: number,
  totalSquares: number,
): boolean {
  if (phase === "watch") return true;
  if (phase !== "input") return false;
  const cleared = length >= totalSquares && cursor >= length;
  return !cleared;
}

/** On screen from Begin until the result replaces the board. Hidden before Begin. */
export function clockVisible(phase: Phase): boolean {
  return phase === "watch" || phase === "input" || phase === "punish";
}

/** `m:ss.t` from a millisecond clear. */
export function formatClearTime(ms: number): string {
  const clamped = Math.max(0, Math.round(ms));
  const tenths = Math.floor(clamped / 100) % 10;
  const totalSeconds = Math.floor(clamped / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

/** A display name. No account, no email address. */
export function cleanScoreName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > SCORE_NAME_MAX) return null;
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return null;
  return name;
}

/**
 * One clock for every flash. The first square of a round used to be lit
 * inside startWatch while the rest waited on the gap. Both paths now call
 * openFlash, so each square is on for FLASH_MS and the dark gap is GAP_MS.
 * The opening pair is not a shorter preview.
 */
function openFlash(state: Snapshot, now: number, squares: readonly string[]): Snapshot {
  const next = state.cursor + 1;
  if (next >= state.length) {
    return { ...state, phase: "input", cursor: 0, lit: null, litKind: null, gapUntil: 0 };
  }
  return {
    ...state,
    cursor: next,
    lit: squares[next] ?? null,
    litKind: "flash",
    litUntil: now + FLASH_MS,
    gapUntil: 0,
  };
}

function armWatch(prev: Snapshot, length: number, now: number): Snapshot {
  return {
    phase: "watch",
    length,
    cursor: -1,
    lit: null,
    litKind: null,
    litUntil: 0,
    gapUntil: now,
    score: 0,
    perfect: false,
    best: prev.best,
  };
}

function startWatch(
  prev: Snapshot,
  length: number,
  now: number,
  squares: readonly string[],
): Snapshot {
  return openFlash(armWatch(prev, length, now), now, squares);
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
      return openFlash(state, now, squares);
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
