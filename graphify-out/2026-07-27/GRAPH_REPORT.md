# Graph Report - .  (2026-07-27)

## Corpus Check
- Corpus is ~48,413 words - fits in a single context window. You may not need a graph.

## Summary
- 276 nodes · 503 edges · 26 communities (16 shown, 10 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc2af963`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.js
- App Shell (index.html)
- sync.js
- save
- accountModal
- README — Mes Listes
- notifier.js
- manifest.json
- App Icon (512px Maskable)
- adminModal
- App Icon (180px)
- renderNews
- migrate
- markBackup
- App Icon (192px)
- produits.js
- streakModal
- closeModal
- preparerImage
- firebase-config.js
- sw.js
- Mes Listes Application
- Mes Listes App Icon (512px)
- Blue-to-Purple Gradient Background
- Bullet List Motif
- Sync/Refresh Arc Motif

## God Nodes (most connected - your core abstractions)
1. `README — Mes Listes` - 18 edges
2. `App Shell (index.html)` - 17 edges
3. `Sync` - 16 edges
4. `save()` - 13 edges
5. `getList()` - 12 edges
6. `renderHome()` - 12 edges
7. `listMenu()` - 12 edges
8. `esc()` - 11 edges
9. `renderItems()` - 10 edges
10. `demarrerEcoute()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `save()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `quitterListe()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `badgeMarque()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `parQui()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `demanderNotifs()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **4-File Version Synchronization Requirement** — app_js, sw_js, readme_version_management [EXTRACTED 1.00]
- **Firebase Integration Layer (config + sync + rules)** — firebase_config_js, sync_js, firestore_rules [INFERRED 0.95]
- **Real-App Iframe Test Harness (tests drive live app code)** — tests_html, app_js, sync_js [EXTRACTED 1.00]

## Communities (26 total, 10 thin omitted)

### Community 0 - "app.js"
Cohesion: 0.04
Nodes (35): adminBackdrop, askText(), COLORS, compteBackdrop, elItems, elLists, elVariantsEdit, ERREURS (+27 more)

### Community 1 - "App Shell (index.html)"
Cohesion: 0.08
Nodes (36): Account / Auth Modal, Bottom Action Sheet Dialog, Admin Announcement Form, Admin Panel Modal, Admin Push Notification Form, Admin Pseudo Reservation Form, Announcement Banner (non-blocking), Announcement Card Mode (+28 more)

### Community 2 - "sync.js"
Cohesion: 0.14
Nodes (24): appelerWorker(), assurerCode(), attentes, chargerInvitations(), collectionCodes(), collectionInvites(), collectionListes(), contenu() (+16 more)

### Community 3 - "save"
Cohesion: 0.17
Nodes (29): closeSheet(), colorPicker(), deleteList(), duplicateList(), editItem(), esc(), estProprietaire(), getList() (+21 more)

### Community 4 - "accountModal"
Cohesion: 0.12
Nodes (24): accountModal(), activerNotifs(), afficherMurAuth(), applyTheme(), badgeMarque(), changerMode(), compresserPhoto(), demanderNotifs() (+16 more)

### Community 5 - "README — Mes Listes"
Cohesion: 0.14
Nodes (24): app.js — App Logic, Data, Rendering, Drag-and-Drop, firebase-config.js — Firebase Project Credentials, firestore.rules — Firestore Security Rules, manifest.json — Web App Manifest (PWA Install Config), README — Mes Listes, Administrator Accounts, Badges, and Announcements, Local Backup and Restore (iCloud / Files), Firebase Authentication and Firestore Sync (+16 more)

### Community 6 - "notifier.js"
Cohesion: 0.30
Nodes (14): b64url(), BASE_FS(), clesDeGoogle(), cors, deB64url(), envoyer(), fetch(), jetonDeService() (+6 more)

### Community 7 - "manifest.json"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

### Community 8 - "App Icon (512px Maskable)"
Cohesion: 0.25
Nodes (11): App Icon (512px Maskable), Bullet List Symbol (4-item list with dots and lines), Blue-Purple Gradient Background, Partial Circle / D-Shape Symbol (right side of icon), Glassmorphism / Frosted Glass Card Style, Maskable PWA Icon Format, App Badge Icon, Badge Style Icon (+3 more)

### Community 9 - "adminModal"
Cohesion: 0.25
Nodes (8): adminModal(), fermerFormulaireAnnonce(), majApercuImage(), majModeAdmin(), messageAdmin(), ouvrirFormulaireAnnonce(), renderAnnonces(), renderListeAnnonces()

### Community 10 - "App Icon (180px)"
Cohesion: 0.50
Nodes (5): App Icon (180px), Cat Face Mascot / Silhouette, Blue-Purple Gradient Background, iOS Touch Icon Size (180x180), List / Checklist Symbol

### Community 11 - "renderNews"
Cohesion: 0.50
Nodes (4): annoncerNouveautes(), newsModal(), NOUVEAUTES, renderNews()

### Community 12 - "migrate"
Cohesion: 0.50
Nodes (4): clampQty(), load(), migrate(), syncDraft()

### Community 13 - "markBackup"
Cohesion: 0.50
Nodes (4): dateCourte(), exportData(), markBackup(), renderBackupNotice()

### Community 14 - "App Icon (192px)"
Cohesion: 0.50
Nodes (4): App Icon (192px), Cat Mascot, Blue-to-Purple Gradient Background, List / Checklist Symbol

### Community 16 - "streakModal"
Cohesion: 0.67
Nodes (3): lancerConfetti(), PALIERS_STREAK, streakModal()

## Knowledge Gaps
- **80 isolated node(s):** `COLORS`, `PHOTOS_EMOJI`, `ICON`, `state`, `screenHome` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sync` connect `sync.js` to `adminModal`, `save`, `accountModal`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **Why does `save()` connect `save` to `app.js`, `sync.js`, `accountModal`, `markBackup`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `COLORS`, `PHOTOS_EMOJI`, `ICON` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `App Shell (index.html)` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `sync.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13548387096774195 - nodes in this community are weakly interconnected._
- **Should `accountModal` be split into smaller, more focused modules?**
  _Cohesion score 0.12318840579710146 - nodes in this community are weakly interconnected._