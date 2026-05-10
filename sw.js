const CACHE_NAME = 'meal-planner-v4';

self.addEventListener('install', event => {
    console.log('SW: install');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW: activate');
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});