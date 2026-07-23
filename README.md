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

## Apparence

Menu **⋯** → **Apparence** : mode **Automatique**, **Clair** ou **Sombre**, et la
couleur des boutons parmi dix. En automatique l'app suit le réglage du téléphone
en direct, sans avoir besoin d'être rouverte.

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
| `icons/` | Icônes de l'app |
