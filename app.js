/* ============================================================
   Mes Listes — application de listes d'articles
   Données stockées localement sur l'appareil (localStorage).
   ============================================================ */

const STORE_KEY = 'meslistes.v1';

/* Affichée en bas à gauche de l'écran d'accueil, elle permet de dire en
   regardant un téléphone si l'app a bien reçu la dernière version.

   Majeur.mineur : le majeur monte pour une fonctionnalité ou une refonte, le
   mineur pour un correctif ou une retouche. À garder en phase avec le nom du
   cache et les `?v…` — voir le README. */
const VERSION = 'v20.5';

const COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be',
  '#007aff', '#5856d6', '#af52de', '#ff2d55', '#8e8e93'
];

const TYPES_LISTE = {
  normale:    { label: 'Liste normale',    icon: '📝', desc: 'Courses, tâches, todo…' },
  collection: { label: 'Collection',       icon: '📦', desc: 'Objets, livres, films, jeux…' },
  visite:     { label: 'Lieux à visiter',  icon: '📍', desc: 'Restaurants, musées, voyages…' },
};

const PHOTOS_EMOJI = [
  '🛒','🍎','🥦','🍞','🧀','🥩','🐟','🧁','☕','🍷',
  '🧃','🥛','📦','🧹','🧴','💊','🐾','🧸','🎮','📚',
  '🏡','🌸','⚽','🎵','✈️','🎁'
];

const PALIERS_STREAK = [
  { jours:    7, emoji:'🔥', label:'Lancé',           couleur:'#ff9f0a' },
  { jours:   10, emoji:'🌟', label:'Débutant',       couleur:'#8e8e93' },
  { jours:   25, emoji:'⭐', label:'Régulier',        couleur:'#ffd700' },
  { jours:   50, emoji:'💫', label:'Assidu',          couleur:'#ff9500' },
  { jours:   75, emoji:'✨', label:'Persévérant',     couleur:'#ff6b00' },
  { jours:  100, emoji:'🏆', label:'Champion',        couleur:'#ff3b30' },
  { jours:  125, emoji:'🥇', label:'Expert',          couleur:'#af52de' },
  { jours:  150, emoji:'💎', label:'Diamant',         couleur:'#00c7be' },
  { jours:  175, emoji:'🔮', label:'Mystique',        couleur:'#5856d6' },
  { jours:  200, emoji:'👑', label:'Légendaire',      couleur:'#007aff' },
  { jours:  250, emoji:'🎯', label:'Précis',          couleur:'#34c759' },
  { jours:  300, emoji:'🌈', label:'Arc-en-ciel',     couleur:'#ff2d55' },
  { jours:  400, emoji:'🌙', label:'Nocturne',        couleur:'#5856d6' },
  { jours:  500, emoji:'🌠', label:'Étoile filante',  couleur:'#ff9500' },
  { jours:  600, emoji:'🌊', label:'Océan',           couleur:'#007aff' },
  { jours:  700, emoji:'⚡', label:'Éclair',          couleur:'#ffcc00' },
  { jours:  800, emoji:'🦋', label:'Papillon',        couleur:'#ff2d55' },
  { jours:  900, emoji:'🌺', label:'Floraison',       couleur:'#ff3b30' },
  { jours: 1000, emoji:'🎆', label:'Millénaire',      couleur:'#ff9500' },
  { jours: 1250, emoji:'🦁', label:'Rugissant',       couleur:'#ff6b00' },
  { jours: 1500, emoji:'🦄', label:'Licorne',         couleur:'#af52de' },
  { jours: 1750, emoji:'🐉', label:'Dragon',          couleur:'#ff3b30' },
  { jours: 2000, emoji:'🌍', label:'Mondial',         couleur:'#34c759' },
  { jours: 2500, emoji:'🚀', label:'Spatial',         couleur:'#007aff' },
  { jours: 3000, emoji:'💥', label:'Ultime',          couleur:'#ff2d55' },
];

const ICON = {
  chevron: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  handle:  '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>',
  check:   '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  trash:   '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
};

/* ============================================================
   Avatars — générateur SVG façon Mii
   ============================================================ */

const PEAUX = ['#FFDBB4', '#EDB98A', '#C68642', '#8D5524', '#4A2912'];
const CHEVEUX_COULEURS = ['#1a1a1a', '#3B2010', '#8B4513', '#D4A017', '#CC5522', '#C8C8C8', '#E87DAA', '#7B5EA7'];
const AVATAR_DEFAUT = { fond: '#007aff', peau: 0, cheveux: 0, cheveuxCouleur: 0, yeux: 0, bouche: 0, accessoire: 0 };

function genererAvatar(attrs) {
  const a = Object.assign({}, AVATAR_DEFAUT, attrs || {});
  const fond = a.fond;
  const peau = PEAUX[a.peau] || PEAUX[0];
  const hc   = CHEVEUX_COULEURS[a.cheveuxCouleur] || CHEVEUX_COULEURS[0];
  const src  = hc === '#C8C8C8' ? '#888' : hc;

  const hairBehind = [
    '',
    '',
    '',
    `<path d="M26 55 Q21 30 50 26 Q79 30 74 55 L72 92 Q60 68 50 65 Q40 68 28 92Z" fill="${hc}"/>`,
    `<ellipse cx="20" cy="54" rx="11" ry="11" fill="${hc}"/><ellipse cx="80" cy="54" rx="11" ry="11" fill="${hc}"/>`,
    '',
    `<path d="M68 42 Q82 38 81 56 Q80 64 70 59 Q75 50 68 46Z" fill="${hc}"/>`,
    '',
  ][a.cheveux] || '';

  const hairFront = [
    '',
    `<ellipse cx="50" cy="39" rx="24" ry="15" fill="${hc}"/>`,
    `<path d="M28 54 Q25 31 50 27 Q75 31 72 54 Q64 44 50 43 Q36 44 28 54Z" fill="${hc}"/>`,
    `<ellipse cx="50" cy="38" rx="24" ry="14" fill="${hc}"/>`,
    `<ellipse cx="31" cy="37" rx="13" ry="12" fill="${hc}"/><ellipse cx="50" cy="30" rx="13" ry="12" fill="${hc}"/><ellipse cx="69" cy="37" rx="13" ry="12" fill="${hc}"/>`,
    `<ellipse cx="50" cy="38" rx="24" ry="14" fill="${hc}"/><circle cx="50" cy="17" r="11" fill="${hc}"/>`,
    `<ellipse cx="50" cy="38" rx="24" ry="14" fill="${hc}"/>`,
    `<ellipse cx="50" cy="37" rx="24" ry="13" fill="${hc}"/><rect x="26" y="43" width="48" height="12" rx="6" fill="${hc}"/>`,
  ][a.cheveux] || '';

  const yeux = [
    `<circle cx="38" cy="55" r="4" fill="#111"/><circle cx="62" cy="55" r="4" fill="#111"/>
     <circle cx="39.5" cy="53.5" r="1.3" fill="white" opacity=".6"/><circle cx="63.5" cy="53.5" r="1.3" fill="white" opacity=".6"/>`,
    `<ellipse cx="38" cy="55" rx="5.5" ry="3.5" fill="#111"/><ellipse cx="62" cy="55" rx="5.5" ry="3.5" fill="#111"/>
     <ellipse cx="39.5" cy="54" rx="1.5" ry="1" fill="white" opacity=".6"/><ellipse cx="63.5" cy="54" rx="1.5" ry="1" fill="white" opacity=".6"/>`,
    `<circle cx="38" cy="55" r="6" fill="white"/><circle cx="38" cy="55" r="4.2" fill="#5B8DEF"/><circle cx="38" cy="55" r="2.5" fill="#111"/><circle cx="36.5" cy="53.5" r="1.1" fill="white" opacity=".9"/>
     <circle cx="62" cy="55" r="6" fill="white"/><circle cx="62" cy="55" r="4.2" fill="#5B8DEF"/><circle cx="62" cy="55" r="2.5" fill="#111"/><circle cx="60.5" cy="53.5" r="1.1" fill="white" opacity=".9"/>`,
    `<path d="M33 55 Q38 50 43 55" stroke="#333" stroke-width="2.2" fill="${peau}" stroke-linecap="round"/>
     <path d="M57 55 Q62 50 67 55" stroke="#333" stroke-width="2.2" fill="${peau}" stroke-linecap="round"/>`,
  ][a.yeux] || '';

  const sourcils = `
    <path d="M33 47 Q38 44 43 47" stroke="${src}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M57 47 Q62 44 67 47" stroke="${src}" stroke-width="2" fill="none" stroke-linecap="round"/>`;

  const bouche = [
    `<path d="M42 70 Q50 78 58 70" stroke="#333" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    `<path d="M40 69 Q50 80 60 69" fill="#333"/><path d="M41 69 Q50 73.5 59 69" fill="white"/>`,
    `<line x1="44" y1="70" x2="56" y2="70" stroke="#333" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M45 73 Q50 68 55 73" stroke="#333" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  ][a.bouche] || '';

  const accessoire = [
    '',
    `<circle cx="38" cy="55" r="7.5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.2"/>
     <circle cx="62" cy="55" r="7.5" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.2"/>
     <line x1="45.5" y1="55" x2="54.5" y2="55" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
     <line x1="30.5" y1="53" x2="27" y2="52" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
     <line x1="69.5" y1="53" x2="73" y2="52" stroke="rgba(0,0,0,.45)" stroke-width="2"/>`,
    `<rect x="31" y="48" width="14" height="14" rx="3" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.2"/>
     <rect x="55" y="48" width="14" height="14" rx="3" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="2.2"/>
     <line x1="45" y1="55" x2="55" y2="55" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
     <line x1="31" y1="53" x2="27" y2="52" stroke="rgba(0,0,0,.45)" stroke-width="2"/>
     <line x1="69" y1="53" x2="73" y2="52" stroke="rgba(0,0,0,.45)" stroke-width="2"/>`,
    `<polygon points="30,38 35,26 42,34 50,20 58,34 65,26 70,38" fill="#FFD700" stroke="#E0A000" stroke-width="1.5" stroke-linejoin="round"/>
     <circle cx="35" cy="27" r="2.5" fill="#E63E3E"/><circle cx="50" cy="21" r="2.5" fill="#3E7BE6"/><circle cx="65" cy="27" r="2.5" fill="#E63E3E"/>`,
    `<circle cx="74" cy="67" r="6.5" fill="rgba(255,150,200,.3)"/><circle cx="74" cy="67" r="3.5" fill="rgba(224,80,150,.4)"/>`,
  ][a.accessoire] || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${fond}"/>${hairBehind}<rect x="43" y="73" width="14" height="18" rx="5" fill="${peau}"/><ellipse cx="28" cy="57" rx="4.5" ry="6" fill="${peau}"/><ellipse cx="72" cy="57" rx="4.5" ry="6" fill="${peau}"/><ellipse cx="50" cy="57" rx="22" ry="24" fill="${peau}"/>${hairFront}${sourcils}${yeux}${bouche}${accessoire}</svg>`;
}

function avatarDataUri(attrs) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(genererAvatar(attrs));
}

function avatarImg(attrs, size, extra) {
  const s = size || 40;
  const cl = 'avatar-img' + (extra ? ' ' + extra : '');
  if (attrs?.type === 'photo' && attrs.photo) {
    return `<img class="${cl}" width="${s}" height="${s}" src="${esc(attrs.photo)}" alt="">`;
  }
  return `<img class="${cl}" width="${s}" height="${s}" src="${avatarDataUri(attrs || AVATAR_DEFAUT)}" alt="">`;
}

/* ---------- Outils ---------- */

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const getList = id => state.lists.find(l => l.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Une quantité vaut 1 au minimum ; la saisie au clavier reste libre, on la borne. */
const clampQty = v => {
  const n = parseInt(String(v).replace(/[^\d]/g, ''), 10);
  return Math.min(999, Math.max(1, n || 1));
};

/* Dès qu'un article a des variantes, ce sont elles qui portent la quantité et
   l'état coché : l'article suit. Sans variante, il se gère lui-même. */
const itemDone = item => item.variants.length ? item.variants.every(v => v.done) : item.done;
const itemQty  = item => item.variants.length
  ? item.variants.reduce((n, v) => n + v.qty, 0)
  : item.qty;

/* ---------- État ---------- */

let state = load();
let currentListId = null;
let undoSnapshot = null;
let toastTimer = null;

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.lists)) return migrate(data);
    }
  } catch (e) {
    console.warn('Données illisibles, réinitialisation.', e);
  }
  return { lists: [], hideDone: false, streak: 0, lastActive: null, joursActifs: [], trierParRayon: false, favoris: { items: [], listes: [] } };
}

/* Les données d'avant les quantités n'ont ni `qty` ni `variants`, et rangent la
   variante unique dans une chaîne `variant`. On les convertit au chargement — y
   compris les sauvegardes importées, qui peuvent dater. */
function migrate(data) {
  data.lists.forEach(list => {
    if (!Array.isArray(list.items)) list.items = [];
    list.items.forEach(item => {
      item.done = !!item.done;
      item.qty = clampQty(item.qty);

      if (!Array.isArray(item.variants)) {
        item.variants = item.variant
          ? [{ id: uid(), name: String(item.variant), qty: 1, done: item.done }]
          : [];
      }
      delete item.variant;

      item.variants.forEach(v => {
        if (!v.id) v.id = uid();
        v.name = String(v.name || '');
        v.qty = clampQty(v.qty);
        v.done = !!v.done;
      });
    });
    if (!list.photo) list.photo = '';
  });
  if (data.streak === undefined) data.streak = 0;
  if (!data.lastActive) data.lastActive = null;
  if (!Array.isArray(data.joursActifs)) data.joursActifs = [];
  if (data.trierParRayon === undefined) data.trierParRayon = false;
  if (!data.favoris || typeof data.favoris !== 'object') data.favoris = { items: [], listes: [], suggIgnores: [] };
  if (!Array.isArray(data.favoris.items)) data.favoris.items = [];
  if (!Array.isArray(data.favoris.listes)) data.favoris.listes = [];
  if (!Array.isArray(data.favoris.suggIgnores)) data.favoris.suggIgnores = [];
  return data;
}

function sauverLocalement() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    alert("Impossible d'enregistrer : la mémoire du navigateur est pleine.");
  }
}

/* L'appareil d'abord, le compte ensuite : l'enregistrement local ne dépend
   jamais du réseau, et la synchro n'est qu'un envoi de plus quand il y en a. */
function save() {
  sauverLocalement();
  Sync.push();
}

/* ---------- Raccourcis DOM ---------- */

const $ = id => document.getElementById(id);
const screenHome = $('screen-home');
const screenList = $('screen-list');
const screenMessages = $('screen-messages');
const screenFavoris = $('screen-favoris');
const elLists = $('lists');
const elItems = $('items');

/* ============================================================
   Écran 1 — les listes
   ============================================================ */

let avatarChargementPending = false;

async function chargerAvatarsDesListes() {
  if (!Sync.user || avatarChargementPending) return;
  const uids = [...new Set(state.lists.flatMap(l => l.members || []))]
    .filter(u => u && !Sync.cacheAvatars.has(u));
  if (!uids.length) return;
  avatarChargementPending = true;
  try {
    await Promise.all(uids.map(u => Sync.avatarDe(u)));
    renderHome();
  } catch { } finally { avatarChargementPending = false; }
}

function renderHome() {
  elLists.innerHTML = state.lists.map(list => {
    const realItems = list.items.filter(i => !i._section);
    const total = realItems.length;
    const done = realItems.filter(itemDone).length;
    const estPartagee = (list.members || []).length > 1;
    const typeInfo = TYPES_LISTE[list.type || 'normale'] || TYPES_LISTE.normale;

    let subSuffix = '';
    if (estPartagee) {
      const autresUids = (list.members || []).filter(u => u !== Sync.user?.uid).slice(0, 3);
      const miniAv = autresUids.map(u => avatarImg(Sync.cacheAvatars.get(u) || null, 22, 'avatar-mini')).join('');
      subSuffix = ` · partagée ${miniAv}`;
    }
    const lieeCount = (list.linkedLists || []).length;
    if (lieeCount) subSuffix += ` · 🔗 ${lieeCount}`;

    const typePrefix = list.type && list.type !== 'normale'
      ? `${typeInfo.icon} ${typeInfo.label} · `
      : `${typeInfo.label} · `;

    const articleText = list.type === 'collection'
      ? (total === 0 ? 'Vide' : `${total} article${total > 1 ? 's' : ''}`)
      : (total === 0 ? 'Vide' : `${done} sur ${total} ${total > 1 ? 'articles' : 'article'}`);
    let modifInfo = '';
    if (partagee(list) && list.majParNom && list.majPar !== Sync.user?.uid && list.majLe) {
      const mins = Math.round((Date.now() - list.majLe) / 60000);
      const quand = mins < 1 ? 'à l\'instant' : mins < 60 ? `il y a ${mins} min` : mins < 1440 ? `il y a ${Math.round(mins / 60)} h` : '';
      if (quand) modifInfo = ` · ✏️ ${list.majParNom} ${quand}`;
    }
    const sub = typePrefix + articleText + subSuffix + modifInfo;

    const coverHtml = list.photo
      ? `<span class="list-photo">${list.photo}</span>`
      : `<span class="color-bar" style="background:${list.color}"></span>`;

    return `
      <li class="row" data-id="${list.id}">
        ${coverHtml}
        <button class="row-main" data-open>
          <span class="row-text">
            <span class="row-title">${esc(list.name)}</span>
            <span class="row-sub">${sub}</span>
          </span>
          <span class="chevron">${ICON.chevron}</span>
        </button>
        <button class="row-btn" data-menu aria-label="Options">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
        </button>
        <span class="handle" data-handle aria-label="Déplacer">${ICON.handle}</span>
      </li>`;
  }).join('');

  $('empty-lists').classList.toggle('is-visible', state.lists.length === 0);

  // Les deux messages visent le même problème — des listes qui n'existent qu'ici.
  // En afficher deux d'un coup serait du harcèlement : l'invitation passe devant,
  // c'est la solution durable.
  renderBackupNotice(renderSyncInvite());
}

elLists.addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  if (e.target.closest('[data-open]')) openList(row.dataset.id);
  else if (e.target.closest('[data-menu]')) listMenu(row.dataset.id);
});

/* ---------- Recherche ---------- */

function ouvrirRecherche() {
  $('search-bar').hidden = false;
  $('search-input').focus();
}

function fermerRecherche() {
  $('search-bar').hidden = true;
  $('search-input').value = '';
  renderHome();
}

function renderRecherche(q) {
  const ql = q.toLowerCase();
  const resultats = [];
  const cover = list => list.photo
    ? `<span class="list-photo">${list.photo}</span>`
    : `<span class="color-bar" style="background:${list.color}"></span>`;

  state.lists.forEach(list => {
    if (list.name.toLowerCase().includes(ql)) {
      resultats.push({ list, item: null });
    }
    list.items.filter(i => !i._section && i.text.toLowerCase().includes(ql)).forEach(item => {
      resultats.push({ list, item });
    });
  });

  $('empty-lists').classList.remove('is-visible');

  if (!resultats.length) {
    elLists.innerHTML = `<li class="search-no-result">Aucun résultat pour « ${esc(q)} »</li>`;
    return;
  }

  elLists.innerHTML = resultats.map(({ list, item }) => `
    <li class="row" data-id="${list.id}">
      ${cover(list)}
      <button class="row-main" data-open>
        <span class="row-text">
          <span class="row-title">${esc(item ? item.text : list.name)}</span>
          <span class="row-sub">${item ? esc(list.name) : 'Liste'}</span>
        </span>
        <span class="chevron">${ICON.chevron}</span>
      </button>
    </li>`).join('');
}

$('btn-search').addEventListener('click', ouvrirRecherche);
$('search-close').addEventListener('click', fermerRecherche);
$('search-input').addEventListener('input', () => {
  const q = $('search-input').value.trim();
  if (!q) { renderHome(); return; }
  renderRecherche(q);
});

$('btn-new-list').addEventListener('click', () => {
  askText('Nouvelle liste', '', name => {
    ouvrirTypeListePicker(type => {
      state.lists.push({ id: uid(), name, color: COLORS[state.lists.length % COLORS.length], type, items: [], linkedLists: [] });
      save();
      renderHome();
    });
  });
});

/* ---------- Menu d'une liste ---------- */

function listMenu(id) {
  const list = getList(id);
  if (!list) return;
  const typeInfo = TYPES_LISTE[list.type || 'normale'] || TYPES_LISTE.normale;

  const actions = [
    { label: 'Renommer', icon: '✏️', run: () => renameList(id) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(id) },
    { label: 'Photo de la liste', icon: '🖼️', run: () => photoPicker(id) },
    { label: `Type : ${typeInfo.icon} ${typeInfo.label}`, icon: '', run: () => changerTypeListe(id) },
    { label: 'Lier à une liste', icon: '🔗', run: () => lierListeModal(id) },
    { label: 'Partager', icon: '👥', run: () => shareModal(id) },
    { label: 'Dupliquer', icon: '📄', run: () => duplicateList(id) }
  ];

  // Sur une liste partagée dont on n'est pas l'hôte, supprimer effacerait le
  // travail commun — ce n'est pas à nous. On la quitte, elle reste aux autres.
  if (partagee(list) && !estProprietaire(list)) {
    actions.push({ label: 'Quitter la liste', icon: '🚪', danger: true, run: () => quitterListe(id) });
  } else {
    actions.push({ label: 'Supprimer', icon: '🗑️', danger: true, run: () => deleteList(id) });
  }

  openSheet(list.name, actions);
}

/* ---------- Type de liste ---------- */

function ouvrirTypeListePicker(cb) {
  const actions = Object.entries(TYPES_LISTE).map(([key, t]) => ({
    label: `${t.icon}  ${t.label}`,
    run: () => cb(key)
  }));
  openSheet('Type de liste', actions);
}

function changerTypeListe(id) {
  ouvrirTypeListePicker(type => {
    const list = getList(id);
    if (!list) return;
    list.type = type;
    save();
    renderHome();
    if (currentListId === id) {
      renderItems();
      renderListesLiees(id);
    }
  });
}

/* ---------- Liaison entre listes ---------- */

