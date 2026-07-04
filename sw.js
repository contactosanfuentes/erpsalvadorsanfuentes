// Service Worker v6 — Mínimo y seguro
// No cachea nada agresivamente, solo pasa requests al network
const CACHE_NAME = 'erp-scout-v10';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  // Eliminar TODOS los caches viejos
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network-only (sin cache) — no interfiere con nada
self.addEventListener('fetch', event => {
  // No interceptar nada — dejar que todo vaya directo al network
  return;
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
