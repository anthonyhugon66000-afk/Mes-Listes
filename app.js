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
const VERSION = 'v17.5';

const COLORS = [
  '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7be',
  '#007aff', '#5856d6', '#af52de', '#ff2d55', '#8e8e93'
];

const ICON = {
  chevron: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
  handle:  '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>',
  check:   '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  trash:   '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>'
};

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
  return { lists: [], hideDone: false };
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
  });
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
const elLists = $('lists');
const elItems = $('items');

/* ============================================================
   Écran 1 — les listes
   ============================================================ */

function renderHome() {
  elLists.innerHTML = state.lists.map(list => {
    const total = list.items.length;
    const done = list.items.filter(itemDone).length;
    const partagee = (list.members || []).length > 1;
    const sub = (total === 0
      ? 'Vide'
      : `${done} sur ${total} ${total > 1 ? 'articles' : 'article'}`)
      + (partagee ? ' · partagée' : '');

    return `
      <li class="row" data-id="${list.id}">
        <span class="color-bar" style="background:${list.color}"></span>
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

$('btn-new-list').addEventListener('click', () => {
  askText('Nouvelle liste', '', name => {
    state.lists.push({ id: uid(), name, color: COLORS[state.lists.length % COLORS.length], items: [] });
    save();
    renderHome();
  });
});

/* ---------- Menu d'une liste ---------- */

function listMenu(id) {
  const list = getList(id);
  if (!list) return;

  const actions = [
    { label: 'Renommer', icon: '✏️', run: () => renameList(id) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(id) },
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
  toast(`« ${list.name} » supprimée`);
}

function colorPicker(id) {
  const list = getList(id);
  const html = `<div class="swatches">` + COLORS.map(c =>
    `<button class="swatch" style="--c:${c}" data-color="${c}"
             aria-checked="${c === list.color}" aria-label="Couleur ${c}"></button>`
  ).join('') + `</div>`;

  openSheet('Couleur de la liste', [], {
    html,
    onClick: e => {
      const sw = e.target.closest('[data-color]');
      if (!sw) return;
      list.color = sw.dataset.color;
      save();
      renderHome();
      if (currentListId === id) renderItems();
      closeSheet();
    }
  });
}

/* ============================================================
   Écran 2 — les articles
   ============================================================ */

function openList(id) {
  currentListId = id;
  const list = getList(id);
  $('list-title').textContent = list.name;
  screenHome.classList.remove('is-active');
  screenList.classList.add('is-active');
  renderItems();
}

function goHome() {
  currentListId = null;
  screenList.classList.remove('is-active');
  screenHome.classList.add('is-active');
  renderHome();
}

const partagee = list => (list.members || []).length > 1;

/* Sur une liste à plusieurs, savoir qui a coché évite le doute — et le double
   achat. Inutile de se nommer soi-même, ni sur une liste qu'on est seul à voir. */
function parQui(nom, list) {
  if (!partagee(list) || !nom || nom === Sync.nomAffiche()) return '';
  // Les cases cochées avant les pseudos portent une adresse : on n'en montre
  // que le début, comme on le faisait alors.
  return `<span class="par-qui">${esc(String(nom).split('@')[0])}</span>`;
}

function renderItems() {
  const list = getList(currentListId);
  if (!list) return goHome();

  const visible = state.hideDone ? list.items.filter(i => !itemDone(i)) : list.items;

  elItems.innerHTML = visible.map(item => {
    const done = itemDone(item);
    const total = itemQty(item);
    // Une variante seule tient sur la ligne du dessous, comme un sous-titre : lui
    // donner sa propre case à cocher ferait doublon avec celle de l'article.
    const seule = item.variants.length === 1 ? item.variants[0] : null;

    return `
    <li class="row item ${done ? 'done' : ''}" data-id="${item.id}">
      <div class="item-head">
        <button class="check-hit" data-toggle
                aria-label="${done ? 'Décocher' : 'Cocher'} ${esc(item.text)}">
          <span class="check" style="background:${done ? list.color : 'transparent'}">${ICON.check}</span>
        </button>
        <button class="row-main" data-edit aria-label="Modifier ${esc(item.text)}">
          <span class="row-text">
            <span class="row-title">${esc(item.text)}</span>
            ${seule ? `<span class="row-sub">${esc(seule.name)}</span>` : ''}
          </span>
        </button>
        ${done ? parQui(item.doneBy, list) : ''}
        ${total > 1 ? `<span class="qty">×${total}</span>` : ''}
        <button class="row-btn danger" data-del aria-label="Supprimer">${ICON.trash}</button>
        <span class="handle" data-handle aria-label="Déplacer">${ICON.handle}</span>
      </div>
      ${item.variants.length > 1 ? `
      <ul class="variants">
        ${item.variants.map(v => `
        <li class="variant ${v.done ? 'done' : ''}" data-vid="${v.id}">
          <button class="variant-hit" data-vtoggle
                  aria-label="${v.done ? 'Décocher' : 'Cocher'} ${esc(v.name)}">
            <span class="check check-sm" style="background:${v.done ? list.color : 'transparent'}">${ICON.check}</span>
          </button>
          <span class="variant-name">${esc(v.name)}</span>
          ${v.done ? parQui(v.doneBy, list) : ''}
          ${v.qty > 1 ? `<span class="qty">×${v.qty}</span>` : ''}
        </li>`).join('')}
      </ul>` : ''}
    </li>`;
  }).join('');

  const done = list.items.filter(itemDone).length;
  const pieces = list.items.reduce((n, i) => n + itemQty(i), 0);
  $('list-progress').textContent = `${done} sur ${list.items.length}`
    + (pieces !== list.items.length ? ` · ${pieces} au total` : '');
  $('btn-toggle-done').textContent = state.hideDone ? 'Afficher les cochés' : 'Masquer les cochés';
  $('empty-items').classList.toggle('is-visible', visible.length === 0);
}

elItems.addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const list = getList(currentListId);
  const item = list.items.find(i => i.id === row.dataset.id);
  if (!item) return;

  // Qui a coché, pour les listes à plusieurs. Décocher efface la signature :
  // une case vide n'appartient à personne.
  const signer = (cible, etat) => { if (etat) cible.doneBy = Sync.user ? Sync.nomAffiche() : null;
                                    else delete cible.doneBy; };

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
    toast(`« ${item.text} » supprimé`);
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
    variants: item.variants.map(v => ({ ...v }))
  };

  draftApply = d => {
    item.text = d.text;
    item.qty = d.qty;
    item.variants = d.variants;
    if (d.variants.length) item.done = d.variants.every(v => v.done);
    save();
    renderItems();
  };

  $('item-name').value = draft.text;
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

$('form-add-item').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('input-item');
  const text = input.value.trim();
  if (!text) return;
  getList(currentListId).items.push({ id: uid(), text, qty: 1, done: false, variants: [] });
  save();
  input.value = '';
  renderItems();
  // garde le clavier ouvert pour enchaîner les ajouts
  input.focus();
});

$('btn-back').addEventListener('click', goHome);

$('btn-toggle-done').addEventListener('click', () => {
  state.hideDone = !state.hideDone;
  save();
  renderItems();
});

$('btn-list-menu').addEventListener('click', () => {
  const list = getList(currentListId);
  const doneCount = list.items.filter(itemDone).length;

  openSheet(list.name, [
    { label: 'Renommer la liste', icon: '✏️', run: () => renameList(currentListId) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(currentListId) },
    { label: 'Partager la liste', icon: '👥', run: () => shareModal(currentListId) },
    { label: 'Tout décocher', icon: '↩️', run: () => {
        snapshot();
        list.items.forEach(i => {
          i.done = false; delete i.doneBy;
          i.variants.forEach(v => { v.done = false; delete v.doneBy; });
        });
        save(); renderItems();
      } },
    { label: `Supprimer les articles cochés (${doneCount})`, icon: '🧹', danger: true, run: () => {
        if (!doneCount) return;
        snapshot();
        list.items = list.items.filter(i => !itemDone(i));
        save(); renderItems();
        toast(`${doneCount} article${doneCount > 1 ? 's' : ''} supprimé${doneCount > 1 ? 's' : ''}`);
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

function toast(message) {
  $('toast-text').textContent = message;
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

  openSheet(`${count} liste${count > 1 ? 's' : ''}`, [
    { label: Sync.user ? 'Compte et synchronisation' : 'Se connecter', icon: '☁️', run: accountModal },
    { label: `Notifications — ${notifs}`, icon: '🔔', run: notifsModal },
    { label: 'Apparence', icon: '🎨', run: themePicker },
    { label: `Nouveautés de ${VERSION}`, icon: '✨', run: newsModal },
    { label: 'Sauvegarder mes listes', icon: '⬇️', run: exportData },
    { label: 'Restaurer une sauvegarde', icon: '⬆️', run: importData }
  ], { html: `<p class="sheet-note">${esc(info)}</p>` });
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

/* ---------- Nouveautés ---------- */

const NOUVEAUTES = [
  { version: 'v17.5', titre: 'Invitations et code ami', points: [
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
  el.innerHTML = invits.map(inv => `
    <li class="invite-recue" data-inv="${esc(inv.id)}">
      <span class="invite-texte"><strong>${esc(inv.deQui)}</strong> t'invite sur « ${esc(inv.nomListe)} »</span>
      <span class="invite-actions">
        <button class="modal-btn primary" data-rejoindre>Rejoindre</button>
        <button class="link-btn" data-refuser>Refuser</button>
      </span>
    </li>`).join('');
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
    return `
      <li class="person">
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
    "Aucun compte ne porte ce code. Vérifie les chiffres."
};
const messageErreur = code => ERREURS[code] || `Erreur inattendue (${code}).`;

const compteBackdrop = $('account-backdrop');

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
    $('account-who').textContent =
      `Connecté en tant que ${Sync.user.email || 'compte Google'}. Tes listes se synchronisent.`;
    $('account-pseudo').value = state.pseudo || '';
    $('account-code').textContent = Sync.codeAffiche() || 'attribution…';
  }
  if (Sync.erreur) {
    const ou = { listes: 'les listes', reglages: "l'apparence",
                 invitations: 'les invitations', connexion: 'la connexion' }[Sync.origine];
    messageCompte(messageErreur(Sync.erreur) + (ou ? ` (${ou})` : ''), 'erreur');
  }
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
}

