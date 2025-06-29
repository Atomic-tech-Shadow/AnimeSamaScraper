# Exemples d'Intégration Frontend - API Anime-Sama

## 🔧 Hook React Personnalisé

### useAnimeSama Hook
```jsx
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000';

// Hook personnalisé pour l'API Anime-Sama
export const useAnimeSama = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (endpoint, params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      );

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    search: (query) => request('/api/search', { query }),
    getTrending: () => request('/api/trending'),
    getRecent: () => request('/api/recent'),
    getAnimeDetails: (id) => request(`/api/anime/${id}`),
    getSeasons: (animeId) => request(`/api/seasons/${animeId}`),
    getEpisodes: (animeId, season = 1, language = 'VOSTFR') => 
      request(`/api/episodes/${animeId}`, { season, language }),
    getEmbedUrl: (episodeUrl) => 
      `${API_BASE_URL}/api/embed?url=${encodeURIComponent(episodeUrl)}`
  };
};
```

### Hook pour la Recherche avec Debounce
```jsx
import { useState, useEffect } from 'react';
import { useAnimeSama } from './useAnimeSama';

export const useAnimeSearch = (initialQuery = '') => {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const { search, loading, error } = useAnimeSama();

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Effectuer la recherche
  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery)
        .then(data => setResults(data.results || []))
        .catch(() => setResults([]));
    } else {
      setResults([]);
    }
  }, [debouncedQuery, search]);

  return {
    query,
    setQuery,
    results,
    loading,
    error
  };
};
```

## ⚛️ Composants React

### Composant de Recherche
```jsx
import React from 'react';
import { useAnimeSearch } from '../hooks/useAnimeSearch';

const AnimeSearch = ({ onAnimeSelect }) => {
  const { query, setQuery, results, loading, error } = useAnimeSearch();

  return (
    <div className="anime-search">
      <div className="search-input">
        <input
          type="text"
          placeholder="Rechercher un anime..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-field"
        />
        {loading && <span className="loading">🔄</span>}
      </div>

      {error && (
        <div className="error-message">
          ❌ Erreur: {error}
        </div>
      )}

      <div className="search-results">
        {results.map(anime => (
          <div 
            key={anime.id}
            className="anime-result"
            onClick={() => onAnimeSelect(anime)}
          >
            <img 
              src={anime.image} 
              alt={anime.title}
              className="anime-thumb"
            />
            <span className="anime-title">{anime.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnimeSearch;
```

### Composant des Animes Tendances
```jsx
import React, { useEffect, useState } from 'react';
import { useAnimeSama } from '../hooks/useAnimeSama';

const TrendingAnimes = ({ onAnimeSelect }) => {
  const [trending, setTrending] = useState([]);
  const { getTrending, loading, error } = useAnimeSama();

  useEffect(() => {
    getTrending()
      .then(data => setTrending(data.trending || []))
      .catch(err => console.error('Erreur trending:', err));
  }, [getTrending]);

  if (loading) return <div className="loading">Chargement des tendances...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="trending-animes">
      <h2>Animes Tendances ({trending.length})</h2>
      <div className="trending-grid">
        {trending.map(anime => (
          <div 
            key={anime.id}
            className="trending-card"
            onClick={() => onAnimeSelect(anime)}
          >
            <img src={anime.image} alt={anime.title} />
            <h3>{anime.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingAnimes;
```