function lierListeModal(id) {
  const list = getList(id);
  if (!list) return;

  const autres = state.lists.filter(l => l.id !== id);
  if (!autres.length) { toast('Aucune autre liste à lier.'); return; }

  const liees = new Set(list.linkedLists || []);

  const actions = autres.map(l => {
    const t = TYPES_LISTE[l.type || 'normale'] || TYPES_LISTE.normale;
    const estLiee = liees.has(l.id);
    return {
      label: `${estLiee ? '✓ ' : ''}${t.icon} ${l.name}`,
      run: () => {
        const cible = getList(l.id);
        if (!cible) return;
        if (estLiee) {
          list.linkedLists = (list.linkedLists || []).filter(x => x !== l.id);
          cible.linkedLists = (cible.linkedLists || []).filter(x => x !== id);
        } else {
          list.linkedLists = [...(list.linkedLists || []), l.id];
          cible.linkedLists = [...(cible.linkedLists || []), id];
        }
        save();
        renderHome();
        if (currentListId === id || currentListId === l.id) renderListesLiees(currentListId);
      }
    };
  });

  openSheet('Lier à une liste', actions);
}

$('btn-ajouter-section')?.addEventListener('click', () => {
  askText('Nom de la section', '', name => {
    const list = getList(currentListId);
    if (!list || !name) return;
    list.items.push({ id: uid(), text: name, _section: true, variants: [] });
    save();
    renderItems();
  });
});

function renderListesLiees(id) {
  const el = $('liees-bar');
  if (!el) return;
  const list = getList(id);
  const liees = (list?.linkedLists || []).map(lid => getList(lid)).filter(Boolean);

  if (!liees.length) { el.hidden = true; return; }

  el.hidden = false;
  el.innerHTML = `<span class="liees-label">Lié à</span>` +
    liees.map(l => {
      const t = TYPES_LISTE[l.type || 'normale'] || TYPES_LISTE.normale;
      const realItems = l.items.filter(i => !i._section);
      const done = realItems.filter(itemDone).length;
      const total = realItems.length;
      const estPartagee = (l.members || []).length > 1;
      const partageIcon = estPartagee ? ' 👥' : '';
      return `<button class="liee-chip" data-lid="${esc(l.id)}">
        <span class="liee-chip-icon">${t.icon}</span>
        <span class="liee-chip-name">${esc(l.name)}</span>
        <span class="liee-chip-count">${done}/${total}${partageIcon}</span>
      </button>`;
    }).join('');

  el.querySelectorAll('.liee-chip').forEach(btn => {
    btn.addEventListener('click', () => openList(btn.dataset.lid));
  });
}

async function quitterListe(id) {
  const list = getList(id);
  if (!list) return;
  try {
    await Sync.quitter(id);
    // La liste vit chez les autres : on la retire de cet appareil, où elle ne
    // serait plus qu'un doublon que rien ne met à jour.
    state.lists = state.lists.filter(l => l.id !== id);
    sauverLocalement();
    if (currentListId === id) goHome();
    renderHome();
    toast(`Tu as quitté « ${list.name} »`);
  } catch (e) {
    toast(messageErreur(e?.code || String(e)));
  }
}

function renameList(id) {
  const list = getList(id);
  askText('Renommer la liste', list.name, name => {
    list.name = name;
    save();
    renderHome();
    if (currentListId === id) $('list-title').textContent = name;
  });
}

function duplicateList(id) {
  const list = getList(id);
  const copy = {
    id: uid(),
    name: `${list.name} (copie)`,
    color: list.color,
    items: list.items.map(i => ({
      ...i,
      id: uid(),
      variants: i.variants.map(v => ({ ...v, id: uid() }))
    }))
  };
  state.lists.splice(state.lists.indexOf(list) + 1, 0, copy);
  save();
  renderHome();
}

function deleteList(id) {
  const list = getList(id);
  snapshot();
  state.lists = state.lists.filter(l => l.id !== id);
  save();
  if (currentListId === id) goHome();
  renderHome();
  toast(`« ${list.name} » supprimée`, true);
}

function _drawColorWheel(canvas) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, r = size / 2;
  const hslToRgb = (h, s, l) => {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  };
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > r) continue;
      const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const sat = dist / r * 100;
      const [rr, gg, bb] = hslToRgb(hue, sat, 50);
      const i = (y * size + x) * 4;
      d[i] = rr; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function _addWheelListeners(canvas, onPick) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const pick = e => {
    const rect = canvas.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e;
    const x = Math.round((pt.clientX - rect.left) * (size / rect.width));
    const y = Math.round((pt.clientY - rect.top) * (size / rect.height));
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const px = ctx.getImageData(x, y, 1, 1).data;
    if (!px[3]) return;
    onPick('#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join(''));
  };
  canvas.addEventListener('click', pick);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); pick(e); }, { passive: false });
  canvas.addEventListener('touchend', pick);
}

function colorPicker(id) {
  const list = getList(id);
  const curColor = list.color || '#007aff';

  openSheet('Couleur de la liste', [], {
    html: `
      <div class="accent-wheel-wrap">
        <canvas id="list-color-wheel" width="220" height="220" class="color-wheel-canvas"></canvas>
        <div class="accent-wheel-side">
          <div class="accent-preview" id="list-color-preview" style="background:${curColor}"></div>
        </div>
      </div>`,
    onClick: () => {}
  });

  requestAnimationFrame(() => {
    const canvas = document.getElementById('list-color-wheel');
    if (!canvas) return;
    _drawColorWheel(canvas);
    _addWheelListeners(canvas, hex => {
      list.color = hex;
      save();
      renderHome();
      if (currentListId === id) renderItems();
      const prev = document.getElementById('list-color-preview');
      if (prev) prev.style.background = hex;
    });
  });
}

function photoPicker(id) {
  const list = getList(id);
  const html = `<div class="photo-grid">` + PHOTOS_EMOJI.map(e =>
    `<button class="photo-opt" data-emoji="${e}" aria-checked="${e === list.photo}">${e}</button>`
  ).join('') + `</div>`;
  openSheet('Photo de la liste', [], {
    html,
    onClick: e => {
      const opt = e.target.closest('[data-emoji]');
      if (!opt) return;
      list.photo = list.photo === opt.dataset.emoji ? '' : opt.dataset.emoji;
      save();
      renderHome();
      closeSheet();
    }
  });
}

function mettreAJourStreak() {
  const today = new Date().toDateString();
  if (state.lastActive === today) return;
  const hier = new Date(Date.now() - 86400000).toDateString();
  state.streak = state.lastActive === hier ? (state.streak || 0) + 1 : 1;
  state.lastActive = today;
  if (!Array.isArray(state.joursActifs)) state.joursActifs = [];
  if (!state.joursActifs.includes(today)) {
    state.joursActifs.push(today);
    const cutoff = new Date(Date.now() - 14 * 86400000);
    state.joursActifs = state.joursActifs.filter(d => new Date(d) > cutoff);
  }
  save();
  const palier = PALIERS_STREAK.find(p => p.jours === state.streak);
  if (palier) setTimeout(() => toast(`${palier.emoji} Palier atteint — ${palier.label} ! ${palier.jours} jours de suite 🎉`), 800);
}

function renderStreak() {
  const el = $('streak-display');
  if (!el) return;
  el.dataset.count = state.streak || 0;
  el.querySelector('.streak-count').textContent = state.streak || 0;
}

$('streak-display').style.cursor = 'pointer';
$('streak-display').addEventListener('click', streakModal);

function streakModal() {
  const streak = state.streak || 0;
  const actifs = new Set(state.joursActifs || []);
  const LETTRES = ['D','L','M','M','J','V','S'];
  const today = new Date();

  const weekHtml = `<div class="sk-week">` +
    Array.from({length: 7}, (_, i) => {
      const d = new Date(today.getTime() - (6 - i) * 86400000);
      const ok = actifs.has(d.toDateString());
      const isToday = i === 6;
      return `<div class="sk-day${ok ? ' actif' : ''}${isToday ? ' auj' : ''}">
        <span class="sk-dot">${ok ? '⭐' : ''}</span>
        <span class="sk-day-lbl">${LETTRES[d.getDay()]}</span>
      </div>`;
    }).join('') + `</div>`;

  const prochain = PALIERS_STREAK.find(p => p.jours > streak);
  const prevJours = prochain
    ? (PALIERS_STREAK.slice().reverse().find(p => p.jours <= streak)?.jours ?? 0)
    : 0;
  const progressPct = prochain
    ? Math.round((streak - prevJours) / (prochain.jours - prevJours) * 100)
    : 100;

  const nextHtml = prochain
    ? `<div class="sk-next-wrap">
        <div class="sk-next-row">
          <span>Prochain : <strong>${prochain.emoji} ${prochain.jours} jours</strong></span>
          <span class="sk-reste">${prochain.jours - streak} j. restant${prochain.jours - streak > 1 ? 's' : ''}</span>
        </div>
        <div class="sk-progress-bar"><div class="sk-progress-fill" style="width:${progressPct}%"></div></div>
      </div>`
    : `<div class="sk-next-wrap"><strong>🏅 Tous les paliers débloqués !</strong></div>`;

  const paliersHtml = PALIERS_STREAK.map((p, idx) => {
    const debloque = streak >= p.jours;
    const estProchain = !debloque && (!PALIERS_STREAK[idx - 1] || streak >= PALIERS_STREAK[idx - 1].jours);
    const cl = debloque ? 'debloque' : estProchain ? 'prochain' : 'verrouille';
    return `<div class="sk-palier ${cl}" style="--pc:${p.couleur};animation-delay:${Math.min(idx * 0.055, 1.1)}s">
      <div class="sk-p-emoji">${p.emoji}</div>
      <div class="sk-p-jours">${p.jours}</div>
      <div class="sk-p-label">${p.label}</div>
      ${debloque ? `<div class="sk-p-check">✓</div>` : ''}
    </div>`;
  }).join('');

  const isMilestone = PALIERS_STREAK.some(p => p.jours === streak);

  openSheet('Ma série', [], { html: `
    <div class="sk-modal">
      <div class="sk-confetti-zone" id="sk-confetti"></div>
      <div class="sk-hero">
        <span class="sk-star">⭐</span>
        <div class="sk-count">${streak}</div>
        <div class="sk-sub">jour${streak > 1 ? 's' : ''} consécutif${streak > 1 ? 's' : ''}</div>
      </div>
      ${weekHtml}
      ${nextHtml}
      <div class="sk-grid-title">Paliers</div>
      <div class="sk-paliers-grid">${paliersHtml}</div>
    </div>`
  });

  if (isMilestone) setTimeout(() => lancerConfetti($('sk-confetti')), 150);
}

function lancerConfetti(zone) {
  if (!zone) return;
  const cl = ['#ff3b30','#ff9500','#ffcc00','#34c759','#007aff','#af52de','#ff2d55'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('span');
    p.className = 'sk-confetti-p';
    const isRound = Math.random() > .5;
    p.style.cssText =
      `left:${Math.random() * 100}%;` +
      `background:${cl[i % cl.length]};` +
      `animation-delay:${Math.random() * .9}s;` +
      `animation-duration:${.6 + Math.random() * .9}s;` +
      `width:${5 + Math.random() * 7}px;height:${5 + Math.random() * 7}px;` +
      `border-radius:${isRound ? '50%' : '2px'};` +
      `--rot:${Math.floor(Math.random() * 360)}deg`;
    zone.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

/* ============================================================
   Écran 2 — les articles
   ============================================================ */

function openList(id) {
  if (currentListId && currentListId !== id) Sync.quitterPresence?.(currentListId);
  currentListId = id;
  const list = getList(id);
  $('list-title').textContent = list.name;
  screenHome.classList.remove('is-active');
  screenList.classList.add('is-active');
  renderItems();
  renderListesLiees(id);
  renderPresence(id);
  if (partagee(list)) Sync.ecrirePresence?.(id);
}

function goHome() {
  Sync.quitterPresence?.(currentListId);
  currentListId = null;
  screenList.classList.remove('is-active');
  screenHome.classList.add('is-active');
  renderHome();
}

function renderPresence(listId) {
  const el = $('presence-viewers');
  if (!el) return;
  const list = listId ? getList(listId) : null;
  if (!list || !partagee(list)) { el.hidden = true; return; }

  const maintenant = Date.now();
  const viewers = Object.entries(list.presence || {})
    .filter(([uid, v]) => uid !== Sync.user?.uid && v?.ts)
    .filter(([, v]) => {
      const ts = v.ts?.toMillis ? v.ts.toMillis() : (v.ts?.seconds ? v.ts.seconds * 1000 : 0);
      return maintenant - ts < 120000;
    });

  if (!viewers.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = viewers.map(([uid, v]) =>
    `<span class="presence-bubble" title="${esc(v.nom || uid)}">${(v.nom || '?')[0].toUpperCase()}</span>`
  ).join('') + `<span class="presence-label">${viewers.length === 1 ? viewers[0][1].nom || 'quelqu\'un' : `${viewers.length} personnes`} est là</span>`;
}

const partagee = list => (list.members || []).length > 1;

/* Un compte marqué porte un badge — le même partout : à côté du nom sur une
   liste partagée, sur une invitation, dans la fenêtre Compte. Doré pour un
   admin, noir pour un compte de test. Le libellé dit lequel. */
const MARQUES_LIBELLE = { admin: 'admin', test: 'test' };
function nomPour(uid) {
  const attrs = Sync.cacheAvatars.get(uid);
  if (attrs?.nom) return attrs.nom;
  const ami = Sync.amis.find(a => a.uid === uid);
  if (ami?.code) return ami.code.replace(/(\d{4})(\d{4})/, '$1-$2');
  return uid.slice(0, 8) + '…';
}

function badgeMarque(uid) {
  const type = Sync.marque(uid);
  if (!type) return '';
  return `<span class="badge badge-${type}" title="Compte ${type}" aria-label="compte ${type}">${MARQUES_LIBELLE[type]}</span>`;
}

/* Sur une liste à plusieurs, savoir qui a coché évite le doute — et le double
   achat. Inutile de se nommer soi-même, ni sur une liste qu'on est seul à voir. */
function parQui(nom, list, uid) {
  if (!partagee(list) || !nom || nom === Sync.nomAffiche()) return '';
  // Les cases cochées avant les pseudos portent une adresse : on n'en montre
  // que le début, comme on le faisait alors.
  return `<span class="par-qui">${esc(String(nom).split('@')[0])}${badgeMarque(uid)}</span>`;
}

function renderItemHtml(item, list) {
  const isCollection = list.type === 'collection';

  if (item._section) {
    return `
  <li class="section-header" data-id="${item.id}">
    <span class="section-name">${esc(item.text)}</span>
    <button class="section-edit-btn" data-section-edit aria-label="Renommer">✏️</button>
    <button class="row-btn danger" data-del aria-label="Supprimer">${ICON.trash}</button>
    <span class="handle" data-handle aria-label="Déplacer">${ICON.handle}</span>
  </li>`;
  }

  const done = itemDone(item);
  const total = itemQty(item);
  const seule = item.variants.length === 1 ? item.variants[0] : null;
  const emojiPfx = item.emoji ? `<span aria-hidden="true">${item.emoji} </span>` : '';
  const subParts = [];
  if (seule) subParts.push(esc(seule.name));
  const lieu = item.ou || (!state.trierParRayon && item.rayon) || '';
  if (lieu) subParts.push(esc(lieu));
  const subHtml = subParts.length ? `<span class="row-sub">${subParts.join(' · ')}</span>` : '';

  let deadlineHtml = '';
  if (item.deadline) {
    const d = new Date(item.deadline);
    const now = new Date();
    const diff = d - now;
    const cls = diff < 0 ? 'deadline-past' : diff < 86400000 ? 'deadline-soon' : 'deadline-ok';
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
    const heure = d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    let label;
    if (isToday)    label = `Aujourd'hui ${heure}`;
    else if (isTomorrow) label = `Demain ${heure}`;
    else label = d.toLocaleDateString('fr', { day: 'numeric', month: 'short' }) + (d.getHours() || d.getMinutes() ? ` ${heure}` : '');
    deadlineHtml = `<div class="item-deadline-row"><span class="row-deadline ${cls}">⏰ ${label}</span><button class="dl-del" data-dldel aria-label="Supprimer le rappel">×</button></div>`;
  }

  const checkHtml = isCollection ? '' : `
      <button class="check-hit" data-toggle
              aria-label="${done ? 'Décocher' : 'Cocher'} ${esc(item.text)}">
        <span class="check" style="background:${done ? list.color : 'transparent'}">${ICON.check}</span>
      </button>`;

  return `
  <li class="row item ${done && !isCollection ? 'done' : ''}" data-id="${item.id}">
    <div class="item-head">
      ${checkHtml}
      <button class="row-main" data-edit aria-label="Modifier ${esc(item.text)}">
        <span class="row-text">
          <span class="row-title">${emojiPfx}${esc(item.text)}</span>
          ${subHtml}
        </span>
      </button>
      ${done && !isCollection ? parQui(item.doneBy, list, item.doneByUid) : ''}
      ${total > 1 ? `<span class="qty">×${total}</span>` : ''}
      <button class="row-btn fav-btn${isFavori(item.text) ? ' fav-active' : ''}" data-star aria-label="${isFavori(item.text) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">★</button>
      <button class="row-btn danger" data-del aria-label="Supprimer">${ICON.trash}</button>
      <span class="handle" data-handle aria-label="Déplacer">${ICON.handle}</span>
    </div>
    ${deadlineHtml}
    ${item.variants.length > 1 ? `
    <ul class="variants">
      ${item.variants.map(v => `
      <li class="variant ${v.done && !isCollection ? 'done' : ''}" data-vid="${v.id}">
        ${isCollection ? '' : `<button class="variant-hit" data-vtoggle
                aria-label="${v.done ? 'Décocher' : 'Cocher'} ${esc(v.name)}">
          <span class="check check-sm" style="background:${v.done ? list.color : 'transparent'}">${ICON.check}</span>
        </button>`}
        <span class="variant-name">${esc(v.name)}</span>
        ${v.done && !isCollection ? parQui(v.doneBy, list, v.doneByUid) : ''}
        ${v.qty > 1 ? `<span class="qty">×${v.qty}</span>` : ''}
      </li>`).join('')}
    </ul>` : ''}
  </li>`;
}

function renderItems() {
  const list = getList(currentListId);
  if (!list) return goHome();

  const isCollection = list.type === 'collection';
  const typeInfo = TYPES_LISTE[list.type || 'normale'] || TYPES_LISTE.normale;

  const typeLabel = $('list-type-label');
  if (typeLabel) {
    typeLabel.textContent = `${typeInfo.icon} ${typeInfo.label}`;
    typeLabel.hidden = false;
  }

  const _btnToggleDone = $('btn-toggle-done');
  const _btnTrierRayon = $('btn-trier-rayon');
  const _btnAjouterSection = $('btn-ajouter-section');
  if (_btnToggleDone) _btnToggleDone.hidden = isCollection;
  if (_btnTrierRayon) _btnTrierRayon.hidden = isCollection;
  if (_btnAjouterSection) _btnAjouterSection.hidden = !isCollection;

  const visible = isCollection
    ? list.items
    : (state.hideDone ? list.items.filter(i => !itemDone(i)) : list.items);

  if (!isCollection && state.trierParDeadline) {
    const avecDate = visible.filter(i => i._section || i.deadline);
    const sansDates = visible.filter(i => !i._section && !i.deadline);
    const tries = [...avecDate].sort((a, b) => {
      if (a._section || b._section) return 0;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    elItems.innerHTML = [...tries, ...sansDates].map(i => renderItemHtml(i, list)).join('');
  } else if (!isCollection && state.trierParRayon) {
    const groups = new Map();
    visible.forEach(item => {
      const k = item.rayon || '';
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(item);
    });
    const sorted = [...groups.entries()].sort(([a], [b]) => {
      if (!a) return 1; if (!b) return -1;
      return a.localeCompare(b, 'fr');
    });
    elItems.innerHTML = sorted.map(([rayon, items]) =>
      (rayon ? `<li class="rayon-header">${esc(rayon)}</li>` : '') +
      items.map(i => renderItemHtml(i, list)).join('')
    ).join('');
  } else {
    elItems.innerHTML = visible.map(i => renderItemHtml(i, list)).join('');
  }

  elItems.classList.toggle('rayon-mode', !isCollection && !!state.trierParRayon);
  elItems.classList.toggle('deadline-mode', !isCollection && !!state.trierParDeadline);

  const realItems = list.items.filter(i => !i._section);
  const done = realItems.filter(itemDone).length;
  const pieces = realItems.reduce((n, i) => n + itemQty(i), 0);

  if (isCollection) {
    $('list-progress').textContent = `${realItems.length} article${realItems.length > 1 ? 's' : ''}`;
  } else {
    $('list-progress').textContent = `${done} sur ${realItems.length}`
      + (pieces !== realItems.length ? ` · ${pieces} au total` : '');
    if (_btnToggleDone) _btnToggleDone.textContent = state.hideDone ? 'Afficher les cochés' : 'Masquer les cochés';
  }

  if (_btnTrierRayon) _btnTrierRayon.classList.toggle('is-active', !isCollection && !!state.trierParRayon);
  $('empty-items').classList.toggle('is-visible', visible.filter(i => !i._section).length === 0);
}

elItems.addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const list = getList(currentListId);
  const item = list.items.find(i => i.id === row.dataset.id);
  if (!item) return;

  if (item._section) {
    if (e.target.closest('[data-section-edit]')) {
      askText('Renommer la section', item.text, name => {
        if (!name) return;
        item.text = name;
        save();
        renderItems();
      });
    } else if (e.target.closest('[data-del]')) {
      snapshot();
      list.items = list.items.filter(i => i.id !== item.id);
      save();
      renderItems();
    }
    return;
  }

  if (e.target.closest('[data-star]')) {
    toggleFavori(item.text);
    return;
  }
  if (e.target.closest('[data-dldel]')) {
    delete item.deadline;
    save();
    renderItems();
    return;
  }

  const signer = (cible, etat) => {
    if (etat) {
      cible.doneBy = Sync.user ? Sync.nomAffiche() : null;
      if (Sync.user) cible.doneByUid = Sync.user.uid; else delete cible.doneByUid;
    } else { delete cible.doneBy; delete cible.doneByUid; }
  };

  const ligneVariante = e.target.closest('[data-vid]');
  if (ligneVariante && e.target.closest('[data-vtoggle]')) {
    const v = item.variants.find(x => x.id === ligneVariante.dataset.vid);
    if (v) {
      v.done = !v.done;
      signer(v, v.done);
      item.done = item.variants.every(x => x.done);
      signer(item, item.done);
      save();
      renderItems();
    }
    return;
  }

  if (e.target.closest('[data-toggle]')) {
    // Cocher l'article coche d'un coup toutes ses variantes, et inversement.
    const etat = !itemDone(item);
    item.done = etat;
    signer(item, etat);
    item.variants.forEach(v => { v.done = etat; signer(v, etat); });
    save();
    renderItems();
  } else if (e.target.closest('[data-edit]')) {
    editItem(item);
  } else if (e.target.closest('[data-del]')) {
    snapshot();
    list.items = list.items.filter(i => i.id !== item.id);
    save();
    renderItems();
    toast(`« ${item.text} » supprimé`, true);
  }
});

/* ============================================================
   Fiche d'un article — nom, quantité, variantes
   ============================================================ */

const itemBackdrop = $('item-backdrop');
const elVariantsEdit = $('item-variants');

/* Brouillon de travail : la fiche modifie une copie, l'article n'est touché
   qu'à la validation. Annuler ne laisse donc aucune trace. */
let draft = null;
let draftApply = null;

function editItem(item) {
  draft = {
    text: item.text,
    qty: item.qty,
    baseDone: itemDone(item),
    variants: item.variants.map(v => ({ ...v })),
    deadline: item.deadline || ''
  };

  draftApply = d => {
    item.text = d.text;
    item.qty = d.qty;
    item.variants = d.variants;
    if (d.variants.length) item.done = d.variants.every(v => v.done);
    if (d.deadline) item.deadline = d.deadline;
    else delete item.deadline;
    save();
    renderItems();
  };

  $('item-name').value = draft.text;
  $('item-deadline').value = draft.deadline;
  $('item-deadline-clear').hidden = !draft.deadline;
  renderDraft();
  itemBackdrop.hidden = false;
  setTimeout(() => { $('item-name').focus(); $('item-name').select(); }, 50);
}

function stepper(cls, valeur) {
  return `
    <div class="stepper">
      <button type="button" class="step" data-step="-1" aria-label="Diminuer">−</button>
      <input type="text" class="step-value ${cls}" inputmode="numeric"
             value="${valeur}" aria-label="Quantité">
      <button type="button" class="step" data-step="1" aria-label="Augmenter">+</button>
    </div>`;
}

function renderDraft() {
  // Avec des variantes, la quantité de l'article est la somme des leurs :
  // afficher les deux réglages inviterait à se contredire.
  $('item-qty-block').hidden = draft.variants.length > 0;
  $('item-qty').value = draft.qty;

  elVariantsEdit.innerHTML = draft.variants.map(v => `
    <li class="variant-edit" data-vid="${v.id}">
      <input type="text" class="v-name" value="${esc(v.name)}" autocomplete="off"
             placeholder="taille, modèle, coloris…" aria-label="Nom de la variante">
      <div class="variant-edit-row">
        ${stepper('v-qty', v.qty)}
        <button type="button" class="row-btn danger" data-vdel
                aria-label="Supprimer la variante">${ICON.trash}</button>
      </div>
    </li>`).join('');
}

/* Les champs de la fiche sont la source de vérité tant qu'elle est ouverte :
   on les relit avant tout réaffichage, sinon une saisie en cours serait perdue. */
function syncDraft() {
  draft.text = $('item-name').value;
  draft.qty = clampQty($('item-qty').value);
  draft.deadline = $('item-deadline').value;
  elVariantsEdit.querySelectorAll('[data-vid]').forEach(li => {
    const v = draft.variants.find(x => x.id === li.dataset.vid);
    if (!v) return;
    v.name = li.querySelector('.v-name').value;
    v.qty = clampQty(li.querySelector('.v-qty').value);
  });
}

$('item-editor').addEventListener('click', e => {
  const pas = e.target.closest('[data-step]');
  if (pas) {
    const champ = pas.parentElement.querySelector('.step-value');
    champ.value = clampQty(clampQty(champ.value) + Number(pas.dataset.step));
    return;
  }

  const suppr = e.target.closest('[data-vdel]');
  if (suppr) {
    syncDraft();
    const id = suppr.closest('[data-vid]').dataset.vid;
    draft.variants = draft.variants.filter(v => v.id !== id);
    renderDraft();
  }
});

$('btn-add-variant').addEventListener('click', () => {
  syncDraft();
  // La première variante reprend l'état de l'article : cocher puis détailler ne
  // doit pas décocher ce qui était déjà fait.
  const done = draft.variants.length === 0 ? draft.baseDone : false;
  draft.variants.push({ id: uid(), name: '', qty: 1, done });
  renderDraft();
  elVariantsEdit.lastElementChild?.querySelector('.v-name').focus();
});

function closeItemEditor() {
  itemBackdrop.hidden = true;
  draft = null;
  draftApply = null;
}

$('item-ok').addEventListener('click', () => {
  syncDraft();
  const d = draft, apply = draftApply;
  d.text = d.text.trim();
  if (!d.text) return closeItemEditor();      // un article sans nom n'a pas de sens
  // Une variante sans nom non plus : on la laisse tomber silencieusement.
  d.variants = d.variants.filter(v => v.name.trim()).map(v => ({ ...v, name: v.name.trim() }));
  closeItemEditor();
  apply(d);
});

$('item-cancel').addEventListener('click', closeItemEditor);
itemBackdrop.addEventListener('click', e => { if (e.target === itemBackdrop) closeItemEditor(); });
$('item-name').addEventListener('keydown', e => { if (e.key === 'Enter') $('item-ok').click(); });

$('item-deadline').addEventListener('input', () => {
  $('item-deadline-clear').hidden = !$('item-deadline').value;
});
$('item-deadline-clear').addEventListener('click', () => {
  $('item-deadline').value = '';
  $('item-deadline-clear').hidden = true;
});

let pendingSuggestion = null;

$('form-add-item').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('input-item');
  const text = input.value.trim();
  if (!text) return;
  $('autocomplete-list').hidden = true;
  const item = { id: uid(), text, qty: 1, done: false, variants: [] };
  if (pendingSuggestion?.rayon) item.rayon = pendingSuggestion.rayon;
  if (pendingSuggestion?.emoji) item.emoji = pendingSuggestion.emoji;
  if (pendingSuggestion?.ou) item.ou = pendingSuggestion.ou;
  pendingSuggestion = null;
  getList(currentListId).items.push(item);
  save();
  input.value = '';
  renderItems();
  input.focus();
  if (!item.ou && !item.rayon) enrichirItemSilencieux(item.id, item.text, currentListId);
});

/* ---------- Autocomplete produits + IA ---------- */

let _iaAcTimer = null;

$('input-item').addEventListener('input', () => {
  const val = $('input-item').value.trim();
  const acList = $('autocomplete-list');
  clearTimeout(_iaAcTimer);

  const suggs = typeof chercherProduit === 'function' ? chercherProduit(val, 5) : [];
  const baseHtml = suggs.map(p => `
    <div class="autocomplete-item" data-nom="${esc(p.nom)}" data-rayon="${esc(p.rayon || '')}" data-emoji="${esc(p.emoji || '')}" data-ou="">
      <span class="ac-emoji">${p.emoji || ''}</span>
      <span class="ac-info">
        <span class="ac-nom">${esc(p.nom)}</span>
        ${p.rayon ? `<span class="ac-rayon">${esc(p.rayon)}</span>` : ''}
      </span>
    </div>`).join('');

  if (val.length < 2) { acList.hidden = true; return; }

  if (!Sync.user || suggs.length >= 4 || val.length < 3) {
    acList.innerHTML = baseHtml;
    acList.hidden = !suggs.length;
    return;
  }

  // Moins de 4 résultats produits → IA en complément (debounce 400 ms)
  acList.innerHTML = baseHtml +
    '<div class="autocomplete-item ac-ia-loading" aria-hidden="true">✨ Recherche…</div>';
  acList.hidden = false;

  _iaAcTimer = setTimeout(async () => {
    const list = getList(currentListId);
    if (!list || $('input-item').value.trim() !== val) return;
    try {
      const idToken = await fb.auth.currentUser.getIdToken();
      const r = await fetch(WORKER_NOTIFS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, action: 'ia', mode: 'suggerer', saisie: val, typeListe: list.type || 'normale' })
      });
      const data = await r.json();
      if ($('input-item').value.trim() !== val) return;
      const iaSuggs = (data.suggestions || []).filter(s => s?.nom);
      const iaHtml = iaSuggs.map(s => `
        <div class="autocomplete-item ac-ia" data-nom="${esc(s.nom)}" data-ou="${esc(s.ou || '')}" data-rayon="" data-emoji="">
          <span class="ac-emoji ac-ia-star">✨</span>
          <span class="ac-info">
            <span class="ac-nom">${esc(s.nom)}</span>
            ${s.ou ? `<span class="ac-rayon">${esc(s.ou)}</span>` : ''}
          </span>
        </div>`).join('');
      acList.innerHTML = baseHtml + iaHtml;
      acList.hidden = !(suggs.length + iaSuggs.length);
    } catch {
      acList.innerHTML = baseHtml;
      acList.hidden = !suggs.length;
    }
  }, 400);
});

