// Root API endpoint for Vercel deployment
module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    res.status(200).json({
        name: 'Anime-Sama API',
        version: '1.0.0',
        description: 'Real-time anime scraping API for anime-sama.fr',
        status: 'running',
        deployment: 'vercel',
        endpoints: {
            search: '/api/search?query=naruto',
            trending: '/api/trending',
            animeDetails: '/api/anime/:id',
            seasons: '/api/seasons/:animeId',
            episodes: '/api/episodes/:animeId?season=1&language=VOSTFR',
            seasonsIndex: '/api/seasons?animeId=xxx&season=1&language=VF&server=eps1',
            episodeSources: '/api/episode-by-id/:episodeId',
            specificEpisode: '/api/episode/:animeId/:season/:episode',
            embed: '/api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2F...'
        },
        examples: {
            searchAnime: 'GET /api/search?query=black%20butler',
            getTrending: 'GET /api/trending',
            getAnimeDetails: 'GET /api/anime/black-butler',
            getSeasons: 'GET /api/seasons/black-butler',
            getEpisodes: 'GET /api/episodes/black-butler?season=1&language=VOSTFR',
            getEpisodeSources: 'GET /api/episode-by-id/black-butler-s1-e1',
            embedPlayer: 'GET /api/embed?url=https%3A%2F%2Fanime-sama.fr%2Fcatalogue%2Fblack-butler'
        },
        documentation: {
            github: 'https://github.com/Atomic-tech-Shadow/AnimeSamaScraper',
            vercel: 'https://anime-sama-scraper.vercel.app'
        }
    });
};