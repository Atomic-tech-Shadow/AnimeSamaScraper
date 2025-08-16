# Anime-Sama API

Une API Node.js serverless qui scrape le site anime-sama.fr en temps réel pour fournir des données d'anime via des endpoints JSON. Compatible avec Vercel et prêt pour le déploiement.

## 📄 Licence

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](LICENSE) pour plus de détails.

### Pourquoi la licence MIT ?

- **🆓 Totalement gratuite** - Utilisation libre pour projets personnels et commerciaux
- **🔧 Modification autorisée** - Tu peux adapter le code à tes besoins
- **📤 Redistribution libre** - Partage et distribue sans restrictions
- **⚖️ Simple et claire** - Pas de complications légales
- **🏢 Compatible entreprise** - Peut être utilisée dans des projets commerciaux

La licence MIT est parfaite pour un projet open-source comme celui-ci qui vise à être utilisé par la communauté des développeurs.

---

**🚀 Powered by el_cid**

© 2025 el_cid - Tous droits réservés

## 🚀 Fonctionnalités

- **Recherche d'anime** - Trouve des anime par nom avec correspondance floue
- **Tendances** - Récupère les anime populaires depuis la page d'accueil
- **Détails d'anime** - Informations complètes sur un anime spécifique
- **Saisons et épisodes** - Navigation dans la structure des contenus
- **Lecteur intégré** - Génère des pages HTML pour l'intégration de lecteurs vidéo
- **Protection anti-bot** - Rotation des User-Agent et délais aléatoires
- **CORS activé** - Compatible avec tous les frontends web

## 📋 Endpoints API

### 🔍 Recherche
```http
GET /api/search?query=naruto
```
Recherche des anime par nom. Supporte la correspondance partielle et floue.

**Exemple de réponse :**
```json
{
  "success": true,
  "query": "black",
  "count": 1,
  "results": [
    {
      "id": "black-butler",
      "title": "Black Butler", 
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/black-butler.jpg",
      "url": "https://anime-sama.fr/catalogue/black-butler"
    }
  ]
}
```

### 📈 Tendances
```http
GET /api/trending
```
Récupère les anime actuellement populaires depuis la page d'accueil.

### 🎬 Détails d'anime
```http
GET /api/anime/:id
```
Informations détaillées sur un anime spécifique (synopsis, genres, statut, etc.).

### 🎭 Saisons
```http
GET /api/seasons/:animeId
```
Liste les saisons disponibles pour un anime.

### 📺 Épisodes
```http
GET /api/episodes/:animeId?season=1&language=VOSTFR
```
Liste les épisodes d'une saison spécifique.

### 🎮 Sources d'épisode
```http
GET /api/episode/:episodeId
```
Récupère les sources de streaming pour un épisode.

### 🖥️ Lecteur intégré
```http
GET /api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler
```
Génère une page HTML avec lecteur vidéo intégré.

## 🛠️ Installation locale

1. **Cloner le projet**
```bash
git clone <repository-url>
cd anime-sama-api
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Démarrer le serveur de développement**
```bash
npm run dev
# ou
node server.js
```

L'API sera accessible sur `http://localhost:5000`

## ☁️ Déploiement sur Vercel

### Option 1: Déploiement via CLI

1. **Installer Vercel CLI**
```bash
npm install -g vercel
```

2. **Se connecter à Vercel**
```bash
vercel login
```

3. **Déployer le projet**
```bash
vercel deploy
```

### Option 2: Déploiement via Git

1. Connecter votre repository GitHub à Vercel
2. Vercel détectera automatiquement la configuration
3. Le déploiement se fera automatiquement à chaque push

## 🏗️ Architecture

### Structure des fichiers
```
anime-sama-api/
├── api/                    # Endpoints Vercel Functions
│   ├── search.js          # Recherche d'anime
│   ├── trending.js        # Tendances
│   ├── anime/[id].js      # Détails d'anime
│   ├── seasons/           # Gestion des saisons
│   ├── episodes/          # Gestion des épisodes
│   ├── episode/           # Sources d'épisodes
│   └── embed.js           # Lecteur intégré
├── utils/
│   └── scraper.js         # Utilitaires de scraping
├── server.js              # Serveur Express (dev)
├── vercel.json            # Configuration Vercel
└── package.json           # Dépendances
```

### Technologies utilisées
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web (développement)
- **Axios** - Client HTTP pour les requêtes
- **Cheerio** - Parsing HTML côté serveur
- **Vercel Functions** - Déploiement serverless

### Protection anti-bot
- Rotation des User-Agent avec un pool de navigateurs communs
- Délais aléatoires entre les requêtes (500-1500ms)
- Headers HTTP réalistes pour imiter un navigateur
- Timeout de 8 secondes pour éviter les connexions qui traînent

## 🔧 Configuration

### Variables d'environnement
```env
NODE_ENV=production          # Environment (development/production)
PORT=5000                   # Port du serveur (optionnel)
```

### Vercel.json
Le fichier `vercel.json` est configuré pour :
- Fonctions serverless avec timeout de 10 secondes
- Headers CORS automatiques
- Routage vers les endpoints API

## 🚨 Limitations

- **Pas de cache** - Toutes les données sont récupérées en temps réel
- **Dépendant du site source** - L'API dépend de la disponibilité d'anime-sama.fr
- **Rate limiting** - Délais implémentés pour éviter de surcharger le serveur cible
- **URLs spécifiques** - L'embed n'accepte que les URLs anime-sama.fr pour la sécurité

## 📝 Exemples d'utilisation

### JavaScript/Fetch
```javascript
// Rechercher des anime
const response = await fetch('https://your-api.vercel.app/api/search?query=naruto');
const data = await response.json();
console.log(data.results);

// Récupérer les tendances
const trending = await fetch('https://your-api.vercel.app/api/trending');
const trendingData = await trending.json();
```

### cURL
```bash
# Recherche
curl "https://your-api.vercel.app/api/search?query=black%20butler"

# Tendances
curl "https://your-api.vercel.app/api/trending"

# Embed
curl "https://your-api.vercel.app/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler"
```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## ⚠️ Avertissement

Cette API est créée à des fins éducatives. Respectez les conditions d'utilisation du site anime-sama.fr et utilisez l'API de manière responsable.