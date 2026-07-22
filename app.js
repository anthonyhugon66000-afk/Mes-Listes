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
      if (Array.isArray(data.lists)) return data;
    }
  } catch (e) {
    console.warn('Données illisibles, réinitialisation.', e);
  }
  return { lists: [], hideDone: false };
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    alert("Impossible d'enregistrer : la mémoire du navigateur est pleine.");
  }
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const getList = id => state.lists.find(l => l.id === id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

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
    const done = list.items.filter(i => i.done).length;
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
    items: list.items.map(i => ({ id: uid(), text: i.text, done: i.done }))
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

  const visible = state.hideDone ? list.items.filter(i => !i.done) : list.items;

  elItems.innerHTML = visible.map(item => `
    <li class="row item ${item.done ? 'done' : ''}" data-id="${item.id}">
      <button class="row-main" data-toggle>
        <span class="check" style="background:${item.done ? list.color : 'transparent'}">${ICON.check}</span>
        <span class="row-text"><span class="row-title">${esc(item.text)}</span></span>
      </button>
      <button class="row-btn danger" data-del aria-label="Supprimer">${ICON.trash}</button>
      <span class="handle" data-handle aria-label="Déplacer">${ICON.handle}</span>
    </li>`).join('');

  const done = list.items.filter(i => i.done).length;
  $('list-progress').textContent = `${done} sur ${list.items.length}`;
  $('btn-toggle-done').textContent = state.hideDone ? 'Afficher les cochés' : 'Masquer les cochés';
  $('empty-items').classList.toggle('is-visible', visible.length === 0);
}

elItems.addEventListener('click', e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  const list = getList(currentListId);
  const item = list.items.find(i => i.id === row.dataset.id);
  if (!item) return;

  if (e.target.closest('[data-toggle]')) {
    item.done = !item.done;
    save();
    renderItems();
  } else if (e.target.closest('[data-del]')) {
    snapshot();
    list.items = list.items.filter(i => i.id !== item.id);
    save();
    renderItems();
    toast(`« ${item.text} » supprimé`);
  }
});

/* Appui long sur un article → renommer */
elItems.addEventListener('contextmenu', e => {
  const row = e.target.closest('[data-id]');
  if (!row) return;
  e.preventDefault();
  const list = getList(currentListId);
  const item = list.items.find(i => i.id === row.dataset.id);
  if (!item) return;
  askText("Modifier l'article", item.text, text => {
    item.text = text;
    save();
    renderItems();
  });
});

$('form-add-item').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('input-item');
  const text = input.value.trim();
  if (!text) return;
  getList(currentListId).items.push({ id: uid(), text, done: false });
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
  const doneCount = list.items.filter(i => i.done).length;

  openSheet(list.name, [
    { label: 'Renommer la liste', icon: '✏️', run: () => renameList(currentListId) },
    { label: 'Changer la couleur', icon: '🎨', run: () => colorPicker(currentListId) },
    { label: 'Tout décocher', icon: '↩️', run: () => {
        snapshot();
        list.items.forEach(i => i.done = false);
        save(); renderItems();
      } },
    { label: `Supprimer les articles cochés (${doneCount})`, icon: '🧹', danger: true, run: () => {
        if (!doneCount) return;
        snapshot();
        list.items = list.items.filter(i => !i.done);
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
    list.items = [...shown, ...list.items.filter(i => i.done)];
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

function askText(title, value, callback) {
  $('modal-title').textContent = title;
  modalInput.value = value;
  modalCallback = callback;
  modalBackdrop.hidden = false;
  setTimeout(() => { modalInput.focus(); modalInput.select(); }, 50);
}

function closeModal() { modalBackdrop.hidden = true; modalCallback = null; }

function confirmModal() {
  const value = modalInput.value.trim();
  if (!value) return closeModal();
  const cb = modalCallback;
  closeModal();
  cb(value);
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
  $('toast').hidden = true;
  if (currentListId && getList(currentListId)) renderItems();
  else goHome();
});

/* ============================================================
   Réglages — sauvegarde et restauration
   ============================================================ */

$('btn-settings').addEventListener('click', () => {
  const count = state.lists.length;
  openSheet(`${count} liste${count > 1 ? 's' : ''}`, [
    { label: 'Exporter une sauvegarde', icon: '⬇️', run: exportData },
    { label: 'Importer une sauvegarde', icon: '⬆️', run: importData }
  ]);
});

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mes-listes-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

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
        state = data;
        save();
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
