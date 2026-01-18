<div align="center">

# 🎌 Anime-Sama API v2.1

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&pause=1000&color=F75C7E&center=true&vCenter=true&width=435&lines=Real-time+Anime+Scraping+API;100%25+Animation+Focus;Production+Ready;Global+Language+Support" alt="Typing SVG" />

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg?style=for-the-badge)]()
[![Domain](https://img.shields.io/badge/domain-anime--sama.si-green.svg?style=for-the-badge)]()
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

**API Node.js ultra-rapide dédiée exclusivement à l'animation. Scrape en temps réel anime-sama.si avec une détection linguistique mondiale.**

</div>

---

## 🚀 Nouveautés v2.1 (Janvier 2026)

- **100% Anime** : Suppression totale des références aux mangas/scans. L'API est purifiée.
- **Support Linguistique Mondial** : Détection automatique de **VOSTFR, VF, VA, VAR, VKR, VCN, VQC, VF1, VF2**.
- **GMT+0 Native** : Toutes les heures de sortie sont automatiquement converties en GMT+0.
- **Robustesse Accrue** : Extraction intelligente des serveurs de streaming avec fallback automatique.
- **Métadonnées de Compte** : Prêt pour la synchronisation des comptes Anime-Sama.

---

## 🛠️ Endpoints API

### 🏠 Documentation Racine
`GET /`
Retourne l'état du serveur et les métadonnées de synchronisation.

### 🔍 Recherche
`GET /api/search?query=naruto`
Recherche intelligente avec nettoyage automatique des titres.

### 📈 Sorties Récentes
`GET /api/recent`
Les 30 derniers épisodes ajoutés, filtrés par langue et type (Film, OAV, Special).

### 📅 Planning
`GET /api/planning?day=lundi`
Planning hebdomadaire converti en GMT+0. Utilisez `?day=all` pour la semaine complète.

### 🎬 Détails & Streaming
- `GET /api/anime/:id` : Métadonnées complètes.
- `GET /api/seasons/:animeId` : Liste des saisons.
- `GET /api/episodes/:animeId?season=1&language=VOSTFR` : Épisodes et sources.
- `GET /api/episode-by-id/:episodeId` : Sources via ID (ex: `naruto-s1-e1`).

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
