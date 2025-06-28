const { getAnimeEpisodes, getEpisodeSources } = require('../../../../utils/scraper');

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
        const { animeId, season, ep } = req.query;
        const { language = 'VOSTFR' } = req.query;

        // Validate required parameters
        if (!animeId || !season || !ep) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                message: 'Please provide animeId, season, and episode number'
            });
        }

        // Get episodes to find the specific episode URL
        const episodes = await getAnimeEpisodes(animeId.trim(), season, language);
        const targetEpisode = episodes.find(episode => episode.number === parseInt(ep));

        if (!targetEpisode) {
            return res.status(404).json({
                error: 'Episode not found',
                message: `Episode ${ep} not found for ${animeId} season ${season}`
            });
        }

        // Try to get sources if episode has URL/ID
        let sources = [];
        if (targetEpisode.url) {
            try {
                // Extract episode ID from URL or use combination
                const episodeId = `${animeId}-s${season}-e${ep}`;
                sources = await getEpisodeSources(episodeId);
            } catch (sourceError) {
                console.warn('Could not fetch sources:', sourceError.message);
            }
        }

        // Return episode details with sources
        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            season: parseInt(season),
            episode: parseInt(ep),
            language: language,
            episodeDetails: targetEpisode,
            sources: sources
        });

    } catch (error) {
        console.error('Specific episode API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch episode details',
            message: 'Unable to retrieve episode details at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
