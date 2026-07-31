/* ============================================================
   Synchronisation — compte Firebase et listes dans Firestore

   Principe : l'app marche sans compte, exactement comme avant. Se connecter
   est un ajout, jamais un préalable. Une panne de Firebase ou de réseau ne
   doit pas laisser quelqu'un bloqué devant son rayon de courses.

   Le SDK Firebase n'est téléchargé qu'au moment où on en a besoin : tant que
   personne ne se connecte, l'app reste sans dépendance.
   ============================================================ */

const SDK = 'https://www.gstatic.com/firebasejs/11.10.0/';
const CLE_REDIRECTION = 'meslistes.redirection';

const Sync = {
  pret: false,          // SDK chargé et écoute de l'état de connexion en place
  user: null,           // { uid, email } quand connecté
  erreur: null,
  etat: 'local',        // local | synchro | envoi | horsligne | erreur
  annonces: [],         // annonces actives reçues de Firestore
  onChange: () => {},   // renseigné par app.js
  onAnnonces: () => {}, // renseigné par app.js — reçoit le tableau d'annonces
  monAvatar: null,          // avatar du compte courant (chargé au login)
  cacheAvatars: new Map()   // uid → données avatar, chargés à la demande
};
window.Sync = Sync;

/* ---------- Comptes marqués : admins et comptes de test ----------

   Chaque compte spécial est désigné par son UID Firebase, associé à un type de
   marque : `admin` (doré) ou `test` (noir). L'UID est le choix le plus sûr —
   c'est le seul identifiant que les règles Firestore vérifient sans faille
   (`request.auth.uid`), impossible à usurper. Cette table sert à l'interface :
   badge affiché, panneau d'administration réservé aux admins. La sécurité, elle,
   vient des règles.

   LA LISTE DES ADMINS DOIT RESTER D'ACCORD avec `firestore.rules` (fonction
   `estAdmin`) : un admin ajouté ici doit l'être là-bas aussi, sans quoi ses
   écritures (annonce, réservation de pseudo) seront refusées. On récupère un UID
   dans la console Firebase : Authentication → Users → « Identifiant utilisateur ». */
Sync.MARQUES = {
  'jXcKGdfqQxNM8SZN3E4Y1nKX5d53': 'admin',   // compte Gmail
  'IfPmjQ3iLyUwA8lCAiyumevQa793': 'test'      // compte iCloud — pseudo unique, non admin
};

// La marque d'un compte, ou '' s'il n'en a pas. `uid` optionnel : par défaut le
// compte courant. L'argument sert à reconnaître un autre — l'auteur d'une
// invitation, celui qui a coché une case.
Sync.marque = (uid = Sync.user && Sync.user.uid) => (uid && Sync.MARQUES[uid]) || '';

// Les admins découlent de la table : seuls les comptes marqués `admin`. Un
// compte `test` n'a que son badge, aucun pouvoir.
Sync.ADMINS = Object.keys(Sync.MARQUES).filter(u => Sync.MARQUES[u] === 'admin');
Sync.estAdmin = (uid = Sync.user && Sync.user.uid) => !!uid && Sync.ADMINS.includes(uid);

