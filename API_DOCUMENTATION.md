# API Anime-Sama - Documentation Complète

## 📖 Vue d'ensemble

L'API Anime-Sama est une API de scraping en temps réel qui extrait des données authentiques depuis anime-sama.fr. Elle fournit des informations complètes sur les animes, épisodes, saisons et sources de streaming.

**URL de base**: `http://localhost:5000`

## 🚀 Endpoints Disponibles

### 1. Documentation de l'API
```
GET /
```

**Description**: Page d'accueil avec la documentation de l'API

**Réponse**:
```json
{
  "name": "Anime-Sama API",
  "version": "1.0.0",
  "description": "Real-time anime scraping API for anime-sama.fr",
  "endpoints": { ... }
}
```

### 2. Recherche d'Animes
```
GET /api/search?query={terme}
```

**Paramètres**:
- `query` (requis): Terme de recherche (ex: "naruto", "demon slayer")

**Exemple**:
```bash
curl "http://localhost:5000/api/search?query=demon%20slayer"
```

**Réponse**:
```json
{
  "success": true,
  "query": "demon slayer",
  "count": 1,
  "results": [
    {
      "id": "demon-slayer",
      "title": "Demon Slayer",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/demon-slayer.jpg",
      "url": "https://anime-sama.fr/catalogue/demon-slayer/"
    }
  ]
}
```

### 3. Animes Tendances
```
GET /api/trending
```

**Description**: Retourne les animes populaires du moment

**Exemple**:
```bash
curl "http://localhost:5000/api/trending"
```

**Réponse**:
```json
{
  "success": true,
  "count": 20,
  "trending": [
    {
      "id": "black-butler",
      "title": "Black Butler",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/black-butler.jpg",
      "url": "https://anime-sama.fr/catalogue/black-butler/"
    }
  ]
}
```

### 4. Épisodes Récents
```
GET /api/recent
```

**Description**: Liste des derniers épisodes ajoutés sur le site

**Exemple**:
```bash
curl "http://localhost:5000/api/recent"
```

**Réponse**:
```json
{
  "success": true,
  "count": 30,
  "recentEpisodes": [
    {
      "animeId": "la-sorciere-invincible-tueuse-de-slime-depuis-300-ans",
      "animeTitle": "La Sorcière invincible tueuse de Slime depuis 300 ans",
      "season": 2,
      "episode": 10,
      "language": "VF",
      "url": "https://anime-sama.fr/catalogue/la-sorciere-invincible-tueuse-de-slime-depuis-300-ans/saison2/vf/",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/la-sorciere-invincible-tueuse-de-slime-depuis-300-ans.jpg",
      "addedAt": "2025-06-29T00:32:08.785Z"
    }
  ]
}
```

### 5. Détails d'un Anime
```
GET /api/anime/{id}
```

**Paramètres**:
- `id` (requis): Identifiant unique de l'anime (ex: "demon-slayer")

**Exemple**:
```bash
curl "http://localhost:5000/api/anime/demon-slayer"
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "id": "demon-slayer",
    "title": "Demon Slayer",
    "synopsis": "Depuis les temps anciens, il existe des rumeurs concernant des démons mangeurs d'hommes...",
    "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/demon-slayer.jpg",
    "genres": ["Demon Slayer", "Kimetsu no Yaiba", "KNY", "streaming vostfr", "streaming vf"],
    "status": "7 saisons disponibles",
    "year": "2000",
    "type": "Série + Films",
    "totalSeasons": 7,
    "availableLanguages": ["VOSTFR", "VF"],
    "url": "https://anime-sama.fr/catalogue/demon-slayer/",
    "lastUpdated": "2025-06-29T00:32:32.982Z"
  }
}
```

### 6. Saisons d'un Anime
```
GET /api/seasons/{animeId}
```

**Paramètres**:
- `animeId` (requis): Identifiant de l'anime

**Exemple**:
```bash
curl "http://localhost:5000/api/seasons/demon-slayer"
```

**Réponse**:
```json
{
  "success": true,
  "animeId": "demon-slayer",
  "count": 7,
  "seasons": [
    {
      "number": 1,
      "name": "Saison 1",
      "value": "1",
      "languages": ["VOSTFR"],
      "available": true
    },
    {
      "number": 2,
      "name": "Saison 2",
      "value": "2",
      "languages": ["VOSTFR"],
      "available": true
    }
  ]
}
```

