const { searchAnime } = require('../utils/scraper');

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
        const { query } = req.query;

        // Validate query parameter
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Query parameter is required',
                message: 'Please provide a search query using ?query=anime_name'
            });
        }

        // Perform search
        const results = await searchAnime(query.trim());

        // Return results
        res.setHeader('X-Provider', 'Anime-Sama');
        res.setHeader('X-API-Version', '2.0.0');
        res.status(200).json({
            success: true,
            query: query.trim(),
            count: results.length,
            animes: results
        });

    } catch (error) {
        console.error('Search API error:', error);
        
        res.status(500).json({
            error: 'Search failed',
            message: 'Unable to search anime at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