let fb = null;              // fonctions du SDK, une fois chargées
let arreterEcoute = null;
let arreterReglages = null;
let arreterAnnonce = null;
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

  // Au retour d'une redirection, c'est le seul endroit où l'échec se manifeste.
  // Sans cette lecture, une connexion Google refusée ne dit rien du tout : on
  // revient sur l'écran d'accueil comme si l'on n'avait rien demandé.
  a.getRedirectResult(auth)
    .catch(e => signalerErreur(e, 'connexion'))
    .finally(() => localStorage.removeItem(CLE_REDIRECTION));

  a.onAuthStateChanged(auth, async utilisateur => {
    Sync.user = utilisateur ? { uid: utilisateur.uid, email: utilisateur.email } : null;
    localStorage.setItem('meslistes.compte', utilisateur ? '1' : '');

    if (arreterEcoute) { arreterEcoute(); arreterEcoute = null; }
    if (arreterReglages) { arreterReglages(); arreterReglages = null; }
    if (arreterAnnonce) { arreterAnnonce(); arreterAnnonce = null; }
    // Se déconnecter efface les annonces : elles ne valent que pour les connectés.
    Sync.annonces = [];
    Sync.onAnnonces([]);
    Sync.oublierAvis();
    Sync.invitations = [];
    Sync.monAvatar = null;
    Sync.cacheAvatars = new Map();
    envoye = new Map();
    envoyeReglages = null;
    Sync.etat = utilisateur ? 'envoi' : 'local';

    if (utilisateur) {
      try { await demarrerEcoute(); }
      catch (e) { signalerErreur(e, 'listes'); }
      Sync.logVisite().catch(() => {});
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

/* ---------- Connexion par lien ----------

   Pas de mot de passe : Firebase envoie un lien, l'ouvrir suffit. L'adresse est
   gardée de côté en attendant le retour, sinon Firebase la redemanderait — le
   lien seul ne prouve pas qui l'a demandé. */

const CLE_LIEN = 'meslistes.lien';

Sync.envoyerLien = async function (email) {
  const { auth, a } = await chargerSDK();
  await a.sendSignInLinkToEmail(auth, email.trim(), {
    url: location.href.split('?')[0].split('#')[0],
    handleCodeInApp: true
  });
  localStorage.setItem(CLE_LIEN, email.trim());
};

/* Vrai si la page a été ouverte depuis un lien de connexion. */
Sync.lienEnAttente = async function () {
  const { auth, a } = await chargerSDK();
  return a.isSignInWithEmailLink(auth, location.href);
};

Sync.terminerLien = async function (emailSaisi) {
  const { auth, a } = await chargerSDK();
  const email = emailSaisi || localStorage.getItem(CLE_LIEN);
  if (!email) throw { code: 'lien/adresse-manquante' };
  await a.signInWithEmailLink(auth, email, location.href);
  localStorage.removeItem(CLE_LIEN);
  // L'adresse et le jeton restent dans la barre d'adresse : on les efface pour
  // qu'un rechargement ne rejoue pas un lien désormais consommé.
  history.replaceState(null, '', location.pathname);
};

/* Google passe par un aller-retour sur `firebaseapp.com`, un autre domaine que
   celui de l'app. Safari cloisonne le stockage par domaine, et une app installée
   sur l'écran d'accueil est plus cloisonnée encore : la redirection revient
   souvent sans session. La fenêtre surgissante, elle, garde le contexte — et
   fonctionne bien depuis une app installée. On l'essaie donc d'abord, la
   redirection ne servant plus que de recours. */
Sync.signInGoogle = async function () {
  const { auth, a } = await chargerSDK();
  const fournisseur = new a.GoogleAuthProvider();
  try {
    return await a.signInWithPopup(auth, fournisseur);
  } catch (e) {
    const recuperable = ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment',
                         'auth/cancelled-popup-request'].includes(e?.code);
    if (!recuperable) throw e;
    // La redirection quitte la page : sans cette trace, on reviendrait sans
    // savoir qu'une connexion était en cours, et le résultat serait ignoré.
    localStorage.setItem(CLE_REDIRECTION, '1');
    return a.signInWithRedirect(auth, fournisseur);
  }
};

/* Ajoute un mot de passe à un compte déjà ouvert — typiquement créé avec Google.
   Le compte reste le même, avec ses listes : on lui donne simplement une seconde
   porte d'entrée, la seule qui fonctionne depuis une app installée sur iPhone. */
Sync.definirMotDePasse = async function (mdp) {
  const { auth, a } = await chargerSDK();
  const utilisateur = auth.currentUser;
  if (!utilisateur) throw { code: 'auth/no-current-user' };

  const aDejaUnMotDePasse = utilisateur.providerData.some(p => p.providerId === 'password');
  if (aDejaUnMotDePasse) return a.updatePassword(utilisateur, mdp);

  return a.linkWithCredential(utilisateur, a.EmailAuthProvider.credential(utilisateur.email, mdp));
};

Sync.signOut = async function () {
  const { auth, a } = await chargerSDK();
  await a.signOut(auth);
};

/* `origine` dit quelle partie a échoué. Sans elle, « accès refusé » ne permet
   pas de savoir quelle règle manque : celle des listes, des réglages, ou des
   invitations. */
function signalerErreur(e, origine) {
  Sync.erreur = e?.code || String(e);
  Sync.origine = origine || null;
  Sync.etat = 'erreur';
  Sync.onChange();
}

/* État de la synchro, déduit des métadonnées de Firestore : `hasPendingWrites`
   dit qu'une modification attend son tour, `fromCache` que la réponse vient du
   disque faute de serveur joignable. */
function majEtat(metadonnees) {
  if (!Sync.user) Sync.etat = 'local';
  else if (metadonnees?.hasPendingWrites) Sync.etat = 'envoi';
  else if (metadonnees?.fromCache || !navigator.onLine) Sync.etat = 'horsligne';
  else Sync.etat = 'synchro';
}

addEventListener('online', () => { if (Sync.user) { majEtat(); Sync.onChange(); } });
addEventListener('offline', () => { if (Sync.user) { Sync.etat = 'horsligne'; Sync.onChange(); } });

/* ---------- Écoute et envoi des listes ---------- */

const collectionListes = () => fb.s.collection(fb.db, 'lists');
const docReglages = () => fb.s.doc(fb.db, 'users', Sync.user.uid);

/* Ce qui distingue deux versions d'une liste. L'ordre en fait partie : déplacer
   une liste est une modification comme une autre. */
const signature = (liste, i) =>
  JSON.stringify([liste.name, liste.color, liste.type || 'normale', liste.linkedLists || [], liste.items]) + '|' + i;

const noterEnvoyees = () => {
  envoye = new Map(state.lists.map((l, i) => [l.id, signature(l, i)]));
};

async function demarrerEcoute() {
  const { s } = fb;

  // Récupérer les invitations en attente, pour les proposer sur l'écran
  // d'accueil. On ne rejoint plus tout seul.
  try { await chargerInvitations(); } catch (e) { signalerErreur(e, 'invitations'); }

  const requete = s.query(collectionListes(), s.where('members', 'array-contains', Sync.user.uid));

  // Ce qui existait sur l'appareil avant la connexion est versé dans le compte,
  // une seule fois : les listes déjà en ligne sont reconnues à leur identifiant,
  // donc se reconnecter ne duplique rien.
  //
  // Tout ce qui suit est délibérément tolérant à l'échec. Auparavant, un refus
  // ici interrompait la fonction avant même que l'écoute soit posée : plus rien
  // ne se synchronisait, et l'app se contentait d'afficher « erreur ».
  try {
    const distantes = await s.getDocs(requete);
    const connues = new Set(distantes.docs.map(d => d.id));

    // Une liste portant le nom d'un autre propriétaire vient d'un compte qui
    // s'est déconnecté de cet appareil. Elle vit dans le sien : la reprendre est
    // refusé par les règles, et la garder ici ne ferait qu'afficher un doublon
    // fantôme que rien ne met à jour.
    const aMoi = l => !l.owner || l.owner === Sync.user.uid;
    state.lists = state.lists.filter(l => aMoi(l) || connues.has(l.id));

    const aVerser = state.lists.filter(l => !connues.has(l.id) && aMoi(l));
    if (aVerser.length) {
      const lot = s.writeBatch(fb.db);
      aVerser.forEach((liste, i) =>
        lot.set(s.doc(collectionListes(), liste.id), enDocument(liste, connues.size + i)));
      await lot.commit();
    }
  } catch (e) {
    signalerErreur(e, 'listes');
  }

  // `includeMetadataChanges` : sans lui, passer de « envoi » à « synchronisé »
  // ne déclencherait aucun instantané, puisque les données, elles, n'ont pas bougé.
  arreterEcoute = s.onSnapshot(requete, { includeMetadataChanges: true }, instantane => {
    majEtat(instantane.metadata);
    // Ce qu'on affichait juste avant, pour repérer ce qu'un autre a changé.
    const avant = new Map(state.lists.map(l => [l.id, signature(l, 0)]));
    const avantItems = new Map(state.lists.map(l => [l.id, l.items]));
    const premierPassage = envoye.size === 0;

    state.lists = instantane.docs
      .map(d => {
        const v = d.data();
        return { id: d.id, name: v.name, color: v.color, items: v.items || [], ordre: v.ordre,
                 type: v.type || 'normale', linkedLists: v.linkedLists || [],
                 owner: v.owner, members: v.members || [], memberEmails: v.memberEmails || [],
                 majPar: v.majPar, majParNom: v.majParNom,
                 majLe: v.majLe?.toMillis ? v.majLe.toMillis() : (v.majLe?.seconds ? v.majLe.seconds * 1000 : null),
                 presence: v.presence || {} };
      })
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

    // À la première synchronisation tout paraît nouveau : signaler chaque liste
    // reviendrait à noyer l'utilisateur dès l'ouverture.
    if (!premierPassage) {
      state.lists.forEach(l => {
        const connue = avant.has(l.id);
        const change = connue && avant.get(l.id) !== signature(l, 0);
        if (change && l.majPar && l.majPar !== Sync.user.uid) {
          const ancItems = (avantItems.get(l.id) || []).filter(i => !i._section);
          const nouvItems = l.items.filter(i => !i._section);
          const ancMap = new Map(ancItems.map(i => [i.id, i]));
          const nouvMap = new Map(nouvItems.map(i => [i.id, i]));
          const done = i => i.variants?.length ? i.variants.every(v => v.done) : i.done;
          const ajouts  = nouvItems.filter(i => !ancMap.has(i.id));
          const coches  = nouvItems.filter(i => ancMap.has(i.id) && !done(ancMap.get(i.id)) && done(i));
          const retraits = ancItems.filter(i => !nouvMap.has(i.id));
          let detail =
            ajouts.length === 1  ? `a ajouté « ${ajouts[0].text} »` :
            ajouts.length > 1   ? `a ajouté ${ajouts.length} articles` :
            coches.length === 1  ? `a coché « ${coches[0].text} »` :
            coches.length > 1   ? `a coché ${coches.length} articles` :
            retraits.length === 1 ? `a retiré « ${retraits[0].text} »` :
            'a modifié la liste';
          Sync.modifs.push({ liste: l.name, qui: l.majParNom || 'quelqu\'un', detail });
        }
      });
    }

    // La normalisation d'abord, les signatures ensuite : sinon une donnée
    // d'ancien format serait renvoyée en boucle au serveur.
    migrate(state);
    noterEnvoyees();
    Sync.erreur = null;
    sauverLocalement();
    Sync.onChange();
  }, e => signalerErreur(e, 'listes'));

  ecouterReglages();

  // Les annonces globales : messages ou pauses décidés par un admin. Leur échec
  // est silencieux — l'app doit marcher même si cette lecture-là ne passe pas.
  arreterAnnonce = Sync.ecouterAnnonces(as => { Sync.annonces = as; Sync.onAnnonces(as); });

  // Charger l'avatar du compte en arrière-plan (silencieux).
  Sync.chargerAvatar().catch(() => {});
}

/* ---------- Notifications poussées ----------

   L'appareil réclame un jeton d'envoi et le range dans son propre profil. Le
   Worker, seul détenteur de la clé, ira le chercher pour prévenir les autres.
   L'app ne transmet jamais de jeton : elle dit quelle liste a changé, rien de
   plus, et le Worker vérifie qu'on en est bien membre. */

Sync.logVisite = async function () {
  if (!fb || !Sync.user) return;
  const { s, db } = fb;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await s.setDoc(s.doc(db, 'stats_daily', today), { visites: s.increment(1) }, { merge: true });
  } catch (e) {}
};

Sync.chargerAnalytics = async function () {
  if (!fb || !Sync.estAdmin()) return null;
  const { s, db } = fb;
  try {
    const debut = new Date();
    debut.setDate(debut.getDate() - 364);
    const debutStr = debut.toISOString().slice(0, 10);

    const [statsSnap, onbSnap] = await Promise.all([
      s.getDocs(s.query(s.collection(db, 'stats_daily'), s.orderBy(s.documentId()), s.startAt(debutStr))),
      s.getDocs(s.collection(db, 'onboarding'))
    ]);

    const visites = {};
    statsSnap.forEach(d => { visites[d.id] = d.data().visites || 0; });

    const prefs = { usage: {}, contexte: {} };
    onbSnap.forEach(d => {
      const v = d.data();
      if (v.usage)    prefs.usage[v.usage]       = (prefs.usage[v.usage]       || 0) + 1;
      if (v.contexte) prefs.contexte[v.contexte] = (prefs.contexte[v.contexte] || 0) + 1;
    });

    return { visites, prefs, totalUtilisateurs: onbSnap.size };
  } catch (e) {
    console.error('[analytics]', e);
    return null;
  }
};

Sync.sauverOnboarding = async function (reponses) {
  if (!fb || !Sync.user) return;
  try {
    const { s, db } = fb;
    await s.setDoc(s.doc(db, 'onboarding', Sync.user.uid), {
      ...reponses,
      uid: Sync.user.uid,
      cree: s.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error('[onboarding]', e);
  }
};

Sync.enregistrerJeton = async function () {
  if (!Sync.user) return null;
  const { s } = fb || await chargerSDK();
  const messagerie = await import(SDK + 'firebase-messaging.js');
  if (!(await messagerie.isSupported())) throw { code: 'notif/indisponible' };

  const reg = await navigator.serviceWorker.ready;
  const jeton = await messagerie.getToken(messagerie.getMessaging(), {
    vapidKey: FIREBASE_VAPID,
    serviceWorkerRegistration: reg
  });
  if (!jeton) throw { code: 'notif/sans-jeton' };

  await s.setDoc(docReglages(), { jetons: s.arrayUnion(jeton) }, { merge: true });
  return jeton;
};

/* Un appareil qui coche cinq articles d'affilée ne doit pas déclencher cinq
   notifications : on laisse passer quelques secondes avant de prévenir. */
const attentes = new Map();

Sync.prevenirMembres = function (liste) {
  if (!Sync.user || !liste || (liste.members || []).length < 2) return;
  clearTimeout(attentes.get(liste.id));
  attentes.set(liste.id, setTimeout(() => envoyerAvis(liste.id, liste.name), 5000));
};

/* Un avis en attente ne doit pas partir après un changement de compte : il
   emprunterait l'identité du compte suivant. */
Sync.oublierAvis = function () {
  attentes.forEach(clearTimeout);
  attentes.clear();
};

async function envoyerAvis(listeId, nomListe) {
  attentes.delete(listeId);
  appelerWorker({
    listeId,
    titre: `« ${nomListe} » a changé`,
    corps: `${Sync.nomAffiche()} vient de modifier la liste.`
  });
}

async function appelerWorker(charge) {
  try {
    const idToken = await fb.auth.currentUser.getIdToken();
    await fetch(WORKER_NOTIFS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, ...charge })
    });
  } catch {
    // Prévenir les autres est un confort : que ça échoue ne doit jamais
    // empêcher l'action, déjà enregistrée.
  }
}

