/* Service worker : rend l'application utilisable hors connexion. */

const CACHE = 'meslistes-v6';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Réseau d'abord, cache en secours : l'app se met à jour dès qu'il y a du réseau,
   et reste utilisable sans connexion. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // `fetch` passe par le cache HTTP du navigateur, qui peut renvoyer une vieille
  // copie sans même contacter le serveur. On force une revalidation pour que les
  // mises à jour de l'app soient réellement prises en compte.
  let req = e.request;
  if (req.mode !== 'navigate') {
    try { req = new Request(req, { cache: 'no-cache' }); } catch {}
  }

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
