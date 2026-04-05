const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Root route with API documentation
app.get('/', (req, res) => {
    res.json({
        name: "Anime-Sama API",
        version: '3.0.0',
        description: 'Real-time anime scraping API for anime-sama.to — Anime only (no scans/manga)',
        author: 'el_cid',
        status: 'running',
        endpoints: {
            search: {
                path: '/api/search?query=:query',
                description: 'Search anime by name',
                returns: 'id, title, image, url'
            },
            recent: {
                path: '/api/recent',
                description: 'Latest added/updated anime episodes',
                returns: 'animeId, title, season, seasonValue, episode, language, contentType, url, image'
            },
            planning: {
                path: '/api/planning',
                params: 'day (lundi|mardi|...|all), filter (vf|vostfr)',
                description: 'Weekly release schedule',
                returns: 'title, season, seasonValue, contentType, releaseTime, language'
            },
            popular: {
                path: '/api/popular',
                description: 'Classics and hidden gems from the homepage',
                returns: 'id, title, image, url, category'
            },
            recommendations: {
                path: '/api/recommendations?page=1&limit=50',
                description: 'Random anime catalogue page for discovery',
                returns: 'id, title, image, url'
            },
            animeDetails: {
                path: '/api/anime/:id',
                description: 'Full anime details including all seasons',
                returns: 'title, synopsis, image, genres, details, seasons[]'
            },
            seasons: {
                path: '/api/seasons/:animeId',
                description: 'List all seasons/films/OAV/kai for an anime',
                returns: 'name, value, type (Saison|Film|OAV|Kai), contentType, languages[]'
            },
            episodes: {
                path: '/api/episodes/:animeId?season=:seasonValue&language=VOSTFR',
                description: 'Episodes for a specific season — seasonValue from /api/seasons (ex: saison1, film, oav, kai, kai2, saison4-3)',
                contentTypes: 'anime, film, oav, kai',
                returns: 'number, title, streamingSources[], language'
            },
            seasonsIndex: {
                path: '/api/seasons?animeId=:id&season=:seasonValue&language=VOSTFR',
                description: 'Alternative episodes endpoint via query params',
                returns: 'episodes[]'
            },
            episodeSources: {
                path: '/api/episode-by-id/:episodeId',
                description: 'Streaming sources for one episode — format: {animeId}-s{season}-e{episode}',
                example: '/api/episode-by-id/one-piece-s1-e1',
                returns: 'server, url, quality'
            },
            embed: {
                path: '/api/embed?url=:episodeUrl',
                description: 'Extract streaming sources from a full anime-sama episode URL',
                returns: 'sources[], count'
            }
        },
        notes: {
            seasonValue: 'Always use the `seasonValue` field from /api/seasons as the `season` param in /api/episodes. Examples: saison1, film, oav, kai, kai2, saison4-3',
            contentTypes: 'anime | film | oav | kai',
            languages: 'VOSTFR | VF | VF1 | VF2 | VA | VKR | VCN | VQC | VAR | VJ'
        },
        examples: {
            search: 'GET /api/search?query=one+piece',
            recentEpisodes: 'GET /api/recent',
            planning: 'GET /api/planning?day=all',
            animeDetails: 'GET /api/anime/dragon-ball-z',
            seasons: 'GET /api/seasons/dragon-ball-z',
            episodesNormal: 'GET /api/episodes/one-piece?season=saison1&language=VOSTFR',
            episodesFilm: 'GET /api/episodes/one-piece?season=film&language=VOSTFR',
            episodesOAV: 'GET /api/episodes/one-piece?season=oav&language=VOSTFR',
            episodesKai: 'GET /api/episodes/dragon-ball-z?season=kai&language=VOSTFR',
            episodesPartielle: 'GET /api/episodes/dr-stone?season=saison4-3&language=VOSTFR',
            episodeSource: 'GET /api/episode-by-id/one-piece-s1-e1',
            embed: 'GET /api/embed?url=https%3A%2F%2Fanime-sama.to%2Fcatalogue%2Fone-piece%2Fsaison1%2Fvostfr%2Fepisode-1'
        }
    });
});

// API Routes
app.get('/api/search', require('./api/search.js'));
app.get('/api/recent', require('./api/recent.js'));
app.get('/api/planning', require('./api/planning.js'));
app.get('/api/popular', require('./api/popular.js'));
app.get('/api/recommendations', require('./api/recommendations.js'));
app.get('/api/anime/:id', (req, res) => {
    req.query.id = req.params.id;
    require('./api/anime/[id].js')(req, res);
});
// Route spécifique avec paramètre doit venir AVANT la route générale
app.get('/api/seasons/:animeId', (req, res) => {
    require('./api/seasons/[animeId].js')(req, res);
});
app.get('/api/episodes/:animeId', (req, res) => {
    require('./api/episodes/[animeId].js')(req, res);
});
// Route générale vient après
app.get('/api/seasons', require('./api/seasons/index.js'));
app.get('/api/episode-by-id/:episodeId', (req, res) => {
    req.query.episodeId = req.params.episodeId;
    require('./api/episode-by-id.js')(req, res);
});
app.get('/api/episode/:animeId/:season/:ep', (req, res) => {
    req.query.animeId = req.params.animeId;
    req.query.season = req.params.season;
    req.query.ep = req.params.ep;
    require('./api/episode/[animeId]/[season]/[ep].js')(req, res);
});
app.get('/api/embed', require('./api/embed.js'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: [
            '/api/search?query=anime_name',
            '/api/recent',
            '/api/planning',
            '/api/recommendations?page=1&limit=50',
            '/api/anime/:id',
            '/api/seasons/:animeId',
            '/api/episodes/:animeId',
            '/api/episode-by-id/:episodeId',
            '/api/embed?url=anime_url'
        ]
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Start server
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log('🚀 Anime-Sama API Server running on port', PORT);
        console.log('⚡ Powered by el_cid');
        console.log('📚 API Documentation:', `http://localhost:${PORT}`);
        console.log('🔍 Search endpoint:', `http://localhost:${PORT}/api/search?query=naruto`);
        console.log('📈 Recent endpoint:', `http://localhost:${PORT}/api/recent`);
        console.log('🎬 Embed endpoint:', `http://localhost:${PORT}/api/embed?url=https%3A%2F%2Fanime-sama.to%2Fcatalogue%2Fblack-butler`);
    });
}

module.exports = app;