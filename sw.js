// Service Worker: hält die App-Dateien bereit, damit sie auch ohne Netz startet, und merkt sich Poster.
// App-Dateien: erst das Netz fragen (so kommen Updates sofort an), nach 3 Sekunden oder ohne Netz den gemerkten Stand.
// Poster von TMDB: einmal geladen, danach immer aus dem Speicher (sie ändern sich nicht).
// Die TMDB-API selbst läuft nicht hierüber. Bei jeder Änderung an der Dateiliste VERSION hochzählen.
const VERSION = 'mt-2';
const BILDER = 'mt-bilder';
const DATEIEN = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/main.js', 'js/kern.js', 'js/zustand.js', 'js/hilfen.js', 'js/ansichten.js', 'js/aktionen.js',
  'js/daten.js', 'js/pruefen.js', 'js/speicher.js', 'js/tmdb.js', 'js/demo.js', 'js/thema.js', 'js/config.js',
  'vendor/idiomorph.js', 'icons/apple-touch-icon.png', 'icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN.map(d => new Request(d, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(alle => Promise.all(alle.filter(k => k !== VERSION && k !== BILDER).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  if (url.hostname === 'image.tmdb.org') {
    e.respondWith(caches.open(BILDER).then(async c => {
      const gemerkt = await c.match(e.request);
      if (gemerkt) return gemerkt;
      const antwort = await fetch(e.request);
      if (antwort.ok || antwort.type === 'opaque') c.put(e.request, antwort.clone());
      return antwort;
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;
  const gemerkt = () => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'));
  const frisch = e.request.mode === 'navigate' ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request, { cache: 'no-cache' });
  const netz = frisch.then(antwort => {
    if (antwort.ok) { const kopie = antwort.clone(); caches.open(VERSION).then(c => c.put(e.request, kopie)); }
    return antwort;
  });
  const zuLangsam = new Promise(fertig => setTimeout(fertig, 3000)).then(() => gemerkt().then(r => r || netz));
  e.respondWith(Promise.race([netz.catch(gemerkt), zuLangsam]));
});
