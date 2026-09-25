// sw.js
const CACHE = 'crishern-v3';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './css/app.css',
  './css/brasil.css',
  './css/print.css',
  './js/router.js',
  './js/workout-data.js',
  './js/spreadsheet-data.js',
  './js/load-calculator.js',
  './js/timer.js',
  './js/audio-engine.js',
  './js/brasil-score.js',
  './js/brasil-audio.js',
  './js/theme.js',
  './js/ambience.js',
  './music/brute-kawaii.mid',
  './music/brasil-sol-de-treino.mid',
  './js/views/dashboard.js',
  './js/views/workout.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    (async () => {
      const oldCaches = (await caches.keys()).filter(k => k.startsWith('crishern-v') && k !== CACHE);
      const windows = oldCaches.length ? await self.clients.matchAll({ type: 'window', includeUncontrolled: true }) : [];
      await Promise.all(oldCaches.map(k => caches.delete(k)));
      await self.clients.claim();
      await Promise.allSettled(windows
        .filter(client => client.url.startsWith(self.registration.scope) && client.frameType === 'top-level')
        .map(client => client.navigate(client.url)));
    })()
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