/* ---------- Partage à plusieurs ----------

   Rien n'associe une adresse e-mail à un identifiant de compte : Firestore ne
   sait pas interroger l'annuaire des comptes, et publier cette correspondance
   reviendrait à laisser n'importe qui parcourir les adresses de tout le monde.

   L'invitation est donc déposée au nom de l'adresse. Le destinataire la trouve
   à sa prochaine ouverture, s'ajoute lui-même à la liste, et la consomme. Aucun
   courriel n'est envoyé — il n'y a pas de serveur pour le faire. */

const collectionInvites = () => fb.s.collection(fb.db, 'invites');
const collectionCodes = () => fb.s.collection(fb.db, 'codes');
const collectionPseudos = () => fb.s.collection(fb.db, 'pseudos');
const collectionAnnonces = () => fb.s.collection(fb.db, 'annonces');
const normaliser = e => String(e || '').trim().toLowerCase();

// Deux façons d'adresser une invitation : à une adresse (la personne n'a
// peut-être pas encore de compte) ou à un identifiant de compte (invité par son
// code ami). L'identifiant du document en découle, pour que les règles puissent
// vérifier son existence sans requête.
const idInviteEmail = (listId, email) => `${listId}__${normaliser(email)}`;
const idInviteUid = (listId, uid) => `${listId}__u_${uid}`;

