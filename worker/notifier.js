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

/* Extrait le premier tableau JSON équilibré d'un texte (gère strings, echappements, imbrication). */
function extraireTableauJson(texte) {
  const start = texte.indexOf('[');
  if (start === -1) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < texte.length; i++) {
    const ch = texte[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '[') depth++;
    if (ch === ']') { depth--; if (depth === 0) return texte.slice(start, i + 1); }
  }
  return null;
}

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

/* ---------- Récupérer tous les jetons (pour les diffusions globales) ---------- */

async function tousLesJetons(projet, acces) {
  const jetons = [];
  let pageToken = null;
  do {
    const url = `${BASE_FS(projet)}/users?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${acces}` } });
    if (!r.ok) break;
    const data = await r.json();
    for (const doc of data.documents || []) {
      tableau(doc?.fields?.jetons).forEach(j => jetons.push(j));
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  return jetons;
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

    /* --- Suggestions IA via Cloudflare Workers AI --- */
    if (action === 'ia') {
      if (!idToken) return repondre({ erreur: 'idToken requis' }, 400);

      let auteur;
      try { auteur = await verifierIdentite(idToken, projet); }
      catch (e) { return repondre({ erreur: 'identité refusée' }, 401); }

      if (!env.GROQ_API_KEY) return repondre({ erreur: 'GROQ_API_KEY absent — ajoute-le dans les Secrets du Worker' }, 500);

      const { mode = 'completer', articles = [], typeListe = 'normale', texte = '', saisie = '', imageBase64 = '' } = corpsRequete;

      const typeDesc = { normale: 'liste générale', courses: 'liste de courses', collection: 'collection d\'objets', visite: 'lieux à visiter' }[typeListe] || 'liste';

      /* --- Mode vision : extraction d'articles depuis une photo --- */
      if (mode === 'photo' && imageBase64) {
        try {
          const rv = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'qwen/qwen3.6-27b',
              messages: [{
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
                  { type: 'text', text: 'Liste tous les articles, produits ou ingrédients visibles ou mentionnés sur cette image (liste manuscrite, recette, étiquette, photo de rayon, etc.). Pour chaque article, extrait la quantité et l\'unité si présentes sur l\'image, et indique où le trouver en magasin. Réponds UNIQUEMENT avec un tableau JSON d\'objets {nom, ou, quantite, unite} en français. Si pas de quantité visible, laisse quantite vide. Exemples d\'unités : g, kg, mL, L, pièce(s), sachet(s). Exemple : [{"nom":"farine","ou":"Épicerie","quantite":"500","unite":"g"},{"nom":"lait","ou":"Rayon frais","quantite":"1","unite":"L"}]' }
                ]
              }],
              max_tokens: 1000,
              temperature: 0.3
            })
          });
          if (!rv.ok) { const err = await rv.text(); return repondre({ erreur: 'vision ' + rv.status + ' : ' + err }, 500); }
          const json = await rv.json();
          const brut = (json.choices?.[0]?.message?.content || '').trim();
          const cleaned = brut.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
          const jsonStr = extraireTableauJson(cleaned);
          if (!jsonStr) return repondre({ erreur: 'réponse vision illisible' }, 500);
          let suggestions;
          try { suggestions = JSON.parse(jsonStr); }
          catch { return repondre({ erreur: 'JSON vision invalide' }, 500); }
          if (!Array.isArray(suggestions)) return repondre({ erreur: 'format vision inattendu' }, 500);
          return repondre({
            suggestions: suggestions
              .filter(s => s && typeof s === 'object' && typeof s.nom === 'string' && s.nom.trim())
              .map(s => ({ nom: s.nom.trim(), ou: (s.ou || '').trim(), quantite: (s.quantite || '').trim(), unite: (s.unite || '').trim() }))
          });
        } catch (e) { return repondre({ erreur: 'erreur vision : ' + e.message }, 500); }
      }

      let instruction;
      if (mode === 'creer' && texte.trim()) {
        instruction = `Génère une liste d'articles pour : "${texte.trim()}". Pour chaque article indique où le trouver et l'unité typique (g, kg, mL, L, pièce(s), etc.). Réponds UNIQUEMENT avec un tableau JSON d'objets en français, max 12 articles. Exemple : [{"nom":"farine","ou":"Épicerie — pâtisserie","quantite":"","unite":"g"},{"nom":"lait","ou":"Rayon frais","quantite":"","unite":"L"}]`;
      } else if (mode === 'suggerer' && saisie.trim()) {
        instruction = `L'utilisateur tape "${saisie.trim()}" dans une ${typeDesc}. Propose 2 ou 3 articles en français correspondants avec où les trouver et l'unité typique. Réponds UNIQUEMENT avec un tableau JSON d'objets {nom, ou, quantite, unite}, max 3 éléments. Exemple : [{"nom":"Nutella","ou":"Épicerie — pâtes à tartiner","quantite":"","unite":"g"}]`;
      } else if (mode === 'localiser' && articles.length) {
        const liste = articles.slice(0, 30);
        instruction = `Voici des articles d'une ${typeDesc}. Pour chacun, indique où le trouver et l'unité de mesure typique (g, kg, mL, L, pièce(s), sachet(s), etc.). Conserve exactement les mêmes noms. Réponds UNIQUEMENT avec un tableau JSON d'objets {nom, ou, quantite, unite}. Articles : ${JSON.stringify(liste)}`;
      } else {
        const ctx = articles.length
          ? `Articles déjà présents : ${articles.slice(0, 20).join(', ')}.`
          : 'La liste est encore vide.';
        instruction = `Type : ${typeDesc}. ${ctx} Suggère 6 à 10 articles manquants pertinents. Pour chaque article indique où le trouver et l'unité typique (g, kg, mL, L, pièce(s), etc.). Réponds UNIQUEMENT avec un tableau JSON d'objets en français. Exemple : [{"nom":"beurre","ou":"Rayon frais","quantite":"","unite":"g"},{"nom":"eau","ou":"Épicerie","quantite":"","unite":"L"}]`;
      }

      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-20b',
            messages: [
              { role: 'system', content: 'Tu génères des listes en français. Tu réponds UNIQUEMENT avec un tableau JSON valide d\'objets {nom, ou, quantite, unite}, sans aucun texte autour. quantite est une chaîne vide si inconnue, unite est l\'unité typique du produit (g, kg, mL, L, pièce(s), sachet(s), boîte(s), etc.) ou vide.' },
              { role: 'user', content: instruction }
            ],
            max_tokens: mode === 'suggerer' ? 150 : mode === 'localiser' ? 1000 : 500,
            temperature: mode === 'suggerer' ? 0.3 : 0.7
          })
        });

        if (!r.ok) {
          const err = await r.text();
          return repondre({ erreur: 'Groq erreur ' + r.status + ' : ' + err }, 500);
        }

        const json = await r.json();
        const brut = (json.choices?.[0]?.message?.content || '').trim();
        // Supprime les blocs <think>…</think> (modèles raisonneurs)
        const cleaned = brut.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
        const jsonStr = extraireTableauJson(cleaned);
        if (!jsonStr) return repondre({ erreur: 'réponse IA illisible', brut }, 500);

        let suggestions;
        try { suggestions = JSON.parse(jsonStr); }
        catch { return repondre({ erreur: 'JSON IA invalide', brut }, 500); }

        if (!Array.isArray(suggestions)) return repondre({ erreur: 'format IA inattendu' }, 500);

        return repondre({
          suggestions: suggestions
            .filter(s => s && typeof s === 'object' && typeof s.nom === 'string' && s.nom.trim())
            .map(s => ({ nom: s.nom.trim(), ou: (s.ou || '').trim(), quantite: (s.quantite || '').trim(), unite: (s.unite || '').trim() }))
            .slice(0, 15)
        });
      } catch (e) {
        return repondre({ erreur: 'erreur IA : ' + e.message }, 500);
      }
    }

    /* --- Diffusion globale (admin → tous les appareils) --- */
    if (action === 'broadcast') {
      if (!idToken) return repondre({ erreur: 'idToken requis' }, 400);
      if (!titre)   return repondre({ erreur: 'titre requis' }, 400);

      let auteur;
      try { auteur = await verifierIdentite(idToken, projet); }
      catch (e) { return repondre({ erreur: 'identité refusée' }, 401); }

      const admins = (env.ADMINS || '').split(',').map(u => u.trim()).filter(Boolean);
      if (!admins.includes(auteur)) return repondre({ erreur: 'admin requis' }, 403);

      const acces  = await jetonDeService(compte);
      const jetons = await tousLesJetons(projet, acces);
      if (!jetons.length) return repondre({ envoyes: 0, tentes: 0, raison: 'aucun appareil enregistré' });

      const resultats = await Promise.all(jetons.map(j => envoyer(projet, acces, j, titre, corps || '', '')));
      return repondre({ envoyes: resultats.filter(Boolean).length, tentes: jetons.length });
    }

    /* --- Notification de message privé --- */
    if (action === 'message') {
      if (!idToken || !cibleUid) return repondre({ erreur: 'idToken et cibleUid requis' }, 400);

      let auteur;
      try { auteur = await verifierIdentite(idToken, projet); }
      catch (e) { return repondre({ erreur: 'identité refusée' }, 401); }

      if (cibleUid === auteur) return repondre({ envoyes: 0, raison: 'ne peut pas se notifier soi-même' });

      const acces = await jetonDeService(compte);
      const profil = await lireDocument(projet, acces, `users/${cibleUid}`);
      const jetons = tableau(profil?.jetons);
      if (!jetons.length) return repondre({ envoyes: 0, raison: 'aucun appareil enregistré' });

      const resultats = await Promise.all(jetons.map(j =>
        envoyer(projet, acces, j, titre || 'Nouveau message', corps || '', '')));

      return repondre({ envoyes: resultats.filter(Boolean).length, tentes: jetons.length });
    }

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
