const { getAnimeEpisodes } = require('../../utils/scraper');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { animeId, season = '1', language = 'VOSTFR', server = 'eps1' } = req.query;

        // Validate required parameters
        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Please provide animeId parameter'
            });
        }

        // Get episodes for specific season
        const episodes = await getAnimeEpisodes(animeId.trim(), season, language);

        // Return episodes with server info
        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            season: parseInt(season),
            language: language,
            server: server,
            count: episodes.length,
            episodes: episodes.map(episode => ({
                ...episode,
                server: server
            }))
        });

    } catch (error) {
        console.error('Seasons index API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch season episodes',
            message: 'Unable to retrieve season episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
