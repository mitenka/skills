const CACHE_NAME = "v1.7.3";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles/diary.css",
  "/styles/fireworks.css",
  "/styles/main.css",
  "/styles/theory.css",
  "/js/app.js",
  "/js/behaviors.js",
  "/js/db.js",
  "/js/diary-history.js",
  "/js/export-utils.js",
  "/js/fireworks.js",
  "/js/practice.js",
  "/js/theme.js",
  "/js/ui.js",
  "/fonts/remixicon/remixicon.css",
  "/fonts/remixicon/remixicon.ttf",
  "/fonts/remixicon/remixicon.woff",
  "/fonts/remixicon/remixicon.woff2",
  "/data/assumptions.json",
  "/data/dictionary.json",
  "/data/theory.json",
  "/icons/icon-48x48.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-192x192.png",
  "/icons/icon-256x256.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/offline.html",
];

self.addEventListener("message", (event) => {
  if (event.data === "getVersion") {
    event.ports[0].postMessage(CACHE_NAME);
  }
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keyList = await caches.keys();
      await Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.url.endsWith(".css")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      }),
    );
  } else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("/offline.html");
          });
        }),
    );
  }
});
