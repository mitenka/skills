const CACHE_NAME = "v1.8.0";

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
    })
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
        })
      );
      await self.clients.claim();
    })()
  );
});

// Функция для запроса с таймаутом
function timeoutFetch(request, timeout = 5000) {
  return Promise.race([
    fetch(request),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), timeout)
    ),
  ]);
}

// Обработчик изменения состояния сети
self.addEventListener("online", (event) => {
  console.log("Network is online, updating cache...");
  self.skipWaiting();
  self.clients.claim();
});

self.addEventListener("offline", (event) => {
  console.log("Network is offline, serving from cache...");
});

// Основной обработчик fetch
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .match(event.request)
        .then((cachedResponse) => {
          // Используем стратегию stale-while-revalidate
          const fetchPromise = timeoutFetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                // Асинхронно обновляем кэш
                cache
                  .put(event.request, networkResponse.clone())
                  .catch((error) =>
                    console.error("Cache update failed:", error)
                  );
              }
              return networkResponse;
            })
            .catch((error) => {
              console.error(
                `Network fetch failed for ${event.request.url}:`,
                error
              );
              // Возвращаем кэшированный ответ или offline.html
              return cachedResponse || caches.match("/offline.html");
            });

          // Сразу возвращаем кэшированный ответ, если он есть
          return cachedResponse || fetchPromise;
        })
        .catch((error) => {
          console.error("Cache match failed:", error);
          return caches.match("/offline.html");
        });
    })
  );
});
