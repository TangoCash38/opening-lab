/* Find the mate — best-effort next-batch reminder. No push server. */
const CACHE = "opening-lab-find-mate-reminder-v1";
const KEY = "/__find-mate-reminder";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      await maybeNotify();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "schedule") {
    event.waitUntil(saveSchedule(data).then(() => armTimeout(data)));
  } else if (data.type === "check") {
    event.waitUntil(maybeNotify());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          await client.focus();
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow("/");
      }
    })(),
  );
});

async function saveSchedule(data) {
  const cache = await caches.open(CACHE);
  await cache.put(
    KEY,
    new Response(
      JSON.stringify({
        nextUnlockAt: data.nextUnlockAt,
        title: data.title,
        body: data.body,
        tag: data.tag || "find-mate-next-batch",
        icon: data.icon || "/icons/icon-192.png",
        notifiedAt: null,
      }),
      { headers: { "content-type": "application/json" } },
    ),
  );
}

async function readSchedule() {
  try {
    const cache = await caches.open(CACHE);
    const res = await cache.match(KEY);
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

let timeoutId = null;

function armTimeout(data) {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  const delay = Number(data.nextUnlockAt) - Date.now();
  if (!Number.isFinite(delay)) return;
  if (delay <= 0) {
    void maybeNotify();
    return;
  }
  if (delay > 24 * 60 * 60 * 1000 + 60_000) return;
  timeoutId = setTimeout(() => {
    timeoutId = null;
    void maybeNotify();
  }, delay);
}

async function maybeNotify() {
  const data = await readSchedule();
  if (!data || typeof data.nextUnlockAt !== "number") return;
  if (Date.now() < data.nextUnlockAt) {
    armTimeout(data);
    return;
  }
  if (data.notifiedAt != null && data.notifiedAt >= data.nextUnlockAt) return;

  try {
    await self.registration.showNotification(data.title || "Your next 5 mates are ready", {
      body: data.body || "Find the mate — 5 new puzzles",
      tag: data.tag || "find-mate-next-batch",
      icon: data.icon || "/icons/icon-192.png",
      renotify: true,
    });
    data.notifiedAt = Date.now();
    const cache = await caches.open(CACHE);
    await cache.put(
      KEY,
      new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" },
      }),
    );
  } catch {
    /* permission revoked or unsupported */
  }
}
