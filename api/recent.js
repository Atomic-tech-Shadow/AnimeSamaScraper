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
        const $ = await scrapeAnimesama('https://anime-sama.eu/');
        
        const recentEpisodes = [];
        const seenLinks = new Set();
        
        // Extract from anime/manga cards with season/episode info
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/') || seenLinks.has(href)) {
                return;
            }
            seenLinks.add(href);
            
            // Check if this card has season/episode info
            const $card = $link.closest('.anime-card-premium, .card-base') || $link;
            const $infoItems = $card.find('.info-item.episode');
            
            if ($infoItems.length === 0) return;
            
            // Extract anime ID and title
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            if (!animeId) return;
            
            // Get title from card
            const $title = $card.find('.card-title');
            const animeTitle = $title.length > 0 ? $title.text().trim() : animeId.replace(/-/g, ' ');
            
            // Get image
            const $img = $card.find('.card-image');
            const image = $img.attr('src') || $img.attr('data-src') || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            
            // Extract season and language from URL
            let season = 1;
            let language = 'VOSTFR';
            
            if (href.includes('/saison')) {
                const seasonMatch = href.match(/\/saison(\d+)/);
                season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            }
            
            if (href.includes('/vf')) {
                language = 'VF';
            } else if (href.includes('/va')) {
                language = 'VA';
            }
            
            // Extract season info from card text
            let seasonText = '';
            $infoItems.each((i, item) => {
                const text = $(item).text().trim();
                if (text.includes('Saison') || text.includes('Partie')) {
                    seasonText = text;
                }
            });
            
            recentEpisodes.push({
                animeId: animeId,
                animeTitle: animeTitle,
                season: season,
                language: language,
                seasonInfo: seasonText,
                url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                image: image,
                addedAt: new Date().toISOString(),
                type: 'recent'
            });
        });
        
        // Limit to 30 most recent
        const limitedEpisodes = recentEpisodes.slice(0, 30);
        
        // Return recent episodes
        res.status(200).json({
            success: true,
            count: limitedEpisodes.length,
            recentEpisodes: limitedEpisodes
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
