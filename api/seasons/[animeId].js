const { getAnimeSeasons } = require('../../utils/scraper');

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
        // Get animeId from params OR query (support both route patterns)
        const animeId = req.params?.animeId || req.query?.animeId;

        // Validate anime ID
        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Please provide a valid anime ID (use /api/seasons/:animeId)'
            });
        }

        // Get anime seasons
        const seasons = await getAnimeSeasons(animeId.trim());

        // Format seasons for API response
        const formattedSeasons = seasons.map(season => ({
            number: season.number,
            name: season.name,
            value: season.number.toString(),
            languages: season.languages || ['VOSTFR'],
            available: season.available !== false
        }));

        // Return seasons
        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            count: formattedSeasons.length,
            seasons: formattedSeasons
        });

    } catch (error) {
        console.error('Seasons API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch anime seasons',
            message: 'Unable to retrieve anime seasons at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
