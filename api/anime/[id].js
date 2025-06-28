const { getAnimeDetails } = require('../../utils/scraper');

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
        const { id } = req.query;

        // Validate anime ID
        if (!id || id.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Please provide a valid anime ID'
            });
        }

        // Get anime details
        const details = await getAnimeDetails(id.trim());

        // Return anime details
        res.status(200).json({
            success: true,
            data: details
        });

    } catch (error) {
        console.error('Anime details API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch anime details',
            message: 'Unable to retrieve anime details at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