/* ---------- Code ami ----------

   Un e-mail est unique mais indiscret, un pseudo est lisible mais ambigu. Le
   code ami tranche : un numéro court, unique, sans rien révéler de son porteur.
   On le partage, l'autre le tape, et l'invitation part. */

const normaliserCode = c => String(c || '').replace(/\D/g, '');
const genererCode = () => String(Math.floor(10000000 + Math.random() * 90000000));

// Affiché groupé — 1234-5678 se lit et se dicte mieux que 12345678.
Sync.codeAffiche = () => state.code ? state.code.replace(/(\d{4})(\d{4})/, '$1-$2') : '';

/* Réserve un code au compte, une fois. Le document `codes/{code}` ne peut être
   créé que s'il n'existe pas déjà : une collision tombe dans le catch, et on
   retente avec un autre numéro. */
async function assurerCode() {
  if (state.code || !fb || !Sync.user) return;
  const { s } = fb;
  for (let essai = 0; essai < 6; essai++) {
    const code = genererCode();
    try {
      await s.setDoc(s.doc(collectionCodes(), code), { uid: Sync.user.uid });
      state.code = code;
      await s.setDoc(docReglages(), { code }, { merge: true });
      sauverLocalement();
      Sync.onChange();
      return;
    } catch { /* déjà pris : on retente */ }
  }
}

Sync.resoudreCode = async function (codeSaisi) {
  const code = normaliserCode(codeSaisi);
  if (code.length !== 8) throw { code: 'code/invalide' };
  const snap = await fb.s.getDoc(fb.s.doc(collectionCodes(), code));
  if (!snap.exists()) throw { code: 'code/introuvable' };
  return snap.data().uid;
};

/* ---------- Pseudos réservés ----------

   Certains pseudos sont uniques : réservés à un compte, indisponibles aux
   autres. Le mécanisme reprend celui du code ami — une collection `pseudos`
   dont chaque document porte le pseudo pour identifiant et l'UID de son
   titulaire pour contenu. Seuls les admins y écrivent (voir les règles) : ils
   protègent leur propre pseudo, et en réservent pour d'autres comptes,
   secondaires ou non. Les pseudos non réservés restent libres, comme avant.

   La clé du document est le pseudo réduit à sa forme comparable : sans espaces
   superflus, en minuscules. Deux pseudos qui ne diffèrent que par la casse
   désignent donc la même réservation. La barre oblique, seul caractère interdit
   dans un identifiant Firestore, devient une espace. */
const clePseudo = p => String(p || '').trim().toLowerCase().replace(/\//g, ' ').slice(0, 60);
Sync.clePseudo = clePseudo;

/* Un pseudo est-il disponible pour moi ? `libre` si personne ne l'a réservé,
   `moi` s'il m'est déjà réservé, `pris` s'il appartient à un autre compte. */
Sync.pseudoDisponible = async function (pseudo) {
  const cle = clePseudo(pseudo);
  if (!cle || !fb || !Sync.user) return 'libre';
  const snap = await fb.s.getDoc(fb.s.doc(collectionPseudos(), cle));
  if (!snap.exists()) return 'libre';
  return snap.data().uid === Sync.user.uid ? 'moi' : 'pris';
};

/* Protéger son propre pseudo — réservé aux admins. On garde la clé réservée
   dans les réglages du compte : sans cette trace, changer de pseudo laisserait
   l'ancien bloqué pour tout le monde, faute de savoir lequel libérer. */
Sync.reserverMonPseudo = async function (pseudo) {
  if (!Sync.estAdmin() || !fb || !Sync.user) return;
  const { s } = fb;
  const cle = clePseudo(pseudo);
  const ancienne = state.pseudoReserve || '';
  if (ancienne && ancienne !== cle) {
    try { await s.deleteDoc(s.doc(collectionPseudos(), ancienne)); } catch { /* déjà libre */ }
  }
  if (cle) await s.setDoc(s.doc(collectionPseudos(), cle), { uid: Sync.user.uid });
  state.pseudoReserve = cle;
  await s.setDoc(docReglages(), { pseudoReserve: cle }, { merge: true });
  sauverLocalement();
};

/* Réserver un pseudo pour un autre compte — réservé aux admins. La cible se
   désigne par son code ami (huit chiffres) ou directement par son UID. */
Sync.reserverPseudoPour = async function (pseudo, cible) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  const cle = clePseudo(pseudo);
  if (!cle) throw { code: 'pseudo/vide' };
  const saisie = String(cible || '').trim();
  if (!saisie) throw { code: 'cible/vide' };
  // Huit chiffres : c'est un code ami, qu'on traduit en UID. Sinon, c'est déjà
  // un UID, qu'on prend tel quel.
  const uidCible = /^[\d-]{8,9}$/.test(saisie) ? await Sync.resoudreCode(saisie) : saisie;
  await fb.s.setDoc(fb.s.doc(collectionPseudos(), cle), { uid: uidCible });
  return uidCible;
};

/* Libérer un pseudo réservé — réservé aux admins. */
Sync.libererPseudo = async function (pseudo) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  const cle = clePseudo(pseudo);
  if (cle) await fb.s.deleteDoc(fb.s.doc(collectionPseudos(), cle));
};

/* Envoyer une notification push à tous les appareils enregistrés. */
Sync.diffuserNotif = async function (titre, corps) {
  if (!Sync.estAdmin() || !fb || !Sync.user) throw { code: 'admin/refuse' };
  const idToken = await fb.auth.currentUser.getIdToken();
  const r = await fetch(WORKER_NOTIFS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'broadcast', idToken, titre, corps: corps || '' })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw { code: data.erreur || 'notif/erreur' };
  return data;
};

/* ---------- Annonce globale ----------

   Un admin peut afficher un message à l'entrée de l'app — un simple avis, ou
   un écran bloquant qui met l'app en pause. Le message vit dans un unique
   collection `annonces`, lue par tout compte connecté et écrite par les seuls
   admins (voir les règles). Comme le reste, ça ne touche que les comptes
   connectés : sans compte, l'app ne charge même pas Firebase. */
