const CACHE_NAME = "engineering-dashboard-shell-v39";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/branding/mark-01.png",
  "./assets/branding/mark-02.png",
  "./assets/branding/mark-03.png",
  "./assets/branding/mark-04.png",
  "./assets/branding/mark-05.png",
  "./assets/css/style.css?v=20260928-1",
  "./assets/css/home.css?v=20260928-6",
  "./assets/css/tools.css?v=20260927-3",
  "./assets/css/pyro-auth.css?v=20260926-1",
  "./assets/css/pyro-team.css?v=20260926-1",
  "./assets/css/pyro-gates.css?v=20260926-1",
  "./assets/css/command-bar.css?v=20260926-1",
  "./assets/css/refinement.css?v=20260928-1",
  "./assets/css/graphing-calculator.css?v=20260927-4",
  "./assets/js/date-utils.js?v=20260926-1",
  "./assets/js/converter-data.js?v=20260926-1",
  "./assets/js/navigation.js?v=20260928-5",
  "./assets/js/converter.js?v=20260927-2",
  "./assets/js/pyro-sim.js?v=20260926-1",
  "./assets/js/pyro-team.js?v=20260926-1",
  "./assets/js/pyro-gates.js?v=20260926-1",
  "./assets/js/weather-window.js?v=20260926-1",
  "./assets/js/vendor/math.js?v=20260926-1",
  "./assets/js/graphing-calculator.js?v=20260927-3",
  "./assets/js/command-bar.js?v=20260927-1",
  "./assets/js/app.js?v=20260928-1",
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
