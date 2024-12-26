const CACHE_NAME = "v1.4.1";

// Добавляем обработчик сообщений
self.addEventListener("message", (event) => {
  if (event.data === "getVersion") {
    event.ports[0].postMessage(CACHE_NAME);
  }
});

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles/main.css",
  "/styles/diary.css",
  "/js/app.js",
  "/js/behaviors.js",
  "/js/db.js",
  "/js/diary-history.js",
  "/js/export-utils.js",
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
];

// При установке воркера
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// При активации воркера
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keyList = await caches.keys();
      await Promise.all(
        keyList.map((key) => {
          if (key.startsWith(CACHE_NAME) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Отдельная стратегия для CSS файлов - StaleWhileRevalidate
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.url.endsWith(".css")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
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
          return caches.match(event.request);
        })
    );
  }
});
