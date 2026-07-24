# Mes Listes

Application de listes d'articles, installable sur iPhone via safari. Aucune dépendance, aucun
compte, aucun serveur : tes données restent sur ton téléphone.
Voici le site: https://anthonyhugon66000-afk.github.io/Mes-Listes/

## Fonctionnalités

**Les listes**
- Créer, renommer, dupliquer, supprimer
- Choisir une couleur parmi 10
- Réorganiser en glissant la poignée `≡`

**Les articles**
- Ajouter depuis le champ en bas de l'écran
- **Toucher le cercle** pour cocher / décocher
- **Toucher le nom** pour ouvrir la fiche et modifier l'article
- Choisir une **quantité** : le nombre d'exemplaires voulus, affiché en `×3`
  au bout de la ligne
- Donner des **variantes** à un article : la précision qui distingue deux
  exemplaires du même produit — taille, modèle, coloris, référence — chacune
  avec sa propre quantité.
  *Article :* Maillot équipe de France — *variantes :* domicile ×2, extérieur ×1
- Supprimer un article, ou tous les articles cochés d'un coup
- Tout décocher (pratique pour réutiliser une liste de courses)
- Masquer les articles cochés
- Réorganiser en glissant la poignée `≡`

Dès qu'un article a plusieurs variantes, chacune se coche séparément : l'article
n'est terminé que lorsque toutes le sont. Cocher l'article coche tout d'un coup.
Le compteur en haut de la liste indique les articles faits puis, quand les
quantités s'en écartent, le nombre total d'exemplaires à rapporter :
`2 sur 5 · 12 au total`.

Toute suppression peut être annulée pendant 5 secondes via la notification qui apparaît.

## Compte et synchronisation

Facultatif. Sans compte, l'app se comporte exactement comme avant : tout reste
sur l'appareil, et le SDK Firebase n'est même pas téléchargé.

Une carte sur l'écran d'accueil explique ce qu'un compte apporte, dès qu'il y a
au moins une liste à protéger. Elle s'écarte d'un toucher et ne revient pas avant
un mois. Tant qu'elle est là, le rappel de sauvegarde ci-dessous s'efface : les
deux visent le même problème, en afficher deux serait du harcèlement.

Menu **⋯** → **Se connecter** : par Google, ou par e-mail et mot de passe. Une
fois connecté, les listes sont tenues à jour dans Firestore et arrivent d'elles-
mêmes sur les autres appareils. Le hors-connexion continue de fonctionner :
les modifications sont mises en file et partent au retour du réseau.

À la première connexion, les listes déjà présentes sur l'appareil sont versées
dans le compte. Elles sont reconnues à leur identifiant, donc se reconnecter
ne duplique rien.

### Partager une liste

Menu de la liste → **Partager** → saisir une adresse e-mail.

**Aucun courriel n'est envoyé** : l'app n'a pas de serveur pour ça. L'invitation
est déposée dans Firestore au nom de l'adresse ; la personne la récupère à sa
prochaine ouverture, une fois connectée avec cette même adresse. La liste
apparaît alors chez elle et un message le lui signale.

Ce détour vient d'une contrainte réelle : rien ne permet de traduire une adresse
en identifiant de compte avant que la personne se connecte. Publier cette
correspondance laisserait n'importe qui parcourir les adresses de tout le monde.

On peut aussi inviter par **code ami** : chaque compte reçoit un numéro court et
unique (affiché dans ⋯ → Compte), à donner sans révéler son adresse. Il est rangé
dans la collection `codes`, consultable un par un si l'on connaît le numéro
exact, jamais listable — personne ne peut parcourir l'annuaire.