### 7. Épisodes d'une Saison
```
GET /api/episodes/{animeId}?season={numero}&language={langue}
```

**Paramètres**:
- `animeId` (requis): Identifiant de l'anime
- `season` (optionnel): Numéro de saison (défaut: 1)
- `language` (optionnel): Langue (VOSTFR/VF, défaut: VOSTFR)

**Exemple**:
```bash
curl "http://localhost:5000/api/episodes/demon-slayer?season=1&language=VOSTFR"
```

**Réponse**:
```json
{
  "success": true,
  "animeId": "demon-slayer",
  "season": 1,
  "language": "VOSTFR",
  "count": 26,
  "episodes": [
    {
      "number": 1,
      "title": "Épisode 1",
      "url": "https://anime-sama.fr/catalogue/demon-slayer/saison1/vostfr/episode-1",
      "streamingSources": [
        {
          "server": "Sibnet",
          "url": "https://video.sibnet.ru/shell.php?videoid=4668120",
          "quality": "HD",
          "serverNumber": 3
        },
        {
          "server": "OneUpload",
          "url": "https://oneupload.to/embed-iatz8lo6d0bg.html",
          "quality": "HD",
          "serverNumber": 4
        }
      ]
    }
  ]
}
```

### 8. Lecteur Intégré (Embed)
```
GET /api/embed?url={urlEpisode}
```

**Paramètres**:
- `url` (requis): URL encodée de l'épisode à intégrer

**Exemple**:
```bash
curl "http://localhost:5000/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fdemon-slayer%2Fsaison1%2Fvostfr%2Fepisode-1"
```

**Réponse**: HTML complet d'un lecteur vidéo intégrable

## 🛠️ Intégration Frontend

### Configuration JavaScript de Base

```javascript
// Configuration de l'API
const API_BASE_URL = 'http://localhost:5000';

// Classe utilitaire pour l'API
class AnimeSamaAPI {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, params = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Méthodes pour chaque endpoint
  async search(query) {
    return this.request('/api/search', { query });
  }

  async getTrending() {
    return this.request('/api/trending');
  }

  async getRecent() {
    return this.request('/api/recent');
  }

  async getAnimeDetails(id) {
    return this.request(`/api/anime/${id}`);
  }

  async getSeasons(animeId) {
    return this.request(`/api/seasons/${animeId}`);
  }

  async getEpisodes(animeId, season = 1, language = 'VOSTFR') {
    return this.request(`/api/episodes/${animeId}`, { season, language });
  }

  getEmbedUrl(episodeUrl) {
    return `${this.baseUrl}/api/embed?url=${encodeURIComponent(episodeUrl)}`;
  }
}

// Instance globale
const api = new AnimeSamaAPI();
```

### Exemples d'Utilisation Frontend

#### 1. Recherche d'Animes
```javascript
async function searchAnimes(query) {
  try {
    const result = await api.search(query);
    const animesList = document.getElementById('animes-list');
    
    animesList.innerHTML = result.results.map(anime => `
      <div class="anime-card" onclick="showAnimeDetails('${anime.id}')">
        <img src="${anime.image}" alt="${anime.title}">
        <h3>${anime.title}</h3>
      </div>
    `).join('');
  } catch (error) {
    console.error('Erreur de recherche:', error);
  }
}

// Utilisation
searchAnimes('demon slayer');
```

