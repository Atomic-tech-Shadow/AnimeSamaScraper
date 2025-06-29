# Quick Start - API Anime-Sama

## 🚀 Test Rapide de l'API

### URL de Production
```
https://anime-sama-scraper.vercel.app
```

### Tests Rapides avec cURL

```bash
# 1. Tester l'API (documentation)
curl "https://anime-sama-scraper.vercel.app/"

# 2. Rechercher un anime
curl "https://anime-sama-scraper.vercel.app/api/search?query=demon%20slayer"

# 3. Voir les tendances
curl "https://anime-sama-scraper.vercel.app/api/trending"

# 4. Épisodes récents  
curl "https://anime-sama-scraper.vercel.app/api/recent"

# 5. Détails d'un anime
curl "https://anime-sama-scraper.vercel.app/api/anime/demon-slayer"

# 6. Saisons disponibles
curl "https://anime-sama-scraper.vercel.app/api/seasons/demon-slayer"

# 7. Épisodes d'une saison
curl "https://anime-sama-scraper.vercel.app/api/episodes/demon-slayer?season=1&language=VOSTFR"
```

## 💻 Intégration JavaScript Simple

### Code Minimal
```html
<!DOCTYPE html>
<html>
<head>
    <title>Test API Anime-Sama</title>
</head>
<body>
    <h1>API Anime-Sama Test</h1>
    
    <!-- Recherche -->
    <input type="text" id="search" placeholder="Rechercher un anime...">
    <button onclick="searchAnime()">Rechercher</button>
    
    <!-- Résultats -->
    <div id="results"></div>

    <script>
        const API_URL = 'https://anime-sama-scraper.vercel.app';
        
        async function searchAnime() {
            const query = document.getElementById('search').value;
            const resultsDiv = document.getElementById('results');
            
            if (!query.trim()) return;
            
            try {
                resultsDiv.innerHTML = 'Recherche en cours...';
                
                const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.success) {
                    resultsDiv.innerHTML = `
                        <h3>Résultats (${data.count}):</h3>
                        ${data.results.map(anime => `
                            <div style="border:1px solid #ccc; margin:10px; padding:10px;">
                                <img src="${anime.image}" alt="${anime.title}" style="width:100px; height:140px;">
                                <h4>${anime.title}</h4>
                                <button onclick="getAnimeDetails('${anime.id}')">Voir Détails</button>
                            </div>
                        `).join('')}
                    `;
                } else {
                    resultsDiv.innerHTML = 'Aucun résultat trouvé';
                }
            } catch (error) {
                resultsDiv.innerHTML = `Erreur: ${error.message}`;
            }
        }
        
        async function getAnimeDetails(animeId) {
            try {
                const response = await fetch(`${API_URL}/api/anime/${animeId}`);
                const data = await response.json();
                
                if (data.success) {
                    const anime = data.data;
                    alert(`
Titre: ${anime.title}
Synopsis: ${anime.synopsis.substring(0, 200)}...
Genres: ${anime.genres.join(', ')}
Statut: ${anime.status}
Type: ${anime.type}
                    `);
                }
            } catch (error) {
                alert(`Erreur: ${error.message}`);
            }
        }
        
        // Test automatique au chargement
        window.onload = async function() {
            console.log('Test de l\'API Anime-Sama...');
            
            try {
                // Test trending
                const trendingResponse = await fetch(`${API_URL}/api/trending`);
                const trendingData = await trendingResponse.json();
                console.log('✅ Trending:', trendingData.count, 'animes');
                
                // Test recent
                const recentResponse = await fetch(`${API_URL}/api/recent`);
                const recentData = await recentResponse.json();
                console.log('✅ Recent:', recentData.count, 'épisodes');
                
                console.log('🎉 API fonctionnelle !');
            } catch (error) {
                console.error('❌ Erreur API:', error);
            }
        };
    </script>
</body>
</html>
```

## ⚛️ Intégration React Rapide

