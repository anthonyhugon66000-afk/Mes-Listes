/* ============================================================
   Mes Listes — application de listes d'articles
   Données stockées localement sur l'appareil (localStorage).
   ============================================================ */

const STORE_KEY = 'meslistes.v1';

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

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    alert("Impossible d'enregistrer : la mémoire du navigateur est pleine.");
  }
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
    const sub = total === 0
      ? 'Vide'
      : `${done} sur ${total} ${total > 1 ? 'articles' : 'article'}`;

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
  renderBackupNotice();
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

  openSheet(list.name, [
    { label: 'Renommer', icon: '✏️', run: () => renameList(id) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(id) },
    { label: 'Dupliquer', icon: '📄', run: () => duplicateList(id) },
    { label: 'Supprimer', icon: '🗑️', danger: true, run: () => deleteList(id) }
  ]);
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

  const ligneVariante = e.target.closest('[data-vid]');
  if (ligneVariante && e.target.closest('[data-vtoggle]')) {
    const v = item.variants.find(x => x.id === ligneVariante.dataset.vid);
    if (v) {
      v.done = !v.done;
      item.done = item.variants.every(x => x.done);
      save();
      renderItems();
    }
    return;
  }

  if (e.target.closest('[data-toggle]')) {
    // Cocher l'article coche d'un coup toutes ses variantes, et inversement.
    const etat = !itemDone(item);
    item.done = etat;
    item.variants.forEach(v => v.done = etat);
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
    { label: 'Tout décocher', icon: '↩️', run: () => {
        snapshot();
        list.items.forEach(i => { i.done = false; i.variants.forEach(v => v.done = false); });
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

  openSheet(`${count} liste${count > 1 ? 's' : ''}`, [
    { label: 'Apparence', icon: '🎨', run: themePicker },
    { label: 'Sauvegarder mes listes', icon: '⬇️', run: exportData },
    { label: 'Restaurer une sauvegarde', icon: '⬆️', run: importData }
  ], { html: `<p class="sheet-note">${esc(info)}</p>` });
});

/* ---------- Apparence ---------- */

const MODES = [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']];
const ACCENT_DEFAUT = '#007aff';
const nuitPreferee = matchMedia('(prefers-color-scheme: dark)');

function applyTheme() {
  const choix = state.theme || 'auto';
  const sombre = choix === 'dark' || (choix === 'auto' && nuitPreferee.matches);

  document.documentElement.dataset.theme = sombre ? 'dark' : 'light';
  if (state.accent) document.documentElement.style.setProperty('--accent', state.accent);
  else document.documentElement.style.removeProperty('--accent');
  $('meta-theme').content = sombre ? '#000000' : '#f2f2f7';
}

// En mode automatique, l'app suit le basculement jour/nuit du téléphone sans
// qu'on ait à la rouvrir.
nuitPreferee.addEventListener('change', () => {
  if ((state.theme || 'auto') === 'auto') applyTheme();
});

function themePicker() {
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

/* Bandeau de rappel : discret, et seulement quand il y a quelque chose à perdre. */
function renderBackupNotice() {
  const el = $('backup-notice');
  const derniere = state.lastBackup || 0;
  const montrer = state.lists.length > 0
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

applyTheme();
renderHome();

if ('serviceWorker' in navigator) {
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
