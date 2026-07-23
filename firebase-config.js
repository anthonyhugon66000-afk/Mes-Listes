/* Configuration du projet Firebase « Mes Listes ».

   Ces valeurs sont publiques par nature : elles identifient le projet, elles
   n'autorisent rien. Ce qui protège les données, ce sont les règles d'accès
   déclarées dans la console Firebase (onglet Règles de Firestore).

   Analytics est volontairement écarté : l'app n'a pas besoin d'être mesurée,
   et c'est une dépendance et un traçage de moins. */

/* Le Worker Cloudflare qui envoie les notifications. Il détient la clé qui
   autorise l'envoi ; l'app ne fait que lui signaler quelle liste a changé.
   Son code est dans `worker/notifier.js`. */
const WORKER_NOTIFS = 'https://mes-listes-notifs.anthony-hugon-66000.workers.dev/';

/* Clé publique de notification (VAPID). Elle sert à réclamer un jeton d'envoi
   pour cet appareil. Publique elle aussi — c'est la clé privée, gardée chez
   Cloudflare, qui autorise à envoyer. */
const FIREBASE_VAPID =
  'BKW4EDxgLH8Lh1t5vlgysn7c2MfTyTtyD7uwgY0BPyL_296lV_x24Hjvb8_vmAEN2WVgrYi6DAq_mIwYdQ1qiAM';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBD0DUziulvwarBdKRF5nBStzagpJ3px3Q',
  authDomain: 'mes--listes.firebaseapp.com',
  projectId: 'mes--listes',
  storageBucket: 'mes--listes.firebasestorage.app',
  messagingSenderId: '952930705142',
  appId: '1:952930705142:web:19d7c817d3889a885696d7'
};
