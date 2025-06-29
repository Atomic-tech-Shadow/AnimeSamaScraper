const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Root endpoint with documentation
app.get('/', (req, res) => {
    res.json({
        name: 'Anime-Sama API',
        version: '1.0.0',
        description: 'Real-time anime scraping API for anime-sama.fr',
        endpoints: {
            search: '/api/search?query=naruto',
            trending: '/api/trending',
            recent: '/api/recent',
            animeDetails: '/api/anime/:id',
            seasons: '/api/seasons/:animeId',
            episodes: '/api/episodes/:animeId?season=1&language=VOSTFR',
            embed: '/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2F...'
        }
    });
});

// API Routes
app.get('/api/search', require('./api/search.js'));
app.get('/api/trending', require('./api/trending.js'));
app.get('/api/recent', require('./api/recent.js'));

app.get('/api/anime/:id', (req, res) => {
    require('./api/anime/[id].js')(req, res);
});

app.get('/api/seasons/:animeId', (req, res) => {
    require('./api/seasons/[animeId].js')(req, res);
});

app.get('/api/episodes/:animeId', (req, res) => {
    require('./api/episodes/[animeId].js')(req, res);
});

app.get('/api/embed', require('./api/embed.js'));

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: ['/api/search', '/api/trending', '/api/recent', '/api/anime/:id', '/api/seasons/:animeId', '/api/episodes/:animeId', '/api/embed']
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Anime-Sama API Server running on port ${PORT}`);
    console.log(`📚 Documentation: http://localhost:${PORT}`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/search?query=naruto`);
    console.log(`📈 Trending: http://localhost:${PORT}/api/trending`);
    console.log(`📺 Recent: http://localhost:${PORT}/api/recent`);
});