Sync.ecouterAnnonces = function (rappel) {
  if (!fb) return () => {};
  const { s } = fb;
  const q = s.query(collectionAnnonces(), s.orderBy('maj'));
  return s.onSnapshot(q,
    snap => rappel(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => rappel([]));   // une erreur ne doit jamais bloquer l'app
};

// id = null → nouvelle annonce ; id = string → mise à jour d'une existante.
Sync.enregistrerAnnonce = function (annonce, id) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  const { s } = fb;
  const data = {
    actif: !!annonce.actif,
    mode: annonce.mode || 'carte',
    bloquant: !!annonce.bloquant,
    titre: (annonce.titre || '').slice(0, 120),
    message: (annonce.message || '').slice(0, 2000),
    image: annonce.image || '',
    maj: s.serverTimestamp(),
    parNom: Sync.nomAffiche(),
    parUid: Sync.user.uid
  };
  if (id) return s.setDoc(s.doc(fb.db, 'annonces', id), data, { merge: true });
  return s.addDoc(collectionAnnonces(), data);
};

Sync.supprimerAnnonce = function (id) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  return fb.s.deleteDoc(fb.s.doc(fb.db, 'annonces', id));
};

/* ---------- Retours utilisateurs (commentaires et bugs) ---------- */

const collectionFeedback = () => fb.s.collection(fb.db, 'feedback');

Sync.envoyerRetour = function (type, message, anonyme) {
  if (!Sync.user) throw { code: 'auth/not-connected' };
  if (!['commentaire', 'bug'].includes(type)) throw { code: 'feedback/type-invalide' };
  const msg = (message || '').trim().slice(0, 2000);
  if (!msg) throw { code: 'feedback/vide' };
  const { s } = fb;
  return s.addDoc(collectionFeedback(), {
    type,
    message: msg,
    version: VERSION,
    cree: s.serverTimestamp(),
    uid: anonyme ? null : Sync.user.uid,
    email: anonyme ? null : (Sync.user.email || null),
    pseudo: anonyme ? null : (Sync.nomAffiche() || null),
  });
};

Sync.ecouterRetours = function (rappel) {
  if (!fb || !Sync.estAdmin()) return () => {};
  const { s } = fb;
  const q = s.query(collectionFeedback(), s.orderBy('cree', 'desc'));
  return s.onSnapshot(q,
    snap => rappel(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    () => rappel([]));
};

Sync.supprimerRetour = function (id) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  return fb.s.deleteDoc(fb.s.doc(fb.db, 'feedback', id));
};

// Permet à l'utilisateur connecté de lire ses propres retours (et les réponses admin).
// Pas d'orderBy combiné au where : évite d'exiger un index composite Firestore.
// Le tri se fait côté client.
Sync.ecouterMesRetours = function (rappel) {
  if (!fb || !Sync.user) return () => {};
  const { s } = fb;
  const q = s.query(collectionFeedback(), s.where('uid', '==', Sync.user.uid));
  return s.onSnapshot(q,
    snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.cree?.seconds || 0) - (a.cree?.seconds || 0));
      rappel(docs);
    },
    () => rappel([]));
};

// Admin : répondre à un retour (ou mettre à jour la réponse existante).
Sync.repondreRetour = function (id, texte) {
  if (!Sync.estAdmin()) throw { code: 'admin/refuse' };
  const { s } = fb;
  return s.updateDoc(s.doc(collectionFeedback(), id), {
    reponse: (texte || '').trim().slice(0, 2000),
    repondeuNom: Sync.nomAffiche(),
    repondeuUid: Sync.user.uid,
    reponseLe: s.serverTimestamp(),
  });
};

/* ---------- Inviter ---------- */

Sync.inviter = async function (listId, email, nomListe) {
  const adresse = normaliser(email);
  if (!adresse.includes('@')) throw { code: 'auth/invalid-email' };
  if (adresse === normaliser(Sync.user.email)) throw { code: 'deja-membre' };

  await fb.s.setDoc(fb.s.doc(collectionInvites(), idInviteEmail(listId, adresse)), {
    listId, nomListe: nomListe || '',
    cibleEmail: adresse, cibleUid: '',
    invitePar: Sync.user.uid, inviteParNom: Sync.nomAffiche(),
    creeLe: fb.s.serverTimestamp()
  });

  appelerWorker({
    action: 'invitation', listeId: listId, email: adresse,
    titre: 'Une liste partagée avec toi',
    corps: `${Sync.nomAffiche()} t'invite sur « ${nomListe || 'une liste'} ».`
  });
};

Sync.inviterParCode = async function (listId, codeSaisi, nomListe) {
  const uidCible = await Sync.resoudreCode(codeSaisi);
  if (uidCible === Sync.user.uid) throw { code: 'deja-membre' };
  const liste = getList(listId);
  if (liste && (liste.members || []).includes(uidCible)) throw { code: 'deja-membre' };

  await fb.s.setDoc(fb.s.doc(collectionInvites(), idInviteUid(listId, uidCible)), {
    listId, nomListe: nomListe || '',
    cibleEmail: '', cibleUid: uidCible,
    invitePar: Sync.user.uid, inviteParNom: Sync.nomAffiche(),
    creeLe: fb.s.serverTimestamp()
  });

  appelerWorker({
    action: 'invitation', listeId: listId, cibleUid: uidCible,
    titre: 'Une liste partagée avec toi',
    corps: `${Sync.nomAffiche()} t'invite sur « ${nomListe || 'une liste'} ».`
  });
};

Sync.annulerInvitation = inviteId =>
  fb.s.deleteDoc(fb.s.doc(collectionInvites(), inviteId));

/* Invitations encore en attente sur une liste, pour que celui qui invite ne
   reste pas sans nouvelles. Le filtre sur `invitePar` n'est pas cosmétique : la
   règle de lecture est un « ou », et Firestore n'accepte une requête que s'il
   peut prouver l'un de ses termes à partir des filtres. */
Sync.ecouterInvitations = function (listId, rappel) {
  if (!fb || !Sync.user) return () => {};
  const { s } = fb;
  return s.onSnapshot(
    s.query(collectionInvites(),
      s.where('listId', '==', listId),
      s.where('invitePar', '==', Sync.user.uid)),
    instantane => rappel(instantane.docs.map(d =>
      ({ id: d.id, label: d.data().cibleEmail || 'invité par code' }))),
    e => { signalerErreur(e, 'invitations'); rappel([]); }
  );
};

Sync.retirerMembre = function (listId, uid, email) {
  const { s } = fb;
  return s.updateDoc(s.doc(collectionListes(), listId), {
    members: s.arrayRemove(uid),
    memberEmails: s.arrayRemove(email || '')
  });
};

Sync.quitter = function (listId) {
  return Sync.retirerMembre(listId, Sync.user.uid, Sync.user.email);
};

/* ---------- Avatars ----------

   Les avatars vivent dans `avatars/{uid}`, séparée de `users/{uid}` (privée),
   pour être lisibles par tout membre connecté d'une liste partagée. */

const collectionAvatars = () => fb.s.collection(fb.db, 'avatars');

