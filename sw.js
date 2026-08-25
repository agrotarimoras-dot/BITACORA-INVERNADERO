// Nombre de la caché (súbelo a v1.0.2, v1.0.3, etc. cada vez que quieras forzar recarga)
const CACHE_NAME = 'bitacora-invernadero-v1.0.2';
// Archivos esenciales para funcionamiento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  // Scripts de Firebase: se precargan para que la app también pueda
  // intentar conectarse a la nube incluso si la primera vez que se abre
  // ya no hay señal (por ejemplo, si el teléfono se queda sin batería y
  // se reinicia estando en el campo, sin cobertura).
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js'
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
  // Ignorar peticiones a Firebase/Firestore/Auth para que no interfiera la caché
  // con la sincronización en tiempo real ni con el inicio de sesión anónimo.
  const url = event.request.url;
  if (
    url.includes('firestore') ||
    url.includes('firebase') ||
    url.includes('googleapis.com')
  ) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