#### 2. Affichage des Animes Tendances
```javascript
async function loadTrendingAnimes() {
  try {
    const result = await api.getTrending();
    const container = document.getElementById('trending-container');
    
    container.innerHTML = `
      <h2>Animes Tendances (${result.count})</h2>
      <div class="trending-grid">
        ${result.trending.map(anime => `
          <div class="trending-item">
            <img src="${anime.image}" alt="${anime.title}">
            <p>${anime.title}</p>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Erreur trending:', error);
  }
}
```

#### 3. Détails d'un Anime avec Saisons
```javascript
async function showAnimeDetails(animeId) {
  try {
    const [details, seasons] = await Promise.all([
      api.getAnimeDetails(animeId),
      api.getSeasons(animeId)
    ]);

    const container = document.getElementById('anime-details');
    container.innerHTML = `
      <div class="anime-header">
        <img src="${details.data.image}" alt="${details.data.title}">
        <div class="anime-info">
          <h1>${details.data.title}</h1>
          <p class="synopsis">${details.data.synopsis}</p>
          <div class="meta">
            <span>Genres: ${details.data.genres.join(', ')}</span>
            <span>Statut: ${details.data.status}</span>
            <span>Type: ${details.data.type}</span>
          </div>
        </div>
      </div>
      
      <div class="seasons">
        <h3>Saisons Disponibles (${seasons.count})</h3>
        ${seasons.seasons.map(season => `
          <button onclick="loadEpisodes('${animeId}', ${season.number})">
            ${season.name} (${season.languages.join(', ')})
          </button>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Erreur détails anime:', error);
  }
}
```

#### 4. Liste des Épisodes avec Lecteur
```javascript
async function loadEpisodes(animeId, season, language = 'VOSTFR') {
  try {
    const result = await api.getEpisodes(animeId, season, language);
    const container = document.getElementById('episodes-list');
    
    container.innerHTML = `
      <h3>Saison ${season} - ${language} (${result.count} épisodes)</h3>
      <div class="episodes-grid">
        ${result.episodes.map(episode => `
          <div class="episode-card">
            <h4>${episode.title}</h4>
            <div class="servers">
              ${episode.streamingSources.map(source => `
                <button onclick="playEpisode('${source.url}')">
                  ${source.server} (${source.quality})
                </button>
              `).join('')}
            </div>
            <button onclick="openEmbed('${episode.url}')">
              Lecteur Intégré
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Erreur épisodes:', error);
  }
}

function openEmbed(episodeUrl) {
  const embedUrl = api.getEmbedUrl(episodeUrl);
  window.open(embedUrl, '_blank', 'width=800,height=600');
}
```

#### 5. Épisodes Récents (Page d'Accueil)
```javascript
async function loadRecentEpisodes() {
  try {
    const result = await api.getRecent();
    const container = document.getElementById('recent-episodes');
    
    container.innerHTML = `
      <h2>Derniers Épisodes (${result.count})</h2>
      <div class="recent-grid">
        ${result.recentEpisodes.slice(0, 12).map(episode => `
          <div class="recent-episode">
            <img src="${episode.image}" alt="${episode.animeTitle}">
            <div class="episode-info">
              <h4>${episode.animeTitle}</h4>
              <p>S${episode.season}E${episode.episode} (${episode.language})</p>
              <small>${new Date(episode.addedAt).toLocaleDateString()}</small>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Erreur épisodes récents:', error);
  }
}
```

### CSS de Base pour l'Interface

```css
/* Styles de base pour l'interface anime */
.anime-card, .trending-item, .episode-card, .recent-episode {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.anime-card:hover, .trending-item:hover {
  transform: scale(1.05);
}

.anime-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.anime-header img {
  width: 200px;
  height: 280px;
  object-fit: cover;
  border-radius: 8px;
}

.synopsis {
  max-height: 150px;
  overflow-y: auto;
  margin: 16px 0;
}

.trending-grid, .episodes-grid, .recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.servers button {
  margin: 4px;
  padding: 8px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

## ⚠️ Gestion d'Erreurs

```javascript
// Gestionnaire d'erreurs global
function handleApiError(error, context = '') {
  console.error(`Erreur API ${context}:`, error);
  
  const errorContainer = document.getElementById('error-messages');
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div class="error-alert">
        ❌ Erreur ${context}: ${error.message}
        <button onclick="this.parentElement.remove()">✕</button>
      </div>
    `;
  }
}

// Utilisation avec try/catch
try {
  const result = await api.search('naruto');
  // Traitement du résultat
} catch (error) {
  handleApiError(error, 'lors de la recherche');
}
```

## 🚀 Déploiement et Configuration

### Variables d'Environnement
```javascript
// Configuration pour différents environnements
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5000'
  },
  production: {
    API_BASE_URL: 'https://your-domain.com'
  }
};

const API_BASE_URL = config[process.env.NODE_ENV || 'development'].API_BASE_URL;
```

### CORS et Sécurité
L'API est configurée avec CORS ouvert pour le développement. En production, configurez les origines autorisées.

## 📝 Notes Importantes

1. **Données Authentiques**: Toutes les données proviennent directement d'anime-sama.fr
2. **Rate Limiting**: L'API inclut des délais pour éviter la surcharge du serveur source
3. **Cache**: Considérez l'implémentation d'un cache côté client pour les requêtes fréquentes
4. **Erreurs**: Toujours implémenter une gestion d'erreurs robuste
5. **Performance**: Utilisez la pagination pour les grandes listes

Cette documentation vous permet d'intégrer facilement l'API Anime-Sama dans votre frontend !