Sync.sauverAvatar = async function (attrs) {
  if (!Sync.user || !fb) return;
  const { s } = fb;
  await s.setDoc(s.doc(collectionAvatars(), Sync.user.uid), attrs);
  Sync.monAvatar = attrs;
  Sync.cacheAvatars.set(Sync.user.uid, attrs);
  Sync.onChange();
};

Sync.chargerAvatar = async function () {
  if (!Sync.user || !fb) return null;
  const { s } = fb;
  try {
    const snap = await s.getDoc(s.doc(collectionAvatars(), Sync.user.uid));
    const attrs = snap.exists() ? snap.data() : null;
    Sync.monAvatar = attrs;
    if (attrs) Sync.cacheAvatars.set(Sync.user.uid, attrs);
    Sync.onChange();
    return attrs;
  } catch { return null; }
};

/* Récupère l'avatar d'un autre utilisateur — depuis le cache si disponible,
   sinon depuis Firestore. Silencieux en cas d'erreur. */
Sync.avatarDe = async function (uid) {
  if (!uid || !fb) return null;
  if (Sync.cacheAvatars.has(uid)) return Sync.cacheAvatars.get(uid);
  try {
    const { s } = fb;
    const snap = await s.getDoc(s.doc(collectionAvatars(), uid));
    const attrs = snap.exists() ? snap.data() : null;
    Sync.cacheAvatars.set(uid, attrs);
    return attrs;
  } catch { return null; }
};

/* ---------- Amis ----------

   Les amis sont stockés dans `amis/{uid}` sous la forme `{ liste: [{ uid, code }] }`.
   Le code (8 chiffres) est conservé pour l'affichage sans avoir à accéder au
   compte privé de l'ami. */

Sync.amis = [];

const docAmis = () => fb.s.doc(fb.db, 'amis', Sync.user.uid);

Sync.chargerAmis = async function () {
  if (!Sync.user || !fb) { Sync.amis = []; return; }
  try {
    const snap = await fb.s.getDoc(docAmis());
    Sync.amis = snap.exists() ? (snap.data().liste || []) : [];
  } catch { Sync.amis = []; }
};

Sync.ajouterAmi = async function (codeSaisi) {
  const code = normaliserCode(codeSaisi);
  const uid = await Sync.resoudreCode(codeSaisi);
  if (uid === Sync.user.uid) throw { code: 'ami/soi-meme' };
  if (Sync.amis.some(a => a.uid === uid)) throw { code: 'ami/deja-ajoute' };
  const { s } = fb;
  Sync.amis = [...Sync.amis, { uid, code }];
  await s.setDoc(docAmis(), { liste: Sync.amis });
};

Sync.retirerAmi = async function (uid) {
  const { s } = fb;
  Sync.amis = Sync.amis.filter(a => a.uid !== uid);
  await s.setDoc(docAmis(), { liste: Sync.amis });
};

/* ---------- Demandes d'amitié ----------

   demandeId = ${deUid}__${versUid}
   Cycle : create → (update accepte+codeVers par destinataire) → delete par expéditeur. */

Sync.demandesRecues  = [];
Sync.demandesEnvoyees = [];

const collDemandes = () => fb.s.collection(fb.db, 'demandes');

Sync.envoyerDemandeAmi = async function (codeSaisi) {
  if (!Sync.user || !fb) throw { code: 'auth/not-logged-in' };
  const code = normaliserCode(codeSaisi);
  const uid  = await Sync.resoudreCode(codeSaisi);
  if (uid === Sync.user.uid) throw { code: 'ami/soi-meme' };
  if (Sync.amis.some(a => a.uid === uid)) throw { code: 'ami/deja-ajoute' };
  const { s } = fb;
  await s.setDoc(s.doc(collDemandes(), `${Sync.user.uid}__${uid}`), {
    de: Sync.user.uid,
    vers: uid,
    codeDe:    state.code || '',
    codeCible: code,
    cree: s.serverTimestamp()
  });
  appelerWorker({
    action: 'message',
    cibleUid: uid,
    titre: Sync.nomAffiche(),
    corps: 'te demande en ami'
  });
};

Sync.ecouterDemandes = function (callback) {
  if (!Sync.user || !fb) return () => {};
  const { s } = fb;
  const myUid = Sync.user.uid;
  let recues = [], envoyees = [];
  const fire = () => {
    Sync.demandesRecues  = recues;
    Sync.demandesEnvoyees = envoyees;
    callback(recues, envoyees);
  };
  const unsubR = s.onSnapshot(
    s.query(collDemandes(), s.where('vers', '==', myUid)),
    snap => { recues = snap.docs.map(d => ({ id: d.id, ...d.data() })); fire(); },
    e => console.error('[demandes-recues]', e)
  );
  const unsubE = s.onSnapshot(
    s.query(collDemandes(), s.where('de', '==', myUid)),
    snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.filter(d => d.accepte).forEach(d => Sync._finaliserAcceptation(d).catch(() => {}));
      envoyees = docs.filter(d => !d.accepte);
      fire();
    },
    e => console.error('[demandes-envoyees]', e)
  );
  return () => { unsubR(); unsubE(); };
};

Sync._finaliserAcceptation = async function (demande) {
  const { s } = fb;
  await Sync.chargerAmis();
  if (demande.codeVers && !Sync.amis.some(a => a.uid === demande.vers)) {
    Sync.amis = [...Sync.amis, { uid: demande.vers, code: demande.codeVers }];
    await s.setDoc(docAmis(), { liste: Sync.amis });
  }
  await s.deleteDoc(s.doc(fb.db, 'demandes', demande.id));
  Sync.onChange();
};

Sync.accepterDemande = async function (demande) {
  const { s } = fb;
  await Sync.chargerAmis();
  if (!Sync.amis.some(a => a.uid === demande.de)) {
    Sync.amis = [...Sync.amis, { uid: demande.de, code: demande.codeDe }];
    await s.setDoc(docAmis(), { liste: Sync.amis });
  }
  await s.updateDoc(s.doc(fb.db, 'demandes', demande.id), {
    accepte: true,
    codeVers: state.code || ''
  });
  appelerWorker({
    action: 'message',
    cibleUid: demande.de,
    titre: Sync.nomAffiche(),
    corps: 'a accepté ta demande d\'ami'
  });
};

Sync.refuserDemande = async function (demandeId) {
  await fb.s.deleteDoc(fb.s.doc(fb.db, 'demandes', demandeId));
};

/* ---------- Messagerie ----------

   Les conversations sont dans `conversations/{convId}` où
   convId = [uid1, uid2].sort().join('__').
   Chaque conversation a une sous-collection `messages/{msgId}`.
   `nonLus : { uid: nombre }` suit les messages non lus par participant. */

Sync.conversations = [];
Sync.totalNonLus = 0;

const collectionConversations = () => fb.s.collection(fb.db, 'conversations');
const collMessages = id => fb.s.collection(fb.db, 'conversations', id, 'messages');
const docConv = id => fb.s.doc(fb.db, 'conversations', id);

