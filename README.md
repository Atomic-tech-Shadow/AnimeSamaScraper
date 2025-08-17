<div align="center">

# 🎌 Anime-Sama API v2.0

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=F75C7E&center=true&vCenter=true&width=435&lines=Real-time+Anime+Scraping+API;Powered+by+el_cid;Production+Ready;Smart+Recommendations" alt="Typing SVG" />

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=for-the-badge&logo=node.js)]()
[![License](https://img.shields.io/badge/license-MIT-yellow.svg?style=for-the-badge)]()
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()

**Une API Node.js serverless avancée qui scrape intelligemment le site anime-sama.fr en temps réel pour fournir des données d'anime via des endpoints JSON optimisés.**

**Compatible avec Vercel et prêt pour le déploiement en production 🚀**

</div>

---

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

</details>

---

<div align="center">

## 📊 Statistiques du Projet

<img src="https://github-readme-stats.vercel.app/api?username=el_cid&show_icons=true&theme=radical" alt="Stats" />

### 🚀 Quick Start

<img src="https://user-images.githubusercontent.com/74038190/212284115-f47cd8ff-2ffb-4b04-b5bf-4d1c14c0247f.gif" width="100">

</div>

```bash
# Clone le repository
git clone https://github.com/your-username/anime-sama-api.git

# Installe les dépendances
npm install

# Lance le serveur
npm start
```

<div align="center">

### 🌟 Contribuer

**Si ce projet vous aide, donnez-lui une ⭐ !**

<img src="https://user-images.githubusercontent.com/74038190/216649417-9acc58df-9186-4132-ad43-819a57babb67.gif" width="200">

---

**Made with ❤️ by [el_cid](https://github.com/el_cid)**

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer" />

</div>

<div align="center">

## ⭐ Fonctionnalités v2.0

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="700">

</div>

<table>
<tr>
<td width="50%">

### 🎯 Core Features
```diff
+ 🔍 Recherche d'anime intelligente
+ 📺 Épisodes récents sans doublons  
+ 📅 Planning des anime
+ 📖 Détails complets d'anime
+ 🎬 Saisons et épisodes
+ 🎮 Lecteur intégré
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
+ 🌐 Production Ready Architecture
+ 📈 ~1500-2000 Animes Discovery
+ 🎪 38 Pages Smart Exploration
```

</td>
</tr>
</table>

<div align="center">

## 🛠️ Endpoints API

<img src="https://user-images.githubusercontent.com/74038190/212284087-bbe7e430-757e-4901-90bf-4cd2ce3e1852.gif" width="100">

</div>

<details>
<summary>📖 Click to expand all endpoints</summary>

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

### 📈 Épisodes récents
```http
GET /api/recent
```
Récupère les épisodes récemment ajoutés sur le site.

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
const response = await fetch('https://anime-sama-scraper.vercel.app/api/search?query=naruto');
const data = await response.json();
console.log(data.results);

// Récupérer les épisodes récents
const recent = await fetch('https://anime-sama-scraper.vercel.app/api/recent');
const recentData = await recent.json();
```

### cURL
```bash
# Recherche
curl "https://anime-sama-scraper.vercel.app/api/search?query=black%20butler"

# Épisodes récents
curl "https://anime-sama-scraper.vercel.app/api/recent"

# Embed
curl "https://anime-sama-scraper.vercel.app/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler"
```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## ⚠️ Avertissement

Cette API est créée à des fins éducatives. Respectez les conditions d'utilisation du site anime-sama.fr et utilisez l'API de manière responsable.