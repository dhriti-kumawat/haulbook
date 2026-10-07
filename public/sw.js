// Haulbook service worker.
// Makes the app installable and shows a friendly page when offline.
// It never caches API responses or signed-in pages, so private data is not stored on the device.
const OFFLINE_URL = "/offline.html";
const CACHE = "haulbook-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only page navigations get the offline fallback; everything else goes straight to the network.
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

// Reminder notifications (Web Push). The payload is { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Haulbook", {
      body: data.body || "Something needs you today.",
      icon: "/icons/192",
      badge: "/icons/192",
      tag: data.tag || "haulbook",
      renotify: true,
      data: { url: data.url || "/home" },
    })
  );
});

// Tapping a notification focuses an open Haulbook window, or opens one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/home", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => c.url.startsWith(self.location.origin));
      if (open) return open.navigate(url).then((c) => (c || open).focus());
      return self.clients.openWindow(url);
    })
  );
});
