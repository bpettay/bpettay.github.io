const CACHE_NAME = 'brock-tools-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/style.css',
  '/assets/css/home.css',
  '/assets/css/tools.css',
  '/assets/js/app.js',
  '/assets/js/navigation.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
