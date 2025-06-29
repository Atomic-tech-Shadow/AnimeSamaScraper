// Configuration centralisée pour l'API Anime-Sama
export const API_CONFIG = {
  // URL de base de l'API en production
  BASE_URL: 'https://anime-sama-scraper.vercel.app',
  
  // Endpoints disponibles
  ENDPOINTS: {
    ROOT: '/',
    SEARCH: '/api/search',
    TRENDING: '/api/trending', 
    RECENT: '/api/recent',
    ANIME_DETAILS: '/api/anime',
    SEASONS: '/api/seasons',
    EPISODES: '/api/episodes',
    EMBED: '/api/embed'
  },
  
  // Configuration par défaut
  DEFAULTS: {
    LANGUAGE: 'VOSTFR',
    SEASON: 1,
    SEARCH_DEBOUNCE: 300,
    REQUEST_TIMEOUT: 8000
  },
  
  // Messages d'erreur
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Erreur de connexion à l\'API',
    NOT_FOUND: 'Contenu introuvable',
    SERVER_ERROR: 'Erreur serveur, veuillez réessayer',
    INVALID_PARAMS: 'Paramètres invalides'
  }
};

// Classe utilitaire pour construire les URLs
export class ApiUrlBuilder {
  static search(query) {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}`;
  }
  
  static trending() {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TRENDING}`;
  }
  
  static recent() {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RECENT}`;
  }
  
  static animeDetails(id) {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ANIME_DETAILS}/${id}`;
  }
  
  static seasons(animeId) {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEASONS}/${animeId}`;
  }
  
  static episodes(animeId, season = API_CONFIG.DEFAULTS.SEASON, language = API_CONFIG.DEFAULTS.LANGUAGE) {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EPISODES}/${animeId}?season=${season}&language=${language}`;
  }
  
  static embed(episodeUrl) {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EMBED}?url=${encodeURIComponent(episodeUrl)}`;
  }
}

// Export par défaut pour usage CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_CONFIG, ApiUrlBuilder };
}