/* ============================================================
   Synchronisation — compte Firebase et listes dans Firestore

   Principe : l'app marche sans compte, exactement comme avant. Se connecter
   est un ajout, jamais un préalable. Une panne de Firebase ou de réseau ne
   doit pas laisser quelqu'un bloqué devant son rayon de courses.

   Le SDK Firebase n'est téléchargé qu'au moment où on en a besoin : tant que
   personne ne se connecte, l'app reste sans dépendance.
   ============================================================ */

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0/';

const Sync = {
  pret: false,          // SDK chargé et écoute de l'état de connexion en place
  user: null,           // { uid, email } quand connecté
  erreur: null,
  onChange: () => {}    // renseigné par app.js
};
window.Sync = Sync;

let fb = null;              // fonctions du SDK, une fois chargées
let arreterEcoute = null;
let arreterReglages = null;
let envoye = new Map();     // id de liste -> signature déjà poussée
let envoyeReglages = null;
let chargement = null;

/* ---------- Chargement du SDK ---------- */

function chargerSDK() {
  if (chargement) return chargement;

  chargement = (async () => {
    const [app, auth, store] = await Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-auth.js'),
      import(SDK + 'firebase-firestore.js')
    ]);

    const application = app.initializeApp(FIREBASE_CONFIG);

    // Le cache persistant est ce qui rend l'app utilisable hors connexion :
    // les lectures viennent du disque et les écritures partent au retour du réseau.
    const db = store.initializeFirestore(application, {
      localCache: store.persistentLocalCache({
        tabManager: store.persistentMultipleTabManager()
      })
    });

    fb = { auth: auth.getAuth(application), db, a: auth, s: store };
    return fb;
  })();

  // Un échec ne doit pas condamner les tentatives suivantes — le réseau revient.
  chargement.catch(() => { chargement = null; });
  return chargement;
}

/* ---------- Connexion ---------- */

/* Appelé au démarrage seulement si un compte a déjà servi sur l'appareil :
   inutile de télécharger le SDK pour quelqu'un qui n'aura jamais de compte. */
Sync.init = async function () {
  if (Sync.pret) return;
  Sync.pret = true;

  const { auth, a } = await chargerSDK();

  a.onAuthStateChanged(auth, async utilisateur => {
    Sync.user = utilisateur ? { uid: utilisateur.uid, email: utilisateur.email } : null;
    localStorage.setItem('meslistes.compte', utilisateur ? '1' : '');

    if (arreterEcoute) { arreterEcoute(); arreterEcoute = null; }
    if (arreterReglages) { arreterReglages(); arreterReglages = null; }
    envoye = new Map();
    envoyeReglages = null;

    if (utilisateur) {
      try { await demarrerEcoute(); }
      catch (e) { signalerErreur(e); }
    }
    Sync.onChange();
  });
};

Sync.signUpEmail = (email, mdp) =>
  chargerSDK().then(({ auth, a }) => a.createUserWithEmailAndPassword(auth, email, mdp));

Sync.signInEmail = (email, mdp) =>
  chargerSDK().then(({ auth, a }) => a.signInWithEmailAndPassword(auth, email, mdp));

Sync.resetEmail = email =>
  chargerSDK().then(({ auth, a }) => a.sendPasswordResetEmail(auth, email));

Sync.signInGoogle = async function () {
  const { auth, a } = await chargerSDK();
  const fournisseur = new a.GoogleAuthProvider();
  // Une app installée sur l'écran d'accueil n'a pas de fenêtre surgissante à sa
  // disposition : on redirige, et Firebase reprend la main au retour.
  const installee = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return installee
    ? a.signInWithRedirect(auth, fournisseur)
    : a.signInWithPopup(auth, fournisseur);
};

Sync.signOut = async function () {
  const { auth, a } = await chargerSDK();
  await a.signOut(auth);
};

function signalerErreur(e) {
  Sync.erreur = e?.code || String(e);
  Sync.onChange();
}

/* ---------- Écoute et envoi des listes ---------- */

const collectionListes = () => fb.s.collection(fb.db, 'lists');
const docReglages = () => fb.s.doc(fb.db, 'users', Sync.user.uid);

/* Ce qui distingue deux versions d'une liste. L'ordre en fait partie : déplacer
   une liste est une modification comme une autre. */
