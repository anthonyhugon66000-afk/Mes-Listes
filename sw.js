/* Service worker : rend l'application utilisable hors connexion. */

const CACHE = 'meslistes-v15.1';

/* Les adresses portent le même numéro de version que dans `index.html` : c'est
   ce qui garantit qu'une page et ses scripts vont par paire. */
const ASSETS = [
  './',
  './index.html',
  './styles.css?v15.1',
  './app.js?v15.1',
  './sync.js?v15.1',
  './firebase-config.js?v15.1',
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

  // On ne s'occupe que de l'app elle-même et du SDK Firebase, qu'il faut avoir
  // en cache pour se connecter hors ligne. Les échanges avec Firestore, eux,
  // gèrent déjà leur propre mode hors connexion : les mettre en cache ici
  // reviendrait à lui servir des réponses périmées à sa place.
  const url = new URL(e.request.url);
  const local = url.origin === self.location.origin;
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!local && !sdk) return;

  // `fetch` passe par le cache HTTP du navigateur, qui peut renvoyer une vieille
  // copie sans même contacter le serveur. On force une revalidation pour que les
  // mises à jour de l'app soient réellement prises en compte.
  //
  // Une requête de navigation ne peut pas être recopiée — `new Request(req, …)`
  // refuse le mode `navigate` — d'où une requête neuve bâtie sur son URL. Sans
  // ça `index.html` restait la seule ressource servie depuis le cache HTTP,
  // et c'est justement elle qui désigne les scripts : l'app entière restait
  // figée à la version précédente le temps de son `max-age`.
  let req = e.request;
  try {
    req = req.mode === 'navigate'
      ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
      : new Request(req, { cache: 'no-cache' });
  } catch {}

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      // Hors connexion : le cache, et pour une navigation seulement, l'app à
      // défaut. Renvoyer index.html à la place d'un script produirait une erreur
      // bien plus difficile à comprendre qu'un échec franc.
      .catch(() => caches.match(e.request).then(r =>
        r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
