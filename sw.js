const CACHE = "dc-viewer-shell-v12";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {

      // Si el archivo ya existe localmente, úsalo inmediatamente
      if (cached) {
        return cached;
      }

      // Si no existe en caché, intenta obtenerlo de Internet
      return fetch(event.request)
        .then(response => {

          const copy = response.clone();

          // Solo guardar archivos de nuestro propio sitio
          if (
            response.ok &&
            new URL(event.request.url).origin === self.location.origin
          ) {
            caches.open(CACHE).then(cache => {
              cache.put(event.request, copy);
            });
          }

          return response;
        })
        .catch(() => {

          // Si se está intentando abrir una página y no hay Internet,
          // cargar la aplicación principal
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return Response.error();
        });
    })
  );
});