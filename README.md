<div align="center">

# 🎌 Anime-Sama API v2.1

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=F75C7E&center=true&vCenter=true&width=435&lines=Real-time+Anime+Scraping+API;100%25+Animation+Focus;Production+Ready;Global+Language+Support" alt="Typing SVG" />

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg?style=for-the-badge)]()
[![Domain](https://img.shields.io/badge/domain-anime--sama.tv-green.svg?style=for-the-badge)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)]()
[![Express](https://img.shields.io/badge/Express.js-4.x-black.svg?style=for-the-badge&logo=express)]()
[![Status](https://img.shields.io/badge/status-active-success.svg?style=for-the-badge)]()

### 🛠️ Technologies Stack

<p align="center">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" />
<img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
<img src="https://img.shields.io/badge/Cheerio-E88C1A?style=for-the-badge&logo=cheerio&logoColor=white" />
</p>

**API Node.js ultra-rapide dédiée exclusivement à l'animation. Scrape en temps réel anime-sama.tv avec une détection linguistique mondiale.**

</div>

---

## 🚀 Nouveautés v2.1 (Janvier 2026)

- **100% Anime** : Suppression totale des références aux mangas/scans. L'API est purifiée.
- **Support Linguistique Mondial** : Détection automatique de **VOSTFR, VF, VA, VAR, VKR, VCN, VQC, VF1, VF2**.
- **GMT+0 Native** : Toutes les heures de sortie sont automatiquement converties en GMT+0.
- **Robustesse Accrue** : Extraction intelligente des serveurs de streaming avec fallback automatique.
- **Métadonnées de Compte** : Prêt pour la synchronisation des comptes Anime-Sama.

---

## 🛠️ Endpoints API (Détails & Utilisation)

### 🏠 Documentation Racine
`GET /`
- **Description** : Retourne les métadonnées de l'API, l'état du serveur et les informations de synchronisation de compte.
- **Utilisation** : Vérification de la connectivité et des versions supportées.

### 🔍 Recherche
`GET /api/search?query={nom}`
- **Description** : Recherche d'animes par titre avec nettoyage automatique des tags de langue.
- **Paramètres** : `query` (obligatoire).
- **Exemple** : `/api/search?query=naruto`

### 📈 Sorties Récentes
`GET /api/recent`
- **Description** : Récupère les 30 derniers épisodes ajoutés sur la plateforme.
- **Données** : Titre propre, saison, épisode, langue (VF, VOSTFR, etc.), type (Anime, Film, OAV, Special).

### 📅 Planning hebdomadaire
`GET /api/planning?day={jour}&filter={type}`
- **Description** : Planning des sorties converti en **GMT+0**.
- **Paramètres** : 
  - `day` : `lundi`, `mardi`... ou `all` pour la semaine.
  - `filter` : `anime`, `vf`, `vostfr`.
- **Exemple** : `/api/planning?day=all&filter=vf`

### 🎬 Détails de l'Anime
`GET /api/anime/:id`
- **Description** : Métadonnées complètes (synopsis, genres, image HD, statut).
- **Exemple** : `/api/anime/black-clover`

### 📺 Saisons
`GET /api/seasons/:animeId`
- **Description** : Liste toutes les saisons, films et OAV disponibles pour un ID donné.
- **Exemple** : `/api/seasons/one-piece`

### 🎞️ Épisodes d'une Saison
`GET /api/episodes/:animeId?season={n}&language={lang}`
- **Description** : Liste les épisodes avec leurs sources de streaming pour une combinaison saison/langue.
- **Paramètres** : `season` (défaut: 1), `language` (défaut: VOSTFR).
- **Exemple** : `/api/episodes/bleach?season=1&language=VF`

### 🔗 Sources Directes (par ID)
`GET /api/episode-by-id/:episodeId`
- **Description** : Extraction rapide des serveurs pour un épisode spécifique via son ID technique.
- **Exemple** : `/api/episode-by-id/naruto-s1-e1`

### 🖥️ Lecteur & Sources (par numéro)
`GET /api/episode/:animeId/:season/:ep`
- **Description** : Récupère les liens des lecteurs (Sibnet, SendVid, etc.) pour un numéro précis.

### 🎥 Extraction Embed
`GET /api/embed?url={url_anime_sama}`
- **Description** : Extrait les sources vidéo à partir d'une URL brute du site Anime-Sama.
- **Utilisation** : Pour les intégrations personnalisées de lecteurs.

---

## 🏗️ Architecture Technique

- **Protection Anti-Bot** : Rotation de User-Agent et délais aléatoires.
- **CDN Stability** : Images servies via GitHub Raw pour éviter les liens morts.
- **CORS** : Activé par défaut pour toutes les origines.
- **Headers Transparence** : `X-Provider: Anime-Sama`, `X-API-Version: 2.1.0`.

---

## 📝 Installation

1. `npm install`
2. `npm start`
Serveur sur `http://localhost:5000`

---

<div align="center">
  Made with ❤️ by <b>el_cid</b>
</div>
