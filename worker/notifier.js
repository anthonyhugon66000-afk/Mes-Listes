/* ============================================================
   Worker Cloudflare — envoi des notifications de « Mes Listes »

   À coller dans l'éditeur du Worker sur dash.cloudflare.com.
   Un seul secret à définir : CLE_SERVICE, le contenu du fichier JSON de compte
   de service Firebase.

   Ce que fait ce Worker, et pourquoi il existe : un site statique ne peut rien
   envoyer. Il faut quelqu'un qui détienne une clé et parle à Firebase. C'est
   son seul rôle.

   L'appelant n'indique jamais qui notifier — seulement quelle liste il vient de
   modifier. Le Worker vérifie son identité, vérifie qu'il est bien membre de
   cette liste, et va lui-même chercher les jetons des autres membres. Sans quoi
   n'importe quel compte pourrait arroser des appareils au hasard.
   ============================================================ */

const GOOGLE_JWK = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const OAUTH = 'https://oauth2.googleapis.com/token';
const PORTEE = 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore';

let jetonAcces = null;   // { valeur, expire } — gardé en mémoire entre deux appels
let clesGoogle = null;   // { cles, expire }

/* ---------- Outils ---------- */

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const deB64url = s => Uint8Array.from(
  atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(s.length + (4 - s.length % 4) % 4, '=')),
  c => c.charCodeAt(0));

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const repondre = (donnees, statut = 200) =>
  new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { 'Content-Type': 'application/json', ...cors }
  });

/* ---------- Vérification de l'identité de l'appelant ---------- */

async function clesDeGoogle() {
  if (clesGoogle && clesGoogle.expire > Date.now()) return clesGoogle.cles;
  const r = await fetch(GOOGLE_JWK);
  const { keys } = await r.json();
  clesGoogle = { cles: keys, expire: Date.now() + 3600e3 };
  return keys;
}

/* Rend l'identifiant de l'utilisateur, ou lève si le jeton ne tient pas. */
async function verifierIdentite(jeton, projet) {
  const [tete64, charge64, signature64] = String(jeton).split('.');
  if (!signature64) throw new Error('jeton mal formé');

  const tete = JSON.parse(new TextDecoder().decode(deB64url(tete64)));
  const charge = JSON.parse(new TextDecoder().decode(deB64url(charge64)));

  if (charge.aud !== projet) throw new Error('jeton émis pour un autre projet');
  if (charge.iss !== `https://securetoken.google.com/${projet}`) throw new Error('émetteur inattendu');
  if (charge.exp * 1000 < Date.now()) throw new Error('jeton expiré');
  if (!charge.sub) throw new Error('jeton sans utilisateur');

  const jwk = (await clesDeGoogle()).find(k => k.kid === tete.kid);
  if (!jwk) throw new Error('clé de signature inconnue');

  const cle = await crypto.subtle.importKey('jwk', jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);

  const valide = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cle,
    deB64url(signature64), new TextEncoder().encode(`${tete64}.${charge64}`));
  if (!valide) throw new Error('signature invalide');

  return charge.sub;
}

/* ---------- Accès à Google avec la clé de service ---------- */

