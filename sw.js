const REPO_NAME = '/kanji-search';
const CACHE_NAME = 'pwa-cache-v1';
const staticCacheName = 'site-static-v2';
const dynamicCacheName = 'site-dynamic-v1';
const urlsToCache = [
  `${REPO_NAME}/index.html`,
  `${REPO_NAME}/index.css`,
  `${REPO_NAME}/index.js`,
  `${REPO_NAME}/dict.json`,
  `${REPO_NAME}/icons/192x192.png`,
  `${REPO_NAME}/icons/512x512.png`,
  `${REPO_NAME}/offline.html`,
];

// Install the service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Fetch resources
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((cacheRes) => {
        return (
          cacheRes ||
          fetch(event.request).then((fetchRes) => {
            return caches.open(dynamicCacheName).then((cache) => {
              cache.put(event.request.url, fetchRes.clone());
              return fetchRes;
            });
          })
        );
      })
      .catch(() => {
        if (event.request.url.indexOf('.html') > -1) {
          return caches.match(`${REPO_NAME}/offline.html`);
        }
      }),
  );
});

// Activate and update the cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k !== staticCacheName && k !== dynamicCacheName).map((key) => {
          return caches.delete(key);
        }),
      );
    }),
  );
});