Sync.convId = (uid1, uid2) => [uid1, uid2].sort().join('__');

Sync.ouvrirConversation = async function (otherUid) {
  if (!Sync.user || !fb) throw { code: 'auth/not-logged-in' };
  const { s } = fb;
  const id = Sync.convId(Sync.user.uid, otherUid);
  const snap = await s.getDoc(docConv(id));
  if (!snap.exists()) {
    await s.setDoc(docConv(id), {
      participants: [Sync.user.uid, otherUid],
      dernierMsg: '',
      dernierTs: s.serverTimestamp(),
      nonLus: { [Sync.user.uid]: 0, [otherUid]: 0 }
    });
  }
  return id;
};

Sync.ecouterConversations = function (callback) {
  if (!Sync.user || !fb) return () => {};
  const { s } = fb;
  // Pas d'orderBy combiné au where : évite d'exiger un index composite Firestore.
  // Tri côté client sur dernierTs.
  const q = s.query(collectionConversations(),
    s.where('participants', 'array-contains', Sync.user.uid));
  return s.onSnapshot(q, snap => {
    Sync.conversations = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.dernierTs?.seconds ?? 0) - (a.dernierTs?.seconds ?? 0));
    Sync.totalNonLus = Sync.conversations.reduce(
      (n, c) => n + ((c.nonLus || {})[Sync.user.uid] || 0), 0);
    callback(Sync.conversations, Sync.totalNonLus);
  }, e => console.error('[convs] onSnapshot error:', e));
};

Sync.ecouterMessages = function (id, callback) {
  if (!fb) return () => {};
  const { s } = fb;
  // Pas de orderBy : serverTimestamp() crée un pending-write avec ts=null qui
  // peut être exclu d'un orderBy avant confirmation serveur. On trie côté client.
  const q = s.query(collMessages(id));
  return s.onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ts || 0) - (b.ts || 0));
    callback(msgs);
  }, e => console.error('[msg] onSnapshot error:', e));
};

Sync.envoyerMessage = async function (id, otherUid, texte) {
  const { s } = fb;
  await s.addDoc(collMessages(id), {
    de: Sync.user.uid,
    texte: texte.trim(),
    ts: Date.now()   // timestamp client : jamais null, évite le bug serverTimestamp+orderBy
  });
  await s.updateDoc(docConv(id), {
    dernierMsg: texte.trim().slice(0, 100),
    dernierTs: s.serverTimestamp(),
    [`nonLus.${otherUid}`]: s.increment(1)
  });
  appelerWorker({
    action: 'message',
    cibleUid: otherUid,
    titre: Sync.nomAffiche(),
    corps: texte.trim().slice(0, 100)
  });
};

Sync.marquerLu = async function (id) {
  if (!Sync.user || !fb) return;
  const { s } = fb;
  await s.updateDoc(docConv(id), {
    [`nonLus.${Sync.user.uid}`]: 0
  }).catch(() => {});
};

/* ---------- Recevoir une invitation ----------

   On ne rejoint plus automatiquement : rejoindre la liste d'un autre est un
   choix. On récupère seulement ce qui nous attend, l'app l'affiche, et
   l'utilisateur accepte ou refuse. */

Sync.invitations = [];   // invitations en attente qui nous sont adressées
Sync.modifs = [];        // modifications faites par d'autres, à signaler

async function chargerInvitations() {
  const { s } = fb;
  Sync.invitations = [];
  const vues = new Set();
  const ajouter = docs => docs.forEach(d => {
    if (vues.has(d.id)) return;
    vues.add(d.id);
    const v = d.data();
    Sync.invitations.push({
      id: d.id, listId: v.listId, nomListe: v.nomListe || 'une liste',
      deQui: v.inviteParNom || 'quelqu\'un', invitePar: v.invitePar || ''
    });
  });

  try {
    const adresse = normaliser(Sync.user.email);
    if (adresse) {
      const parEmail = await s.getDocs(
        s.query(collectionInvites(), s.where('cibleEmail', '==', adresse)));
      ajouter(parEmail.docs);
    }
    const parCode = await s.getDocs(
      s.query(collectionInvites(), s.where('cibleUid', '==', Sync.user.uid)));
    ajouter(parCode.docs);
  } catch (e) {
    signalerErreur(e, 'invitations');
  }
}

/* Rejoindre : on s'ajoute soi-même à la liste, puis on consomme l'invitation.
   Deux écritures — si la seconde échoue, l'invitation resservira, `arrayUnion`
   ne duplique pas. */
Sync.rejoindre = async function (inv) {
  const { s } = fb;
  await s.updateDoc(s.doc(collectionListes(), inv.listId), {
    members: s.arrayUnion(Sync.user.uid),
    memberEmails: s.arrayUnion(Sync.user.email || '')
  });
  await s.deleteDoc(s.doc(collectionInvites(), inv.id));
  Sync.invitations = Sync.invitations.filter(i => i.id !== inv.id);
};

Sync.refuser = async function (inv) {
  await fb.s.deleteDoc(fb.s.doc(collectionInvites(), inv.id));
  Sync.invitations = Sync.invitations.filter(i => i.id !== inv.id);
};

/* ---------- Apparence ----------

   Le thème est réservé aux comptes : il doit donc suivre le compte, sinon le
   violet choisi sur le téléphone resterait introuvable sur l'ordinateur. */

const signatureReglages = () =>
  JSON.stringify([state.theme || 'auto', state.accent || null, state.pseudo || '', state.favoris]);

/* Le nom sous lequel on apparaît aux autres. Sans pseudo, on retombe sur le
   début de l'adresse — mieux que rien, et moins indiscret que l'adresse entière. */
Sync.nomAffiche = () =>
  (state.pseudo || '').trim() || String(Sync.user?.email || '').split('@')[0] || 'quelqu\'un';

function ecouterReglages() {
  arreterReglages = fb.s.onSnapshot(docReglages(), instantane => {
    const distant = instantane.data();

    if (distant) {
      // Le compte fait foi : c'est lui qui porte l'apparence et le pseudo.
      state.theme = distant.theme || 'auto';
      state.accent = distant.accent || null;
      state.pseudo = distant.pseudo || '';
      state.pseudoReserve = distant.pseudoReserve || '';
      if (distant.code) state.code = distant.code;
      if (distant.favoris && typeof distant.favoris === 'object') {
        state.favoris = {
          items: Array.isArray(distant.favoris.items) ? distant.favoris.items : [],
          listes: Array.isArray(distant.favoris.listes) ? distant.favoris.listes : []
        };
      }
      envoyeReglages = signatureReglages();
      // Rendre le nom public lisible par les autres (avatars est public).
      // pousserReglages() ne passe pas ici (signature déjà à jour), donc on écrit directement.
      fb.s.setDoc(fb.s.doc(collectionAvatars(), Sync.user.uid),
        { nom: Sync.nomAffiche() }, { merge: true }).catch(() => {});
      sauverLocalement();
      applyTheme();
      assurerCode();   // aucun code encore ? on en réserve un
      Sync.onChange();
    } else {
      // Rien en ligne : ce premier appareil donne le ton au compte.
      envoyeReglages = null;
      pousserReglages();
    }
  }, e => signalerErreur(e, 'reglages'));
}

