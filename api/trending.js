const { getTrendingAnime } = require('../utils/scraper');

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
        // Get trending anime
        const trending = await getTrendingAnime();

        // Return results
        res.status(200).json({
            success: true,
            count: trending.length,
            results: trending
        });

    } catch (error) {
        console.error('Trending API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch trending anime',
            message: 'Unable to retrieve trending anime at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
