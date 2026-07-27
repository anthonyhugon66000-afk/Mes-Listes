# Graph Report - .  (2026-07-27)

## Corpus Check
- 4 files · ~49,789 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 284 nodes · 519 edges · 27 communities (16 shown, 11 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core App Shell
- Sync et Partage
- Structure HTML et Modals
- Edition Listes et Items
- Config et Documentation
- Auth et Compte
- Worker Notifications Push
- PWA Manifest
- Nouveautes et Retours
- Icones 512px Maskable
- Panel Admin et Annonces
- Icones iOS 180px
- Theme et Apparence
- Sauvegarde et Export
- Icones 192px
- Base Produits
- Streak et Gamification
- Quantites et Brouillons
- Modals Utilitaires
- Traitement Images
- Firebase Config
- Service Worker Cache
- Point Entree App
- Icone 512px
- Icone 512px Gradient
- Icone 512px Motif
- Icone 512px Arc Sync

## God Nodes (most connected - your core abstractions)
1. `README — Mes Listes` - 18 edges
2. `Sync` - 18 edges
3. `App Shell (index.html)` - 17 edges
4. `esc()` - 13 edges
5. `save()` - 13 edges
6. `getList()` - 12 edges
7. `renderHome()` - 12 edges
8. `listMenu()` - 12 edges
9. `fetch()` - 10 edges
10. `renderItems()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Firebase Authentication and Firestore Sync` --conceptually_related_to--> `Firestore Write and Settings Convergence Test Suites`  [INFERRED]
  README.md → tests.html
- `Push Notification System via Cloudflare Worker and FCM` --conceptually_related_to--> `Cloudflare Worker Notification Test Suite`  [INFERRED]
  README.md → tests.html
- `Collaborative List Sharing Feature` --conceptually_related_to--> `Invitation System Test Suite`  [INFERRED]
  README.md → tests.html
- `save()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js
- `quitterListe()` --references--> `Sync`  [EXTRACTED]
  app.js → sync.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Firebase Integration Layer (config + sync + rules)** — firebase_config_js, sync_js, firestore_rules [INFERRED 0.95]
- **Real-App Iframe Test Harness (tests drive live app code)** — tests_html, app_js, sync_js [EXTRACTED 1.00]

## Communities (27 total, 11 thin omitted)

### Community 0 - "Core App Shell"
Cohesion: 0.05
Nodes (29): adminBackdrop, COLORS, compteBackdrop, elItems, elLists, elVariantsEdit, ERREURS, ETATS (+21 more)

### Community 1 - "Sync et Partage"
Cohesion: 0.11
Nodes (28): badgeMarque(), parQui(), partagee(), renderAccount(), appelerWorker(), assurerCode(), attentes, chargerInvitations() (+20 more)

### Community 2 - "Structure HTML et Modals"
Cohesion: 0.08
Nodes (36): Account / Auth Modal, Bottom Action Sheet Dialog, Admin Announcement Form, Admin Panel Modal, Admin Push Notification Form, Admin Pseudo Reservation Form, Announcement Banner (non-blocking), Announcement Card Mode (+28 more)

### Community 3 - "Edition Listes et Items"
Cohesion: 0.14
Nodes (32): askText(), closeSheet(), colorPicker(), deleteList(), duplicateList(), editItem(), estProprietaire(), getList() (+24 more)

### Community 4 - "Config et Documentation"
Cohesion: 0.14
Nodes (24): app.js — App Logic, Data, Rendering, Drag-and-Drop, firebase-config.js — Firebase Project Credentials, firestore.rules — Firestore Security Rules, manifest.json — Web App Manifest (PWA Install Config), README — Mes Listes, Administrator Accounts, Badges, and Announcements, Local Backup and Restore (iCloud / Files), Firebase Authentication and Firestore Sync (+16 more)

### Community 5 - "Auth et Compte"
Cohesion: 0.16
Nodes (18): accountModal(), activerNotifs(), afficherMurAuth(), changerMode(), demanderNotifs(), envoyerLien(), etatNotifs(), feedbackModal() (+10 more)

### Community 6 - "Worker Notifications Push"
Cohesion: 0.30
Nodes (14): b64url(), BASE_FS(), clesDeGoogle(), cors, deB64url(), envoyer(), fetch(), jetonDeService() (+6 more)

### Community 7 - "PWA Manifest"
Cohesion: 0.17
Nodes (11): background_color, description, display, icons, lang, name, orientation, scope (+3 more)

### Community 8 - "Nouveautes et Retours"
Cohesion: 0.18
Nodes (11): annoncerNouveautes(), esc(), majBadgeRetours(), mesRetoursModal(), newsModal(), NOUVEAUTES, renderDraft(), renderInvitationsRecues() (+3 more)

### Community 9 - "Icones 512px Maskable"
Cohesion: 0.25
Nodes (11): App Icon (512px Maskable), Bullet List Symbol (4-item list with dots and lines), Blue-Purple Gradient Background, Partial Circle / D-Shape Symbol (right side of icon), Glassmorphism / Frosted Glass Card Style, Maskable PWA Icon Format, App Badge Icon, Badge Style Icon (+3 more)

### Community 10 - "Panel Admin et Annonces"
Cohesion: 0.22
Nodes (9): adminModal(), fermerFormulaireAnnonce(), majApercuImage(), majModeAdmin(), messageAdmin(), ouvrirFormulaireAnnonce(), renderAdminRetours(), renderAnnonces() (+1 more)

### Community 11 - "Icones iOS 180px"
Cohesion: 0.50
Nodes (5): App Icon (180px), Cat Face Mascot / Silhouette, Blue-Purple Gradient Background, iOS Touch Icon Size (180x180), List / Checklist Symbol

### Community 12 - "Theme et Apparence"
Cohesion: 0.67
Nodes (4): applyTheme(), compresserPhoto(), themePersonnalisable(), themePicker()

### Community 13 - "Sauvegarde et Export"
Cohesion: 0.50
Nodes (4): dateCourte(), exportData(), markBackup(), renderBackupNotice()

### Community 14 - "Icones 192px"
Cohesion: 0.50
Nodes (4): App Icon (192px), Cat Mascot, Blue-to-Purple Gradient Background, List / Checklist Symbol

### Community 16 - "Streak et Gamification"
Cohesion: 0.67
Nodes (3): lancerConfetti(), PALIERS_STREAK, streakModal()

## Knowledge Gaps
- **80 isolated node(s):** `FIREBASE_CONFIG`, `name`, `short_name`, `description`, `start_url` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Sync` connect `Sync et Partage` to `Nouveautes et Retours`, `Panel Admin et Annonces`, `Edition Listes et Items`, `Auth et Compte`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `save()` connect `Edition Listes et Items` to `Core App Shell`, `Sync et Partage`, `Theme et Apparence`, `Sauvegarde et Export`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `FIREBASE_CONFIG`, `name`, `short_name` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Sync et Partage` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Structure HTML et Modals` be split into smaller, more focused modules?**
  _Cohesion score 0.07777777777777778 - nodes in this community are weakly interconnected._
- **Should `Edition Listes et Items` be split into smaller, more focused modules?**
  _Cohesion score 0.13709677419354838 - nodes in this community are weakly interconnected._