async function jetonDeService(compte) {
  if (jetonAcces && jetonAcces.expire > Date.now() + 60e3) return jetonAcces.valeur;

  const maintenant = Math.floor(Date.now() / 1000);
  const tete = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const charge = b64url(new TextEncoder().encode(JSON.stringify({
    iss: compte.client_email, scope: PORTEE, aud: OAUTH,
    iat: maintenant, exp: maintenant + 3600
  })));

  // La clé privée arrive au format PEM : on retire l'enveloppe et on décode.
  const pem = compte.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const cle = await crypto.subtle.importKey('pkcs8',
    Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);

  const signature = b64url(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle,
    new TextEncoder().encode(`${tete}.${charge}`)));

  const r = await fetch(OAUTH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${tete}.${charge}.${signature}`
    })
  });
  const reponse = await r.json();
  if (!reponse.access_token) throw new Error('accès refusé : ' + JSON.stringify(reponse));

  jetonAcces = { valeur: reponse.access_token, expire: Date.now() + reponse.expires_in * 1000 };
  return jetonAcces.valeur;
}

/* ---------- Lecture de Firestore ---------- */

const BASE_FS = projet =>
  `https://firestore.googleapis.com/v1/projects/${projet}/databases/(default)/documents`;

async function lireDocument(projet, acces, chemin) {
  const r = await fetch(`${BASE_FS(projet)}/${chemin}`, {
    headers: { Authorization: `Bearer ${acces}` }
  });
  if (!r.ok) return null;
  return (await r.json()).fields || null;
}

// Firestore renvoie ses valeurs typées : on n'extrait que ce dont on a besoin.
const tableau = champ => (champ?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean);

/* Retrouver quelqu'un à partir de son adresse. Au moment d'inviter, c'est tout
   ce que l'on connaît de lui — son identifiant de compte, non. */
async function jetonsParEmail(projet, acces, email) {
  const r = await fetch(`${BASE_FS(projet)}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: { fieldFilter: {
          field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email }
        } },
        limit: 5
      }
    })
  });
  if (!r.ok) return [];
  const lignes = await r.json();
  const jetons = [];
  for (const ligne of lignes) {
    tableau(ligne?.document?.fields?.jetons).forEach(j => jetons.push(j));
  }
  return jetons;
}

/* ---------- Envoi ---------- */

async function envoyer(projet, acces, jeton, titre, corps, listeId) {
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${projet}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: jeton,
        // Message de données uniquement : c'est le service worker de l'app qui
        // compose la notification, et lui seul sait mettre la bonne icône.
        data: { titre, corps, listeId: listeId || '' },
        webpush: { headers: { Urgency: 'high', TTL: '86400' } }
      }
    })
  });
  return r.ok;
}

/* ---------- Point d'entrée ---------- */

export default {
  async fetch(requete, env) {
    if (requete.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (requete.method !== 'POST') return repondre({ erreur: 'POST attendu' }, 405);

    let compte;
    try {
      compte = JSON.parse(env.CLE_SERVICE);
    } catch {
      return repondre({ erreur: 'CLE_SERVICE absent ou illisible' }, 500);
    }
    const projet = compte.project_id;

    let corpsRequete;
    try {
      corpsRequete = await requete.json();
    } catch {
      return repondre({ erreur: 'corps illisible' }, 400);
    }

    const { idToken, listeId, titre, corps, action, email, cibleUid } = corpsRequete;
    if (!idToken || !listeId) return repondre({ erreur: 'idToken et listeId requis' }, 400);

    let auteur;
    try {
      auteur = await verifierIdentite(idToken, projet);
    } catch (e) {
      return repondre({ erreur: 'identité refusée' }, 401);
    }

    const acces = await jetonDeService(compte);

    const liste = await lireDocument(projet, acces, `lists/${listeId}`);
    if (!liste) return repondre({ erreur: 'liste introuvable' }, 404);

    const membres = tableau(liste.members);
    if (!membres.includes(auteur)) return repondre({ erreur: 'tu n\'es pas membre de cette liste' }, 403);

    let jetons = [];

    if (action === 'invitation') {
      // L'invité n'est pas encore membre. Selon la voie, on le retrouve par son
      // adresse ou par son identifiant. Le droit d'inviter vient d'être vérifié
      // — l'appelant, lui, est bien membre.
      if (cibleUid) {
        const profil = await lireDocument(projet, acces, `users/${cibleUid}`);
        jetons = tableau(profil?.jetons);
      } else if (email) {
        jetons = await jetonsParEmail(projet, acces, String(email).trim().toLowerCase());
      } else {
        return repondre({ erreur: 'email ou cibleUid requis pour une invitation' }, 400);
      }
    } else {
      // On ne se notifie pas soi-même : on vient de faire la modification.
      for (const uid of membres.filter(m => m !== auteur)) {
        const profil = await lireDocument(projet, acces, `users/${uid}`);
        tableau(profil?.jetons).forEach(j => jetons.push(j));
      }
    }

    if (!jetons.length) return repondre({ envoyes: 0, raison: 'aucun appareil enregistré' });

    const resultats = await Promise.all(jetons.map(j =>
      envoyer(projet, acces, j, titre || 'Mes Listes', corps || 'Une liste a changé', listeId)));

    return repondre({ envoyes: resultats.filter(Boolean).length, tentes: jetons.length });
  }
};
