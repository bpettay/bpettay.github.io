const CACHE_NAME = "brock-tools-shell-v4";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./Favicon.png",
  "./assets/css/style.css",
  "./assets/css/home.css",
  "./assets/css/tools.css",
  "./assets/css/pyro-auth.css",
  "./assets/css/pyro-team.css",
  "./assets/css/pyro-gates.css",
  "./assets/css/command-bar.css",
  "./assets/css/refinement.css",
  "./assets/js/date-utils.js",
  "./assets/js/converter-data.js",
  "./assets/js/navigation.js",
  "./assets/js/converter.js",
  "./assets/js/pyro-sim.js",
  "./assets/js/pyro-team.js",
  "./assets/js/pyro-gates.js",
  "./assets/js/weather-window.js",
  "./assets/js/command-bar.js",
  "./assets/js/app.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
