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
        const { animeId } = req.query;
        const { season = '1', language = 'VOSTFR' } = req.query;

        // Validate anime ID
        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Please provide a valid anime ID'
            });
        }

        // Get anime episodes
        const episodes = await getAnimeEpisodes(animeId.trim(), season, language);

        // Return episodes
        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            season: parseInt(season),
            language: language,
            count: episodes.length,
            episodes: episodes
        });

    } catch (error) {
        console.error('Episodes API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch anime episodes',
            message: 'Unable to retrieve anime episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
