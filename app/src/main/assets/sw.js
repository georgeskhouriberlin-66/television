/* PhoeniciaTV Service Worker — App-Shell precachen, Netzwerk mit Cache-Fallback.
 * Eine Datei, kein Build. Bei Shell-Aenderungen VERSION hochzaehlen. */
'use strict';

const VERSION = 'phoenicia-tv-v1';
const STATIC_CACHE = VERSION + '-static';
const RUNTIME_CACHE = VERSION + '-runtime';

const APP_SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'hls.min.js',
  'logo.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isNavigation(request) {
  return request.mode === 'navigate' ||
    (request.method === 'GET' && request.headers.get('accept') !== null &&
      request.headers.get('accept').indexOf('text/html') !== -1);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Streams/CDN nie cachen

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && (response.status === 200 || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request).then((hit) => {
        if (hit) return hit;
        if (isNavigation(request)) return caches.match('index.html');
        return Response.error();
      }))
  );
});