$('input-item').addEventListener('keydown', e => {
  if (e.key === 'Escape') { $('autocomplete-list').hidden = true; pendingSuggestion = null; }
});

function selectionnerSuggestion(e) {
  const item = e.target.closest('[data-nom]');
  if (!item || item.classList.contains('ac-ia-loading')) return;
  e.preventDefault();
  $('input-item').value = item.dataset.nom;
  pendingSuggestion = { rayon: item.dataset.rayon || '', emoji: item.dataset.emoji || '', ou: item.dataset.ou || '' };
  $('autocomplete-list').hidden = true;
}
$('autocomplete-list').addEventListener('touchstart', selectionnerSuggestion, { passive: false });
$('autocomplete-list').addEventListener('mousedown', selectionnerSuggestion);

document.addEventListener('click', e => {
  if (!e.target.closest('#form-add-item') && !e.target.closest('#autocomplete-list')) {
    const acList = $('autocomplete-list');
    if (acList) acList.hidden = true;
  }
});

$('btn-back').addEventListener('click', goHome);

$('btn-toggle-done').addEventListener('click', () => {
  state.hideDone = !state.hideDone;
  save();
  renderItems();
});

$('btn-trier-rayon').addEventListener('click', () => {
  state.trierParRayon = !state.trierParRayon;
  save();
  renderItems();
});

$('btn-list-menu').addEventListener('click', () => {
  const list = getList(currentListId);
  const doneCount = list.items.filter(itemDone).length;
  const typeInfo = TYPES_LISTE[list.type || 'normale'] || TYPES_LISTE.normale;

  openSheet(list.name, [
    { label: 'Renommer la liste', icon: '✏️', run: () => renameList(currentListId) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(currentListId) },
    { label: `Type : ${typeInfo.icon} ${typeInfo.label}`, icon: '', run: () => changerTypeListe(currentListId) },
    { label: state.trierParDeadline ? 'Annuler le tri par rappel' : 'Trier par rappel', icon: '⏰', run: () => {
        state.trierParDeadline = !state.trierParDeadline;
        if (state.trierParDeadline) state.trierParRayon = false;
        sauverLocalement(); renderItems();
      } },
    { label: 'Lier à une liste', icon: '🔗', run: () => lierListeModal(currentListId) },
    { label: 'Partager la liste', icon: '👥', run: () => shareModal(currentListId) },
    { label: 'Tout décocher', icon: '↩️', run: () => {
        snapshot();
        list.items.forEach(i => {
          if (i._section) return;
          i.done = false; delete i.doneBy; delete i.doneByUid;
          i.variants.forEach(v => { v.done = false; delete v.doneBy; delete v.doneByUid; });
        });
        save(); renderItems();
      } },
    { label: `Supprimer les articles cochés (${doneCount})`, icon: '🧹', danger: true, run: () => {
        if (!doneCount) return;
        snapshot();
        list.items = list.items.filter(i => i._section || !itemDone(i));
        save(); renderItems();
        toast(`${doneCount} article${doneCount > 1 ? 's' : ''} supprimé${doneCount > 1 ? 's' : ''}`, true);
      } },
    { label: 'Dupliquer la liste', icon: '📄', run: () => { duplicateList(currentListId); toast('Liste dupliquée'); } },
    { label: 'Supprimer la liste', icon: '🗑️', danger: true, run: () => deleteList(currentListId) }
  ]);
});

/* ============================================================
   Réorganisation par glisser-déposer
   ============================================================ */

function enableDragSort(container, onDrop) {
  let el = null, pointerId = null, startY = 0, scrollTimer = null;

  const scroller = container.closest('.scroll');

  function move(clientY) {
    el.style.transform = `translateY(${clientY - startY}px)`;
  }

  function swapWith(sibling, clientY) {
    const before = el.getBoundingClientRect().top;
    if (sibling.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING) {
      sibling.after(el);          // le voisin était après → on passe derrière lui
    } else {
      sibling.before(el);         // le voisin était avant → on passe devant lui
    }
    el.style.transform = '';
    const after = el.getBoundingClientRect().top;
    startY = clientY - (before - after);
    move(clientY);
  }

  container.addEventListener('pointerdown', e => {
    const handle = e.target.closest('[data-handle]');
    if (!handle) return;
    el = handle.closest('[data-id]');
    if (!el) return;

    e.preventDefault();
    pointerId = e.pointerId;
    startY = e.clientY;
    el.classList.add('dragging');
    try { el.setPointerCapture(pointerId); } catch {}
    if (navigator.vibrate) navigator.vibrate(8);
  });

  container.addEventListener('pointermove', e => {
    if (!el || e.pointerId !== pointerId) return;
    e.preventDefault();
    clearInterval(scrollTimer);
    move(e.clientY);

    const rect = el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;

    const next = el.nextElementSibling;
    const prev = el.previousElementSibling;
    if (next) {
      const r = next.getBoundingClientRect();
      if (center > r.top + r.height / 2) return swapWith(next, e.clientY);
    }
    if (prev) {
      const r = prev.getBoundingClientRect();
      if (center < r.top + r.height / 2) return swapWith(prev, e.clientY);
    }

    // défilement automatique près des bords
    const bounds = scroller.getBoundingClientRect();
    const speed = e.clientY < bounds.top + 70 ? -8
                : e.clientY > bounds.bottom - 70 ? 8 : 0;
    if (speed) {
      scrollTimer = setInterval(() => {
        scroller.scrollTop += speed;
        startY -= speed;
        move(e.clientY);
      }, 16);
    }
  });

  function end() {
    if (!el) return;
    clearInterval(scrollTimer);
    el.classList.remove('dragging');
    el.style.transform = '';
    el = null; pointerId = null;
    onDrop([...container.children].map(c => c.dataset.id));
  }

  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);
}

function reorderBy(array, ids) {
  const map = new Map(array.map(o => [o.id, o]));
  return ids.map(id => map.get(id)).filter(Boolean);
}

enableDragSort(elLists, ids => {
  state.lists = reorderBy(state.lists, ids);
  save();
  renderHome();
});

enableDragSort(elItems, ids => {
  const list = getList(currentListId);
  if (!list) return;
  if (state.hideDone) {
    // seuls les non-cochés sont affichés : on réinsère les cochés à la fin
    const shown = reorderBy(list.items, ids);
    list.items = [...shown, ...list.items.filter(itemDone)];
  } else {
    list.items = reorderBy(list.items, ids);
  }
  save();
  renderItems();
});

/* ============================================================
   Feuille d'actions, boîte de saisie, notification
   ============================================================ */

const sheetBackdrop = $('sheet-backdrop');
const sheetBody = $('sheet-body');

/* `extra` (facultatif) : { html, onClick } pour du contenu sur mesure. */
function openSheet(title, actions, extra = null) {
  $('sheet-title').textContent = title;
  sheetBody.innerHTML = (extra?.html || '') + actions.map((a, i) =>
    `<button class="sheet-action ${a.danger ? 'danger' : ''}" data-i="${i}">
       <span>${a.icon || ''}</span><span>${esc(a.label)}</span>
     </button>`).join('');

  // onclick (et non addEventListener) : chaque ouverture remplace le gestionnaire
  // précédent au lieu de l'empiler.
  sheetBody.onclick = e => {
    const btn = e.target.closest('[data-i]');
    if (btn) {
      closeSheet();
      actions[+btn.dataset.i].run();
    } else if (extra?.onClick) {
      extra.onClick(e);
    }
  };

  sheetBackdrop.hidden = false;
}

function closeSheet() { sheetBackdrop.hidden = true; }

sheetBackdrop.addEventListener('click', e => { if (e.target === sheetBackdrop) closeSheet(); });
$('sheet-cancel').addEventListener('click', closeSheet);

/* ---------- Saisie de texte ---------- */

const modalBackdrop = $('modal-backdrop');
const modalInput = $('modal-input');
let modalCallback = null;

/* Un champ unique — pour un nom de liste. Le rappel reçoit une chaîne. */
function askText(title, value, callback) {
  modalCallback = callback;
  $('modal-title').textContent = title;
  modalInput.value = value;
  modalBackdrop.hidden = false;
  setTimeout(() => { modalInput.focus(); modalInput.select(); }, 50);
}

function closeModal() { modalBackdrop.hidden = true; modalCallback = null; }

function confirmModal() {
  const texte = modalInput.value.trim();
  if (!texte) return closeModal();          // une liste sans nom n'a pas de sens
  const cb = modalCallback;
  closeModal();
  cb(texte);
}

$('modal-ok').addEventListener('click', confirmModal);
$('modal-cancel').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
modalInput.addEventListener('keydown', e => { if (e.key === 'Enter') confirmModal(); });

/* ---------- Notification avec annulation ---------- */

function snapshot() {
  undoSnapshot = JSON.stringify(state);
}

/* `annulable` n'est vrai que pour ce qui se défait vraiment — les suppressions,
   qui ont pris un instantané. Quitter une liste retire des membres côté serveur :
   « Annuler » ne pourrait pas rejoindre à nouveau, alors le bouton ne s'affiche
   pas. Le laisser partout annulait en douce la dernière suppression en mémoire. */
function toast(message, annulable = false) {
  $('toast-text').textContent = message;
  $('toast-undo').hidden = !annulable;
  if (!annulable) undoSnapshot = null;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 5000);
}

$('toast-undo').addEventListener('click', () => {
  if (!undoSnapshot) return;
  state = JSON.parse(undoSnapshot);
  undoSnapshot = null;
  save();
  applyTheme();
  $('toast').hidden = true;
  if (currentListId && getList(currentListId)) renderItems();
  else goHome();
});

/* ============================================================
   Réglages — sauvegarde et restauration
   ============================================================ */

const JOUR = 86400000;
const dateCourte = ts =>
  new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

$('btn-settings').addEventListener('click', () => {
  const count = state.lists.length;
  const info = state.lastBackup
    ? `Dernière sauvegarde le ${dateCourte(state.lastBackup)}`
    : 'Aucune sauvegarde enregistrée';

  const notifs = { granted: 'activées', denied: 'refusées', default: 'désactivées',
                   indisponible: 'indisponibles' }[etatNotifs()];

  const aRetours = $('btn-settings').classList.contains('has-retours');
  const actions = [
    { label: Sync.user ? 'Compte et synchronisation' : 'Se connecter', icon: '☁️', run: accountModal },
    { label: `Notifications — ${notifs}`, icon: '🔔', run: notifsModal },
    { label: 'Apparence', icon: '🎨', run: themePicker },
    { label: 'Mon activité', icon: '📊', run: statsModal },
    { label: `Nouveautés de ${VERSION}`, icon: '✨', run: newsModal },
    { label: 'Sauvegarder mes listes', icon: '⬇️', run: exportData },
    { label: 'Restaurer une sauvegarde', icon: '⬆️', run: importData }
  ];
  if (Sync.user && !Sync.estAdmin()) {
    actions.push({ label: 'Nous écrire', icon: '✉️', run: feedbackModal });
  }
  if (Sync.user && !Sync.estAdmin()) {
    actions.push({ label: aRetours ? 'Mes retours  ●' : 'Mes retours', icon: '📬', run: mesRetoursModal });
  }
  // Réservé aux admins : annonce globale et réservation de pseudos.
  if (Sync.estAdmin()) {
    actions.push({ label: 'Administration', icon: '✦', run: adminModal });
  }

  openSheet(`${count} liste${count > 1 ? 's' : ''}`, actions,
    { html: `<p class="sheet-note">${esc(info)}</p>` });
});

/* ---------- Notifications ----------

   Ce que l'app sait faire seule : prévenir pendant qu'elle tourne. Prévenir un
   téléphone dont l'app est fermée demande un serveur qui pousse le message, et
   il n'y en a pas — un site statique ne peut rien envoyer. C'est dit dans la
   fenêtre plutôt que promis à moitié. */

let jetonEnregistre = false;

const notifsPossibles = () => 'Notification' in window;
const etatNotifs = () => notifsPossibles() ? Notification.permission : 'indisponible';

async function demanderNotifs() {
  if (!notifsPossibles()) throw { code: 'notif/indisponible' };
  const reponse = await Notification.requestPermission();
  if (reponse !== 'granted') throw { code: 'notif/' + reponse };

  // Sans compte, prévenir n'a personne à prévenir : on s'arrête à l'autorisation.
  if (Sync.user) {
    try { await Sync.enregistrerJeton(); }
    catch (e) { messageCompte(messageErreur(e?.code || String(e)), 'erreur'); }
  }
  await notifier('Notifications activées', 'Tu seras prévenu des changements sur tes listes partagées.', 'bienvenue');
}

/* iOS n'affiche une notification que si elle passe par le service worker :
   `new Notification()` y est refusé dans une app installée. */
async function notifier(titre, corps, tag) {
  if (etatNotifs() !== 'granted') return false;
  const options = {
    body: corps, lang: 'fr', tag: tag || 'mes-listes',
    icon: 'icons/icon-192.png', badge: 'icons/icon-badge.png'
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
    if (reg) { await reg.showNotification(titre, options); return true; }
    new Notification(titre, options);
    return true;
  } catch {
    return false;
  }
}

/* La feuille dit franchement ce que les notifications couvrent et ce qu'elles
   ne couvrent pas : promettre d'être prévenu app fermée serait un mensonge. */
