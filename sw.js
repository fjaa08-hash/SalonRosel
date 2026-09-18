const CACHE_NAME = 'rosel-app-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // La página principal se pide siempre a internet primero, para que
  // cualquier actualización se vea de inmediato. Si no hay internet,
  // usa la última copia guardada.
  if (req.mode === 'navigate' || req.url.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  // Los archivos que casi no cambian (íconos, manifest) sí se sirven
  // de la copia guardada primero, para que la app abra rápido.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
