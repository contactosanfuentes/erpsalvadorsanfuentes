const CACHE_NAME = 'erp-scout-v3';
const RUNTIME_CACHE = 'erp-runtime-v3';

// Archivos críticos que se precachean
const STATIC_ASSETS = [
  '/',
  '/login.html',
  '/index.html',
  '/manifest.json',
  '/wa_api.js'
];

// CDNs y recursos externos confiables que cacheamos en runtime
const RUNTIME_CACHE_PATTERNS = [
  /^https:\/\/cdn\.jsdelivr\.net/,
  /^https:\/\/cdnjs\.cloudflare\.com/,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /^https:\/\/i\.imgur\.com/,
  /^https:\/\/ui-avatars\.com/
];

// ── INSTALL: precachear assets críticos ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('SW install:', err))
  );
});

// ── ACTIVATE: limpiar caches viejos ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: estrategia híbrida ──
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo manejar GET
  if (req.method !== 'GET') return;

  // No interceptar API de Supabase ni Netlify functions (necesitan red)
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/.netlify/')) {
    return;
  }

  // inscripcion_publica.html: siempre network (form crítico, sin caché)
  if (url.pathname.includes('inscripcion_publica')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Recursos externos en runtime cache
  if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache =>
        cache.match(req).then(cached => {
          const fetchPromise = fetch(req).then(networkRes => {
            if (networkRes && networkRes.status === 200) cache.put(req, networkRes.clone());
            return networkRes;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Solo manejar mismo origen
  if (url.origin !== self.location.origin) return;

  // HTML: network-first con fallback a cache
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(c => c || caches.match('/login.html')))
    );
    return;
  }

  // Otros recursos: stale-while-revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// ── MESSAGE: control desde la app (ej: forzar actualización) ──
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
  }
});

// ── PUSH: notificaciones push (preparado, requiere backend) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'ERP Scout', {
        body: data.body || '',
        icon: 'https://i.imgur.com/11u9rUD.png',
        badge: 'https://i.imgur.com/11u9rUD.png',
        tag: data.tag || 'erp-scout',
        data: data.url || '/',
        vibrate: [200, 100, 200]
      })
    );
  } catch(e) { console.warn('Push error:', e); }
});

// ── NOTIFICATION CLICK: abrir la app al tocar la notificación ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsList => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
