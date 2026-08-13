// Service Worker de la Bitácora del Invernadero
// Guarda una copia de la app la primera vez que se abre con internet,
// para que después funcione offline aunque se abra desde la URL de GitHub Pages.

const CACHE_NAME = 'invernadero-cache-v1';
const ARCHIVOS_A_GUARDAR = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ARCHIVOS_A_GUARDAR))
      .catch(() => {}) // si algún archivo no existe con ese nombre exacto, no rompe nada
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((respuestaCache) => {
      return respuestaCache || fetch(event.request).catch(() => caches.match('./index.html'));
    })
  );
});