**Une invitation ne rejoint plus automatiquement.** Elle attend sur l'écran
d'accueil de la personne, qui **Rejoint** ou **Refuse**. Deux voies coexistent :
par adresse (l'invitation est adressée à l'e-mail, la personne n'a pas forcément
de compte) ou par code (adressée à l'identifiant du compte).

Chacun coche de son côté, tout le monde voit les modifications. Le propriétaire
peut retirer quelqu'un ou annuler une invitation en attente. **Un invité ne voit
pas « Supprimer » — il voit « Quitter la liste »**, qui le retire sans effacer le
travail commun. Seul le propriétaire peut supprimer pour tout le monde.

### Qui a coché quoi

Sur une liste à plusieurs, un article coché porte le nom de qui l'a coché — la
partie de l'adresse avant l'arobase. Rien ne s'affiche pour ses propres cases,
ni sur une liste qu'on est seul à voir : la mention n'apparaît que là où elle
apprend quelque chose. Décocher efface la signature.

### Connexion sans mot de passe

Bouton **Recevoir un lien** dans la fenêtre de compte. Firebase envoie un lien,
l'ouvrir suffit. L'adresse est gardée de côté en attendant le retour : le lien
seul ne prouve pas qui l'a demandé, et Firebase la redemande s'il est ouvert sur
un autre appareil.

Demande d'activer **Lien e-mail (connexion sans mot de passe)** dans la console
Firebase : Authentication → Sign-in method → E-mail/Mot de passe.

### Numéro de version

Affiché en bas à gauche de l'écran d'accueil. Il permet de vérifier d'un coup
d'œil, sur un téléphone, que la dernière version est bien arrivée.

Il s'écrit **majeur.mineur** :

| | Quand | Exemple |
|---|---|---|
| **Majeur** | nouvelle fonctionnalité, refonte, changement du modèle de données | `v15` → `v16` |
| **Mineur** | correctif, retouche de texte ou de mise en page | `v15` → `v15.1` → `v15.2` |

**À chaque publication, le numéro se change à quatre endroits** — il vaut mieux
les traiter comme un bloc :

| Fichier | Ce qu'il faut changer |
|---|---|
| `app.js` | la constante `VERSION` |
| `sw.js` | le nom du cache `CACHE` |
| `sw.js` | les `?v…` de la liste `ASSETS` |
| `index.html` | les `?v…` du style et des trois scripts |

Ces `?v…` ne sont pas une coquetterie. Sans eux, une page fraîchement
téléchargée pouvait s'exécuter avec un `app.js` resté en cache : les
identifiants ne correspondaient plus, le script s'arrêtait sur la première
référence introuvable, et l'app restait à moitié morte sans rien afficher.

Une fois connecté, l'état de la synchro s'y ajoute — `synchronisé`, `envoi…`,
`hors ligne`, ou `erreur de synchro` en rouge. Il est déduit des métadonnées de
Firestore : `hasPendingWrites` dit qu'une modification attend son tour,
`fromCache` que la réponse vient du disque faute de serveur joignable.

### Mise en place côté Firebase

1. Projet créé sur [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication** : méthodes **E-mail/Mot de passe** et **Google** activées
3. **Authentication → Paramètres → Domaines autorisés** : ajouter le domaine où
   l'app est servie, sans quoi toute connexion est refusée
4. **Firestore Database** créée, en mode production
5. **Firestore → Règles** : coller le contenu de [`firestore.rules`](firestore.rules),
   puis **Publier**. Sans ça la base refuse tout et l'app affiche « Accès refusé »
6. Les identifiants du projet vont dans [`firebase-config.js`](firebase-config.js).
   Ces valeurs sont publiques par nature : elles désignent le projet, elles
   n'autorisent rien. Ce sont les règles qui protègent les données.

## Notifications

Menu **⋯** → **Notifications**. Elles préviennent quand quelqu'un modifie une
liste partagée, et quand on t'invite sur une liste.

Elles arrivent **même app fermée**, grâce à un petit serveur chez Cloudflare —
un site statique ne peut rien envoyer par lui-même.

### Comment ça circule

```
Un appareil modifie une liste partagée
   ↓ écrit dans Firestore
   ↓ appelle le Worker Cloudflare
Worker  ──►  Firebase Cloud Messaging  ──►  les autres appareils
```

**L'app n'envoie jamais de jetons.** Elle dit seulement quelle liste elle vient
de modifier, avec son jeton d'identité. Le Worker vérifie cette identité contre
les clés publiques de Google, vérifie que l'appelant est bien membre de la
liste, puis va lui-même chercher les jetons des autres membres. Sans ce
détour, n'importe quel compte pourrait se servir du Worker pour arroser des
appareils au hasard.

Les avis sont différés de cinq secondes et regroupés : cocher cinq articles
d'affilée ne déclenche qu'une notification.

Le code du Worker est dans [`worker/notifier.js`](worker/notifier.js), à coller
dans l'éditeur Cloudflare. Son unique secret, `CLE_SERVICE`, est le fichier JSON
de compte de service Firebase — **il ne doit jamais entrer dans ce dépôt**.

Sur iPhone, l'app doit être **installée sur l'écran d'accueil** : Safari ne les
affiche pas. L'autorisation est demandée par un bouton, jamais au chargement —
et si tu refuses, iOS ne redemande plus, il faut passer par Réglages.

La notification porte le nom et l'icône de l'app, qu'iOS reprend de l'écran
d'accueil. Sur Android, `icons/icon-badge.png` fournit la silhouette blanche
attendue à côté du nom ; elle est extraite des formes blanches de l'icône
principale.

## Pseudo

Menu **⋯** → **Compte** → **Ton pseudo**. Il remplace le début de ton adresse
partout où les autres te voient : l'étiquette de qui a coché quoi. Il suit le
compte, comme le thème. Laissé vide, c'est le début de l'adresse qui s'affiche.

## Nouveautés

Menu **⋯** → **Nouveautés**. La fenêtre s'ouvre aussi d'elle-même au premier
lancement d'une nouvelle version — mais jamais à la toute première ouverture de
l'app, qui n'a rien à annoncer.

## Apparence

**Réservée aux comptes.** Menu **⋯** → **Apparence** : mode **Automatique**,
**Clair** ou **Sombre**, et la couleur des boutons parmi dix. En automatique
l'app suit le réglage du téléphone en direct, sans avoir besoin d'être rouverte.

L'apparence **suit le compte** : le violet choisi sur le téléphone se retrouve
sur l'ordinateur. Elle est rangée dans `users/{uid}`, à part des listes, parce
que c'est un réglage personnel et non un contenu partageable.

Sans compte, l'app suit le réglage clair ou sombre du téléphone, et la feuille
Apparence explique pourquoi elle est fermée plutôt que d'afficher des options
mortes. Les préférences déjà choisies sont conservées, pas effacées : elles
reprennent effet à la reconnexion.

## Installer sur l'iPhone

L'app doit être servie en **HTTPS** pour fonctionner hors connexion. La méthode la
plus simple et gratuite est GitHub Pages.

### 1. Publier sur GitHub Pages

Depuis ce dossier :

```bash
git init && git add -A && git commit -m "Mes Listes"
```

Crée ensuite un dépôt **public** nommé `mes-listes` sur GitHub, puis :

```bash
git remote add origin https://github.com/TON-PSEUDO/mes-listes.git && git push -u origin main
```

Dans le dépôt sur GitHub : **Settings → Pages → Source : `Deploy from a branch`**,
branche `main`, dossier `/ (root)`, puis **Save**. Au bout d'une minute l'app est
disponible à l'adresse `https://TON-PSEUDO.github.io/mes-listes/`.

### 2. Ajouter à l'écran d'accueil

Sur l'iPhone, **avec Safari** (Chrome ne sait pas installer les apps web) :

1. Ouvre l'adresse `https://TON-PSEUDO.github.io/mes-listes/`
2. Appuie sur le bouton **Partager** (le carré avec la flèche vers le haut)
3. Choisis **Sur l'écran d'accueil**
4. Appuie sur **Ajouter**

L'app apparaît avec son icône, s'ouvre en plein écran sans barre d'adresse, et
fonctionne sans connexion.

## Les tests

Double-clique sur **`Lancer les tests.bat`** : il démarre le serveur local et
ouvre la page. Puis un bouton **Lancer les tests**, et c'est tout. Rien ne
démarre tout seul.

**Ouvrir `tests.html` directement depuis le disque ne marche pas** : le
navigateur traite alors chaque fichier comme un site étranger aux autres, et
interdit à la page de lire dans l'application. Elle le détecte et l'explique
plutôt que d'échouer sur un message obscur.

La page charge la véritable application dans un cadre invisible et exerce son
code réel — le même `app.js`, le même `sync.js`, le même HTML. Un test ne peut
donc pas passer sur une copie pendant que l'app, elle, serait cassée.

**Tes listes sont mises de côté avant et remises à l'identique après**, y compris
si un test échoue : la page partage le stockage de l'app, et les tests ont besoin
d'y écrire.

L'app est chargée avec le paramètre `?tests=1`, qui lui fait sauter
l'enregistrement du service worker. Sans ça, lancer les tests juste après une
mise à jour rechargeait le cadre en pleine séance — au pire moment, donc.

Le bouton **Copier les résultats** met un compte rendu dans le presse-papier,
prêt à être collé — bilan, échecs détaillés avec l'attendu et l'obtenu, puis un
résumé par groupe.

Les tests couvrent la migration des anciennes données, les quantités et
variantes, le cochage en cascade, l'échappement des caractères, le rendu des
deux écrans, le thème et son verrou, les bandeaux, les signatures et la
convergence de la synchronisation, les écritures vers Firestore, les
invitations, le formulaire de connexion, les messages d'erreur, le partage,
l'aller-retour export/import, la fiche d'un article et l'annulation.

Ce qu'ils **ne peuvent pas** couvrir, et que la page indique elle-même : tout ce
qui demande un vrai compte Firebase, la feuille de partage iOS, les
notifications, le service worker, et l'apparence.

## Tester sur l'ordinateur

```bash
python -m http.server 8123
```

Puis ouvre <http://localhost:8123>. Pour tester depuis l'iPhone sur le même Wi-Fi,
remplace `localhost` par l'adresse IP locale du PC — l'app sera utilisable, mais
sans le mode hors connexion (réservé au HTTPS).

## Sauvegarder tes données

Les listes vivent dans le stockage local du téléphone. Depuis iOS 14, une app web
ajoutée à l'écran d'accueil dispose de son propre espace, séparé de Safari :
effacer les données de navigation n'y touche pas. En revanche **supprimer l'icône
de l'écran d'accueil efface les listes**, et rien ne survit à un changement de
téléphone.

D'où la sauvegarde, dans le menu **⋯** en haut à droite :

- **Sauvegarder mes listes** ouvre la feuille de partage iOS. Choisis
  **Enregistrer dans Fichiers** puis un dossier **iCloud Drive** : le fichier
  quitte alors l'appareil. Sur ordinateur, c'est un téléchargement classique.
- **Restaurer une sauvegarde** relit un de ces fichiers.

La date de la dernière sauvegarde est rappelée dans ce même menu. Passé deux
semaines sans sauvegarde, un bandeau discret le signale sur l'écran d'accueil ;
la croix le met en sourdine pour une semaine.

Quand l'app est vide — après une réinstallation, typiquement — l'écran d'accueil
propose directement **Restaurer depuis Fichiers ou iCloud**. Il faut ce geste :
aucun navigateur n'autorise une page web à lire tes fichiers sans que tu les
désignes toi-même.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Structure des deux écrans |
| `styles.css` | Apparence, thèmes clair et sombre automatiques |
| `app.js` | Logique : données, affichage, glisser-déposer |
| `manifest.json` | Nom, icônes et mode plein écran de l'app installée |
| `sw.js` | Service worker — fonctionnement hors connexion |
| `sync.js` | Compte Firebase et synchronisation des listes |
| `firebase-config.js` | Identifiants du projet Firebase |
| `firestore.rules` | Règles d'accès à coller dans la console Firebase |
| `worker/notifier.js` | Envoi des notifications — à coller dans le Worker Cloudflare |
| `tests.html` | Tests — à ouvrir via `Lancer les tests.bat` |
| `icons/` | Icônes de l'app, dont `icon-badge.png` pour les notifications Android |
