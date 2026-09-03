// Nombre de la caché (súbelo a v1.0.4, v1.0.5, etc. la próxima vez que quieras forzar recarga)
const CACHE_NAME = 'bitacora-invernadero-v1.0.3';

// Archivos LOCALES esenciales (mismo dominio) — si alguno falla, sí debe
// cancelar la instalación, porque sin ellos la app no puede funcionar.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Archivos EXTERNOS (Firebase, en gstatic.com) — se intentan precargar,
// pero si alguno falla (por ejemplo, por política de CORS del navegador),
// NO debe tumbar la instalación completa del service worker. Por eso se
// manejan aparte, con su propio try/catch, uno por uno.
const EXTERNAL_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js'
];

// Evento de Instalación
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // 1) Archivos locales: esto SÍ debe funcionar siempre (son del mismo
      //    dominio). Si esto falla, algo más grave está pasando.
      await cache.addAll(ASSETS_TO_CACHE);

      // 2) Archivos externos de Firebase: se intentan uno por uno, y si
      //    alguno falla (sin internet en el primer install, CORS, etc.)
      //    simplemente se ignora ESE archivo — NUNCA se cancela toda la
      //    instalación por su culpa. Así la app SIEMPRE queda utilizable
      //    sin conexión, aunque Firebase tarde en estar disponible.
      await Promise.all(EXTERNAL_ASSETS.map(async (url) => {
        try {
          const resp = await fetch(url, { mode: 'no-cors' });
          await cache.put(url, resp);
        } catch (err) {
          // Sin problema: se reintentará la próxima vez que haya señal.
        }
      }));
    })()
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
