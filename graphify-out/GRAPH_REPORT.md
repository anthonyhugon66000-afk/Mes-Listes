# Graph Report - Mes Listes  (2026-07-27)

## Corpus Check
- 8 files · ~49,749 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 284 nodes · 519 edges · 28 communities (17 shown, 11 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `86989490`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Interface principale & modals
- Architecture globale & config
- Gestion des listes & sheets UI
- Synchronisation Firebase & comptes
- Notifications & badges
- Cloudflare Worker & push notifs
- PWA Manifest
- Auth & connexion
- Icone maskable 512px
- Panneau admin & annonces
- Icone iOS 180px
- Icone badge
- Nouveautes & changelog
- Etat local & migration donnees
- Icone 192px
- Theme & apparence
- Modals basiques
- Traitement image
- Config Firebase
- Service Worker
- Entree app
- Icone 512px (A)
- Icone 512px (B)
- Icone 512px (C)
- Icone 512px (D)
- Sync/Refresh Arc Motif
- themePicker
- ouvrirFormulaireAnnonce

## God Nodes (most connected - your core abstractions)
1. `Sync` - 18 edges
2. `README — Mes Listes` - 18 edges
3. `App Shell (index.html)` - 17 edges
4. `esc()` - 13 edges
5. `save()` - 13 edges
6. `getList()` - 12 edges
7. `renderHome()` - 12 edges
8. `listMenu()` - 12 edges
9. `renderItems()` - 10 edges
10. `demarrerEcoute()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `save()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `quitterListe()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `demanderNotifs()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `shareModal()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `envoyerLien()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Firebase Integration Layer (config + sync + rules)** — firebase_config_js, sync_js, firestore_rules [INFERRED 0.95]
- **Real-App Iframe Test Harness (tests drive live app code)** — tests_html, app_js, sync_js [EXTRACTED 1.00]

## Communities (28 total, 11 thin omitted)

### Community 0 - "Interface principale & modals"
Cohesion: 0.05
Nodes (29): adminBackdrop, COLORS, compteBackdrop, elItems, elLists, elVariantsEdit, ERREURS, ETATS (+21 more)

### Community 1 - "Architecture globale & config"
Cohesion: 0.08
Nodes (36): Account / Auth Modal, Bottom Action Sheet Dialog, Admin Announcement Form, Admin Panel Modal, Admin Push Notification Form, Admin Pseudo Reservation Form, Announcement Banner (non-blocking), Announcement Card Mode (+28 more)

### Community 2 - "Gestion des listes & sheets UI"
Cohesion: 0.11
Nodes (28): badgeMarque(), parQui(), partagee(), renderAccount(), appelerWorker(), assurerCode(), attentes, chargerInvitations() (+20 more)

### Community 3 - "Synchronisation Firebase & comptes"
Cohesion: 0.14
Nodes (32): askText(), closeSheet(), colorPicker(), deleteList(), duplicateList(), editItem(), estProprietaire(), getList() (+24 more)

### Community 4 - "Notifications & badges"
Cohesion: 0.16
Nodes (18): accountModal(), activerNotifs(), afficherMurAuth(), changerMode(), demanderNotifs(), envoyerLien(), etatNotifs(), feedbackModal() (+10 more)

### Community 5 - "Cloudflare Worker & push notifs"
Cohesion: 0.14
Nodes (24): app.js — App Logic, Data, Rendering, Drag-and-Drop, firebase-config.js — Firebase Project Credentials, firestore.rules — Firestore Security Rules, manifest.json — Web App Manifest (PWA Install Config), README — Mes Listes, Administrator Accounts, Badges, and Announcements, Local Backup and Restore (iCloud / Files), Firebase Authentication and Firestore Sync (+16 more)

### Community 6 - "PWA Manifest"
Cohesion: 0.30
Nodes (14): b64url(), BASE_FS(), clesDeGoogle(), cors, deB64url(), envoyer(), fetch(), jetonDeService() (+6 more)

### Community 7 - "Auth & connexion"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

### Community 8 - "Icone maskable 512px"
Cohesion: 0.25
Nodes (11): App Icon (512px Maskable), Bullet List Symbol (4-item list with dots and lines), Blue-Purple Gradient Background, Partial Circle / D-Shape Symbol (right side of icon), Glassmorphism / Frosted Glass Card Style, Maskable PWA Icon Format, App Badge Icon, Badge Style Icon (+3 more)

### Community 9 - "Panneau admin & annonces"
Cohesion: 0.18
Nodes (12): adminModal(), esc(), fermerFormulaireAnnonce(), majBadgeRetours(), mesRetoursModal(), renderAdminRetours(), renderAnnonces(), renderDraft() (+4 more)

### Community 10 - "Icone iOS 180px"
Cohesion: 0.50
Nodes (5): App Icon (180px), Cat Face Mascot / Silhouette, Blue-Purple Gradient Background, iOS Touch Icon Size (180x180), List / Checklist Symbol

### Community 11 - "Icone badge"
Cohesion: 0.50
Nodes (4): annoncerNouveautes(), newsModal(), NOUVEAUTES, renderNews()

### Community 13 - "Etat local & migration donnees"
Cohesion: 0.50
Nodes (4): dateCourte(), exportData(), markBackup(), renderBackupNotice()

### Community 14 - "Icone 192px"
Cohesion: 0.50
Nodes (4): App Icon (192px), Cat Mascot, Blue-to-Purple Gradient Background, List / Checklist Symbol

### Community 16 - "Modals basiques"
Cohesion: 0.67
Nodes (3): lancerConfetti(), PALIERS_STREAK, streakModal()

### Community 26 - "themePicker"
Cohesion: 0.67
Nodes (4): applyTheme(), compresserPhoto(), themePersonnalisable(), themePicker()

### Community 27 - "ouvrirFormulaireAnnonce"
Cohesion: 0.50
Nodes (4): majApercuImage(), majModeAdmin(), messageAdmin(), ouvrirFormulaireAnnonce()

## Knowledge Gaps
- **80 isolated node(s):** `COLORS`, `PHOTOS_EMOJI`, `ICON`, `state`, `screenHome` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sync` connect `Gestion des listes & sheets UI` to `Panneau admin & annonces`, `Synchronisation Firebase & comptes`, `Notifications & badges`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `save()` connect `Synchronisation Firebase & comptes` to `Interface principale & modals`, `Gestion des listes & sheets UI`, `themePicker`, `Etat local & migration donnees`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `COLORS`, `PHOTOS_EMOJI`, `ICON` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Interface principale & modals` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Architecture globale & config` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `Gestion des listes & sheets UI` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Synchronisation Firebase & comptes` be split into smaller, more focused modules?**
  _Cohesion score 0.13709677419354838 - nodes in this community are weakly interconnected._