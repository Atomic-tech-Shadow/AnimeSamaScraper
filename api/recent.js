const { scrapeAnimesama } = require('../utils/scraper');

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
        // Scrape the homepage to get recent episodes
        const $ = await scrapeAnimesama('https://anime-sama.fr/');
        
        const recentEpisodes = [];
        
        // Find recent episodes in the "containerAjoutsAnimes" section
        $('#containerAjoutsAnimes .relative').each((index, element) => {
            const $el = $(element);
            const $link = $el.find('a');
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            // Extract anime info
            const $img = $el.find('img');
            const title = $el.find('h1').text().trim();
            const image = $img.attr('src');
            
            // Extract episode and season info from the URL and badges
            const urlParts = href.split('/');
            const animeId = urlParts.find((part, i) => urlParts[i-1] === 'catalogue');
            const seasonMatch = href.match(/saison(\d+)/);
            const episodeMatch = href.match(/episode-(\d+)/);
            
            // Extract language and episode info from badges
            const badges = $el.find('button').map((i, btn) => $(btn).text().trim()).get();
            const languageBadge = badges.find(badge => badge === 'VF' || badge === 'VOSTFR') || 'VOSTFR';
            const episodeBadge = badges.find(badge => badge.includes('Episode'));
            
            // Parse episode information
            let seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            let episodeNumber = null;
            
            if (episodeBadge) {
                const epMatch = episodeBadge.match(/Episode (\d+)/);
                if (epMatch) {
                    episodeNumber = parseInt(epMatch[1]);
                }
            }
            
            if (title && animeId) {
                recentEpisodes.push({
                    animeId: animeId,
                    animeTitle: title,
                    season: seasonNumber,
                    episode: episodeNumber,
                    language: languageBadge,
                    url: href,
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
                    addedAt: new Date().toISOString() // Current timestamp as proxy
                });
            }
        });
        
        // Return recent episodes
        res.status(200).json({
            success: true,
            count: recentEpisodes.length,
            recentEpisodes: recentEpisodes
        });
        
    } catch (error) {
        console.error('Recent episodes API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch recent episodes',
            message: 'Unable to retrieve recent episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};