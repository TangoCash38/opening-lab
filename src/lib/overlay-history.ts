/**
 * History-backed overlays for Android WebView / in-app Back.
 *
 * When an overlay opens we pushState so hardware/gesture Back fires popstate
 * and closes the top overlay instead of webView.goBack() / moveTaskToBack.
 * Dismissing via in-sheet Back/X/Escape/backdrop releases with history.back()
 * so the stack stays clean.
 *
 * A single shared stack + one popstate listener ensures nested overlays
 * (e.g. finish sheet + nested prompt) peel one at a time.
 */

export const OVERLAY_HISTORY_KEY = "olOverlay";

export type HistoryLike = {
  state: unknown;
  pushState(data: unknown, unused: string, url?: string | null): void;
  back(): void;
};

export type WindowLike = {
  history: HistoryLike;
  addEventListener(
    type: "popstate" | "scroll",
    listener: (ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "popstate" | "scroll",
    listener: (ev: Event) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  scrollX?: number;
  scrollY?: number;
  scrollTo?: (x: number, y: number) => void;
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
  onPopState: (ev: Event) => void;
};

let stack: StackState | null = null;

/** Test helper — drop any leftover stack between cases. */
export function resetOverlayHistoryStackForTests(): void {
  if (stack?.listening) {
    stack.win.removeEventListener("popstate", stack.onPopState, true);
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
    stack.win.removeEventListener("popstate", stack.onPopState, true);
  }

  const state: StackState = {
    win,
    entries: [],
    suppressPops: 0,
    listening: false,
    onPopState: (ev: Event) => {
      // Same-URL overlay entries must not reach the app router. It treats
      // any popstate as navigation and scrolls the window to the top.
      if (state.suppressPops > 0 || state.entries.length > 0) {
        ev.stopImmediatePropagation?.();
      }
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
  // Capture so we run before the router's bubble popstate listener.
  state.win.addEventListener("popstate", state.onPopState, true);
  state.listening = true;
}

function maybeUnlisten(state: StackState): void {
  if (!state.listening) return;
  if (state.entries.length > 0 || state.suppressPops > 0) return;
  state.win.removeEventListener("popstate", state.onPopState, true);
  state.listening = false;
}

/**
 * Keep the viewport where the player already was. history.back() and the
 * router both try to restore the page-load scroll (the top).
 */
function pinWindowScroll(win: WindowLike): () => void {
  if (typeof win.scrollTo !== "function" || typeof win.scrollY !== "number") {
    return () => {};
  }
  const x = win.scrollX ?? 0;
  const y = win.scrollY ?? 0;
  let stopped = false;
  const restore = () => {
    if (stopped) return;
    if ((win.scrollX ?? 0) !== x || (win.scrollY ?? 0) !== y) {
      win.scrollTo!(x, y);
    }
  };
  const onScroll = () => restore();
  win.addEventListener("scroll", onScroll);
  const stopTimer = setTimeout(() => {
    stopped = true;
    win.removeEventListener("scroll", onScroll);
  }, 450);
  setTimeout(restore, 0);
  setTimeout(restore, 60);
  setTimeout(restore, 180);
  return () => {
    restore();
    void stopTimer;
  };
}

/** Push without notifying the app router (it patches history.pushState). */
function pushOverlayState(history: HistoryLike, data: unknown): void {
  const proto = typeof History === "undefined" ? undefined : History.prototype.pushState;
  if (typeof proto === "function" && history instanceof History) {
    proto.call(history, data, "");
    return;
  }
  history.pushState(data, "");
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
    const restoreScroll = pinWindowScroll(state.win);
    state.win.history.back();
    restoreScroll();
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
  pushOverlayState(win.history, mergeState(win.history.state, opts.id));

  const stopOwned = () => dropEntry(state, entry);

  return {
    isActive: () => entry.active,
    dismiss: stopOwned,
    release: stopOwned,
  };
}
