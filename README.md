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
- Donner une **variante** à un article : la précision qui distingue deux
  exemplaires du même produit — taille, modèle, coloris, référence.
  *Article :* Maillot équipe de France — *variante :* domicile 2026 aero fit
- Supprimer un article, ou tous les articles cochés d'un coup
- Tout décocher (pratique pour réutiliser une liste de courses)
- Masquer les articles cochés
- Réorganiser en glissant la poignée `≡`

Toute suppression peut être annulée pendant 5 secondes via la notification qui apparaît.

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

Les listes sont enregistrées dans le stockage local de Safari. iOS peut l'effacer
si l'app reste inutilisée plusieurs semaines, ou si tu effaces les données de
navigation.

Le menu **⋯** en haut à droite de l'écran d'accueil permet d'**exporter** un
fichier de sauvegarde et de le **réimporter** ensuite.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Structure des deux écrans |
| `styles.css` | Apparence, thèmes clair et sombre automatiques |
| `app.js` | Logique : données, affichage, glisser-déposer |
| `manifest.json` | Nom, icônes et mode plein écran de l'app installée |
| `sw.js` | Service worker — fonctionnement hors connexion |
| `icons/` | Icônes de l'app |