function notifsModal() {
  const etat = etatNotifs();

  const explications = {
    granted: 'Tu seras prévenu quand quelqu\'un modifie une liste que tu partages, ou t\'invite sur une liste.',
    denied: 'Tu les as refusées. iOS ne redemande jamais : il faut repasser par Réglages → Mes Listes → Notifications.',
    default: 'Tu seras prévenu quand quelqu\'un modifie une liste que tu partages, ou t\'invite sur une liste.',
    indisponible: 'Ce navigateur ne sait pas afficher de notifications. Sur iPhone, l\'app doit être installée sur l\'écran d\'accueil.'
  };

  const html = `<p class="sheet-note left">${esc(explications[etat])}</p>
    <p class="sheet-note left">${Sync.user
      ? 'Elles arrivent même quand l\'app est fermée, tant que tu es connecté.'
      : 'Sans compte, il n\'y a personne pour te prévenir : les notifications concernent les listes partagées.'}</p>`;

  const actions = etat === 'default'
    ? [{ label: 'Activer les notifications', icon: '🔔', run: () => activerNotifs() }]
    : etat === 'granted'
      ? [{ label: 'Envoyer une notification d\'essai', icon: '📨',
           run: () => notifier('Essai', 'Si tu lis ceci, tout fonctionne.', 'essai') }]
      : [];

  openSheet('Notifications', actions, { html });
}

async function activerNotifs() {
  try { await demanderNotifs(); toast('Notifications activées'); }
  catch (e) { toast(messageErreur(e?.code || String(e))); }
}

/* ---------- Stats personnelles ---------- */

function statsModal() {
  const allItems = state.lists.flatMap(l => l.items.filter(i => !i._section));
  const total = allItems.length;
  const coche = allItems.filter(itemDone).length;
  const listes = state.lists.length;
  const streak = state.streak || 0;
  const mois = new Date().toISOString().slice(0, 7);
  const joursActifsMois = (state.joursActifs || []).filter(d => d.startsWith(mois)).length;
  const plusFournie = state.lists.slice().sort((a, b) =>
    b.items.filter(i => !i._section).length - a.items.filter(i => !i._section).length
  )[0];
  const montrerPlus = plusFournie && plusFournie.items.filter(i => !i._section).length > 0;

  openSheet('📊 Mon activité', [], {
    html: `<div class="stats-grid">
      <div class="stat-card"><div class="stat-val">${listes}</div><div class="stat-lbl">liste${listes !== 1 ? 's' : ''}</div></div>
      <div class="stat-card"><div class="stat-val">${total}</div><div class="stat-lbl">article${total !== 1 ? 's' : ''}</div></div>
      <div class="stat-card"><div class="stat-val">${coche}</div><div class="stat-lbl">cochés</div></div>
      <div class="stat-card"><div class="stat-val">${streak} j.</div><div class="stat-lbl">streak</div></div>
      ${joursActifsMois ? `<div class="stat-card"><div class="stat-val">${joursActifsMois}</div><div class="stat-lbl">jours actifs ce mois</div></div>` : ''}
      ${montrerPlus ? `<div class="stat-card ${joursActifsMois ? 'stat-wide' : ''}"><div class="stat-val" style="font-size:18px">${esc(plusFournie.name)}</div><div class="stat-lbl">liste la plus fournie</div></div>` : ''}
    </div>`
  });
}

/* ---------- Nouveautés ---------- */

const NOUVEAUTES = [
  { version: 'v20.5', titre: 'Favoris & rappels', points: [
    'Ajoute n\'importe quel article en favori depuis son ★',
    'Écran Favoris : articles seuls ou groupés en listes nommées',
    'Ajoute un favori dans n\'importe quelle liste en un tap',
    'Suggestions : tes articles fréquents te sont proposés en favoris',
    'Supprime un rappel directement depuis la ligne de l\'article',
    'Favoris synchronisés entre tous tes appareils'
  ] },
  { version: 'v20.4', titre: 'Collaboration temps réel', points: [
    'Vois qui est en train de consulter la même liste que toi',
    'Toast précis : "Jean a ajouté Lait" au lieu d\'un message générique',
    'Indicateur "Modifié par X il y a N min" sur les listes partagées',
    'Palier streak à 7 jours — 🔥 Lancé !'
  ] },
  { version: 'v20.3', titre: 'Recherche & statistiques', points: [
    'Cherche dans tes listes et articles depuis l\'accueil',
    'Résultats en temps réel sur les titres et le contenu',
    'Voir tes stats : listes, articles, streak, jours actifs'
  ] },
  { version: 'v20.2', titre: 'Rappels & deadlines', points: [
    'Ajoute une date de rappel sur n\'importe quel article',
    'Affichage coloré : rouge si dépassé, orange si dans moins de 24h',
    'Vue "À venir" pour voir tous tes rappels d\'un coup',
    'Tri par rappel dans le menu de la liste'
  ] },
  { version: 'v20.1', titre: 'Suggestions IA', points: [
    'Bouton ✨ Suggérer dans chaque liste pour compléter automatiquement',
    'Décris ta liste en texte libre et l\'IA la génère pour toi',
    'Propulsé par Llama 3.1 — open source et gratuit'
  ] },
  { version: 'v19.4', titre: 'Onboarding et analytics', points: [
    'Questionnaire de bienvenue au premier lancement pour personnaliser ton expérience',
    'Panneau analytics admin : visites par jour/semaine/mois/an et préférences des utilisateurs'
  ] },
  { version: 'v19.1', titre: 'Types de liste', points: [
    'Chaque liste a un type : Normale, Courses, Collection, Tâches ou Lieux à visiter',
    'Les collections peuvent être organisées en sections',
    'Le type s\'affiche dans l\'accueil et dans la liste'
  ] },
  { version: 'v18.3', titre: 'Notifications push', points: [
    'Reçois une notif quand un ami t\'envoie un message',
    'Notif quand quelqu\'un te fait une demande d\'ami ou accepte la tienne'
  ] },
  { version: 'v18', titre: 'Amis et messagerie', points: [
    'Ajoute des amis avec un code ou par e-mail',
    'Messagerie directe entre amis',
    'Invitations à rejoindre une liste partagée via le code ami'
  ] },
  { version: 'v17.10', titre: 'Mode Liquid Glass', points: [
    'Nouveau thème inspiré d\'iOS : surfaces en verre dépoli avec flou et transparence',
    'S\'adapte automatiquement au mode clair et sombre du téléphone',
    'Disponible dans Apparence → 🫧 Liquid Glass'
  ] },
  { version: 'v17.9', titre: 'Commentaires et signalements de bugs', points: [
    'Envoie un commentaire ou signale un bug directement depuis l\'app',
    'Choisis d\'apparaître ou de rester anonyme',
    'L\'équipe peut te répondre directement dans « Mes retours »'
  ] },
  { version: 'v17.8.1', titre: 'Streak Duolingo et fond photo', points: [
    'Menu streak avec 24 paliers, animations et confettis',
    'Fond photo personnalisable dans l\'apparence'
  ] },
  { version: 'v17.7.12', titre: 'Trois façons d\'afficher une annonce', points: [
    'Bandeau coulissant en haut, texte seul',
    'Carte complète avec titre, texte et image (comme avant)',
    'Vitrine sous les listes, image en grand'
  ] },
  { version: 'v17.7', titre: 'Comptes vérifiés et annonces', points: [
    'Un badge distingue les comptes administrateurs et de test',
    'Certains pseudos sont désormais réservés, uniques à un compte',
    'L\'équipe peut afficher un message, ou mettre l\'app en pause'
  ] },
  { version: 'v17.6', titre: 'Invitations et code ami', points: [
    'Une invitation à une liste se choisit maintenant : Rejoindre ou Refuser',
    'Un code ami, à donner pour être ajouté sans révéler ton adresse',
    'Quitter une liste partagée sans la supprimer pour les autres',
    'Plus de bouton Supprimer sur une liste dont tu n\'es pas l\'hôte'
  ] },
  { version: 'v17.4', titre: 'Notifications, pseudo et nouveautés', points: [
    'Être prévenu quand quelqu\'un modifie une liste partagée, ou t\'y invite',
    'Les notifications arrivent même quand l\'app est fermée',
    'Choisir un pseudo, affiché aux autres à la place de ton adresse',
    'Cet écran, qui explique ce que chaque version apporte'
  ] },
  { version: 'v16', titre: 'Tests automatisés', points: [
    'Une page de tests qui vérifie l\'application toute seule',
    'Rien de visible dans l\'app : c\'est un filet pour les versions suivantes'
  ] },
  { version: 'v15', titre: 'Connexion refaite', points: [
    'Connexion et inscription dans une même fenêtre, plus claires',
    'Ajouter un mot de passe à un compte créé avec Google',
    'Chaque page ne peut plus s\'exécuter qu\'avec ses propres scripts'
  ] },
  { version: 'v14', titre: 'Partage et synchronisation', points: [
    'Partager une liste avec quelqu\'un, chacun coche de son côté',
    'Voir qui a coché quoi',
    'Thème et couleur qui suivent le compte d\'un appareil à l\'autre'
  ] }
];

const newsBackdrop = $('news-backdrop');

function renderNews(depuis) {
  const aMontrer = depuis
    ? NOUVEAUTES.filter(n => n.version !== depuis).slice(0, 1)
    : NOUVEAUTES;

  $('news-title').textContent = depuis ? `Quoi de neuf en ${VERSION}` : 'Nouveautés';
  $('news-body').innerHTML = (aMontrer.length ? aMontrer : NOUVEAUTES.slice(0, 1)).map(n => `
    <div class="news-version">
      <h3>${esc(n.version)} — ${esc(n.titre)}</h3>
      <ul>${n.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
    </div>`).join('');
}

function newsModal() {
  renderNews(null);
  newsBackdrop.hidden = false;
}

$('news-close').addEventListener('click', () => { newsBackdrop.hidden = true; });
newsBackdrop.addEventListener('click', e => { if (e.target === newsBackdrop) newsBackdrop.hidden = true; });

/* Au premier lancement d'une nouvelle version : on montre ce qui a changé. Un
   tout premier usage n'a rien à annoncer, on note simplement la version. */
function annoncerNouveautes() {
  const vue = state.vuVersion;
  if (vue === VERSION) return;

  state.vuVersion = VERSION;
  sauverLocalement();
  if (!vue) return;                       // première ouverture de l'app

  renderNews(vue);
  newsBackdrop.hidden = false;

  // Une notification n'a de sens que si l'écran est ailleurs : sinon la fenêtre
  // ci-dessus dit déjà tout, et prévenir deux fois est du bruit.
  if (document.hidden) {
    notifier(`Mes Listes ${VERSION}`, 'De nouvelles fonctions sont disponibles. Ouvre l\'app pour les découvrir.', 'maj');
  }
}

/* ---------- Invitations reçues ----------

   On ne rejoint plus une liste sans le vouloir : chaque invitation attend qu'on
   l'accepte ou qu'on la refuse. */

function renderInvitationsRecues() {
  const el = $('invites-recues');
  const invits = Sync.invitations || [];
  el.innerHTML = invits.map(inv => {
    const av = avatarImg(Sync.cacheAvatars.get(inv.invitePar) || null, 36, 'avatar-invite');
    return `
    <li class="invite-recue" data-inv="${esc(inv.id)}">
      ${av}
      <span class="invite-texte"><strong>${esc(inv.deQui)}${badgeMarque(inv.invitePar)}</strong> t'invite sur « ${esc(inv.nomListe)} »</span>
      <span class="invite-actions">
        <button class="modal-btn primary" data-rejoindre>Rejoindre</button>
        <button class="link-btn" data-refuser>Refuser</button>
      </span>
    </li>`;
  }).join('');

  const manquants = invits.map(i => i.invitePar).filter(u => u && !Sync.cacheAvatars.has(u));
  if (manquants.length) {
    Promise.all(manquants.map(u => Sync.avatarDe(u))).then(() => renderInvitationsRecues()).catch(() => {});
  }
}

$('invites-recues').addEventListener('click', async e => {
  const ligne = e.target.closest('[data-inv]');
  if (!ligne) return;
  const inv = (Sync.invitations || []).find(i => i.id === ligne.dataset.inv);
  if (!inv) return;

  try {
    if (e.target.closest('[data-rejoindre]')) {
      await Sync.rejoindre(inv);
      toast(`Tu as rejoint « ${inv.nomListe} »`);
    } else if (e.target.closest('[data-refuser]')) {
      await Sync.refuser(inv);
      toast('Invitation refusée');
    } else return;
    renderInvitationsRecues();
    renderHome();
  } catch (err) {
    toast(messageErreur(err?.code || String(err)));
  }
});

/* ---------- Partage d'une liste ---------- */

const shareBackdrop = $('share-backdrop');
let listePartagee = null;
let arreterInvitations = null;

const estProprietaire = liste => !liste.owner || liste.owner === Sync.user?.uid;

function shareModal(id) {
  const liste = getList(id);
  if (!liste) return;
  // Partager suppose de savoir avec qui : sans compte, il n'y a personne.
  if (!Sync.user) return accountModal();
  listePartagee = id;

  $('share-title').textContent = `Partager « ${liste.name} »`;
  $('share-email').value = '';
  messagePartage('');
  renderPeople([]);
  shareBackdrop.hidden = false;

  // Les invitations en attente arrivent en direct : accepter chez l'un fait
  // disparaître la ligne chez l'autre.
  arreterInvitations?.();
  arreterInvitations = Sync.ecouterInvitations(id, renderPeople);

  // Charger les avatars des membres manquants puis rafraîchir.
  const uidsManquants = (liste.members || []).filter(u => u && !Sync.cacheAvatars.has(u));
  if (uidsManquants.length) {
    Promise.all(uidsManquants.map(u => Sync.avatarDe(u))).then(() => renderPeople()).catch(() => {});
  }
}

function closeShare() {
  shareBackdrop.hidden = true;
  arreterInvitations?.();
  arreterInvitations = null;
  listePartagee = null;
}

function messagePartage(texte, type) {
  const el = $('share-msg');
  el.textContent = texte || '';
  el.hidden = !texte;
  el.classList.toggle('erreur', type === 'erreur');
}

let invitationsEnAttente = [];

/* Appelée sans argument quand seules les listes ont changé : les invitations
   viennent de leur propre écoute, il ne faut pas les effacer au passage. */
function renderPeople(enAttente) {
  if (enAttente) invitationsEnAttente = enAttente;
  const liste = getList(listePartagee);
  if (!liste) return;
  const moi = Sync.user?.uid;
  const proprio = estProprietaire(liste);

  const membres = (liste.members || [moi]).map((uid, i) => {
    const email = (liste.memberEmails || [])[i] || 'compte sans adresse';
    const soi = uid === moi;
    const retirable = proprio && !soi;
    const av = avatarImg(Sync.cacheAvatars.get(uid) || null, 32, 'avatar-membre');
    return `
      <li class="person">
        ${av}
        <span class="person-name">${esc(email)}${soi ? ' (toi)' : ''}</span>
        ${uid === liste.owner ? '<span class="tag">propriétaire</span>' : ''}
        ${retirable ? `<button class="link-btn danger" data-retirer="${esc(uid)}"
                               data-email="${esc(email)}">Retirer</button>` : ''}
      </li>`;
  }).join('');

  const invitations = invitationsEnAttente.map(inv => `
    <li class="person">
      <span class="person-name">${esc(inv.label)}</span>
      <span class="tag">en attente</span>
      ${proprio ? `<button class="link-btn danger" data-annuler="${esc(inv.id)}">Annuler</button>` : ''}
    </li>`).join('');

  const quitter = proprio ? '' : `
    <li class="person">
      <button class="link-btn danger" id="btn-quitter">Quitter cette liste</button>
    </li>`;

  $('share-people').innerHTML = membres + invitations + quitter;
}

