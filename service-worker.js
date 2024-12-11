const CACHE_NAME = 'dpt-skills-v5';
const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'styles/main.css',
    'js/app.js',
    'js/db.js',
    'js/behaviors.js',
    'js/ui.js',
    'js/theme.js',
    'manifest.json',
    'data/theory.json',
    'data/assumptions.json',
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css'
];

// При установке воркера
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting()) // Принудительно активируем новый Service Worker
    );
});

// При активации воркера
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Удаляем неактуальные версии кэша
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Принимаем контроль над всеми клиентами
            return self.clients.claim();
        })
    );
});

// Стратегия загрузки: сначала сеть, затем кэш
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Если получили ответ от сети, обновляем кэш
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Если сеть недоступна, используем кэш
                return caches.match(event.request);
            })
    );
});