const signature = (liste, i) =>
  JSON.stringify([liste.name, liste.color, liste.items]) + '|' + i;

const noterEnvoyees = () => {
  envoye = new Map(state.lists.map((l, i) => [l.id, signature(l, i)]));
};

async function demarrerEcoute() {
  const { s } = fb;
  const requete = s.query(collectionListes(), s.where('members', 'array-contains', Sync.user.uid));

  // Ce qui existait sur l'appareil avant la connexion est versé dans le compte,
  // une seule fois : les listes déjà en ligne sont reconnues à leur identifiant,
  // donc se reconnecter ne duplique rien.
  const distantes = await s.getDocs(requete);
  const connues = new Set(distantes.docs.map(d => d.id));
  const aVerser = state.lists.filter(l => !connues.has(l.id));
  if (aVerser.length) {
    const lot = s.writeBatch(fb.db);
    aVerser.forEach((liste, i) =>
      lot.set(s.doc(collectionListes(), liste.id), enDocument(liste, connues.size + i)));
    await lot.commit();
  }

  arreterEcoute = s.onSnapshot(requete, instantane => {
    state.lists = instantane.docs
      .map(d => ({ id: d.id, name: d.data().name, color: d.data().color,
                   items: d.data().items || [], ordre: d.data().ordre }))
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

    // La normalisation d'abord, les signatures ensuite : sinon une donnée
    // d'ancien format serait renvoyée en boucle au serveur.
    migrate(state);
    noterEnvoyees();
    Sync.erreur = null;
    sauverLocalement();
    Sync.onChange();
  }, signalerErreur);

  ecouterReglages();
}

/* ---------- Apparence ----------

   Le thème est réservé aux comptes : il doit donc suivre le compte, sinon le
   violet choisi sur le téléphone resterait introuvable sur l'ordinateur. */

const signatureReglages = () => JSON.stringify([state.theme || 'auto', state.accent || null]);

function ecouterReglages() {
  arreterReglages = fb.s.onSnapshot(docReglages(), instantane => {
    const distant = instantane.data();

    if (distant) {
      // Le compte fait foi : c'est lui qui porte l'apparence.
      state.theme = distant.theme || 'auto';
      state.accent = distant.accent || null;
      envoyeReglages = signatureReglages();
      sauverLocalement();
      applyTheme();
    } else {
      // Rien en ligne : ce premier appareil donne le ton au compte.
      envoyeReglages = null;
      pousserReglages();
    }
  }, signalerErreur);
}

function pousserReglages() {
  const sig = signatureReglages();
  if (envoyeReglages === sig) return;
  envoyeReglages = sig;
  fb.s.setDoc(docReglages(),
    { theme: state.theme || 'auto', accent: state.accent || null },
    { merge: true }
  ).catch(signalerErreur);
}

function enDocument(liste, ordre) {
  return {
    name: liste.name,
    color: liste.color,
    items: liste.items,
    ordre,
    owner: Sync.user.uid,
    members: [Sync.user.uid],
    majLe: fb.s.serverTimestamp()
  };
}

/* Appelé après chaque modification. On n'écrit que les listes réellement
   changées : le quota gratuit ne mérite pas d'être gaspillé à tout réécrire
   à chaque case cochée. */
Sync.push = function () {
  if (!Sync.user || !fb) return;
  const { s } = fb;

  pousserReglages();

  state.lists.forEach((liste, i) => {
    const sig = signature(liste, i);
    if (envoye.get(liste.id) === sig) return;
    envoye.set(liste.id, sig);
    s.setDoc(s.doc(collectionListes(), liste.id), enDocument(liste, i)).catch(signalerErreur);
  });

  const vivantes = new Set(state.lists.map(l => l.id));
  [...envoye.keys()].filter(id => !vivantes.has(id)).forEach(id => {
    envoye.delete(id);
    s.deleteDoc(s.doc(collectionListes(), id)).catch(() => {});
  });
};

/* Un compte a déjà servi ici : on rebranche la synchro au démarrage, sans quoi
   l'app s'ouvrirait déconnectée à chaque fois. */
if (localStorage.getItem('meslistes.compte')) {
  addEventListener('load', () => Sync.init().catch(signalerErreur));
}
