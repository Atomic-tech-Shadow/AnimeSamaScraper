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
        name: 'Anime-Sama API',
        version: '1.0.0',
        description: 'Real-time anime scraping API for anime-sama.fr',
        status: 'running',
        endpoints: {
            search: '/api/search?query=naruto',
            trending: '/api/trending',
            animeDetails: '/api/anime/:id',
            seasons: '/api/seasons/:animeId',
            episodes: '/api/episodes/:animeId?season=1&language=VOSTFR',
            seasonsIndex: '/api/seasons?animeId=xxx&season=1&language=VF&server=eps1',
            episodeSources: '/api/episode/:episodeId',
            specificEpisode: '/api/episode/:animeId/:season/:episode',
            embed: '/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2F...'
        },
        examples: {
            searchAnime: 'GET /api/search?query=black%20butler',
            getTrending: 'GET /api/trending',
            getAnimeDetails: 'GET /api/anime/black-butler',
            getSeasons: 'GET /api/seasons/black-butler',
            getEpisodes: 'GET /api/episodes/black-butler?season=1&language=VOSTFR',
            getEpisodeSources: 'GET /api/episode/black-butler-s1-e1',
            embedPlayer: 'GET /api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler'
        }
    });
});

// API Routes
app.get('/api/search', require('./api/search.js'));
app.get('/api/trending', require('./api/trending.js'));
app.get('/api/anime/:id', (req, res) => {
    req.query.id = req.params.id;
    require('./api/anime/[id].js')(req, res);
});
app.get('/api/seasons/:animeId', (req, res) => {
    req.query.animeId = req.params.animeId;
    require('./api/seasons/[animeId].js')(req, res);
});
app.get('/api/episodes/:animeId', (req, res) => {
    req.query.animeId = req.params.animeId;
    require('./api/episodes/[animeId].js')(req, res);
});
app.get('/api/seasons', require('./api/seasons/index.js'));
app.get('/api/episode/:episodeId', (req, res) => {
    req.query.episodeId = req.params.episodeId;
    require('./api/episode/[episodeId].js')(req, res);
});
app.get('/api/episode/:animeId/:season/:ep', (req, res) => {
    req.query.animeId = req.params.animeId;
    req.query.season = req.params.season;
    req.query.ep = req.params.ep;
    require('./api/episode/[animeId]/[season]/[ep].js')(req, res);
});
app.get('/api/embed', require('./api/embed.js'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested endpoint does not exist',
        availableEndpoints: [
            '/api/search?query=anime_name',
            '/api/trending',
            '/api/anime/:id',
            '/api/seasons/:animeId',
            '/api/episodes/:animeId',
            '/api/episode/:episodeId',
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
        console.log('📚 API Documentation:', `http://localhost:${PORT}`);
        console.log('🔍 Search endpoint:', `http://localhost:${PORT}/api/search?query=naruto`);
        console.log('📈 Trending endpoint:', `http://localhost:${PORT}/api/trending`);
        console.log('🎬 Embed endpoint:', `http://localhost:${PORT}/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler`);
    });
}

module.exports = app;