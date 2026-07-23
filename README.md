# Mes Listes

Application de listes d'articles, installable sur iPhone. Aucune dépendance, aucun
compte, aucun serveur : tes données restent sur ton téléphone.

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
| `icons/` | Icônes de l'app |
