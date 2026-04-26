const CACHE_NAME = 'erp-scout-v1';

// Archivos que se cachean para uso offline
const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

// Instalación: cachear assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first para HTML (siempre fresco), cache-first para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Solo manejar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // inscripcion_publica.html: siempre network (no-cache configurado en netlify.toml)
  if (url.pathname.includes('inscripcion_publica')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML: network-first, fallback a cache
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Resto: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
