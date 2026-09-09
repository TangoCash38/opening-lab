import {
  markMateReminderAsked,
  markMateReminderNotified,
  readMateReminderState,
} from "@/lib/find-mate";

export const FIND_MATE_SW_URL = "/find-mate-sw.js";
export const FIND_MATE_SW_SCOPE = "/";

type ReminderCopy = {
  title: string;
  body: string;
};

let timerId: number | null = null;
let focusBound = false;

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

async function ensureServiceWorker() {
  if (!notificationsSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register(FIND_MATE_SW_URL, {
      scope: FIND_MATE_SW_SCOPE,
    });
    await navigator.serviceWorker.ready;
    return reg;
  } catch {
    return null;
  }
}

function postSchedule(reg: ServiceWorkerRegistration, nextUnlockAt: number, copy: ReminderCopy) {
  const payload = {
    type: "schedule",
    nextUnlockAt,
    title: copy.title,
    body: copy.body,
    tag: "find-mate-next-batch",
    icon: "/icons/icon-192.png",
  };
  try {
    reg.active?.postMessage(payload);
  } catch {
    /* ignore */
  }
  try {
    navigator.serviceWorker.controller?.postMessage(payload);
  } catch {
    /* ignore */
  }
}

async function showLocalNotification(copy: ReminderCopy) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(FIND_MATE_SW_SCOPE);
    if (reg?.showNotification) {
      await reg.showNotification(copy.title, {
        body: copy.body,
        tag: "find-mate-next-batch",
        icon: "/icons/icon-192.png",
        renotify: true,
      });
    } else {
      new Notification(copy.title, {
        body: copy.body,
        tag: "find-mate-next-batch",
        icon: "/icons/icon-192.png",
      });
    }
    markMateReminderNotified();
    return true;
  } catch {
    return false;
  }
}

/** If unlock time has passed and we opted in, show a one-shot ready notification. */
export async function maybeNotifyFindMateReady(copy: ReminderCopy) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const state = readMateReminderState();
  if (!state.reminderOptIn || state.nextUnlockAt == null) return false;
  if (Date.now() < state.nextUnlockAt) return false;
  if (state.reminderNotifiedAt != null && state.reminderNotifiedAt >= state.nextUnlockAt) {
    return false;
  }
  return showLocalNotification(copy);
}

function clearTimer() {
  if (timerId != null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
}

function armClientTimer(nextUnlockAt: number, copy: ReminderCopy) {
  clearTimer();
  const delay = nextUnlockAt - Date.now();
  if (delay <= 0) {
    void maybeNotifyFindMateReady(copy);
    return;
  }
  // Cap so we do not hold a multi-day timer; focus path covers the rest.
  if (delay > 24 * 60 * 60 * 1000 + 60_000) return;
  timerId = window.setTimeout(() => {
    timerId = null;
    void maybeNotifyFindMateReady(copy);
  }, delay);
}

function bindFocusCheck(copy: ReminderCopy) {
  if (focusBound || typeof document === "undefined") return;
  focusBound = true;
  const check = () => {
    void maybeNotifyFindMateReady(copy);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
  window.addEventListener("focus", check);
}

/** After permission is granted: register SW, schedule, arm timer + focus check. */
export async function scheduleFindMateReminder(nextUnlockAt: number, copy: ReminderCopy) {
  if (!notificationsSupported() || Notification.permission !== "granted") return false;
  const reg = await ensureServiceWorker();
  if (reg) postSchedule(reg, nextUnlockAt, copy);

  // Best-effort TimestampTrigger when available (often flag-gated — never required).
  try {
    const Trigger = (window as unknown as { TimestampTrigger?: new (ts: number) => unknown })
      .TimestampTrigger;
    if (Trigger && reg?.showNotification) {
      const delay = nextUnlockAt - Date.now();
      if (delay > 0) {
        const options: NotificationOptions & { showTrigger?: unknown } = {
          body: copy.body,
          tag: "find-mate-next-batch",
          icon: "/icons/icon-192.png",
          showTrigger: new Trigger(nextUnlockAt),
        };
        await reg.showNotification(copy.title, options);
      }
    }
  } catch {
    /* unsupported — fall through to timer / focus / SW check */
  }

  armClientTimer(nextUnlockAt, copy);
  bindFocusCheck(copy);
  return true;
}

export async function requestFindMateReminder(
  nextUnlockAt: number,
  copy: ReminderCopy,
): Promise<"granted" | "denied" | "unsupported"> {
  if (!notificationsSupported()) {
    markMateReminderAsked(false);
    return "unsupported";
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      markMateReminderAsked(false);
      return "denied";
    }
    markMateReminderAsked(true);
    await scheduleFindMateReminder(nextUnlockAt, copy);
    return "granted";
  } catch {
    markMateReminderAsked(false);
    return "unsupported";
  }
}

export function declineFindMateReminder() {
  markMateReminderAsked(false);
}

/** Re-arm from a cold open if the player already opted in. */
export async function resumeFindMateReminder(copy: ReminderCopy) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const state = readMateReminderState();
  if (!state.reminderOptIn) return;
  if (state.nextUnlockAt != null && Date.now() < state.nextUnlockAt) {
    await scheduleFindMateReminder(state.nextUnlockAt, copy);
    return;
  }
  await maybeNotifyFindMateReady(copy);
}