$('share-people').addEventListener('click', async e => {
  const retirer = e.target.closest('[data-retirer]');
  const annuler = e.target.closest('[data-annuler]');
  const quitter = e.target.closest('#btn-quitter');
  const id = listePartagee;

  try {
    if (retirer) {
      await Sync.retirerMembre(id, retirer.dataset.retirer, retirer.dataset.email);
      messagePartage('Personne retirée.');
    } else if (annuler) {
      await Sync.annulerInvitation(annuler.dataset.annuler);
      messagePartage('Invitation annulée.');
    } else if (quitter) {
      await Sync.quitter(id);
      closeShare();
      toast('Tu as quitté cette liste');
    }
  } catch (err) {
    messagePartage(messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('share-invite').addEventListener('click', async () => {
  const email = $('share-email').value;
  const liste = getList(listePartagee);
  if (!liste) return;
  messagePartage('Envoi…');
  try {
    await Sync.inviter(listePartagee, email, liste.name);
    $('share-email').value = '';
    messagePartage(`Invitation envoyée à ${email.trim()}.`);
  } catch (err) {
    messagePartage(messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('share-invite-code').addEventListener('click', async () => {
  const code = $('share-code').value;
  const liste = getList(listePartagee);
  if (!liste) return;
  messagePartage('Envoi…');
  try {
    await Sync.inviterParCode(listePartagee, code, liste.name);
    $('share-code').value = '';
    messagePartage('Invitation envoyée. La personne l\'accepte à sa prochaine ouverture.');
  } catch (err) {
    messagePartage(messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('share-email').addEventListener('keydown', e => { if (e.key === 'Enter') $('share-invite').click(); });
$('share-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('share-invite-code').click(); });
$('share-close').addEventListener('click', closeShare);
shareBackdrop.addEventListener('click', e => { if (e.target === shareBackdrop) closeShare(); });

/* ---------- Compte et synchronisation ---------- */

/* Les codes de Firebase sont clairs pour un développeur, opaques pour tout le
   monde : on les traduit en phrases qui disent quoi faire. */
const ERREURS = {
  'auth/invalid-email':          'Cette adresse e-mail ne semble pas valide.',
  'auth/missing-password':       'Saisis un mot de passe.',
  'auth/weak-password':          'Mot de passe trop court : six caractères au minimum.',
  'auth/email-already-in-use':   'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.',
  'auth/invalid-credential':     'Adresse ou mot de passe incorrect.',
  'auth/wrong-password':         'Mot de passe incorrect.',
  'auth/user-not-found':         "Aucun compte avec cette adresse. Utilise « Je n'ai pas encore de compte ».",
  'auth/too-many-requests':      'Trop de tentatives. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Pas de réseau. Tes listes restent utilisables hors connexion.',
  'auth/popup-closed-by-user':   'Connexion annulée.',
  'auth/popup-blocked':          'La fenêtre de connexion a été bloquée par le navigateur.',
  'auth/unauthorized-domain':    "Ce domaine n'est pas autorisé dans la console Firebase.",
  'auth/operation-not-allowed':  "Cette méthode de connexion n'est pas activée dans la console Firebase.",
  'permission-denied':           "Accès refusé : les règles de la base ne sont pas encore publiées.",
  'unavailable':                 'Serveur injoignable. Les modifications partiront au retour du réseau.',
  'deja-membre':                 'Cette liste est déjà à toi.',
  'not-found':                   'Cette liste a été supprimée entre-temps.',
  'lien/adresse-manquante':      'Saisis ton adresse pour terminer la connexion.',
  'auth/invalid-action-code':    'Ce lien a déjà servi ou a expiré. Demandes-en un nouveau.',
  'auth/expired-action-code':    'Ce lien a expiré. Demandes-en un nouveau.',
  'auth/operation-not-supported-in-this-environment':
    "Ce navigateur refuse la connexion Google. Utilise le lien sans mot de passe.",
  'auth/web-storage-unsupported':
    "Ce navigateur bloque le stockage nécessaire à Google. Utilise le lien sans mot de passe.",
  'auth/account-exists-with-different-credential':
    'Un compte existe déjà avec cette adresse, créé autrement. Connecte-toi par mot de passe ou par lien.',
  'auth/internal-error':
    "La connexion Google a échoué. L'e-mail et le mot de passe restent la voie sûre.",
  'auth/requires-recent-login':
    'Par sécurité, reconnecte-toi puis recommence : cette opération demande une connexion récente.',
  'auth/provider-already-linked':
    'Ce compte a déjà un mot de passe. Saisis-en un nouveau pour le remplacer.',
  'auth/credential-already-in-use':
    'Ces identifiants appartiennent déjà à un autre compte.',
  'auth/no-current-user':
    'Connecte-toi d\'abord.',
  'notif/indisponible':
    "Ce navigateur ne sait pas afficher de notifications. Sur iPhone, installe l'app sur l'écran d'accueil.",
  'notif/denied':
    'Notifications refusées. iOS ne redemande pas : passe par Réglages → Mes Listes → Notifications.',
  'notif/default':
    'Tu n\'as pas répondu à la demande. Réessaie quand tu veux.',
  'notif/sans-jeton':
    "Cet appareil n'a pas pu être enregistré pour les notifications. Réessaie plus tard.",
  'code/invalide':
    'Un code ami est un nombre à huit chiffres, comme 1234-5678.',
  'code/introuvable':
    "Aucun compte ne porte ce code. Vérifie les chiffres.",
  'ami/soi-meme':
    "C'est ton propre code — impossible de s'ajouter soi-même.",
  'ami/deja-ajoute':
    'Cet ami est déjà dans ta liste.',
  'ami/demande-deja-envoyee':
    'Tu as déjà envoyé une demande à cette personne.',
  'pseudo/reserve':
    'Ce pseudo est réservé à un autre compte. Choisis-en un autre.',
  'pseudo/vide':
    'Saisis le pseudo à réserver.',
  'cible/vide':
    'Indique le compte visé, par son code ami ou son UID.',
  'admin/refuse':
    "Cette action est réservée aux comptes administrateurs.",
  'image/illisible':
    "Ce fichier n'a pas pu être lu comme une image.",
  'image/trop-grande':
    "Cette image reste trop lourde même réduite. Choisis-en une plus légère."
};
const messageErreur = code => ERREURS[code] || `Erreur inattendue (${code}).`;

const compteBackdrop = $('account-backdrop');

let authMurActif = false;
let precedentUser = !!localStorage.getItem('meslistes.compte');

function afficherMurAuth() {
  authMurActif = true;
  $('account-modal').setAttribute('data-force', '');
  accountModal();
}

function libererMurAuth() {
  authMurActif = false;
  $('account-modal').removeAttribute('data-force');
}

/* Le message s'affiche dans le volet visible : le glisser sous un formulaire
   caché reviendrait à ne rien dire. */
function messageCompte(texte, type) {
  // Effacer vide les deux volets : un message resté dans celui qu'on vient de
  // quitter réapparaîtrait à la prochaine bascule.
  ['account-msg', 'account-msg-in'].forEach(id => {
    const el = $(id);
    const concerne = texte && id === (Sync.user ? 'account-msg-in' : 'account-msg');
    el.textContent = concerne ? texte : '';
    el.hidden = !concerne;
    el.classList.toggle('erreur', !!concerne && type === 'erreur');
  });
}

/* ---------- Les deux modes du formulaire ---------- */

let modeAuth = 'connexion';   // connexion | inscription

const TEXTES_AUTH = {
  connexion: {
    titre: 'Se connecter',
    intro: 'Tes listes te suivront sur tous tes appareils, et survivront à la perte de celui-ci.',
    valider: 'Se connecter',
    bascule: 'Première fois ici ?',
    lienBascule: 'Inscris-toi'
  },
  inscription: {
    titre: 'Créer un compte',
    intro: 'Une adresse et un mot de passe suffisent. Aucune vérification, aucun courriel de bienvenue.',
    valider: 'Créer mon compte',
    bascule: 'Tu as déjà un compte ?',
    lienBascule: 'Connecte-toi'
  },
  lien: {
    titre: 'Recevoir un lien',
    intro: "Saisis ton adresse : tu recevras un lien à ouvrir, et te voilà connecté. Aucun mot de passe à retenir.",
    valider: 'Envoyer le lien',
    bascule: 'Tu préfères un mot de passe ?',
    lienBascule: 'Revenir à la connexion'
  }
};

function renderAuthMode() {
  const t = TEXTES_AUTH[modeAuth];
  $('auth-title').textContent = t.titre;
  $('auth-intro').textContent = t.intro;
  $('btn-submit').textContent = t.valider;
  $('switch-text').textContent = t.bascule;
  $('btn-switch').textContent = t.lienBascule;

  // Le mode « lien » se passe de mot de passe : montrer le champ inviterait à
  // en taper un qui ne servirait à rien. Les autres portes d'entrée aussi
  // s'effacent — on est venu chercher un lien.
  const parLien = modeAuth === 'lien';
  $('account-pass').parentElement.hidden = parLien;
  $('btn-google').hidden = parLien;
  $('btn-lien').hidden = parLien;
  $('separateur-auth').hidden = parLien;

  // Réinitialiser un mot de passe qu'on n'a pas encore choisi n'a pas de sens.
  $('btn-reset').hidden = modeAuth !== 'connexion';
  $('account-pass').setAttribute('autocomplete',
    modeAuth === 'inscription' ? 'new-password' : 'current-password');
  $('account-pass').placeholder =
    modeAuth === 'inscription' ? 'Mot de passe — six caractères minimum' : 'Mot de passe';

  majBoutonAuth();
}

/* Le bouton reste gris tant que la saisie ne permet rien : il annonce ce qu'il
   ferait au lieu d'échouer une fois pressé. */
function majBoutonAuth() {
  const { email, mdp } = identifiants();
  const adresseOk = email.includes('@');
  const motDePasseOk = modeAuth === 'lien' ? true
                     : modeAuth === 'inscription' ? mdp.length >= 6
                     : mdp.length > 0;
  $('btn-submit').disabled = !(adresseOk && motDePasseOk);
}

function changerMode(mode) {
  modeAuth = mode;
  messageCompte('');
  renderAuthMode();
  $('account-email').focus();
}

// Depuis le mode « lien », la bascule ramène toujours à la connexion.
$('btn-switch').addEventListener('click', () =>
  changerMode(modeAuth === 'connexion' ? 'inscription' : 'connexion'));

['account-email', 'account-pass'].forEach(id =>
  $(id).addEventListener('input', majBoutonAuth));

$('btn-eye').addEventListener('click', () => {
  const champ = $('account-pass');
  const cache = champ.type === 'password';
  champ.type = cache ? 'text' : 'password';
  $('btn-eye').classList.toggle('actif', cache);
  $('btn-eye').setAttribute('aria-label', cache ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
});

function renderAccount() {
  const connecte = !!Sync.user;
  $('account-out').hidden = connecte;
  $('account-in').hidden = !connecte;
  if (connecte) {
    // Avatar
    const avEl = $('account-avatar');
    if (avEl) {
      avEl.innerHTML = avatarImg(Sync.monAvatar, 80) +
        `<button type="button" class="avatar-edit-btn" id="btn-edit-avatar" aria-label="Modifier l'avatar">✏️</button>`;
    }

    $('account-who').textContent =
      `Connecté en tant que ${Sync.user.email || 'compte Google'}. Tes listes se synchronisent.`;
    $('account-pseudo').value = state.pseudo || '';
    $('account-code').textContent = Sync.codeAffiche() || 'attribution…';

    // Un compte marqué le voit ici — admin (doré) ou compte de test (noir).
    const type = Sync.marque();
    const marque = $('account-marque');
    marque.hidden = !type;
    if (type) marque.innerHTML =
      `Ce compte est un compte ${type} ${badgeMarque(Sync.user.uid)}`;
  }
  if (Sync.erreur) {
    const ou = { listes: 'les listes', reglages: "l'apparence",
                 invitations: 'les invitations', connexion: 'la connexion' }[Sync.origine];
    messageCompte(messageErreur(Sync.erreur) + (ou ? ` (${ou})` : ''), 'erreur');
  }
}

function renderDemandes() {
  const blocR = $('bloc-demandes-recues');
  const blocE = $('bloc-demandes-envoyees');
  if (!blocR) return;
  const recues   = Sync.demandesRecues  || [];
  const envoyees = Sync.demandesEnvoyees || [];
  blocR.hidden = recues.length === 0;
  blocE.hidden = envoyees.length === 0;
  $('demandes-recues-list').innerHTML = recues.map(d => {
    const av = avatarImg(Sync.cacheAvatars.get(d.de) || null, 32, 'avatar-membre');
    const nom = String(d.codeDe || '').replace(/(\d{4})(\d{4})/, '$1-$2') || d.de.slice(0, 8);
    return `<li class="person">
      ${av}
      <span class="person-name">${esc(nom)}</span>
      <button class="link-btn" data-accepter="${esc(d.id)}">Accepter</button>
      <button class="link-btn danger" data-refuser="${esc(d.id)}">Refuser</button>
    </li>`;
  }).join('');
  $('demandes-envoyees-list').innerHTML = envoyees.map(d => {
    const av = avatarImg(Sync.cacheAvatars.get(d.vers) || null, 32, 'avatar-membre');
    const nom = String(d.codeCible || '').replace(/(\d{4})(\d{4})/, '$1-$2') || d.vers.slice(0, 8);
    return `<li class="person">
      ${av}
      <span class="person-name">${esc(nom)}</span>
      <button class="link-btn danger" data-annuler="${esc(d.id)}">Annuler</button>
    </li>`;
  }).join('');
}

function renderAmis() {
  const el = $('amis-list');
  if (!el) return;
  if (!Sync.amis.length) {
    el.innerHTML = `<li class="person"><span class="person-name" style="color:var(--text-dim)">Aucun ami pour l'instant.</span></li>`;
    return;
  }
  el.innerHTML = Sync.amis.map(({ uid, code }) => {
    const av = Sync.cacheAvatars.get(uid) || null;
    const codeAffiche = String(code).replace(/(\d{4})(\d{4})/, '$1-$2');
    return `<li class="person">
      ${avatarImg(av, 32, 'avatar-membre')}
      <span class="person-name">${esc(codeAffiche)}</span>
      <button class="link-btn danger" data-retirer-ami="${esc(uid)}">Retirer</button>
    </li>`;
  }).join('');
}

/* Prévenir avant l'échec plutôt que l'expliquer après : c'est exactement la
   configuration où la connexion Google casse. */
const iOS = /iP(hone|ad|od)/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installee = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;

function accountModal() {
  $('note-ios').hidden = !(iOS && installee());
  // Effacer d'abord, afficher ensuite : dans l'autre sens on effaçait le
  // message d'erreur que `renderAccount` venait de poser, et l'app restait
  // muette sur la panne qu'elle était censée expliquer.
  messageCompte('');
  renderAccount();
  modeAuth = 'connexion';    // rouvrir la fenêtre repart de l'écran d'accueil
  renderAuthMode();
  compteBackdrop.hidden = false;
  if (Sync.user) {
    renderAmis();
    renderDemandes();
    Sync.chargerAmis().then(() => {
      const manquants = Sync.amis.filter(a => !Sync.cacheAvatars.has(a.uid)).map(a => a.uid);
      return manquants.length ? Promise.all(manquants.map(u => Sync.avatarDe(u))) : Promise.resolve();
    }).then(() => renderAmis()).catch(() => renderAmis());
  }
}

function closeAccount() { if (authMurActif) return; compteBackdrop.hidden = true; }

$('account-close').addEventListener('click', closeAccount);
compteBackdrop.addEventListener('click', e => { if (e.target === compteBackdrop) closeAccount(); });

async function tenter(attente, action, succes) {
  messageCompte(attente);
  try {
    await action();
    Sync.erreur = null;
    messageCompte(succes || '');
  } catch (e) {
    messageCompte(messageErreur(e?.code || String(e)), 'erreur');
  }
}

/* Toute connexion passe par `init` : c'est lui qui met en place l'écoute de
   l'état du compte, sans laquelle rien ne se synchroniserait ensuite. */
const identifiants = () => ({
  email: $('account-email').value.trim(),
  mdp: $('account-pass').value
});

$('btn-google').addEventListener('click', () =>
  tenter('Connexion…', async () => { await Sync.init(); await Sync.signInGoogle(); }));

$('btn-submit').addEventListener('click', () => {
  const { email, mdp } = identifiants();
  if (modeAuth === 'lien') return envoyerLien();
  if (modeAuth === 'inscription') {
    tenter('Création du compte…', async () => { await Sync.init(); await Sync.signUpEmail(email, mdp); });
  } else {
    tenter('Connexion…', async () => { await Sync.init(); await Sync.signInEmail(email, mdp); });
  }
});

/* Le bouton n'envoie rien : il ouvre l'étape où l'on saisit son adresse. Exiger
   qu'elle soit déjà remplie revenait à refuser d'agir sans le dire. */
$('btn-lien').addEventListener('click', () => changerMode('lien'));

function envoyerLien() {
  const { email } = identifiants();
  // Sur iPhone, un lien ouvert depuis un mail atterrit dans Safari, jamais dans
  // l'app installée : le dire avant, plutôt que de laisser croire à une panne.
  const avertissement = iOS && installee()
    ? " Attention : sur iPhone le lien s'ouvrira dans Safari, pas ici — tu seras connecté dans Safari seulement."
    : '';
  tenter('Envoi…', async () => { await Sync.init(); await Sync.envoyerLien(email); },
    `Lien envoyé à ${email}. Regarde aussi tes indésirables.${avertissement}`);
}

$('btn-reset').addEventListener('click', () => {
  const { email } = identifiants();
  if (!email) return messageCompte('Saisis ton adresse pour recevoir le lien.', 'erreur');
  tenter('Envoi…', () => Sync.resetEmail(email), `Lien envoyé à ${email}. Regarde ta boîte mail.`);
});

$('btn-copier-code').addEventListener('click', async () => {
  const code = Sync.codeAffiche();
  if (!code) return;
  try { await navigator.clipboard.writeText(code); $('btn-copier-code').textContent = 'Copié ✓'; }
  catch { $('btn-copier-code').textContent = code; }   // presse-papier refusé : au moins on le lit
  setTimeout(() => $('btn-copier-code').textContent = 'Copier', 2500);
});

$('btn-pseudo').addEventListener('click', () => {
  const pseudo = $('account-pseudo').value.trim().slice(0, 24);
  tenter('Enregistrement…', async () => {
    // Un pseudo réservé par un autre compte est refusé. Les pseudos non
    // réservés restent libres — la vérification ne bloque que les uniques.
    if (pseudo && await Sync.pseudoDisponible(pseudo) === 'pris') throw { code: 'pseudo/reserve' };
    // Un admin protège automatiquement son pseudo : personne d'autre ne pourra
    // le prendre. Change-t-il de pseudo ? L'ancien est libéré.
    if (Sync.estAdmin()) await Sync.reserverMonPseudo(pseudo);
    state.pseudo = pseudo;
    save();
    if (currentListId) renderItems();
  }, pseudo ? `Les autres te verront sous « ${pseudo} ».`
            : 'Pseudo retiré : c\'est le début de ton adresse qui s\'affichera.');
});

$('account-pseudo').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-pseudo').click(); });

$('btn-setpass').addEventListener('click', () => {
  const mdp = $('account-newpass').value;
  if (mdp.length < 6) return messageCompte("Six caractères au minimum.", 'erreur');
  const adresse = Sync.user?.email || 'ton adresse';
  tenter('Enregistrement…', async () => {
    await Sync.definirMotDePasse(mdp);
    $('account-newpass').value = '';
  }, `C'est fait. Tu peux maintenant te connecter avec ${adresse} et ce mot de passe, depuis n'importe quel appareil — y compris l'app installée.`);
});

$('account-newpass').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-setpass').click(); });

/* ---------- Amis ---------- */

$('btn-ajouter-ami').addEventListener('click', async () => {
  const code = $('ami-code').value.trim();
  const btn = $('btn-ajouter-ami');
  btn.disabled = true;
  messageCompte('Envoi…');
  try {
    await Sync.envoyerDemandeAmi(code);
    $('ami-code').value = '';
    messageCompte('Demande envoyée !');
    setTimeout(() => messageCompte(''), 2500);
  } catch (e) {
    messageCompte(messageErreur(e?.code || String(e)), 'erreur');
  } finally {
    btn.disabled = false;
  }
});

$('ami-code').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-ajouter-ami').click(); });

$('amis-list').addEventListener('click', async e => {
  const btn = e.target.closest('[data-retirer-ami]');
  if (!btn) return;
  const uid = btn.dataset.retirerAmi;
  btn.disabled = true;
  try {
    await Sync.retirerAmi(uid);
    renderAmis();
  } catch (err) {
    messageCompte(messageErreur(err?.code || String(err)), 'erreur');
    btn.disabled = false;
  }
});

$('demandes-recues-list').addEventListener('click', async e => {
  const btnA = e.target.closest('[data-accepter]');
  if (btnA) {
    const demande = Sync.demandesRecues.find(d => d.id === btnA.dataset.accepter);
    if (!demande) return;
    btnA.disabled = true;
    try {
      await Sync.accepterDemande(demande);
      renderAmis();
    } catch (err) {
      messageCompte(messageErreur(err?.code || String(err)), 'erreur');
      btnA.disabled = false;
    }
    return;
  }
  const btnR = e.target.closest('[data-refuser]');
  if (btnR) {
    btnR.disabled = true;
    try {
      await Sync.refuserDemande(btnR.dataset.refuser);
    } catch (err) {
      messageCompte(messageErreur(err?.code || String(err)), 'erreur');
      btnR.disabled = false;
    }
  }
});

$('demandes-envoyees-list').addEventListener('click', async e => {
  const btn = e.target.closest('[data-annuler]');
  if (!btn) return;
  btn.disabled = true;
  try {
    await Sync.refuserDemande(btn.dataset.annuler);
  } catch (err) {
    messageCompte(messageErreur(err?.code || String(err)), 'erreur');
    btn.disabled = false;
  }
});

$('btn-signout').addEventListener('click', () =>
  tenter('Déconnexion…', () => Sync.signOut()));

$('account-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !$('btn-submit').disabled) $('btn-submit').click();
});

/* ---------- Apparence ---------- */

const MODES = [['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre'], ['photo', '🖼️ Photo']];
const ACCENT_DEFAUT = '#007aff';
const nuitPreferee = matchMedia('(prefers-color-scheme: dark)');

/* L'apparence est réservée aux comptes. Avant que Firebase ait répondu, on se
   fie à la trace de la dernière session — comme le script du <head> — sinon le
   thème choisi clignoterait à chaque ouverture. */
const themePersonnalisable = () =>
  !!Sync.user || !!localStorage.getItem('meslistes.compte');

function applyTheme() {
  const perso = themePersonnalisable();
  const choix = (perso && state.theme) || 'auto';
  const accent = perso ? state.accent : null;
  const sombre = choix === 'dark' || (choix === 'auto' && nuitPreferee.matches);
  const bg = choix === 'photo' ? localStorage.getItem('meslistes.themebg') : null;

  if (bg) {
    document.body.style.backgroundImage = `url("${bg}")`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.documentElement.classList.add('theme-photo');
    document.documentElement.dataset.theme = 'light';
  } else {
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.documentElement.classList.remove('theme-photo');
    document.documentElement.dataset.theme = sombre ? 'dark' : 'light';
  }

  document.documentElement.classList.add('theme-glass');

  if (accent) document.documentElement.style.setProperty('--accent', accent);
  else document.documentElement.style.removeProperty('--accent');
  $('meta-theme').content = bg ? '#f2f2f7' : (sombre ? '#000000' : '#f2f2f7');
}

// En mode automatique, l'app suit le basculement jour/nuit du téléphone sans
// qu'on ait à la rouvrir.
nuitPreferee.addEventListener('change', () => {
  if ((state.theme || 'auto') === 'auto') applyTheme();
});

async function compresserPhoto(fichier) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(fichier);
    img.onload = () => {
      const max = 1280;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > max || h > max) {
        if (w > h) { h = Math.round(h * max / w); w = max; }
        else { w = Math.round(w * max / h); h = max; }
      }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.78));
    };
    img.src = url;
  });
}

function themePicker() {
  if (!themePersonnalisable()) {
    return openSheet('Apparence', [
      { label: 'Se connecter', icon: '☁️', run: accountModal }
    ], {
      html: `<p class="sheet-note left">Choisir le thème et la couleur des boutons
             demande un compte. Sans compte, l'app suit le réglage clair ou sombre
             du téléphone.</p>`
    });
  }

  const curTheme = state.theme || 'auto';
  const curBg = localStorage.getItem('meslistes.themebg');
  const curAccent = state.accent || '#007aff';

  const html = `
    <div class="seg">
      ${MODES.map(([valeur, libelle]) => `
        <button class="seg-btn" data-mode="${valeur}"
                aria-checked="${curTheme === valeur}">${libelle}</button>`).join('')}
    </div>
    <p class="sheet-note">Couleur des boutons</p>
    <div class="accent-wheel-wrap">
      <canvas id="color-wheel" width="220" height="220" class="color-wheel-canvas"></canvas>
      <div class="accent-wheel-side">
        <div class="accent-preview" id="accent-preview" style="background:${curAccent}"></div>
        ${state.accent ? `<button id="accent-reset" class="link-btn accent-reset-btn">↺ Défaut</button>` : ''}
      </div>
    </div>
    ${curTheme === 'photo' ? `
      <p class="sheet-note">Fond d'écran</p>
      <div class="photo-bg-wrap">
        ${curBg ? `<div class="photo-bg-thumb" style="background-image:url(${curBg})"></div>` : ''}
        <button class="sheet-action-btn" id="choisir-fond">${curBg ? '✏️ Changer la photo' : '📷 Choisir une photo'}</button>
        ${curBg ? `<button class="sheet-action-btn" id="supprimer-fond" style="color:#ff3b30">🗑️ Supprimer le fond</button>` : ''}
      </div>
    ` : ''}
    `;

  openSheet('Apparence', [], {
    html,
    onClick: e => {
      const mode = e.target.closest('[data-mode]');
      const accent = e.target.closest('[data-accent]');

      if (e.target.id === 'accent-reset') {
        state.accent = null;
        save();
        applyTheme();
        themePicker();
        return;
      }
      if (e.target.id === 'choisir-fond') {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = 'image/*';
        inp.onchange = async () => {
          if (!inp.files[0]) return;
          const dataUrl = await compresserPhoto(inp.files[0]);
          localStorage.setItem('meslistes.themebg', dataUrl);
          state.theme = 'photo';
          save(); applyTheme(); themePicker();
        };
        inp.click();
        return;
      }
      if (e.target.id === 'supprimer-fond') {
        localStorage.removeItem('meslistes.themebg');
        if (state.theme === 'photo') state.theme = 'auto';
        save(); applyTheme(); themePicker();
        return;
      }
      if (!mode && !accent) return;
      if (mode) { state.theme = mode.dataset.mode; save(); applyTheme(); themePicker(); return; }
      if (accent) { state.accent = accent.dataset.accent; save(); applyTheme(); themePicker(); return; }
    }
  });

  requestAnimationFrame(() => {
    const canvas = document.getElementById('color-wheel');
    if (!canvas) return;
    _drawColorWheel(canvas);
    _addWheelListeners(canvas, hex => {
      state.accent = hex;
      save();
      applyTheme();
      const prev = document.getElementById('accent-preview');
      if (prev) prev.style.background = hex;
    });
    const resetBtn = document.getElementById('accent-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      state.accent = null; save(); applyTheme(); themePicker();
    });
  });
}

function markBackup() {
  state.lastBackup = Date.now();
  save();
  renderBackupNotice();
}

async function exportData() {
  const nom = `mes-listes-${new Date().toISOString().slice(0, 10)}.json`;
  const contenu = JSON.stringify(state, null, 2);

  // Sur iPhone, la feuille de partage propose « Enregistrer dans Fichiers », donc
  // iCloud Drive : c'est le seul chemin pour que les listes quittent l'appareil.
  // Ailleurs (ordinateur), on retombe sur un téléchargement classique.
  const fichier = new File([contenu], nom, { type: 'application/json' });
  if (navigator.canShare?.({ files: [fichier] })) {
    try {
      await navigator.share({ files: [fichier], title: 'Mes Listes' });
      markBackup();
      toast('Sauvegarde enregistrée');
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;   // partage annulé : rien n'a été sauvegardé
      // tout autre échec : on tente quand même le téléchargement
    }
  }

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
  a.download = nom;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  markBackup();
}

/* Invitation à créer un compte : seulement s'il y a des listes à protéger, et
   jamais plus d'une fois par mois si elle a été écartée. Renvoie son état pour
   que le rappel de sauvegarde s'efface derrière elle. */
function renderSyncInvite() {
  const montrer = !Sync.user
    && state.lists.length > 0
    && Date.now() - (state.syncInviteSnooze || 0) > 30 * JOUR;
  $('sync-invite').hidden = !montrer;
  return montrer;
}

$('sync-invite-go').addEventListener('click', accountModal);
$('sync-invite-close').addEventListener('click', () => {
  state.syncInviteSnooze = Date.now();
  save();
  renderHome();
});

/* Bandeau de rappel : discret, et seulement quand il y a quelque chose à perdre.
   Inutile quand les listes sont déjà synchronisées, ou quand l'invitation
   ci-dessus occupe déjà la place. */
function renderBackupNotice(cache) {
  const el = $('backup-notice');
  const derniere = state.lastBackup || 0;
  const montrer = !cache
    && !Sync.user
    && state.lists.length > 0
    && Date.now() - derniere > 14 * JOUR
    && Date.now() - (state.noticeSnooze || 0) > 7 * JOUR;

  el.hidden = !montrer;
  if (!montrer) return;
  $('backup-notice-text').textContent = derniere
    ? `Dernière sauvegarde le ${dateCourte(derniere)}.`
    : 'Tes listes ne sont enregistrées que sur cet appareil.';
}

$('backup-notice-go').addEventListener('click', exportData);
$('backup-notice-close').addEventListener('click', () => {
  state.noticeSnooze = Date.now();
  save();
  renderBackupNotice();
});

// L'app vide, c'est le cas typique d'une réinstallation : le sélecteur iOS ouvre
// Fichiers et iCloud Drive. Aucun navigateur n'autorise à les lire sans ce geste.
$('btn-restore').addEventListener('click', importData);

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.lists)) throw new Error('format');
        snapshot();
        state = migrate(data);
        save();
        applyTheme();
        goHome();
        toast('Sauvegarde importée');
      } catch {
        alert('Fichier invalide.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* ============================================================
   Administration — annonce globale et pseudos réservés
   ============================================================ */

const adminBackdrop = $('admin-backdrop');
let annonceImage = '';          // image de l'annonce en cours d'édition (data URL)

/* Une image de compte de service dans un document Firestore : il faut la réduire.
   On la redessine plus petite et on la ré-encode en JPEG, en baissant la qualité
   jusqu'à tenir sous la limite d'un document (1 Mo). Rare et réservé aux admins :
   la simplicité prime sur la finesse. */
function redimensionnerImage(file, maxDim, qualite) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * echelle), h = Math.round(img.height * echelle);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL('image/jpeg', qualite));
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject({ code: 'image/illisible' }); };
    img.src = URL.createObjectURL(file);
  });
}