### Composant Simple
```jsx
import React, { useState, useEffect } from 'react';

const API_URL = 'https://anime-sama-scraper.vercel.app';

function AnimeApp() {
    const [trending, setTrending] = useState([]);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Charger les tendances au démarrage
    useEffect(() => {
        fetch(`${API_URL}/api/trending`)
            .then(res => res.json())
            .then(data => setTrending(data.trending || []))
            .catch(console.error);
    }, []);

    // Recherche avec debounce
    useEffect(() => {
        if (!search.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(search)}`);
                const data = await response.json();
                setResults(data.results || []);
            } catch (error) {
                console.error('Erreur recherche:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>API Anime-Sama Demo</h1>
            
            {/* Recherche */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un anime..."
                    style={{ 
                        padding: '10px', 
                        width: '300px', 
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '5px'
                    }}
                />
                {loading && <span style={{ marginLeft: '10px' }}>🔄</span>}
            </div>

            {/* Résultats de recherche */}
            {results.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>Résultats de recherche ({results.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                        {results.map(anime => (
                            <div key={anime.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                                <img 
                                    src={anime.image} 
                                    alt={anime.title}
                                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                                />
                                <h4 style={{ margin: '10px 0', fontSize: '14px' }}>{anime.title}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tendances */}
            <div>
                <h3>Animes Tendances ({trending.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                    {trending.slice(0, 12).map(anime => (
                        <div key={anime.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
                            <img 
                                src={anime.image} 
                                alt={anime.title}
                                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                            />
                            <h4 style={{ margin: '10px 0', fontSize: '14px' }}>{anime.title}</h4>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default AnimeApp;
```

## 🔧 Configuration avec Fetch API

### Classe Utilitaire Simple
```javascript
class AnimeSamaAPI {
    constructor() {
        this.baseUrl = 'https://anime-sama-scraper.vercel.app';
    }

    async request(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }

    search(query) {
        return this.request('/api/search', { query });
    }

    getTrending() {
        return this.request('/api/trending');
    }

    getRecent() {
        return this.request('/api/recent');
    }

    getAnimeDetails(id) {
        return this.request(`/api/anime/${id}`);
    }

    getSeasons(animeId) {
        return this.request(`/api/seasons/${animeId}`);
    }

    getEpisodes(animeId, season = 1, language = 'VOSTFR') {
        return this.request(`/api/episodes/${animeId}`, { season, language });
    }

    getEmbedUrl(episodeUrl) {
        return `${this.baseUrl}/api/embed?url=${encodeURIComponent(episodeUrl)}`;
    }
}

// Utilisation
const api = new AnimeSamaAPI();

// Exemples
api.search('demon slayer').then(console.log);
api.getTrending().then(console.log);
api.getAnimeDetails('demon-slayer').then(console.log);
```

## 📱 Test Mobile avec JavaScript

```javascript
// Test rapide pour mobiles/tablettes
async function testMobileAPI() {
    const api = new AnimeSamaAPI();
    
    try {
        console.log('🔍 Test recherche...');
        const searchResult = await api.search('naruto');
        console.log(`✅ Trouvé ${searchResult.count} résultats`);
        
        console.log('📈 Test trending...');
        const trending = await api.getTrending();
        console.log(`✅ ${trending.count} animes tendances`);
        
        console.log('📺 Test épisodes récents...');
        const recent = await api.getRecent();
        console.log(`✅ ${recent.count} épisodes récents`);
        
        console.log('🎉 API complètement fonctionnelle !');
        return true;
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        return false;
    }
}

// Lancer le test
testMobileAPI();
```

## ⚡ Performance et Optimisation

### Cache Simple
```javascript
class CachedAnimeSamaAPI extends AnimeSamaAPI {
    constructor() {
        super();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async request(endpoint, params = {}) {
        const cacheKey = `${endpoint}?${new URLSearchParams(params)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        const data = await super.request(endpoint, params);
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        
        return data;
    }
}
```

## 🚨 Gestion d'Erreurs

```javascript
async function safeApiCall(apiFunction, fallback = null) {
    try {
        return await apiFunction();
    } catch (error) {
        console.error('Erreur API:', error.message);
        
        // Afficher un message à l'utilisateur
        if (error.message.includes('404')) {
            alert('Contenu introuvable');
        } else if (error.message.includes('500')) {
            alert('Erreur serveur, veuillez réessayer');
        } else {
            alert('Erreur de connexion');
        }
        
        return fallback;
    }
}

// Utilisation avec gestion d'erreurs
const results = await safeApiCall(
    () => api.search('anime inexistant'),
    { results: [], count: 0 }
);
```

Cette documentation vous permet de tester et utiliser immédiatement l'API en production !