// Nombre de la caché (puedes cambiar v1 por v2, v3, etc., cada vez que quieras forzar recarga)
const CACHE_NAME = 'bitacora-invernadero-v1.0.1';

// Archivos esenciales para funcionamiento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Evento de Instalación: Fuerza a activar el nuevo service worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Evento de Activación: Toma control inmediato y limpia cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    clients.claim().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      });
    })
  );
});

// Evento Fetch: Carga desde red y cae en caché si no hay internet
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a Firebase y scripts externos para que no interfiera la caché
  if (event.request.url.includes('firestore') || event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