async function preparerImage(file) {
  for (let qualite = 0.7; qualite >= 0.3; qualite -= 0.2) {
    const url = await redimensionnerImage(file, 1280, qualite);
    if (url.length <= 900000) return url;   // ~900 Ko encodés, sous la limite Firestore
  }
  throw { code: 'image/trop-grande' };
}

/* ---------- Affichage des annonces ----------

   Un admin n'est jamais bloqué : sinon une pause l'empêcherait d'aller la lever.
   Plusieurs annonces peuvent coexister : tous les bandeaux défilent dans le même
   ticker, la première vitrine pose son image, la première carte s'affiche en
   bandeau statique (ou bloque l'app si elle est marquée bloquante). */
function renderAnnonces(annonces) {
  annonces = Array.isArray(annonces) ? annonces : [];
  const admin   = Sync.estAdmin();
  const actives = annonces.filter(a => a.actif && (a.titre || a.message || a.image));

  // 1. OVERLAY BLOQUANT — première carte bloquante, jamais pour l'admin.
  const bloquante = !admin && actives.find(a => a.mode === 'carte' && a.bloquant);
  const overlay = $('annonce-overlay');
  overlay.hidden = !bloquante;
  if (bloquante) {
    $('annonce-o-titre').textContent = bloquante.titre || '';
    $('annonce-o-titre').hidden = !bloquante.titre;
    $('annonce-o-message').textContent = bloquante.message || '';
    $('annonce-o-message').hidden = !bloquante.message;
    poserImage($('annonce-o-image'), bloquante.image);
    signer($('annonce-o-signe'), bloquante);
  }

  // 2. VITRINE — première annonce vitrine avec image.
  const vitrines     = actives.filter(a => a.mode === 'vitrine' && a.image);
  const vitrinePremiere = vitrines[0];
  const vitrine      = $('annonce-vitrine');
  vitrine.hidden     = !vitrinePremiere;
  if (vitrinePremiere) {
    poserImage($('annonce-v-image'), vitrinePremiere.image);
    signer($('annonce-v-signe'), vitrinePremiere);
  }

  // 3. TICKER — toutes les annonces bandeaux concatenées.
  const bandeaux     = actives.filter(a => a.mode === 'bandeau' && (a.titre || a.message));
  const montrerTicker = bandeaux.length > 0 && !bloquante;

  // 4. CARTE — première carte non bloquante (si pas de ticker actif).
  const cartes       = actives.filter(a => a.mode === 'carte' && (!a.bloquant || admin)
                                       && (a.titre || a.message || a.image));
  const cartePremiere = montrerTicker ? null : cartes[0];
  const montrerCarte  = !!cartePremiere && !bloquante;

  const banner = $('annonce-banner');
  banner.classList.toggle('annonce-banner--fixe', montrerTicker);
  banner.hidden = !(montrerTicker || montrerCarte);


  if (montrerTicker) {
    banner.style.top = '';  // CSS gère la position
    const texte = bandeaux
      .map(a => [a.titre, a.message].filter(Boolean).join(' — '))
      .join('     ◆     ');
    const tickerTexte = $('annonce-ticker-texte');
    tickerTexte.textContent = texte;
    const duree = Math.max(8, Math.min(90, texte.length * 0.12));
    tickerTexte.style.setProperty('--ticker-duree', duree + 's');
    $('annonce-ticker').hidden = false;
    $('annonce-banner-corps').hidden = true;
    $('annonce-b-titre').hidden = true;
    $('annonce-b-message').hidden = true;
    poserImage($('annonce-b-image'), '');
    $('annonce-b-gerer').hidden = !admin;
    $('annonce-b-etat').textContent = '';
  } else if (montrerCarte) {
    $('annonce-ticker').hidden = true;
    $('annonce-banner-corps').hidden = false;
    $('annonce-b-titre').textContent = cartePremiere.titre || '';
    $('annonce-b-titre').hidden = !cartePremiere.titre;
    $('annonce-b-message').textContent = cartePremiere.message || '';
    $('annonce-b-message').hidden = !cartePremiere.message;
    poserImage($('annonce-b-image'), cartePremiere.image);
    signer($('annonce-b-signe'), cartePremiere);
    $('annonce-b-gerer').hidden = !admin;
    $('annonce-b-etat').textContent = admin && cartes.some(a => a.bloquant)
      ? ' · bloquante pour les autres' : '';
  }

  function poserImage(el, url) {
    el.hidden = !url;
    if (url) el.src = url;
  }
  function signer(el, a) {
    if (!a.parNom) { el.innerHTML = ''; return; }
    const av = a.parUid ? avatarImg(Sync.cacheAvatars.get(a.parUid) || null, 24, 'avatar-signe') : '';
    el.innerHTML = `${av}— ${esc(a.parNom)}${badgeMarque(a.parUid)}`;
  }

  // Rafraîchir la liste dans le panneau admin si celui-ci est ouvert.
  if (!adminBackdrop.hidden) renderListeAnnonces();
}
Sync.onAnnonces = (annonces) => {
  renderAnnonces(annonces);
  const uids = (annonces || []).map(a => a.parUid).filter(u => u && !Sync.cacheAvatars.has(u));
  if (uids.length) {
    Promise.all(uids.map(u => Sync.avatarDe(u)))
      .then(() => renderAnnonces(Sync.annonces))
      .catch(() => {});
  }
};

$('annonce-mode').addEventListener('change', majModeAdmin);
$('annonce-b-gerer').addEventListener('click', adminModal);

/* ---------- Panneau d'administration ---------- */

const NOTES_MODE = {
  bandeau: `Bandeau coulissant en haut. Seuls le titre et le texte défilent — l'image est ignorée.`,
  carte:   `Carte avec titre, texte et image. Peut bloquer l'app si la case ci-dessous est cochée.`,
  vitrine: `Image en grand sous les listes. Le titre et le texte sont ignorés.`,
};

let annonceIdEnEdition = null;  // null = nouvelle annonce, string = id existante

function majModeAdmin() {
  const mode = $('annonce-mode').value;
  $('annonce-mode-note').textContent = NOTES_MODE[mode] || '';
  $('annonce-bloquant').closest('label').hidden = mode !== 'carte';
  if (mode !== 'carte') $('annonce-bloquant').checked = false;
}

/* --- Liste des annonces dans le panneau --- */

const LIBELLE_MODE = { bandeau: 'bandeau', carte: 'carte', vitrine: 'vitrine' };

function renderListeAnnonces() {
  const container = $('annonces-liste');
  const annonces  = Sync.annonces || [];
  if (!annonces.length) {
    container.innerHTML = '<p class="sheet-note left">Aucune annonce pour l\'instant.</p>';
    return;
  }
  container.innerHTML = annonces.map(a => `
    <div class="annonce-item">
      <span class="annonce-item-badge annonce-item-badge--${a.mode || 'carte'}">${a.mode || 'carte'}</span>
      <span class="annonce-item-titre">${esc((a.titre || a.message || '—').slice(0, 36))}</span>
      <span class="annonce-item-etat${a.actif ? ' annonce-item-etat--active' : ''}">${a.actif ? 'active' : 'inact.'}</span>
      <button type="button" class="link-btn" data-action="edit" data-id="${a.id}">Modifier</button>
      <button type="button" class="link-btn" data-action="del"  data-id="${a.id}">Supprimer</button>
    </div>`).join('');
}

$('annonces-liste').addEventListener('click', async e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id     = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === 'edit') {
    const a = (Sync.annonces || []).find(x => x.id === id);
    if (a) ouvrirFormulaireAnnonce(a);
  } else if (action === 'del') {
    if (!confirm('Supprimer cette annonce ?')) return;
    try { await Sync.supprimerAnnonce(id); }
    catch (err) { alert(messageErreur(err?.code || String(err))); }
  }
});

function ouvrirFormulaireAnnonce(a) {
  a = a || {};
  annonceIdEnEdition        = a.id || null;
  $('annonce-actif').checked  = !!a.actif;
  $('annonce-mode').value     = a.mode || 'carte';
  $('annonce-bloquant').checked = !!a.bloquant;
  $('annonce-titre').value    = a.titre || '';
  $('annonce-message').value  = a.message || '';
  annonceImage                = a.image || '';
  majApercuImage();
  majModeAdmin();
  messageAdmin('annonce-msg', '');
  $('annonce-form').hidden    = false;
  $('annonce-form-titre').textContent = annonceIdEnEdition ? 'Modifier l\'annonce' : 'Nouvelle annonce';
}

function fermerFormulaireAnnonce() {
  $('annonce-form').hidden = true;
  annonceIdEnEdition = null;
}

$('annonce-nouvelle').addEventListener('click', () => ouvrirFormulaireAnnonce(null));
$('annonce-form-annuler').addEventListener('click', fermerFormulaireAnnonce);

/* --- Ouverture du modal admin --- */

function adminModal() {
  renderListeAnnonces();
  fermerFormulaireAnnonce();
  messageAdmin('admin-pseudo-msg', '');
  $('admin-pseudo').value = '';
  $('admin-cible').value  = '';
  adminBackdrop.hidden = false;
  if (arreterRetours) { arreterRetours(); arreterRetours = null; }
  arreterRetours = Sync.ecouterRetours(renderAdminRetours);
  afficherAnalytics();
  if (_analyticsTimer) clearInterval(_analyticsTimer);
  _analyticsTimer = setInterval(afficherAnalytics, 60_000);
}

function closeAdmin() {
  adminBackdrop.hidden = true;
  if (arreterRetours) { arreterRetours(); arreterRetours = null; }
  if (_analyticsTimer) { clearInterval(_analyticsTimer); _analyticsTimer = null; }
}
$('admin-close').addEventListener('click', closeAdmin);

/* ===== Analytics ===== */

let _analyticsTimer = null;
let _analyticsEnCours = false;
let _chartJsCharge = false;
async function chargerChartJs() {
  if (_chartJsCharge || window.Chart) { _chartJsCharge = true; return; }
  await new Promise((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js';
    s.onload = () => { _chartJsCharge = true; ok(); };
    s.onerror = ko;
    document.head.appendChild(s);
  });
}

async function afficherAnalytics() {
  if (_analyticsEnCours) return;
  _analyticsEnCours = true;
  const section = $('analytics-section');
  section.innerHTML = '<p class="empty">Chargement…</p>';

  const data = await Sync.chargerAnalytics();
  if (!data) {
    section.innerHTML = '<p class="empty">Impossible de charger les analytics. Vérifie les règles Firestore.</p>';
    _analyticsEnCours = false;
    return;
  }

  const dateStr = d => d.toISOString().slice(0, 10);
  const today = dateStr(new Date());
  const mois  = today.slice(0, 7);

  const visitesToday = data.visites[today] || 0;
  const visitesMonth = Object.entries(data.visites)
    .filter(([d]) => d.startsWith(mois)).reduce((s, [, v]) => s + v, 0);
  const visitesTotal = Object.values(data.visites).reduce((s, v) => s + v, 0);

  let periode = 30;
  let chartVisites = null;

  const isDark = document.documentElement.dataset.theme === 'dark';
  const gridColor  = isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)';
  const tickColor  = isDark ? '#aaa' : '#666';

  section.innerHTML = `
    <div class="analytics-cards">
      <div class="analytics-card">
        <span class="analytics-card-val">${data.totalUtilisateurs}</span>
        <span class="analytics-card-lbl">utilisateurs</span>
      </div>
      <div class="analytics-card">
        <span class="analytics-card-val">${visitesToday}</span>
        <span class="analytics-card-lbl">visites aujourd'hui</span>
      </div>
      <div class="analytics-card">
        <span class="analytics-card-val">${visitesMonth}</span>
        <span class="analytics-card-lbl">ce mois-ci</span>
      </div>
      <div class="analytics-card">
        <span class="analytics-card-val">${visitesTotal}</span>
        <span class="analytics-card-lbl">total</span>
      </div>
    </div>
    <div class="analytics-period-wrap">
      <button class="analytics-period-btn is-active" data-p="30">30j</button>
      <button class="analytics-period-btn" data-p="7">7j</button>
      <button class="analytics-period-btn" data-p="90">3 mois</button>
      <button class="analytics-period-btn" data-p="365">1 an</button>
    </div>
    <div class="analytics-chart-wrap">
      <canvas id="chart-visites"></canvas>
    </div>
    <h4 class="admin-section analytics-h4">Préférences (onboarding)</h4>
    <div class="analytics-donuts">
      <div class="analytics-donut">
        <p class="analytics-donut-label">Usage principal</p>
        <canvas id="chart-usage"></canvas>
      </div>
      <div class="analytics-donut">
        <p class="analytics-donut-label">Avec qui ?</p>
        <canvas id="chart-contexte"></canvas>
      </div>
    </div>
  `;

  section.querySelectorAll('.analytics-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      periode = +btn.dataset.p;
      section.querySelectorAll('.analytics-period-btn').forEach(b =>
        b.classList.toggle('is-active', b === btn));
      dessinerVisites(periode);
    });
  });

  await chargerChartJs();

  function creerPoints(n) {
    const pts = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dateStr(d);
      pts.push({ label: n <= 90 ? k.slice(5) : k.slice(0, 7), val: data.visites[k] || 0 });
    }
    if (n > 90) {
      // regrouper par mois
      const par_mois = {};
      pts.forEach(p => { par_mois[p.label] = (par_mois[p.label] || 0) + p.val; });
      return Object.entries(par_mois).map(([label, val]) => ({ label, val }));
    }
    return pts;
  }

  function dessinerVisites(n) {
    const pts = creerPoints(n);
    if (chartVisites) chartVisites.destroy();
    chartVisites = new Chart($('chart-visites'), {
      type: 'line',
      data: {
        labels: pts.map(p => p.label),
        datasets: [{
          data: pts.map(p => p.val),
          borderColor: '#007aff',
          backgroundColor: 'rgba(0,122,255,.15)',
          fill: true,
          tension: 0.35,
          pointRadius: n <= 30 ? 3 : 0,
          pointHoverRadius: 5,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tickColor, maxTicksLimit: 8 }, grid: { color: gridColor } },
          y: { beginAtZero: true, ticks: { color: tickColor, precision: 0 }, grid: { color: gridColor } }
        }
      }
    });
  }

  dessinerVisites(periode);

  const PALETTE = ['#007aff', '#34c759', '#ff9500', '#ff3b30', '#af52de', '#5ac8fa'];

  function donut(id, obj, labels) {
    const el = $(id);
    if (!el) return;
    const keys = Object.keys(obj);
    if (!keys.length) {
      const msg = document.createElement('p');
      msg.textContent = 'Aucune donnée';
      msg.style.cssText = 'text-align:center;opacity:.5;font-size:13px;padding:20px 0 0';
      el.replaceWith(msg);
      return;
    }
    try {
      new Chart(el, {
        type: 'doughnut',
        data: {
          labels: keys.map(k => labels[k] || k),
          datasets: [{ data: keys.map(k => obj[k]), backgroundColor: PALETTE, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { color: tickColor, font: { size: 11 }, boxWidth: 12, padding: 8 } }
          }
        }
      });
    } catch (e) { console.error('[donut]', id, e); }
  }

  const LBL_USAGE = { courses: '🛒 Courses', taches: '✅ Tâches', collections: '📦 Collections', visites: '📍 Visites', tout: '🔀 Tout' };
  const LBL_CTX   = { seul: '👤 Seul(e)', famille: '👨‍👩‍👧 Famille', amis: '👥 Amis', travail: '💼 Boulot' };

  donut('chart-usage',   data.prefs.usage,    LBL_USAGE);
  donut('chart-contexte', data.prefs.contexte, LBL_CTX);

  _analyticsEnCours = false;
}

$('analytics-charger').addEventListener('click', afficherAnalytics);
adminBackdrop.addEventListener('click', e => { if (e.target === adminBackdrop) closeAdmin(); });

function majApercuImage() {
  const apercu = $('annonce-apercu');
  apercu.hidden = !annonceImage;
  if (annonceImage) apercu.src = annonceImage;
  $('annonce-image-retirer').hidden = !annonceImage;
}

function messageAdmin(id, texte, type) {
  const el = $(id);
  el.textContent = texte || '';
  el.hidden = !texte;
  el.classList.toggle('erreur', type === 'erreur');
}

