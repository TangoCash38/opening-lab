/**
 * History-backed overlays for Android WebView / in-app Back.
 *
 * When an overlay opens we pushState so hardware/gesture Back fires popstate
 * and closes the top overlay instead of webView.goBack() / moveTaskToBack.
 * Dismissing via in-sheet Back/X/Escape/backdrop releases with history.back()
 * so the stack stays clean.
 *
 * A single shared stack + one popstate listener ensures nested overlays
 * (e.g. finish sheet + Play-on prompt) peel one at a time.
 */

export const OVERLAY_HISTORY_KEY = "olOverlay";

export type HistoryLike = {
  state: unknown;
  pushState(data: unknown, unused: string, url?: string | null): void;
  back(): void;
};

export type WindowLike = {
  history: HistoryLike;
  addEventListener(type: "popstate", listener: (ev: Event) => void): void;
  removeEventListener(type: "popstate", listener: (ev: Event) => void): void;
};

export type OverlayHistoryBinding = {
  readonly isActive: () => boolean;
  /** UI dismiss: drop from stack and history.back() if we were on top. */
  dismiss: () => void;
  /**
   * Effect cleanup. If still active (UI closed open→false without dismiss),
   * same as dismiss. No-op if already closed via popstate.
   */
  release: () => void;
};

type StackEntry = {
  id: string;
  onPop: () => void;
  active: boolean;
};

type StackState = {
  win: WindowLike;
  entries: StackEntry[];
  /** Synthetic history.back() pops to ignore (UI dismiss path). */
  suppressPops: number;
  listening: boolean;
  onPopState: () => void;
};

let stack: StackState | null = null;

/** Test helper — drop any leftover stack between cases. */
export function resetOverlayHistoryStackForTests(): void {
  if (stack?.listening) {
    stack.win.removeEventListener("popstate", stack.onPopState);
  }
  stack = null;
}

function mergeState(prev: unknown, id: string): Record<string, unknown> {
  const base =
    prev && typeof prev === "object" && !Array.isArray(prev)
      ? { ...(prev as Record<string, unknown>) }
      : {};
  return { ...base, [OVERLAY_HISTORY_KEY]: id };
}

function ensureStack(win: WindowLike): StackState {
  if (stack && stack.win === win) return stack;

  if (stack?.listening) {
    stack.win.removeEventListener("popstate", stack.onPopState);
  }

  const state: StackState = {
    win,
    entries: [],
    suppressPops: 0,
    listening: false,
    onPopState: () => {
      if (state.suppressPops > 0) {
        state.suppressPops -= 1;
        maybeUnlisten(state);
        return;
      }
      const top = state.entries.pop();
      if (!top) {
        maybeUnlisten(state);
        return;
      }
      top.active = false;
      top.onPop();
      maybeUnlisten(state);
    },
  };
  stack = state;
  return state;
}

function maybeListen(state: StackState): void {
  if (state.listening) return;
  state.win.addEventListener("popstate", state.onPopState);
  state.listening = true;
}

function maybeUnlisten(state: StackState): void {
  if (!state.listening) return;
  if (state.entries.length > 0 || state.suppressPops > 0) return;
  state.win.removeEventListener("popstate", state.onPopState);
  state.listening = false;
}

function dropEntry(state: StackState, entry: StackEntry): void {
  if (!entry.active) return;
  const idx = state.entries.indexOf(entry);
  if (idx < 0) {
    entry.active = false;
    return;
  }
  const isTop = idx === state.entries.length - 1;
  state.entries.splice(idx, 1);
  entry.active = false;
  if (isTop) {
    state.suppressPops += 1;
    maybeListen(state);
    state.win.history.back();
  }
  maybeUnlisten(state);
}

/**
 * Push a history entry for an open overlay. Hardware Back → onPop for the
 * top overlay only. Safe no-op when `win` is missing (SSR).
 */
export function bindOverlayHistory(
  win: WindowLike | null | undefined,
  opts: { id: string; onPop: () => void },
): OverlayHistoryBinding {
  if (!win?.history) {
    return {
      isActive: () => false,
      dismiss: () => {},
      release: () => {},
    };
  }

  const state = ensureStack(win);
  const entry: StackEntry = {
    id: opts.id,
    onPop: opts.onPop,
    active: true,
  };

  state.entries.push(entry);
  maybeListen(state);
  win.history.pushState(mergeState(win.history.state, opts.id), "");

  const stopOwned = () => dropEntry(state, entry);

  return {
    isActive: () => entry.active,
    dismiss: stopOwned,
    release: stopOwned,
  };
}
