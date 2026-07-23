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
    envoye = new Map();
    envoyeReglages = null;
    Sync.etat = utilisateur ? 'envoi' : 'local';

    if (utilisateur) {
      try { await demarrerEcoute(); }
      catch (e) { signalerErreur(e, 'listes'); }
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
  JSON.stringify([liste.name, liste.color, liste.items]) + '|' + i;

const noterEnvoyees = () => {
  envoye = new Map(state.lists.map((l, i) => [l.id, signature(l, i)]));
};

async function demarrerEcoute() {
  const { s } = fb;

  // Avant tout : récupérer les listes qu'on nous a partagées, sinon elles
  // n'apparaîtraient qu'au prochain lancement.
  Sync.recues = [];
  try { await accepterInvitations(); } catch (e) { signalerErreur(e, 'invitations'); }

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

  // `includeMetadataChanges` : sans lui, passer de « envoi » à « synchronisé »
  // ne déclencherait aucun instantané, puisque les données, elles, n'ont pas bougé.
  arreterEcoute = s.onSnapshot(requete, { includeMetadataChanges: true }, instantane => {
    majEtat(instantane.metadata);
    state.lists = instantane.docs
      .map(d => {
        const v = d.data();
        return { id: d.id, name: v.name, color: v.color, items: v.items || [], ordre: v.ordre,
                 owner: v.owner, members: v.members || [], memberEmails: v.memberEmails || [] };
      })
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

    // La normalisation d'abord, les signatures ensuite : sinon une donnée
    // d'ancien format serait renvoyée en boucle au serveur.
    migrate(state);
    noterEnvoyees();
    Sync.erreur = null;
    sauverLocalement();
    Sync.onChange();
  }, e => signalerErreur(e, 'listes'));

  ecouterReglages();
}

/* ---------- Partage à plusieurs ----------

   Rien n'associe une adresse e-mail à un identifiant de compte : Firestore ne
   sait pas interroger l'annuaire des comptes, et publier cette correspondance
   reviendrait à laisser n'importe qui parcourir les adresses de tout le monde.

   L'invitation est donc déposée au nom de l'adresse. Le destinataire la trouve
   à sa prochaine ouverture, s'ajoute lui-même à la liste, et la consomme. Aucun
   courriel n'est envoyé — il n'y a pas de serveur pour le faire. */

const collectionInvites = () => fb.s.collection(fb.db, 'invites');
const normaliser = e => String(e || '').trim().toLowerCase();
const idInvite = (listId, email) => `${listId}__${normaliser(email)}`;

Sync.inviter = async function (listId, email, nomListe) {
  const adresse = normaliser(email);
  if (!adresse.includes('@')) throw { code: 'auth/invalid-email' };
  if (adresse === normaliser(Sync.user.email)) throw { code: 'deja-membre' };
  await fb.s.setDoc(fb.s.doc(collectionInvites(), idInvite(listId, adresse)), {
    listId,
    email: adresse,
    nomListe: nomListe || '',
    invitePar: Sync.user.uid,
    inviteParEmail: Sync.user.email || '',
    creeLe: fb.s.serverTimestamp()
  });
};

Sync.annulerInvitation = (listId, email) =>
  fb.s.deleteDoc(fb.s.doc(collectionInvites(), idInvite(listId, email)));

/* Invitations encore en attente sur une liste, pour que celui qui invite ne
   reste pas sans nouvelles. */
Sync.ecouterInvitations = function (listId, rappel) {
  if (!fb || !Sync.user) return () => {};
  const { s } = fb;
  // Le filtre sur `invitePar` n'est pas cosmétique : la règle de lecture est un
  // « ou », et Firestore n'accepte une requête que s'il peut prouver l'un des
  // deux termes à partir de ses filtres. Sans lui, la requête est refusée.
  return s.onSnapshot(
    s.query(collectionInvites(),
      s.where('listId', '==', listId),
      s.where('invitePar', '==', Sync.user.uid)),
    instantane => rappel(instantane.docs.map(d => d.data().email)),
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

/* Au démarrage : on ramasse ce qui nous attend. L'ajout et la suppression de
   l'invitation sont deux écritures distinctes — si la seconde échoue, la
   prochaine ouverture retentera sans rien casser, `arrayUnion` ne duplique pas. */
async function accepterInvitations() {
  const { s } = fb;
  const adresse = normaliser(Sync.user.email);
  if (!adresse) return;

  const attendues = await s.getDocs(
    s.query(collectionInvites(), s.where('email', '==', adresse)));

  for (const invitation of attendues.docs) {
    try {
      await s.updateDoc(s.doc(collectionListes(), invitation.data().listId), {
        members: s.arrayUnion(Sync.user.uid),
        memberEmails: s.arrayUnion(Sync.user.email)
      });
      await s.deleteDoc(invitation.ref);
      Sync.recues.push(invitation.data().nomListe || 'une liste');
    } catch (e) {
      signalerErreur(e, 'invitations');
    }
  }
}

Sync.recues = [];   // noms des listes récupérées à l'ouverture, pour le message

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
  }, e => signalerErreur(e, 'reglages'));
}

function pousserReglages() {
  const sig = signatureReglages();
  if (envoyeReglages === sig) return;
  envoyeReglages = sig;
  fb.s.setDoc(docReglages(),
    { theme: state.theme || 'auto', accent: state.accent || null },
    { merge: true }
  ).catch(e => signalerErreur(e, 'reglages'));
}

/* Le contenu, et lui seul. Une liste partagée est écrite par plusieurs
   personnes : renvoyer `members` à chaque case cochée effacerait, en cas de
   croisement, quelqu'un qui vient d'accepter une invitation. L'appartenance
   passe donc uniquement par les fonctions dédiées plus bas. */
function contenu(liste, ordre) {
  return {
    name: liste.name,
    color: liste.color,
    items: liste.items,
    ordre,
    majLe: fb.s.serverTimestamp()
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
  });

  const vivantes = new Set(state.lists.map(l => l.id));
  [...envoye.keys()].filter(id => !vivantes.has(id)).forEach(id => {
    envoye.delete(id);
    s.deleteDoc(s.doc(collectionListes(), id)).catch(() => {});
  });
};

/* Un compte a déjà servi ici, ou l'on revient d'une redirection : on rebranche
   la synchro au démarrage. Sans le second cas, le retour de Google serait ignoré
   pour quelqu'un qui ne s'est encore jamais connecté — c'est-à-dire à la seule
   fois où ça compte vraiment. */
if (localStorage.getItem('meslistes.compte') || localStorage.getItem(CLE_REDIRECTION)) {
  addEventListener('load', () => Sync.init().catch(e => signalerErreur(e, 'connexion')));
}
