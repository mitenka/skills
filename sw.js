const CACHE_VERSION = 'v1.1';
const CACHE_NAME = `skills-app-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/data/skills.json',
    '/data/principles.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Установка Service Worker'а
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Активация Service Worker'а
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('skills-app-') && cacheName !== CACHE_NAME;
                        })
                        .map((cacheName) => {
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                // Принимаем контроль над всеми клиентами
                return self.clients.claim();
            })
    );
});

// Стратегия кеширования: Network First с таймаутом
self.addEventListener('fetch', (event) => {
    event.respondWith(
        Promise.race([
            // Пробуем загрузить из сети
            fetch(event.request)
                .then((response) => {
                    // Кешируем новый ответ
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    return response;
                }),
            
            // Таймаут для загрузки из сети
            new Promise((resolve) => {
                setTimeout(() => {
                    // Если сеть медленная, пробуем взять из кеша
                    caches.match(event.request)
                        .then((response) => {
                            if (response) {
                                resolve(response);
                            }
                        });
                }, 1000); // Таймаут 1 секунда
            })
        ]).catch(() => {
            // Если оба запроса не удались, пробуем взять из кеша
            return caches.match(event.request);
        })
    );
});