function pousserReglages() {
  const sig = signatureReglages();
  if (envoyeReglages === sig) return;
  envoyeReglages = sig;
  fb.s.setDoc(docReglages(), {
    theme: state.theme || 'auto',
    accent: state.accent || null,
    pseudo: state.pseudo || '',
    // L'adresse sert au Worker à retrouver qui prévenir quand on invite
    // quelqu'un : à ce moment-là, on ne connaît que son adresse.
    email: normaliser(Sync.user.email),
    favoris: state.favoris || { items: [], listes: [] }
  }, { merge: true }
  ).catch(e => signalerErreur(e, 'reglages'));
  // Rendre le nom affiché lisible par les autres (avatars est public).
  fb.s.setDoc(fb.s.doc(collectionAvatars(), Sync.user.uid),
    { nom: Sync.nomAffiche() }, { merge: true }).catch(() => {});
}

/* Le contenu, et lui seul. Une liste partagée est écrite par plusieurs
   personnes : renvoyer `members` à chaque case cochée effacerait, en cas de
   croisement, quelqu'un qui vient d'accepter une invitation. L'appartenance
   passe donc uniquement par les fonctions dédiées plus bas. */
function contenu(liste, ordre) {
  return {
    name: liste.name,
    color: liste.color,
    type: liste.type || 'normale',
    linkedLists: liste.linkedLists || [],
    items: liste.items,
    ordre,
    majLe: fb.s.serverTimestamp(),
    majPar: Sync.user.uid,
    majParNom: Sync.nomAffiche()
  };
}

/* À la création seulement : c'est le seul moment où l'on décide qui possède. */
function enDocument(liste, ordre) {
  return Object.assign(contenu(liste, ordre), {
    owner: Sync.user.uid,
    members: [Sync.user.uid],
    memberEmails: [Sync.user.email || '']
  });
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
    const connue = envoye.has(liste.id);
    envoye.set(liste.id, sig);

    // Une liste déjà en ligne ne reçoit que son contenu, en fusion : le reste
    // du document — propriétaire et membres — ne nous appartient plus.
    const ref = s.doc(collectionListes(), liste.id);
    const ecriture = connue
      ? s.setDoc(ref, contenu(liste, i), { merge: true })
      : s.setDoc(ref, enDocument(liste, i));
    ecriture.catch(e => signalerErreur(e, 'listes'));

    if (connue) Sync.prevenirMembres(liste);
  });

  const vivantes = new Set(state.lists.map(l => l.id));
  [...envoye.keys()].filter(id => !vivantes.has(id)).forEach(id => {
    envoye.delete(id);
    s.deleteDoc(s.doc(collectionListes(), id)).catch(() => {});
  });
};

/* ===== Présence en temps réel =====

   On écrit un sous-champ `presence.{uid}` dans le document de la liste via
   setDoc+merge : les autres champs (membres, contenu) ne sont jamais touchés.
   Sync.push utilise lui aussi merge: true, donc la présence des autres survive
   à une écriture locale. La signature n'inclut pas `presence`, donc ces mises
   à jour ne déclenchent pas de toast "quelqu'un a modifié". */

Sync.ecrirePresence = function (listId) {
  if (!Sync.user || !fb) return;
  clearTimeout(Sync._presenceTimer);
  const { s } = fb;
  const ref = s.doc(collectionListes(), listId);
  s.setDoc(ref, {
    presence: { [Sync.user.uid]: { nom: Sync.nomAffiche(), ts: s.serverTimestamp() } }
  }, { merge: true }).catch(() => {});
  Sync._presenceTimer = setTimeout(() => Sync.ecrirePresence(listId), 55000);
};

Sync.quitterPresence = function (listId) {
  if (!Sync.user || !fb || !listId) return;
  clearTimeout(Sync._presenceTimer);
  const { s } = fb;
  const ref = s.doc(collectionListes(), listId);
  s.updateDoc(ref, { [`presence.${Sync.user.uid}`]: s.deleteField() }).catch(() => {});
};

/* ===== Analytics ===== */

Sync.logVisite = async function () {
  if (!fb || !Sync.user) return;
  const { s, db } = fb;
  const today = new Date().toISOString().slice(0, 10);
  try {
    await s.setDoc(s.doc(db, 'stats_daily', today), { visites: s.increment(1) }, { merge: true });
  } catch (e) {}
};

Sync.chargerAnalytics = async function () {
  if (!fb || !Sync.estAdmin()) return null;
  const { s, db } = fb;
  try {
    const debut = new Date();
    debut.setDate(debut.getDate() - 364);
    const debutStr = debut.toISOString().slice(0, 10);
    const [statsSnap, onbSnap] = await Promise.all([
      s.getDocs(s.query(s.collection(db, 'stats_daily'), s.orderBy(s.documentId()), s.startAt(debutStr))),
      s.getDocs(s.collection(db, 'onboarding'))
    ]);
    const visites = {};
    statsSnap.forEach(d => { visites[d.id] = d.data().visites || 0; });
    const prefs = { usage: {}, contexte: {} };
    onbSnap.forEach(d => {
      const v = d.data();
      if (v.usage)    prefs.usage[v.usage]       = (prefs.usage[v.usage]       || 0) + 1;
      if (v.contexte) prefs.contexte[v.contexte] = (prefs.contexte[v.contexte] || 0) + 1;
    });
    return { visites, prefs, totalUtilisateurs: onbSnap.size };
  } catch (e) { console.error('[analytics]', e); return null; }
};

Sync.sauverOnboarding = async function (reponses) {
  if (!fb || !Sync.user) return;
  const { s, db } = fb;
  try {
    await s.setDoc(s.doc(db, 'onboarding', Sync.user.uid), reponses, { merge: true });
  } catch (e) {}
};

/* Un compte a déjà servi ici, ou l'on revient d'une redirection : on rebranche
   la synchro au démarrage. Sans le second cas, le retour de Google serait ignoré
   pour quelqu'un qui ne s'est encore jamais connecté — c'est-à-dire à la seule
   fois où ça compte vraiment. */
if (localStorage.getItem('meslistes.compte') || localStorage.getItem(CLE_REDIRECTION)) {
  addEventListener('load', () => Sync.init().catch(e => signalerErreur(e, 'connexion')));
}
