const { getEpisodeSources } = require('../utils/scraper');

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
        const { episodeId } = req.query;

        // Validate episode ID
        if (!episodeId || episodeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Episode ID is required',
                message: 'Please provide a valid episode ID'
            });
        }

        // Get episode sources
        const sources = await getEpisodeSources(episodeId.trim());

        // Return episode sources
        res.status(200).json({
            success: true,
            episodeId: episodeId.trim(),
            count: sources.length,
            sources: sources
        });

    } catch (error) {
        console.error('Episode sources API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch episode sources',
            message: 'Unable to retrieve episode sources at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
