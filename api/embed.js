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
        const { url } = req.query;

        // Validate URL parameter
        if (!url) {
            return res.status(400).json({ 
                error: 'URL parameter is required',
                message: 'Please provide a URL to extract streaming sources from',
                usage: 'Example: /api/embed?url=https://anime-sama.si/catalogue/one-piece/saison1/vostfr/episode-1'
            });
        }

        // Decode URL
        const decodedUrl = decodeURIComponent(url);

        // Validate that it's an anime-sama.si URL or streaming URL
        if (!decodedUrl.includes('anime-sama.si') && !decodedUrl.match(/^https?:\/\//)) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'Please provide a valid anime-sama.si URL or direct streaming URL'
            });
        }

        console.log(`Embed API: Extracting sources from ${decodedUrl}`);

        // Extract streaming sources using the scraper
        const sources = await getEpisodeSources(decodedUrl);

        if (sources.length === 0) {
            return res.status(404).json({
                error: 'No streaming sources found',
                message: 'No streaming sources could be extracted from the provided URL',
                url: decodedUrl
            });
        }

        // Return streaming sources as JSON
        res.status(200).json({
            success: true,
            url: decodedUrl,
            sources: sources,
            count: sources.length,
            extracted_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Embed API error:', error);
        
        res.status(500).json({
            error: 'Failed to extract streaming sources',
            message: 'Unable to extract streaming sources at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
