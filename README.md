<div align="center">

# 🎌 Anime-Sama API v2.0

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=F75C7E&center=true&vCenter=true&width=435&lines=Real-time+Anime+Scraping+API;Powered+by+el_cid;Production+Ready;Smart+Recommendations" alt="Typing SVG" />

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)]()
[![Domain](https://img.shields.io/badge/domain-anime--sama.eu-green.svg?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)]()
[![Express](https://img.shields.io/badge/Express.js-4.x-black.svg?style=for-the-badge&logo=express)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg?style=for-the-badge)]()
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()

### 🛠️ Technologies Stack

<p align="center">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/Cheerio-E88C1A?style=for-the-badge&logo=cheerio&logoColor=white" />
</p>

<p align="center">
<img src="https://img.shields.io/badge/Replit-667881?style=for-the-badge&logo=replit&logoColor=white" />
<img src="https://img.shields.io/badge/REST_API-02569B?style=for-the-badge&logo=api&logoColor=white" />
<img src="https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white" />
<img src="https://img.shields.io/badge/CORS-FF6B6B?style=for-the-badge&logo=cors&logoColor=white" />
</p>

**Une API Node.js avancée qui scrape intelligemment le site anime-sama.eu en temps réel pour fournir des données d'anime via des endpoints JSON optimisés.**

**11 endpoints complets et testés - Production Ready 🚀**

</div>

---

## ⭐ Fonctionnalités v2.0

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">
</div>

<table>
<tr>
<td width="50%">

### 🎯 Core Features
```diff
+ 🔍 Recherche d'anime intelligente
+ 📺 Épisodes récents sans doublons  
+ 📅 Planning des anime en temps réel
+ 📖 Détails complets d'anime
+ 🎬 Saisons et épisodes avec sources
+ 💎 Système des Pépites intégré
+ 🎲 Recommandations intelligentes
+ 🛡️ Protection anti-bot
+ 🌐 CORS activé
```

</td>
<td width="50%">

### ⚡ Advanced v2.0 Features
```diff
+ 🎯 Smart Recommendations System
+ ⚡ Advanced Caching (5min)
+ 🔄 Zero Duplication Technology
+ 📊 Complete Catalog Coverage
+ 🎲 Intelligent Randomization
+ 📈 ~1500-2000 Animes Discovery
+ 🎪 38 Pages Smart Exploration
+ 🎭 Séparation Classiques/Pépites
```

</td>
</tr>
</table>

---

## 🛠️ Endpoints API (11 endpoints complets)

<div align="center">
<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">
</div>

<details>
<summary>📖 Click to expand all endpoints</summary>

### 🏠 Root
```http
GET /
```
Documentation complète de l'API avec tous les endpoints disponibles.

**Exemple de réponse :**
```json
{
  "name": "Anime-Sama API",
  "version": "2.0.0",
  "description": "Real-time anime scraping API for anime-sama.eu",
  "status": "running",
  "endpoints": { ... }
}
```

### 🔍 Recherche d'anime
```http
GET /api/search?query=naruto
```
Recherche des anime par nom. Supporte la correspondance partielle et floue.

**Exemple de réponse :**
```json
{
  "success": true,
  "query": "naruto",
  "count": 5,
  "animes": [
    {
      "id": "naruto",
      "title": "Naruto",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/naruto.jpg",
      "url": "https://anime-sama.eu/catalogue/naruto/"
    }
  ]
}
```

### 📺 Anime populaires
```http
GET /api/popular
```
Récupère les anime populaires avec séparation Classiques/Pépites.

**Exemple de réponse :**
```json
{
  "success": true,
  "totalCount": 30,
  "categories": {
    "classiques": {
      "count": 15,
      "anime": [...]
    },
    "pepites": {
      "count": 15,
      "anime": [...]
    }
  }
}
```

### 📈 Épisodes récents
```http
GET /api/recent
```
Récupère les 30 épisodes récemment ajoutés sur le site.

**Exemple de réponse :**
```json
{
  "success": true,
  "count": 30,
  "recentEpisodes": [
    {
      "animeId": "naruto",
      "animeTitle": "Naruto",
      "season": 1,
      "language": "VOSTFR",
      "url": "https://anime-sama.eu/catalogue/naruto/saison1/vostfr/",
      "image": "..."
    }
  ]
}
```

### 📅 Planning des anime
```http
GET /api/planning?day=lundi
```
Récupère le planning des anime par jour (lundi, mardi, etc.).

**Paramètres optionnels :**
- `day` - jour spécifique (lundi, mardi, etc.)
- `filter` - anime/scan/vf/vostfr
- `timezone` - gmt+0, gmt+1, etc.

### 🎬 Recommandations
```http
GET /api/recommendations?page=1&limit=50
```
Récupère les recommandations d'anime avec smart cache.

### 🎭 Détails d'anime
```http
GET /api/anime/:id
```
Informations détaillées sur un anime spécifique.

**Exemple :**
```http
GET /api/anime/naruto
```

### 📺 Saisons
```http
GET /api/seasons/:animeId
```
Liste les saisons disponibles pour un anime.

**Exemple :**
```http
GET /api/seasons/naruto
```

**Exemple de réponse :**
```json
{
  "success": true,
  "title": "Naruto",
  "count": 5,
  "seasons": [
    {
      "number": 1,
      "name": "Saison 1",
      "languages": ["VOSTFR", "VF"],
      "available": true
    }
  ]
}
```

### 📺 Épisodes
```http
GET /api/episodes/:animeId?season=1&language=VOSTFR
```
Liste les épisodes d'une saison spécifique avec sources streaming.

**Exemple :**
```http
GET /api/episodes/naruto?season=1&language=VOSTFR
```

### 🎮 Sources d'épisode (Par ID)
```http
GET /api/episode-by-id/:episodeId
```
Récupère les sources de streaming pour un épisode.

**Exemple :**
```http
GET /api/episode-by-id/naruto-s1-e1
```

### 🎮 Sources d'épisode (Par numéro)
```http
GET /api/episode/:animeId/:season/:ep
```
Récupère les sources de streaming pour un épisode spécifique.

**Exemple :**
```http
GET /api/episode/naruto/1/1
```

### 🖥️ Lecteur intégré
```http
GET /api/embed?url=https%3A%2F%2Fanime-sama.eu%2Fcatalogue%2Fnaruto
```
Récupère les sources de streaming depuis une URL anime-sama.eu.

</details>

---

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
npm start
```

L'API sera accessible sur `http://localhost:5000`

---

## 🏗️ Architecture

### Structure des fichiers
```
anime-sama-api/
├── api/                    # Endpoints API
│   ├── search.js          # Recherche d'anime
│   ├── popular.js         # Anime populaires + pépites
│   ├── recent.js          # Épisodes récents
│   ├── planning.js        # Planning des anime
│   ├── recommendations.js # Recommandations
│   ├── anime/[id].js      # Détails d'anime
│   ├── seasons/           # Gestion des saisons
│   ├── episodes/          # Gestion des épisodes
│   ├── episode/           # Sources d'épisodes
│   ├── episode-by-id.js   # Sources par ID
│   └── embed.js           # Extraction de sources
├── utils/
│   ├── scraper.js         # Utilitaires de scraping
│   └── title-cleaner.js   # Nettoyage des titres
├── server.js              # Serveur Express
├── package.json           # Dépendances
└── README.md             # Documentation
```

### Technologies utilisées
- **Node.js 20+** - Runtime JavaScript
- **Express.js** - Framework web
- **Axios** - Client HTTP pour les requêtes
- **Cheerio** - Parsing HTML côté serveur
- **Cors** - Gestion CORS

### Protection anti-bot
- Rotation des User-Agent avec un pool de navigateurs
- Délais aléatoires entre les requêtes (100-300ms)
- Headers HTTP réalistes pour imiter un navigateur
- Timeout de 5 secondes pour éviter les connexions qui traînent

---

## 🔧 Configuration

### Variables d'environnement
```env
NODE_ENV=production          # Environment (development/production)
PORT=5000                   # Port du serveur
```

---

## 🚨 Limitations

- **Dépendant du site source** - L'API dépend de la disponibilité d'anime-sama.eu
- **Rate limiting** - Délais implémentés pour éviter de surcharger le serveur cible
- **Structure HTML** - Peut nécessiter des mises à jour si la structure du site change
- **Cache 5min** - Les recommandations sont cachées pour éviter les requêtes répétées

---

## 📝 Exemples d'utilisation

### JavaScript/Fetch
```javascript
// Rechercher des anime
const response = await fetch('http://localhost:5000/api/search?query=naruto');
const data = await response.json();
console.log(data.animes);

// Récupérer les épisodes récents
const recent = await fetch('http://localhost:5000/api/recent');
const recentData = await recent.json();
console.log(recentData.recentEpisodes);

// Récupérer les populaires avec pépites
const popular = await fetch('http://localhost:5000/api/popular');
const popularData = await popular.json();
console.log(popularData.categories.classiques);
console.log(popularData.categories.pepites);
```

### cURL
```bash
# Recherche
curl "http://localhost:5000/api/search?query=naruto"

# Épisodes récents
curl "http://localhost:5000/api/recent"

# Anime populaires
curl "http://localhost:5000/api/popular"

# Planning du jour
curl "http://localhost:5000/api/planning"

# Recommandations
curl "http://localhost:5000/api/recommendations?page=1&limit=50"

# Détails d'anime
curl "http://localhost:5000/api/anime/naruto"

# Saisons
curl "http://localhost:5000/api/seasons/naruto"

# Épisodes d'une saison
curl "http://localhost:5000/api/episodes/naruto?season=1&language=VOSTFR"

# Sources d'épisode
curl "http://localhost:5000/api/episode/naruto/1/1"
```

---

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## ⚠️ Avertissement

Cette API est créée à des fins éducatives. Respectez les conditions d'utilisation du site anime-sama.eu et utilisez l'API de manière responsable.

---

<div align="center">

## 🌟 Contribuer

**Si ce projet vous aide, donnez-lui une ⭐ !**

**Made with ❤️ by [el_cid](https://github.com/el_cid)**

© 2025 el_cid - Tous droits réservés

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" />

</div>
