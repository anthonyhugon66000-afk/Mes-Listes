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
    Sync.oublierAvis();
    Sync.invitations = [];
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
    const premierPassage = envoye.size === 0;

    state.lists = instantane.docs
      .map(d => {
        const v = d.data();
        return { id: d.id, name: v.name, color: v.color, items: v.items || [], ordre: v.ordre,
                 owner: v.owner, members: v.members || [], memberEmails: v.memberEmails || [],
                 majPar: v.majPar, majParNom: v.majParNom };
      })
      .sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

    // À la première synchronisation tout paraît nouveau : signaler chaque liste
    // reviendrait à noyer l'utilisateur dès l'ouverture.
    if (!premierPassage) {
      state.lists.forEach(l => {
        const connue = avant.has(l.id);
        const change = connue && avant.get(l.id) !== signature(l, 0);
        if (change && l.majPar && l.majPar !== Sync.user.uid) {
          Sync.modifs.push({ liste: l.name, qui: l.majParNom || 'quelqu\'un' });
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
}

/* ---------- Notifications poussées ----------

   L'appareil réclame un jeton d'envoi et le range dans son propre profil. Le
   Worker, seul détenteur de la clé, ira le chercher pour prévenir les autres.
   L'app ne transmet jamais de jeton : elle dit quelle liste a changé, rien de
   plus, et le Worker vérifie qu'on en est bien membre. */

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
      deQui: v.inviteParNom || 'quelqu\'un'
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
  JSON.stringify([state.theme || 'auto', state.accent || null, state.pseudo || '']);

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
      if (distant.code) state.code = distant.code;
      envoyeReglages = signatureReglages();
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
    email: normaliser(Sync.user.email)
  }, { merge: true }
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
    majLe: fb.s.serverTimestamp(),
    // Qui vient d'écrire. Sans cette trace, impossible de distinguer la
    // modification d'un autre du simple écho de la sienne : on se notifierait
    // soi-même à chaque case cochée.
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

/* Un compte a déjà servi ici, ou l'on revient d'une redirection : on rebranche
   la synchro au démarrage. Sans le second cas, le retour de Google serait ignoré
   pour quelqu'un qui ne s'est encore jamais connecté — c'est-à-dire à la seule
   fois où ça compte vraiment. */
if (localStorage.getItem('meslistes.compte') || localStorage.getItem(CLE_REDIRECTION)) {
  addEventListener('load', () => Sync.init().catch(e => signalerErreur(e, 'connexion')));
}