$('annonce-fichier').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  messageAdmin('annonce-msg', 'Préparation de l\'image…');
  try {
    annonceImage = await preparerImage(file);
    majApercuImage();
    messageAdmin('annonce-msg', '');
  } catch (err) {
    messageAdmin('annonce-msg', messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('annonce-image-retirer').addEventListener('click', () => {
  annonceImage = '';
  majApercuImage();
});

$('annonce-enregistrer').addEventListener('click', async () => {
  messageAdmin('annonce-msg', 'Enregistrement…');
  try {
    await Sync.enregistrerAnnonce({
      actif:    $('annonce-actif').checked,
      mode:     $('annonce-mode').value,
      bloquant: $('annonce-bloquant').checked,
      titre:    $('annonce-titre').value.trim(),
      message:  $('annonce-message').value.trim(),
      image:    annonceImage
    }, annonceIdEnEdition);
    messageAdmin('annonce-msg', $('annonce-actif').checked
      ? 'Annonce publiée. Elle apparaît chez les comptes connectés.'
      : 'Annonce enregistrée, masquée pour l\'instant.');
    fermerFormulaireAnnonce();
  } catch (err) {
    messageAdmin('annonce-msg', messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('admin-reserver').addEventListener('click', async () => {
  const pseudo = $('admin-pseudo').value.trim();
  const cible = $('admin-cible').value.trim();
  messageAdmin('admin-pseudo-msg', 'Réservation…');
  try {
    await Sync.reserverPseudoPour(pseudo, cible);
    messageAdmin('admin-pseudo-msg', `« ${pseudo} » est réservé à ce compte, lui seul pourra le porter.`);
  } catch (err) {
    messageAdmin('admin-pseudo-msg', messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('admin-liberer').addEventListener('click', async () => {
  const pseudo = $('admin-pseudo').value.trim();
  if (!pseudo) return messageAdmin('admin-pseudo-msg', messageErreur('pseudo/vide'), 'erreur');
  messageAdmin('admin-pseudo-msg', 'Libération…');
  try {
    await Sync.libererPseudo(pseudo);
    messageAdmin('admin-pseudo-msg', `« ${pseudo} » est de nouveau libre pour tous.`);
  } catch (err) {
    messageAdmin('admin-pseudo-msg', messageErreur(err?.code || String(err)), 'erreur');
  }
});

$('notif-envoyer').addEventListener('click', async () => {
  const titre = $('notif-titre').value.trim();
  const corps  = $('notif-corps').value.trim();
  if (!titre) return messageAdmin('notif-msg', 'Le titre est obligatoire.', 'erreur');
  if (!confirm(`Envoyer la notification « ${titre} » à tous les utilisateurs ?`)) return;
  messageAdmin('notif-msg', 'Envoi…');
  try {
    const res = await Sync.diffuserNotif(titre, corps);
    messageAdmin('notif-msg', `Envoyée à ${res.envoyes} appareil(s) sur ${res.tentes}.`);
    $('notif-titre').value = '';
    $('notif-corps').value = '';
  } catch (err) {
    messageAdmin('notif-msg', messageErreur(err?.code || String(err)), 'erreur');
  }
});

/* ============================================================
   Feedback — commentaires et signalements de bugs
   ============================================================ */

const CLE_RETOURS_VUS = 'meslistes.retours_vus';
let arreterConversations = null;
let arreterMessages     = null;
let arreterDemandes     = null;
let convActive          = null;   // { id, otherUid }
let arreterMesRetoursGlobal = null;   // badge temps réel
let arreterMesRetoursModal  = null;   // modal "Mes retours"
let arreterRetours          = null;   // panel admin

/* --- Envoi d'un retour --- */

function feedbackModal() {
  if (!Sync.user) return accountModal();
  $('feedback-backdrop').hidden = false;
  $('feedback-message').value = '';
  $('feedback-anon').checked = false;
  $('feedback-chars-count').textContent = '0';
  const msgEl = $('feedback-msg');
  msgEl.hidden = true;
  document.querySelectorAll('.feedback-type-btn').forEach(b => {
    b.classList.toggle('is-active', b.dataset.type === 'commentaire');
  });
}

function closeFeedback() { $('feedback-backdrop').hidden = true; }
$('feedback-close').addEventListener('click', closeFeedback);
$('feedback-cancel').addEventListener('click', closeFeedback);
$('feedback-backdrop').addEventListener('click', e => { if (e.target === $('feedback-backdrop')) closeFeedback(); });

$('feedback-message').addEventListener('input', () => {
  $('feedback-chars-count').textContent = $('feedback-message').value.length;
});

document.querySelectorAll('.feedback-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.feedback-type-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});

$('feedback-send').addEventListener('click', async () => {
  const type = document.querySelector('.feedback-type-btn.is-active')?.dataset.type || 'commentaire';
  const message = $('feedback-message').value.trim();
  const anonyme = $('feedback-anon').checked;
  const msgEl = $('feedback-msg');
  if (!message) {
    msgEl.textContent = 'Écris ton message avant d\'envoyer.';
    msgEl.hidden = false; msgEl.classList.add('erreur'); return;
  }
  msgEl.textContent = 'Envoi…'; msgEl.hidden = false; msgEl.classList.remove('erreur');
  try {
    await Sync.envoyerRetour(type, message, anonyme);
    msgEl.textContent = 'Merci ! Ton retour a bien été envoyé.';
    $('feedback-message').value = '';
    $('feedback-chars-count').textContent = '0';
    setTimeout(closeFeedback, 1800);
  } catch (err) {
    msgEl.textContent = messageErreur(err?.code || String(err));
    msgEl.classList.add('erreur');
  }
});

/* --- Mes retours (réponses admin) --- */

function majBadgeRetours(retours) {
  const dernier = parseInt(localStorage.getItem(CLE_RETOURS_VUS) || '0', 10);
  const nonVus = retours.some(r => {
    if (!r.reponse || !r.reponseLe) return false;
    const ts = r.reponseLe?.toDate ? r.reponseLe.toDate().getTime() : (r.reponseLe?.seconds * 1000 || 0);
    return ts > dernier;
  });
  $('btn-settings').classList.toggle('has-retours', nonVus);
}

function renderMesRetours(retours) {
  const el = $('mes-retours-liste');
  if (!retours.length) { el.innerHTML = '<p class="empty">Aucun retour envoyé pour l\'instant.</p>'; return; }
  el.innerHTML = retours.map(r => {
    const date = r.cree?.toDate ? r.cree.toDate() : new Date((r.cree?.seconds || 0) * 1000);
    const dateFmt = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const reponseHtml = r.reponse
      ? `<div class="retour-reponse"><span class="retour-reponse-label">Réponse de ${esc(r.repondeuNom || 'l\'équipe')} :</span><p>${esc(r.reponse)}</p></div>`
      : '<p class="retour-en-attente">En attente de réponse…</p>';
    return `<div class="retour-carte">
      <div class="retour-meta">
        <span class="retour-type retour-type-${esc(r.type)}">${r.type === 'bug' ? '🐛 Bug' : '💬 Commentaire'}</span>
        <span class="retour-date">${esc(dateFmt)}</span>
        <span class="retour-version">${esc(r.version || '')}</span>
      </div>
      <p class="retour-message">${esc(r.message)}</p>
      ${reponseHtml}
    </div>`;
  }).join('');
}

function mesRetoursModal() {
  if (!Sync.user) return;
  $('mes-retours-backdrop').hidden = false;
  $('mes-retours-liste').innerHTML = '<p class="empty">Chargement…</p>';
  localStorage.setItem(CLE_RETOURS_VUS, Date.now().toString());
  majBadgeRetours([]);
  if (arreterMesRetoursModal) { arreterMesRetoursModal(); arreterMesRetoursModal = null; }
  arreterMesRetoursModal = Sync.ecouterMesRetours(retours => renderMesRetours(retours));
}

function closeMesRetours() {
  $('mes-retours-backdrop').hidden = true;
  if (arreterMesRetoursModal) { arreterMesRetoursModal(); arreterMesRetoursModal = null; }
}

$('mes-retours-close').addEventListener('click', closeMesRetours);
$('mes-retours-fermer').addEventListener('click', closeMesRetours);
$('mes-retours-backdrop').addEventListener('click', e => { if (e.target === $('mes-retours-backdrop')) closeMesRetours(); });

/* --- Boîte de retours (admin) --- */

function renderAdminRetours(retours) {
  const el = $('admin-retours-liste');
  if (!retours.length) { el.innerHTML = '<p class="empty">Aucun retour reçu.</p>'; return; }
  el.innerHTML = retours.map(r => {
    const date = r.cree?.toDate ? r.cree.toDate() : new Date((r.cree?.seconds || 0) * 1000);
    const dateFmt = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const auteur = r.uid
      ? esc(r.pseudo || r.email || r.uid)
      : '<em>Anonyme</em>';
    const reponseSection = r.reponse
      ? `<div class="retour-reponse admin-reponse">
           <span class="retour-reponse-label">Répondu par ${esc(r.repondeuNom || '?')} :</span>
           <p>${esc(r.reponse)}</p>
           ${r.uid ? `<button class="link-btn admin-retour-btn" data-action="modifier" data-id="${esc(r.id)}">Modifier</button>` : ''}
         </div>`
      : r.uid
        ? `<button class="link-btn admin-retour-btn" data-action="repondre" data-id="${esc(r.id)}">Répondre</button>`
        : '<p class="retour-anon-note">Anonyme — impossible de répondre.</p>';
    return `<div class="retour-carte admin-retour-carte" data-id="${esc(r.id)}">
      <div class="retour-meta">
        <span class="retour-type retour-type-${esc(r.type)}">${r.type === 'bug' ? '🐛 Bug' : '💬 Commentaire'}</span>
        <span class="retour-date">${esc(dateFmt)}</span>
        <span class="retour-version">${esc(r.version || '')}</span>
      </div>
      <p class="retour-auteur">${auteur}</p>
      <p class="retour-message">${esc(r.message)}</p>
      ${reponseSection}
      <div class="admin-retour-form" id="retour-form-${esc(r.id)}" hidden>
        <textarea class="admin-textarea admin-retour-textarea" maxlength="2000" rows="3"
                  placeholder="Ta réponse…"></textarea>
        <div class="admin-boutons">
          <button class="modal-btn primary admin-retour-envoyer" data-id="${esc(r.id)}">Envoyer</button>
          <button class="modal-btn admin-retour-annuler" data-id="${esc(r.id)}">Annuler</button>
        </div>
        <p class="form-msg admin-retour-msg" hidden></p>
      </div>
      <button class="link-btn admin-retour-supprimer" data-id="${esc(r.id)}">Supprimer</button>
    </div>`;
  }).join('');
}

$('admin-retours-liste').addEventListener('click', async e => {
  const btn = e.target.closest('[data-action],[data-id].admin-retour-envoyer,[data-id].admin-retour-annuler,[data-id].admin-retour-supprimer');
  if (!btn) return;
  const id = btn.dataset.id;
  const form = document.getElementById(`retour-form-${id}`);
  const msgEl = form?.querySelector('.admin-retour-msg');

  if (btn.classList.contains('admin-retour-supprimer')) {
    if (!confirm('Supprimer ce retour définitivement ?')) return;
    try { await Sync.supprimerRetour(id); }
    catch (err) { toast(messageErreur(err?.code || String(err))); }
    return;
  }
  if (btn.classList.contains('admin-retour-annuler')) {
    if (form) form.hidden = true; return;
  }
  if (btn.classList.contains('admin-retour-envoyer')) {
    const texte = form?.querySelector('textarea')?.value.trim();
    if (!texte) return;
    if (msgEl) { msgEl.textContent = 'Envoi…'; msgEl.hidden = false; }
    try {
      await Sync.repondreRetour(id, texte);
      if (form) form.hidden = true;
    } catch (err) {
      if (msgEl) { msgEl.textContent = messageErreur(err?.code || String(err)); msgEl.hidden = false; }
    }
    return;
  }
  const action = btn.dataset.action;
  if (action === 'repondre' || action === 'modifier') {
    if (form) form.hidden = false;
    form?.querySelector('textarea')?.focus();
  }
});

/* ============================================================
   Messagerie
   ============================================================ */

function showMsgPanel(id) {
  ['msg-list-view', 'msg-picker-view', 'msg-conv-view'].forEach(p =>
    $(`${p}`).classList.toggle('is-active', p === id));
}

function renderMsgBadge(n) {
  const badge = $('msg-badge');
  if (!badge) return;
  badge.hidden = !n;
  badge.textContent = n > 9 ? '9+' : String(n);
}

function renderConversations(convs) {
  const el = $('convs-list');
  $('empty-msgs').hidden = convs.length > 0;
  el.innerHTML = convs.map(conv => {
    const otherUid = conv.participants.find(u => u !== Sync.user?.uid) || '';
    const ami = Sync.amis.find(a => a.uid === otherUid);
    const nom = ami ? ami.code.replace(/(\d{4})(\d{4})/, '$1-$2') : otherUid.slice(0, 8) + '…';
    const av = avatarImg(Sync.cacheAvatars.get(otherUid) || null, 40, 'avatar-conv');
    const nonLus = (conv.nonLus || {})[Sync.user?.uid] || 0;
    const badge = nonLus > 0 ? `<span class="conv-badge">${nonLus > 9 ? '9+' : nonLus}</span>` : '';
    return `<li class="conv-item" data-other="${esc(otherUid)}">
      ${av}
      <div class="conv-info">
        <span class="conv-name">${esc(nomPour(otherUid))}${badgeMarque(otherUid)}</span>
        <span class="conv-last">${esc(conv.dernierMsg || '')}</span>
      </div>
      ${badge}
    </li>`;
  }).join('');
}

function renderPickerAmis() {
  const el = $('picker-amis-list');
  $('picker-empty').hidden = Sync.amis.length > 0;
  el.innerHTML = Sync.amis.map(({ uid }) => {
    const av = avatarImg(Sync.cacheAvatars.get(uid) || null, 40, 'avatar-conv');
    return `<li class="conv-item" data-pick="${esc(uid)}">
      ${av}
      <div class="conv-info"><span class="conv-name">${esc(nomPour(uid))}${badgeMarque(uid)}</span></div>
    </li>`;
  }).join('');
}

function renderBubbles(msgs) {
  const el = $('msg-bubbles');
  const moi = Sync.user?.uid;
  $('empty-bubbles').hidden = msgs.length > 0;
  el.innerHTML = msgs.map(m =>
    `<li class="bubble ${m.de === moi ? 'bubble-out' : 'bubble-in'}">${esc(m.texte)}</li>`
  ).join('');
  const scroll = $('msg-bubbles-scroll');
  requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
}

function openMessages() {
  if (!Sync.user) return accountModal();
  screenHome.classList.remove('is-active');
  screenMessages.classList.add('is-active');
  showMsgPanel('msg-list-view');
  renderConversations(Sync.conversations);
  arreterConversations?.();
  arreterConversations = Sync.ecouterConversations((convs, nonLus) => {
    renderConversations(convs);
    renderMsgBadge(nonLus);
    const manquants = [...new Set(convs.flatMap(c => c.participants))].filter(u => !Sync.cacheAvatars.has(u));
    if (manquants.length) Promise.all(manquants.map(u => Sync.avatarDe(u))).then(() => renderConversations(Sync.conversations)).catch(() => {});
  });
}

function closeMessages() {
  arreterConversations?.();
  arreterConversations = null;
  arreterMessages?.();
  arreterMessages = null;
  convActive = null;
  screenMessages.classList.remove('is-active');
  screenHome.classList.add('is-active');
}

async function openConversation(otherUid) {
  let convId;
  try { convId = await Sync.ouvrirConversation(otherUid); }
  catch (e) { toast(messageErreur(e?.code || String(e))); return; }
  convActive = { id: convId, otherUid };
  $('conv-title').innerHTML = esc(nomPour(otherUid)) + badgeMarque(otherUid);
  $('conv-header-avatar').innerHTML = avatarImg(Sync.cacheAvatars.get(otherUid) || null, 32, 'avatar-membre');
  showMsgPanel('msg-conv-view');
  arreterMessages?.();
  arreterMessages = Sync.ecouterMessages(convId, msgs => {
    renderBubbles(msgs);
    Sync.marquerLu(convId);
  });
}

$('btn-msgs').addEventListener('click', openMessages);
$('btn-back-msgs').addEventListener('click', closeMessages);

$('btn-new-msg').addEventListener('click', () => {
  renderPickerAmis();
  showMsgPanel('msg-picker-view');
});

$('btn-back-picker').addEventListener('click', () => showMsgPanel('msg-list-view'));

$('btn-back-conv').addEventListener('click', () => {
  arreterMessages?.();
  arreterMessages = null;
  convActive = null;
  showMsgPanel('msg-list-view');
});

$('convs-list').addEventListener('click', e => {
  const item = e.target.closest('.conv-item[data-other]');
  if (item) openConversation(item.dataset.other);
});

$('picker-amis-list').addEventListener('click', e => {
  const item = e.target.closest('[data-pick]');
  if (item) openConversation(item.dataset.pick);
});

$('form-msg').addEventListener('submit', async e => {
  e.preventDefault();
  if (!convActive || !Sync.user) return;
  const input = $('input-msg');
  const texte = input.value.trim();
  if (!texte) return;
  input.value = '';
  try {
    await Sync.envoyerMessage(convActive.id, convActive.otherUid, texte);
  } catch (err) {
    toast(messageErreur(err?.code || String(err)));
    input.value = texte;
  }
});

/* ============================================================
   Démarrage
   ============================================================ */

/* La synchro prévient l'app quand le compte ou les listes changent — au retour
   du réseau, une modification faite sur l'ordinateur arrive ici toute seule. */
Sync.onChange = () => {
  const etaitConnecte = precedentUser;
  precedentUser = !!Sync.user;

  if (Sync.user) {
    libererMurAuth();
    compteBackdrop.hidden = true;
  } else if (etaitConnecte) {
    afficherMurAuth();
  }

  renderAccount();
  applyTheme();          // se connecter rend l'apparence choisie, se déconnecter la retire

  renderInvitationsRecues();

  // Ce que les autres viennent de changer. Regroupé : trois articles cochés
  // d'affilée ne doivent pas donner trois notifications.
  if (Sync.modifs.length) {
    const modifs = Sync.modifs.splice(0);
    const listes = [...new Set(modifs.map(m => m.liste))];
    const gens = [...new Set(modifs.map(m => m.qui))];
    const titre = listes.length === 1 ? `« ${listes[0]} » a changé` : `${listes.length} listes ont changé`;
    const corps = modifs.length === 1 && modifs[0].detail
      ? `${modifs[0].qui} ${modifs[0].detail}.`
      : `${gens.join(' et ')} vient de faire une modification.`;
    notifier(titre, corps, 'modif');
  }
  if (currentListId) renderPresence(currentListId);

  renderEtatSync();

  // Se connecter sur un appareil déjà autorisé doit y enregistrer le jeton :
  // sans ça, il faudrait redemander une permission déjà accordée.
  if (Sync.user && etatNotifs() === 'granted' && !jetonEnregistre) {
    jetonEnregistre = true;
    Sync.enregistrerJeton().catch(() => { jetonEnregistre = false; });
  }
  if (!Sync.user) jetonEnregistre = false;

  // Listener badge "Mes retours" : actif quand connecté, arrêté à la déconnexion.
  if (Sync.user) {
    if (!arreterMesRetoursGlobal) {
      arreterMesRetoursGlobal = Sync.ecouterMesRetours(majBadgeRetours);
    }
  } else {
    if (arreterMesRetoursGlobal) { arreterMesRetoursGlobal(); arreterMesRetoursGlobal = null; }
    majBadgeRetours([]);
  }

  // Listener demandes d'amitié : actif quand connecté pour la finalisation auto.
  if (Sync.user) {
    if (!arreterDemandes) {
      arreterDemandes = Sync.ecouterDemandes(() => {
        if (!compteBackdrop.hidden) renderDemandes();
      });
    }
  } else {
    if (arreterDemandes) { arreterDemandes(); arreterDemandes = null; }
    Sync.demandesRecues  = [];
    Sync.demandesEnvoyees = [];
  }

  if (!shareBackdrop.hidden && listePartagee) renderPeople();
  if (currentListId && !getList(currentListId)) return goHome();
  renderHome();
  if (currentListId) renderItems();
  chargerAvatarsDesListes();

  // FAB messages : visible uniquement quand connecté
  $('btn-msgs').hidden = !Sync.user;
  renderMsgBadge(Sync.totalNonLus);
  if (!Sync.user && screenMessages.classList.contains('is-active')) closeMessages();
};

const ETATS = {
  local:     '',                      // sans compte, rien à dire
  synchro:   '· synchronisé',
  envoi:     '· envoi…',
  horsligne: '· hors ligne',
  erreur:    '· erreur de synchro'
};

const ORIGINES = { listes: 'les listes', reglages: "l'apparence",
                   invitations: 'les invitations', connexion: 'la connexion' };

function renderEtatSync() {
  // En cas de panne, l'indicateur nomme la partie fautive : c'est souvent tout
  // ce qu'on peut lire sur un téléphone, sans console ni journal.
  const detail = Sync.etat === 'erreur' && ORIGINES[Sync.origine]
    ? ` (${ORIGINES[Sync.origine]})` : '';
  $('app-version').textContent = `${VERSION} ${ETATS[Sync.etat] || ''}${detail}`.trim();
  $('app-version').classList.toggle('alerte', Sync.etat === 'erreur');
}
/* ===== Onboarding ===== */

const ONBOARDING_QUESTIONS = [
  {
    id: 'usage',
    question: 'À quoi va te servir Mes Listes ?',
    options: [
      { value: 'courses',     label: 'Faire mes courses',    icon: '🛒' },
      { value: 'taches',      label: 'Gérer mes tâches',     icon: '✅' },
      { value: 'collections', label: 'Mes collections',      icon: '📦' },
      { value: 'visites',     label: 'Lieux à visiter',      icon: '📍' },
      { value: 'tout',        label: 'Tout ça à la fois',    icon: '🔀' },
    ]
  },
  {
    id: 'contexte',
    question: 'Tu l\'utilises plutôt…',
    options: [
      { value: 'seul',    label: 'Tout seul(e)',   icon: '👤' },
      { value: 'famille', label: 'En famille',     icon: '👨‍👩‍👧' },
      { value: 'amis',    label: 'Entre amis',     icon: '👥' },
      { value: 'travail', label: 'Pour le boulot', icon: '💼' },
    ]
  }
];

function afficherOnboarding() {
  if (state.onboardingDone) return;

  const reponses = {};
  let etape = 0;
  const total = ONBOARDING_QUESTIONS.length;

  function renderEtape() {
    const q = ONBOARDING_QUESTIONS[etape];
    const dernier = etape === total - 1;

    $('onboarding-content').innerHTML = `
      <div class="onboarding-header">
        <div class="onboarding-progress">
          ${ONBOARDING_QUESTIONS.map((_, i) =>
            `<span class="onboarding-dot${i <= etape ? ' is-active' : ''}"></span>`
          ).join('')}
        </div>
        <p class="onboarding-step">Question ${etape + 1} sur ${total}</p>
        <h2 class="onboarding-question">${esc(q.question)}</h2>
      </div>
      <div class="onboarding-options">
        ${q.options.map(opt => `
          <button class="onboarding-option${reponses[q.id] === opt.value ? ' is-selected' : ''}" data-val="${opt.value}">
            <span class="onboarding-icon">${opt.icon}</span>
            <span class="onboarding-label">${esc(opt.label)}</span>
          </button>
        `).join('')}
      </div>
      <div class="onboarding-footer">
        <button class="modal-btn primary wide" id="onboarding-next"${!reponses[q.id] ? ' disabled' : ''}>
          ${dernier ? 'C\'est parti !' : 'Suivant →'}
        </button>
        <button class="link-btn" id="onboarding-skip">Passer</button>
      </div>
    `;

    $('onboarding-content').querySelectorAll('.onboarding-option').forEach(btn => {
      btn.addEventListener('click', () => {
        reponses[q.id] = btn.dataset.val;
        $('onboarding-next').disabled = false;
        $('onboarding-content').querySelectorAll('.onboarding-option').forEach(b =>
          b.classList.toggle('is-selected', b.dataset.val === btn.dataset.val)
        );
      });
    });

    $('onboarding-next').addEventListener('click', () => {
      if (!reponses[q.id]) return;
      if (etape < total - 1) { etape++; renderEtape(); }
      else terminerOnboarding(reponses);
    });

    $('onboarding-skip').addEventListener('click', () => terminerOnboarding(reponses));
  }

  $('onboarding-backdrop').hidden = false;
  renderEtape();
}

function terminerOnboarding(reponses) {
  state.onboardingDone = true;
  state.onboardingReponses = reponses;
  sauverLocalement();
  $('onboarding-backdrop').hidden = true;
  Sync.sauverOnboarding(reponses);
}

mettreAJourStreak();
renderEtatSync();
applyTheme();
renderHome();
renderStreak();
annoncerNouveautes();
afficherOnboarding();

if (!localStorage.getItem('meslistes.compte')) {
  afficherMurAuth();
}

/* Retour depuis un lien de connexion : on termine l'ouverture de session avant
   toute chose, l'app apparaîtra directement connectée. */
if (location.href.includes('apiKey=') || location.href.includes('oobCode=')) {
  Sync.init()
    .then(() => Sync.lienEnAttente())
    .then(async oui => {
      if (!oui) return;
      const memorisee = localStorage.getItem('meslistes.lien');
      // Lien ouvert sur un autre appareil que celui qui l'a demandé : Firebase
      // exige l'adresse, elle seule prouve qui est derrière le lien.
      const email = memorisee || prompt('Confirme ton adresse e-mail pour terminer la connexion :');
      if (!email) return;
      await Sync.terminerLien(email);
      toast('Connexion réussie');
    })
    .catch(e => {
      accountModal();
      messageCompte(messageErreur(e?.code || String(e)), 'erreur');
    });
}

/* ============================================================
   Constructeur d'avatar
   ============================================================ */

const avatarModalBackdrop = $('avatar-modal-backdrop');
let avatarEdite = null;

function ouvrirBuilderAvatar() {
  if (!Sync.user) return;
  avatarEdite = Object.assign({}, AVATAR_DEFAUT, Sync.monAvatar || {});
  if (avatarEdite.type === 'photo') {
    // En mode photo on masque les pickers SVG
  }
  renderBuilderAvatar();
  avatarModalBackdrop.hidden = false;
}

function fermerBuilderAvatar() {
  avatarModalBackdrop.hidden = true;
}

function renderBuilderAvatar() {
  const preview = $('avatar-builder-preview');
  if (preview) {
    preview.innerHTML = avatarImg(avatarEdite, 120);
  }
  renderPickerCouleur('picker-fond', COLORS, 'fond', avatarEdite.fond);
  renderPickerCouleur('picker-peau', PEAUX, 'peau', avatarEdite.peau);
  renderPickerStyle('picker-cheveux', 8, 'cheveux', avatarEdite.cheveux);
  renderPickerCouleur('picker-chcoul', CHEVEUX_COULEURS, 'cheveuxCouleur', avatarEdite.cheveuxCouleur);
  renderPickerStyle('picker-yeux', 4, 'yeux', avatarEdite.yeux);
  renderPickerStyle('picker-bouche', 4, 'bouche', avatarEdite.bouche);
  renderPickerStyle('picker-access', 5, 'accessoire', avatarEdite.accessoire);

  const estPhoto = avatarEdite?.type === 'photo' && avatarEdite.photo;
  $('avatar-photo-btn').hidden = !!estPhoto;
  $('avatar-genere-btn').hidden = !estPhoto;
}

function renderPickerCouleur(id, couleurs, key, actuel) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = couleurs.map((c, i) => {
    const actif = key === 'fond' ? actuel === c : actuel === i;
    return `<span class="picker-wrap${actif ? ' is-active' : ''}">
      <button class="picker-color" type="button"
              data-key="${key}" data-val="${esc(String(i))}" data-color="${esc(c)}"
              style="background:${c}" aria-label="Couleur ${i + 1}"></button>
    </span>`;
  }).join('');
}

function renderPickerStyle(id, count, key, actuel) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, (_, i) => {
    const preview = Object.assign({}, avatarEdite, { [key]: i, type: 'genere' });
    const uri = avatarDataUri(preview);
    return `<span class="picker-wrap${actuel === i ? ' is-active' : ''}">
      <button class="picker-style" type="button" data-key="${key}" data-val="${i}">
        <img src="${uri}" width="52" height="52" alt="">
      </button>
    </span>`;
  }).join('');
}

avatarModalBackdrop.addEventListener('click', e => {
  if (e.target === avatarModalBackdrop) fermerBuilderAvatar();
});
$('avatar-builder-close').addEventListener('click', fermerBuilderAvatar);
$('avatar-cancel-btn').addEventListener('click', fermerBuilderAvatar);

/* Délégation globale pour les boutons des pickers */
document.addEventListener('click', e => {
  if (!avatarEdite || avatarModalBackdrop.hidden) return;
  const btn = e.target.closest('[data-key][data-val]');
  if (!btn || !avatarModalBackdrop.contains(btn)) return;
  const key = btn.dataset.key;
  const rawVal = btn.dataset.val;
  avatarEdite[key] = key === 'fond' ? (btn.dataset.color || rawVal) : +rawVal;
  if (avatarEdite.type === 'photo') avatarEdite.type = 'genere';
  renderBuilderAvatar();
});

/* Clic sur le bouton édition d'avatar (rendu dynamiquement dans renderAccount) */
$('account-in').addEventListener('click', e => {
  if (e.target.closest('#btn-edit-avatar')) ouvrirBuilderAvatar();
});

$('avatar-save-btn').addEventListener('click', async () => {
  if (!avatarEdite) return;
  try {
    $('avatar-save-btn').disabled = true;
    await Sync.sauverAvatar(avatarEdite);
    renderAccount();
    fermerBuilderAvatar();
  } catch (e) {
    toast(messageErreur(e?.code || String(e)));
  } finally {
    $('avatar-save-btn').disabled = false;
  }
});

$('avatar-photo-btn').addEventListener('click', () => $('avatar-photo-input').click());

$('avatar-photo-input').addEventListener('change', async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const compressed = await compresserPhoto(file, 80);
    avatarEdite = Object.assign({}, avatarEdite || AVATAR_DEFAUT, { type: 'photo', photo: compressed });
    renderBuilderAvatar();
  } catch (err) {
    toast(messageErreur(err?.code || String(err)));
  }
  e.target.value = '';
});

$('avatar-genere-btn').addEventListener('click', () => {
  if (!avatarEdite) return;
  const { photo, ...rest } = avatarEdite;
  avatarEdite = Object.assign({}, AVATAR_DEFAUT, rest, { type: 'genere' });
  renderBuilderAvatar();
});

/* ============================================================
   À venir — articles avec deadline (v20.2)
   ============================================================ */

const screenAvenir = $('screen-avenir');

function goAvenir() {
  screenHome.classList.remove('is-active');
  screenAvenir.classList.add('is-active');
  renderAVenir();
}

function renderAVenir() {
  const now = new Date();
  const items = [];
  state.lists.forEach(list => {
    list.items.forEach(item => {
      if (!item._section && item.deadline) items.push({ item, list });
    });
  });
  items.sort((a, b) => new Date(a.item.deadline) - new Date(b.item.deadline));

  const el = $('avenir-list');
  const empty = $('empty-avenir');
  if (!items.length) { el.innerHTML = ''; empty.hidden = false; return; }
  empty.hidden = true;

  el.innerHTML = items.map(({ item, list }) => {
    const d = new Date(item.deadline);
    const diff = d - now;
    const cls = diff < 0 ? 'deadline-past' : diff < 86400000 ? 'deadline-soon' : 'deadline-ok';
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === d.toDateString();
    const heure = d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    let quand;
    if (isToday)    quand = `Aujourd'hui ${heure}`;
    else if (isTomorrow) quand = `Demain ${heure}`;
    else quand = d.toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' }) + ` ${heure}`;

    return `<li class="row item avenir-row" data-lid="${list.id}" data-iid="${item.id}">
      <button class="row-main" style="flex:1">
        <span class="row-text">
          <span class="row-title">${esc(item.text)}</span>
          <span class="row-sub">${esc(list.name)}</span>
        </span>
      </button>
      <span class="row-deadline ${cls}">⏰ ${quand}</span>
    </li>`;
  }).join('');

  el.onclick = e => {
    const row = e.target.closest('[data-lid]');
    if (!row) return;
    screenAvenir.classList.remove('is-active');
    screenHome.classList.add('is-active');
    openSheet(state.lists.find(l => l.id === row.dataset.lid)?.name || '', [], {});
    setTimeout(() => {
      const list = getList(row.dataset.lid);
      if (list) { currentListId = row.dataset.lid; screenHome.classList.remove('is-active'); screenList.classList.add('is-active'); renderItems(); }
    }, 50);
  };
}

$('btn-avenir').addEventListener('click', goAvenir);
$('btn-back-avenir').addEventListener('click', () => {
  screenAvenir.classList.remove('is-active');
  screenHome.classList.add('is-active');
});

/* ============================================================
   Favoris (v20.5)
   ============================================================ */

const isFavori = text => {
  const t = text.toLowerCase();
  return state.favoris.items.some(f => f.text.toLowerCase() === t) ||
    state.favoris.listes.some(l => l.items.some(i => i.text.toLowerCase() === t));
};

function toggleFavori(text) {
  const idx = state.favoris.items.findIndex(f => f.text.toLowerCase() === text.toLowerCase());
  if (idx >= 0) {
    state.favoris.items.splice(idx, 1);
    toast('Retiré des favoris');
  } else {
    state.favoris.items.push({ id: uid(), text });
    toast('★ Ajouté aux favoris');
  }
  save();
  renderItems();
}

function goFavoris() {
  screenHome.classList.remove('is-active');
  screenFavoris.classList.add('is-active');
  renderFavoris();
}

function renderFavorisItem(f, listeId = null) {
  const dataLid = listeId ? ` data-lid="${listeId}"` : '';
  return `<li class="fav-item" data-fid="${f.id}" data-ftext="${esc(f.text)}"${dataLid}>
    <span class="fav-item-text">${esc(f.text)}</span>
    <div class="fav-item-actions">
      <button class="fav-add-btn" data-add-to-list aria-label="Ajouter à une liste">+</button>
      <button class="fav-del-btn" data-del-fav aria-label="Retirer des favoris">×</button>
    </div>
  </li>`;
}

function renderFavoris() {
  const { items, listes } = state.favoris;

  $('fav-standalone').innerHTML = items.map(f => renderFavorisItem(f)).join('');

  $('fav-listes').innerHTML = listes.map(l => `
    <div class="fav-liste-section">
      <div class="fav-liste-header">
        <span class="fav-liste-name">${esc(l.name)}</span>
        <button class="icon-btn fav-del-liste-btn" data-del-liste="${l.id}" aria-label="Supprimer la liste">×</button>
      </div>
      <ul class="fav-list">
        ${l.items.map(f => renderFavorisItem(f, l.id)).join('')}
      </ul>
      <button class="fav-add-in-liste" data-add-in-liste="${l.id}">+ Ajouter un article</button>
    </div>
  `).join('');

  const hasContent = items.length > 0 || listes.length > 0;
  $('fav-empty').hidden = hasContent;
  $('fav-items-header').hidden = !hasContent;
}

function renderSuggestionsFavoris() {
  const frequence = new Map();
  state.lists.forEach(list => {
    list.items.filter(i => !i._section && i.text).forEach(i => {
      const k = i.text.toLowerCase();
      if (!frequence.has(k)) frequence.set(k, { text: i.text, count: 0 });
      frequence.get(k).count++;
    });
  });

  const dejaFav = new Set([
    ...state.favoris.items.map(f => f.text.toLowerCase()),
    ...state.favoris.listes.flatMap(l => l.items.map(i => i.text.toLowerCase()))
  ]);
  const ignores = new Set((state.favoris.suggIgnores || []).map(t => t.toLowerCase()));

  const suggestions = [...frequence.values()]
    .filter(s => s.count >= 2 && !dejaFav.has(s.text.toLowerCase()) && !ignores.has(s.text.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  $('fav-sugg-list').innerHTML = suggestions.map(s => `
    <li class="fav-item fav-sugg-item" data-sugg-text="${esc(s.text)}">
      <span class="fav-item-text">${esc(s.text)}</span>
      <span class="fav-sugg-count">${s.count}×</span>
      <button class="fav-add-btn" data-add-sugg aria-label="Ajouter aux favoris">★</button>
    </li>
  `).join('');

  $('fav-sugg-empty').hidden = suggestions.length > 0;
  $('fav-sugg-header').hidden = !suggestions.length;
}

function ouvrirChoixListePourFavori(text) {
  if (!state.lists.length) return toast('Crée d\'abord une liste');
  openSheet(`Ajouter « ${text} » à`, state.lists.map(l => ({
    label: `${l.photo || '📝'} ${l.name}`,
    run() {
      const list = getList(l.id);
      if (!list) return;
      if (list.items.some(i => !i._section && i.text.toLowerCase() === text.toLowerCase())) {
        return toast('Déjà dans cette liste');
      }
      list.items.push({ id: uid(), text, qty: 1, done: false, variants: [] });
      save();
      toast(`Ajouté dans « ${l.name} »`);
    }
  })));
}

function favClickHandler(e) {
  if (e.target.closest('[data-del-fav]')) {
    const li = e.target.closest('[data-fid]');
    if (!li) return;
    const fid = li.dataset.fid;
    const lid = li.dataset.lid;
    if (lid) {
      const l = state.favoris.listes.find(l => l.id === lid);
      if (l) l.items = l.items.filter(i => i.id !== fid);
    } else {
      state.favoris.items = state.favoris.items.filter(f => f.id !== fid);
    }
    save();
    renderFavoris();
    if (currentListId) renderItems();
    return;
  }
  if (e.target.closest('[data-add-to-list]')) {
    const li = e.target.closest('[data-fid]');
    if (!li) return;
    ouvrirChoixListePourFavori(li.dataset.ftext);
    return;
  }
  const delListeBtn = e.target.closest('[data-del-liste]');
  if (delListeBtn) {
    state.favoris.listes = state.favoris.listes.filter(l => l.id !== delListeBtn.dataset.delListe);
    save();
    renderFavoris();
    return;
  }
  const addInListeBtn = e.target.closest('[data-add-in-liste]');
  if (addInListeBtn) {
    const lid = addInListeBtn.dataset.addInListe;
    askText('Ajouter un article', '', text => {
      if (!text) return;
      const l = state.favoris.listes.find(l => l.id === lid);
      if (l) { l.items.push({ id: uid(), text }); save(); renderFavoris(); }
    });
  }
}

$('btn-favoris').addEventListener('click', goFavoris);
$('btn-back-favoris').addEventListener('click', () => {
  screenFavoris.classList.remove('is-active');
  screenHome.classList.add('is-active');
});
$('btn-add-fav-item').addEventListener('click', () => {
  askText('Nouvel article favori', '', text => {
    if (!text) return;
    if (isFavori(text)) return toast('Déjà dans les favoris');
    state.favoris.items.push({ id: uid(), text });
    save();
    renderFavoris();
    if (currentListId) renderItems();
  });
});
$('btn-new-fav-list').addEventListener('click', () => {
  askText('Nom de la liste de favoris', '', name => {
    if (!name) return;
    state.favoris.listes.push({ id: uid(), name, items: [] });
    save();
    renderFavoris();
  });
});
$('tab-fav-items').addEventListener('click', () => {
  $('tab-fav-items').classList.add('is-active');
  $('tab-fav-sugg').classList.remove('is-active');
  $('panel-fav-items').hidden = false;
  $('panel-fav-sugg').hidden = true;
});
$('tab-fav-sugg').addEventListener('click', () => {
  $('tab-fav-sugg').classList.add('is-active');
  $('tab-fav-items').classList.remove('is-active');
  $('panel-fav-items').hidden = true;
  $('panel-fav-sugg').hidden = false;
  renderSuggestionsFavoris();
});
$('panel-fav-items').addEventListener('click', favClickHandler);
$('fav-sugg-list').addEventListener('click', e => {
  const li = e.target.closest('[data-sugg-text]');
  if (!li || !e.target.closest('[data-add-sugg]')) return;
  const text = li.dataset.suggText;
  state.favoris.items.push({ id: uid(), text });
  save();
  renderFavoris();
  renderSuggestionsFavoris();
  toast(`★ ${text} ajouté aux favoris`);
});
$('btn-clear-fav').addEventListener('click', () => {
  state.favoris.items = [];
  state.favoris.listes = [];
  save();
  renderFavoris();
});
$('btn-clear-sugg').addEventListener('click', () => {
  const items = [...$('fav-sugg-list').querySelectorAll('[data-sugg-text]')];
  if (!items.length) return;
  items.forEach(li => {
    const t = li.dataset.suggText.toLowerCase();
    if (!state.favoris.suggIgnores.map(x => x.toLowerCase()).includes(t))
      state.favoris.suggIgnores.push(li.dataset.suggText);
  });
  save();
  renderSuggestionsFavoris();
});

/* ============================================================
   IA — Suggestions d'articles (v20.1)
   ============================================================ */

async function enrichirItemSilencieux(itemId, text, listId) {
  if (!Sync.user) return;
  try {
    const idToken = await fb.auth.currentUser.getIdToken();
    const list = getList(listId);
    if (!list) return;
    const r = await fetch(WORKER_NOTIFS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, action: 'ia', mode: 'localiser', articles: [text], typeListe: list.type || 'normale' })
    });
    const data = await r.json();
    const s = (data.suggestions || [])[0];
    if (!s?.ou) return;
    const item = getList(listId)?.items.find(i => i.id === itemId);
    if (!item) return;
    item.ou = s.ou;
    save();
    if (currentListId === listId) renderItems();
  } catch {}
}

async function localiserItems(listId) {
  const list = getList(listId);
  if (!list || !Sync.user) { if (!Sync.user) messageCompte('La localisation nécessite un compte connecté.'); return; }
  const aEnrichir = list.items.filter(i => !i._section && i.text && !i.ou);
  if (!aEnrichir.length) { toast('Tous les articles ont déjà une localisation.'); return; }
  closeSheet();
  toast('Localisation en cours…');
  try {
    const idToken = await fb.auth.currentUser.getIdToken();
    const r = await fetch(WORKER_NOTIFS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, action: 'ia', mode: 'localiser', articles: aEnrichir.map(i => i.text), typeListe: list.type || 'normale' })
    });
    const data = await r.json();
    if (data.erreur) throw new Error(data.erreur);
    let updated = 0;
    (data.suggestions || []).forEach(s => {
      if (!s?.ou || !s?.nom) return;
      const item = aEnrichir.find(i => i.text.toLowerCase() === s.nom.toLowerCase());
      if (item) { item.ou = s.ou; updated++; }
    });
    if (updated) { save(); renderItems(); toast(`✅ ${updated} article${updated > 1 ? 's' : ''} localisé${updated > 1 ? 's' : ''}`); }
    else toast('Aucune localisation trouvée.');
  } catch (e) {
    toast('Erreur localisation : ' + e.message);
  }
}

async function demanderIA(mode, options = {}) {
  if (!Sync.user) {
    messageCompte('Les suggestions IA nécessitent un compte connecté.');
    return null;
  }
  try {
    const idToken = await fb.auth.currentUser.getIdToken();
    const r = await fetch(WORKER_NOTIFS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, action: 'ia', mode, ...options })
    });
    const data = await r.json();
    if (data.erreur) throw new Error(data.erreur);
    return data.suggestions || [];
  } catch (e) {
    toast('IA indisponible : ' + e.message);
    return null;
  }
}

