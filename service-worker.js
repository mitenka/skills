const BASE_CACHE_NAME = "dpt-skills";
const CACHE_NAME = `${BASE_CACHE_NAME}-${new Date().toISOString()}`;

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles/main.css",
  "/styles/diary.css",
  "/js/app.js",
  "/js/ui.js",
  "/js/behaviors.js",
  "/js/db.js",
  "/js/diary-history.js",
  // Добавьте остальные нужные файлы
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
          if (key.startsWith(BASE_CACHE_NAME) && key !== CACHE_NAME) {
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