function closeAccount() { compteBackdrop.hidden = true; }

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

$('btn-signout').addEventListener('click', () =>
  tenter('Déconnexion…', () => Sync.signOut()));

$('account-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !$('btn-submit').disabled) $('btn-submit').click();
});

/* ---------- Apparence ---------- */

const MODES = [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']];
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

  document.documentElement.dataset.theme = sombre ? 'dark' : 'light';
  if (accent) document.documentElement.style.setProperty('--accent', accent);
  else document.documentElement.style.removeProperty('--accent');
  $('meta-theme').content = sombre ? '#000000' : '#f2f2f7';
}

// En mode automatique, l'app suit le basculement jour/nuit du téléphone sans
// qu'on ait à la rouvrir.
nuitPreferee.addEventListener('change', () => {
  if ((state.theme || 'auto') === 'auto') applyTheme();
});

function themePicker() {
  // Dire pourquoi c'est fermé, et où aller. Une option grisée sans explication
  // laisse juste croire à une panne.
  if (!themePersonnalisable()) {
    return openSheet('Apparence', [
      { label: 'Se connecter', icon: '☁️', run: accountModal }
    ], {
      html: `<p class="sheet-note left">Choisir le thème et la couleur des boutons
             demande un compte. Sans compte, l'app suit le réglage clair ou sombre
             du téléphone.</p>`
    });
  }

  const html = `
    <div class="seg">
      ${MODES.map(([valeur, libelle]) => `
        <button class="seg-btn" data-mode="${valeur}"
                aria-checked="${(state.theme || 'auto') === valeur}">${libelle}</button>`).join('')}
    </div>
    <p class="sheet-note">Couleur des boutons</p>
    <div class="swatches">
      ${COLORS.map(c => `
        <button class="swatch" style="--c:${c}" data-accent="${c}"
                aria-checked="${(state.accent || ACCENT_DEFAUT) === c}"
                aria-label="Couleur ${c}"></button>`).join('')}
    </div>`;

  openSheet('Apparence', [], {
    html,
    onClick: e => {
      const mode = e.target.closest('[data-mode]');
      const accent = e.target.closest('[data-accent]');
      if (!mode && !accent) return;

      if (mode) state.theme = mode.dataset.mode;
      if (accent) state.accent = accent.dataset.accent;
      save();
      applyTheme();
      themePicker();      // réaffiche la feuille avec le nouveau choix coché
    }
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
   Démarrage
   ============================================================ */

/* La synchro prévient l'app quand le compte ou les listes changent — au retour
   du réseau, une modification faite sur l'ordinateur arrive ici toute seule. */
Sync.onChange = () => {
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
    notifier(titre, `${gens.join(' et ')} vient de faire une modification.`, 'modif');
  }

  renderEtatSync();

  // Se connecter sur un appareil déjà autorisé doit y enregistrer le jeton :
  // sans ça, il faudrait redemander une permission déjà accordée.
  if (Sync.user && etatNotifs() === 'granted' && !jetonEnregistre) {
    jetonEnregistre = true;
    Sync.enregistrerJeton().catch(() => { jetonEnregistre = false; });
  }
  if (!Sync.user) jetonEnregistre = false;

  if (!shareBackdrop.hidden && listePartagee) renderPeople();
  if (currentListId && !getList(currentListId)) return goHome();
  renderHome();
  if (currentListId) renderItems();
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
renderEtatSync();
applyTheme();
renderHome();
annoncerNouveautes();

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

/* `tests.html` charge l'app avec ce paramètre. Le rechargement automatique
   ci-dessous viderait alors le cadre en pleine séance : c'est exactement ce qui
   arrive quand on teste juste après une mise à jour, donc au pire moment. */
const sousTest = location.search.includes('tests=1');

if ('serviceWorker' in navigator && !sousTest) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
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
