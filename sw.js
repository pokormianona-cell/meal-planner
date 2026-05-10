const CACHE_NAME = 'meal-planner-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/app.js',
  '/js/database.js',
  '/js/products/products.js',
  '/js/menu/menu.js',
  '/js/menu/menu-components.js',
  '/js/menu/menu-ratings.js',
  '/js/menu/menu-subtract.js',
  '/js/stats/stats.js',
  '/js/shopping/shopping.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Кеширование файлов');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});