function afficherSuggestionsIA(suggestions, list) {
  const existants = new Set(list.items.filter(i => !i._section).map(i => i.text.toLowerCase()));
  const nouveaux = suggestions.filter(s => {
    const nom = typeof s === 'object' ? s.nom : s;
    return !existants.has((nom || '').toLowerCase());
  });

  if (!nouveaux.length) {
    sheetBody.innerHTML = '<p class="ia-msg">Ta liste semble déjà bien complète !</p>';
    sheetBody.onclick = null;
    return;
  }

  sheetBody.innerHTML = `
    <p class="ia-msg">Appuie pour ajouter :</p>
    ${nouveaux.map((s, i) => {
      const nom = typeof s === 'object' ? s.nom : s;
      const ou  = typeof s === 'object' ? s.ou  : '';
      return `<button class="sheet-action ia-sugg" data-ia="${i}">
        <span class="ia-sugg-nom">${esc(nom)}</span>
        ${ou ? `<span class="ia-sugg-ou">${esc(ou)}</span>` : ''}
      </button>`;
    }).join('')}
  `;
  sheetBody.onclick = e => {
    const btn = e.target.closest('[data-ia]');
    if (!btn || btn.disabled) return;
    const s = nouveaux[+btn.dataset.ia];
    const nom = typeof s === 'object' ? s.nom : s;
    const ou  = typeof s === 'object' ? (s.ou || '') : '';
    const newItem = { id: uid(), text: nom, qty: 1, done: false, variants: [] };
    if (ou) newItem.ou = ou;
    getList(currentListId).items.push(newItem);
    save();
    renderItems();
    btn.classList.add('ia-ajoute');
    btn.disabled = true;
    btn.querySelector('.ia-sugg-nom').textContent = '✓ ' + nom;
    btn.querySelector('.ia-sugg-ou')?.remove();
  };
}

async function ouvrirIA() {
  const list = getList(currentListId);
  if (!list) return;

  openSheet('✨ Suggestions IA', [
    {
      icon: '💡',
      label: 'Compléter la liste',
      run: async () => {
        $('sheet-title').textContent = '✨ Analyse…';
        sheetBody.innerHTML = '<p class="ia-msg ia-chargement">L\'IA analyse ta liste…</p>';
        sheetBody.onclick = null;
        sheetBackdrop.hidden = false;

        const articles = list.items.filter(i => !i._section && i.text).map(i => i.text);
        const suggestions = await demanderIA('completer', { articles, typeListe: list.type || 'normale' });
        if (!suggestions) { closeSheet(); return; }

        $('sheet-title').textContent = '✨ Suggestions';
        afficherSuggestionsIA(suggestions, list);
      }
    },
    {
      icon: '📷',
      label: 'Depuis une photo…',
      run: () => {
        closeSheet();
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.onchange = async () => {
          const file = inp.files?.[0];
          if (!file) return;
          sheetBackdrop.hidden = false;
          $('sheet-title').textContent = '📷 Lecture…';
          sheetBody.innerHTML = '<p class="ia-msg ia-chargement">L\'IA lit la photo…</p>';
          sheetBody.onclick = null;
          const dataUrl = await compresserPhoto(file);
          const base64 = dataUrl.split(',')[1];
          const suggestions = await demanderIA('photo', { imageBase64: base64 });
          if (!suggestions) { closeSheet(); return; }
          $('sheet-title').textContent = '📷 Articles détectés';
          afficherSuggestionsIA(suggestions, list);
        };
        inp.click();
      }
    },
    {
      icon: '✍️',
      label: 'Depuis un texte…',
      run: () => {
        closeSheet();
        askText('Décris ta liste', '', async texte => {
          if (!texte.trim()) return;
          $('sheet-title').textContent = '✨ Génération…';
          sheetBody.innerHTML = '<p class="ia-msg ia-chargement">L\'IA prépare ta liste…</p>';
          sheetBody.onclick = null;
          sheetBackdrop.hidden = false;

          const suggestions = await demanderIA('creer', { texte });
          if (!suggestions) { closeSheet(); return; }

          $('sheet-title').textContent = '✨ Articles générés';
          afficherSuggestionsIA(suggestions, list);
        });
      }
    }
  ]);
}

$('btn-ia').addEventListener('click', ouvrirIA);
$('btn-localiser').addEventListener('click', () => localiserItems(currentListId));

/* `tests.html` charge l'app avec ce paramètre. Le rechargement automatique
   ci-dessous viderait alors le cadre en pleine séance : c'est exactement ce qui
   arrive quand on teste juste après une mise à jour, donc au pire moment. */
const sousTest = location.search.includes('tests=1');

if ('serviceWorker' in navigator && !sousTest) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Forcer la vérification de mise à jour dès que l'app revient au premier plan
      // (onglet réactivé, retour depuis le fond sur mobile).
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update();
      });
    }).catch(() => {});
  });

  // Quand un service worker plus récent prend le relais, on recharge une fois
  // pour afficher la nouvelle version sans attendre.
  let rechargement = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (rechargement) return;
    rechargement = true;
    location.reload();
  });
}
