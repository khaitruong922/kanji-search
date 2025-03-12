const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.js',
  '/dict.json',
  '/icons/192x192.png',
  '/icons/512x512.png',
];

// Install the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Fetch resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

// Activate and update the cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        }),
      );
    }),
  );
});
