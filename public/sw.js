const CACHE_NAME = "dailygoal-static-v1";
const STATIC_ASSETS = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

// Solo se cachean íconos y el manifest. Páginas y datos de sesión siempre
// van a la red para no mostrar información desactualizada o de otra sesión.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.startsWith("/icons/") || url.pathname === "/manifest.webmanifest";

  if (event.request.method !== "GET" || !isStaticAsset) {
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
