/* Service worker : rend l'application utilisable hors connexion. */

const CACHE = 'meslistes-v20.5b';

/* Les adresses portent le mÃªme numÃ©ro de version que dans `index.html` : c'est
   ce qui garantit qu'une page et ses scripts vont par paire. */
const ASSETS = [
  './',
  './index.html',
  './styles.css?v20.5b',
  './produits.js?v20.5b',
  './app.js?v20.5b',
  './sync.js?v20.5b',
  './firebase-config.js?v17.9',
  './manifest.json',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/icon-badge.png'
];

self.addEventListener('install', e => {
  // `allSettled` au lieu de `addAll` : un seul asset inaccessible ne fait plus
  // Ã©chouer tout l'install â€” le fetch handler rattrapera au premier accÃ¨s.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
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

/* Notifications poussÃ©es. Le Worker n'envoie que des donnÃ©es, sans texte tout
   prÃªt : c'est ici qu'on compose l'affichage, seul endroit qui connaisse les
   icÃ´nes de l'app. */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch {}
  const contenu = d.data || d;

  e.waitUntil(self.registration.showNotification(contenu.titre || 'Mes Listes', {
    body: contenu.corps || 'Une de tes listes a changÃ©.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-badge.png',
    lang: 'fr',
    tag: contenu.listeId || 'mes-listes',
    data: { listeId: contenu.listeId || '' }
  }));
});

/* Toucher la notification doit rouvrir l'app, et rÃ©utiliser la fenÃªtre dÃ©jÃ 
   ouverte plutÃ´t que d'en empiler une nouvelle. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ouverte = fenetres.find(c => c.url.includes(self.registration.scope));
    if (ouverte) return ouverte.focus();
    return self.clients.openWindow('./index.html');
  })());
});

/* RÃ©seau d'abord, cache en secours : l'app se met Ã  jour dÃ¨s qu'il y a du rÃ©seau,
   et reste utilisable sans connexion. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // On ne s'occupe que de l'app elle-mÃªme et du SDK Firebase, qu'il faut avoir
  // en cache pour se connecter hors ligne. Les Ã©changes avec Firestore, eux,
  // gÃ¨rent dÃ©jÃ  leur propre mode hors connexion : les mettre en cache ici
  // reviendrait Ã  lui servir des rÃ©ponses pÃ©rimÃ©es Ã  sa place.
  const url = new URL(e.request.url);
  const local = url.origin === self.location.origin;
  const sdk = url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  if (!local && !sdk) return;

  // `fetch` passe par le cache HTTP du navigateur, qui peut renvoyer une vieille
  // copie sans mÃªme contacter le serveur. On force une revalidation pour que les
  // mises Ã  jour de l'app soient rÃ©ellement prises en compte.
  //
  // Une requÃªte de navigation ne peut pas Ãªtre recopiÃ©e â€” `new Request(req, â€¦)`
  // refuse le mode `navigate` â€” d'oÃ¹ une requÃªte neuve bÃ¢tie sur son URL. Sans
  // Ã§a `index.html` restait la seule ressource servie depuis le cache HTTP,
  // et c'est justement elle qui dÃ©signe les scripts : l'app entiÃ¨re restait
  // figÃ©e Ã  la version prÃ©cÃ©dente le temps de son `max-age`.
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
      // Hors connexion : le cache, et pour une navigation seulement, l'app Ã 
      // dÃ©faut. Renvoyer index.html Ã  la place d'un script produirait une erreur
      // bien plus difficile Ã  comprendre qu'un Ã©chec franc.
      .catch(() => caches.match(e.request).then(r =>
        r || (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