### Composant des Détails d'Anime
```jsx
import React, { useEffect, useState } from 'react';
import { useAnimeSama } from '../hooks/useAnimeSama';

const AnimeDetails = ({ animeId, onEpisodeSelect }) => {
  const [details, setDetails] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('VOSTFR');
  
  const { getAnimeDetails, getSeasons, getEpisodes, loading, error } = useAnimeSama();

  useEffect(() => {
    if (animeId) {
      // Charger les détails et saisons en parallèle
      Promise.all([
        getAnimeDetails(animeId),
        getSeasons(animeId)
      ]).then(([detailsData, seasonsData]) => {
        setDetails(detailsData.data);
        setSeasons(seasonsData.seasons || []);
        if (seasonsData.seasons?.length > 0) {
          setSelectedSeason(seasonsData.seasons[0].number);
        }
      }).catch(err => console.error('Erreur détails:', err));
    }
  }, [animeId, getAnimeDetails, getSeasons]);

  useEffect(() => {
    if (animeId && selectedSeason) {
      getEpisodes(animeId, selectedSeason, selectedLanguage)
        .then(data => setEpisodes(data.episodes || []))
        .catch(err => console.error('Erreur épisodes:', err));
    }
  }, [animeId, selectedSeason, selectedLanguage, getEpisodes]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!details) return null;

  return (
    <div className="anime-details">
      {/* En-tête avec image et infos */}
      <div className="anime-header">
        <img src={details.image} alt={details.title} className="anime-poster" />
        <div className="anime-info">
          <h1>{details.title}</h1>
          <p className="synopsis">{details.synopsis}</p>
          <div className="meta-info">
            <span><strong>Genres:</strong> {details.genres.join(', ')}</span>
            <span><strong>Statut:</strong> {details.status}</span>
            <span><strong>Type:</strong> {details.type}</span>
            <span><strong>Année:</strong> {details.year}</span>
          </div>
        </div>
      </div>

      {/* Sélecteur de saison et langue */}
      <div className="controls">
        <div className="season-selector">
          <label>Saison:</label>
          <select 
            value={selectedSeason} 
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
          >
            {seasons.map(season => (
              <option key={season.number} value={season.number}>
                {season.name}
              </option>
            ))}
          </select>
        </div>

        <div className="language-selector">
          <label>Langue:</label>
          <select 
            value={selectedLanguage} 
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {details.availableLanguages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des épisodes */}
      <div className="episodes-section">
        <h3>Épisodes - Saison {selectedSeason} ({selectedLanguage})</h3>
        <div className="episodes-grid">
          {episodes.map(episode => (
            <div key={episode.number} className="episode-card">
              <h4>{episode.title}</h4>
              <div className="episode-servers">
                {episode.streamingSources.map((source, index) => (
                  <button
                    key={index}
                    className="server-button"
                    onClick={() => onEpisodeSelect(source.url)}
                  >
                    {source.server} ({source.quality})
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimeDetails;
```

### Composant des Épisodes Récents
```jsx
import React, { useEffect, useState } from 'react';
import { useAnimeSama } from '../hooks/useAnimeSama';

const RecentEpisodes = ({ limit = 12, onEpisodeSelect }) => {
  const [recent, setRecent] = useState([]);
  const { getRecent, loading, error } = useAnimeSama();

  useEffect(() => {
    getRecent()
      .then(data => setRecent(data.recentEpisodes?.slice(0, limit) || []))
      .catch(err => console.error('Erreur épisodes récents:', err));
  }, [getRecent, limit]);

  if (loading) return <div className="loading">Chargement des épisodes récents...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="recent-episodes">
      <h2>Derniers Épisodes ({recent.length})</h2>
      <div className="recent-grid">
        {recent.map((episode, index) => (
          <div 
            key={`${episode.animeId}-${episode.season}-${episode.episode}-${index}`}
            className="recent-episode-card"
            onClick={() => onEpisodeSelect(episode)}
          >
            <img src={episode.image} alt={episode.animeTitle} />
            <div className="episode-info">
              <h4>{episode.animeTitle}</h4>
              <p>S{episode.season}E{episode.episode}</p>
              <span className="language-badge">{episode.language}</span>
              <small>{new Date(episode.addedAt).toLocaleDateString('fr-FR')}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentEpisodes;
```

## 🖼️ Composant Vue.js

