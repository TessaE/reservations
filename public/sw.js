// Bump this version whenever you want to invalidate all cached assets
// (e.g. after changing icons, CSS, or other static files).
const CACHE_NAME = 'reservations-v2';

// Only pre-cache truly static assets that never change between deploys.
// - Do NOT include '/' (SSR – always needs a fresh response)
// - Do NOT include '/manifest.webmanifest' (must always be fetched fresh
//   so PWA metadata/colors/icons update without a manual cache clear)
const PRECACHE_ASSETS = [
  '/favicon.svg',
  '/favicon.ico',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: network-first for navigation/API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Network-only: manifest must always be fresh so PWA metadata updates are
  // picked up immediately (no manual "Clear site data" required).
  if (url.pathname === '/manifest.webmanifest') {
    return; // fall through to browser default – no cache involvement
  }

  // Cache-first for static assets (fonts, images, icons, CSS, JS)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/_astro/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2?|ttf)$/)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // Network-first for everything else (pages, API routes)
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful navigation responses
        if (response && response.status === 200 && request.mode === 'navigate') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve from cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Fallback to the main page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});

