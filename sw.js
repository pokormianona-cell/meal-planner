
self.addEventListener('install', event => {
    event.waitUntil(caches.open('meal-planner-v3').then(cache => cache.addAll([
        './', 'index.html', 'style.css', 'manifest.json', 'icons/icon.svg',
        'js/app.js', 'js/firebase-db.js', 'js/products/products.js',
        'js/menu/menu-components.js', 'js/menu/menu-ratings.js', 'js/menu/menu-subtract.js',
        'js/menu/menu.js', 'js/stats/stats.js', 'js/shopping/shopping.js'
    ])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => event.waitUntil(clients.claim()));
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open('meal-planner-v3').then(cache => cache.put(event.request, copy));
        return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('index.html'))));
});