### Composant Vue avec Composition API
```vue
<template>
  <div class="anime-app">
    <!-- Recherche -->
    <div class="search-section">
      <input 
        v-model="searchQuery"
        @input="debouncedSearch"
        placeholder="Rechercher un anime..."
        class="search-input"
      />
      
      <div v-if="searchResults.length" class="search-results">
        <div 
          v-for="anime in searchResults" 
          :key="anime.id"
          @click="selectAnime(anime.id)"
          class="search-result"
        >
          <img :src="anime.image" :alt="anime.title" />
          <span>{{ anime.title }}</span>
        </div>
      </div>
    </div>

    <!-- Détails de l'anime sélectionné -->
    <div v-if="selectedAnime" class="anime-details">
      <div class="anime-header">
        <img :src="selectedAnime.image" :alt="selectedAnime.title" />
        <div class="anime-info">
          <h1>{{ selectedAnime.title }}</h1>
          <p>{{ selectedAnime.synopsis }}</p>
          <div class="meta">
            <span>Genres: {{ selectedAnime.genres.join(', ') }}</span>
            <span>Statut: {{ selectedAnime.status }}</span>
          </div>
        </div>
      </div>

      <!-- Sélecteurs -->
      <div class="controls">
        <select v-model="selectedSeason" @change="loadEpisodes">
          <option v-for="season in seasons" :key="season.number" :value="season.number">
            {{ season.name }}
          </option>
        </select>
        
        <select v-model="selectedLanguage" @change="loadEpisodes">
          <option v-for="lang in selectedAnime.availableLanguages" :key="lang" :value="lang">
            {{ lang }}
          </option>
        </select>
      </div>

      <!-- Épisodes -->
      <div class="episodes">
        <h3>Épisodes - Saison {{ selectedSeason }} ({{ selectedLanguage }})</h3>
        <div class="episodes-grid">
          <div v-for="episode in episodes" :key="episode.number" class="episode">
            <h4>{{ episode.title }}</h4>
            <div class="servers">
              <button 
                v-for="source in episode.streamingSources" 
                :key="source.server"
                @click="playEpisode(source.url)"
              >
                {{ source.server }} ({{ source.quality }})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chargement et erreurs -->
    <div v-if="loading" class="loading">Chargement...</div>
    <div v-if="error" class="error">Erreur: {{ error }}</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const API_BASE_URL = 'http://localhost:5000';

// États réactifs
const searchQuery = ref('');
const searchResults = ref([]);
const selectedAnime = ref(null);
const seasons = ref([]);
const episodes = ref([]);
const selectedSeason = ref(1);
const selectedLanguage = ref('VOSTFR');
const loading = ref(false);
const error = ref(null);

// Fonction utilitaire pour les requêtes API
const apiRequest = async (endpoint, params = {}) => {
  loading.value = true;
  error.value = null;
  
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => 
      url.searchParams.append(key, params[key])
    );

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    error.value = err.message;
    throw err;
  } finally {
    loading.value = false;
  }
};

// Recherche avec debounce
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    if (searchQuery.value.trim()) {
      try {
        const result = await apiRequest('/api/search', { query: searchQuery.value });
        searchResults.value = result.results || [];
      } catch (err) {
        searchResults.value = [];
      }
    } else {
      searchResults.value = [];
    }
  }, 300);
};

// Sélectionner un anime
const selectAnime = async (animeId) => {
  try {
    const [detailsResult, seasonsResult] = await Promise.all([
      apiRequest(`/api/anime/${animeId}`),
      apiRequest(`/api/seasons/${animeId}`)
    ]);
    
    selectedAnime.value = detailsResult.data;
    seasons.value = seasonsResult.seasons || [];
    
    if (seasons.value.length > 0) {
      selectedSeason.value = seasons.value[0].number;
      await loadEpisodes();
    }
    
    // Vider les résultats de recherche
    searchResults.value = [];
    searchQuery.value = '';
  } catch (err) {
    console.error('Erreur sélection anime:', err);
  }
};

// Charger les épisodes
const loadEpisodes = async () => {
  if (!selectedAnime.value) return;
  
  try {
    const result = await apiRequest(
      `/api/episodes/${selectedAnime.value.id}`,
      { 
        season: selectedSeason.value, 
        language: selectedLanguage.value 
      }
    );
    episodes.value = result.episodes || [];
  } catch (err) {
    episodes.value = [];
    console.error('Erreur chargement épisodes:', err);
  }
};

// Jouer un épisode
const playEpisode = (sourceUrl) => {
  // Ouvrir dans un nouvel onglet ou intégrer dans la page
  window.open(sourceUrl, '_blank');
};

// Watcher pour recharger les épisodes
watch([selectedSeason, selectedLanguage], loadEpisodes);
</script>

<style scoped>
.anime-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 16px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.search-result {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.search-result:hover {
  background-color: #f5f5f5;
}

.search-result img {
  width: 50px;
  height: 70px;
  object-fit: cover;
  margin-right: 12px;
  border-radius: 4px;
}

.anime-header {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.anime-header img {
  width: 200px;
  height: 280px;
  object-fit: cover;
  border-radius: 8px;
}

.controls {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.controls select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.episode {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
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

.servers button:hover {
  background: #0056b3;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  margin: 20px 0;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>
```

## 📱 Styles CSS Responsive

```css
/* Styles responsive pour tous les frameworks */
.anime-search, .trending-animes, .anime-details, .recent-episodes {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

/* Grid responsive */
.trending-grid, .episodes-grid, .recent-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

@media (max-width: 768px) {
  .trending-grid, .episodes-grid, .recent-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .anime-header {
    flex-direction: column;
    align-items: center;
  }
  
  .anime-header img {
    width: 150px;
    height: 210px;
  }
}

@media (max-width: 480px) {
  .trending-grid, .episodes-grid, .recent-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .controls {
    flex-direction: column;
  }
}

/* Animations */
.anime-card, .trending-card, .episode-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.anime-card:hover, .trending-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Loading states */
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.loading::before {
  content: '';
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

Ces exemples vous donnent une base solide pour intégrer l'API Anime-Sama dans vos applications React ou Vue.js modernes !