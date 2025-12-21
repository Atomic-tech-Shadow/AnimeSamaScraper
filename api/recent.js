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
            
            // Get title from card (no fallback)
            const $title = $card.find('.card-title');
            const animeTitle = $title.length > 0 ? $title.text().trim() : null;
            
            // Get image (no fallback)
            const $img = $card.find('.card-image');
            const image = $img.attr('src') || $img.attr('data-src') || null;
            
            // Extract season and language from URL
            let season = null;
            let seasonPart = null;
            let episode = null;
            let language = null;
            
            // Extract season number and part/variant (only if found)
            if (href.includes('/saison')) {
                const seasonMatch = href.match(/\/saison(\d+)(?:-(\d+))?/);
                if (seasonMatch) {
                    season = parseInt(seasonMatch[1]);
                    // Extract part number if exists (e.g., saison1-2 means season 1 part 2)
                    if (seasonMatch[2]) {
                        seasonPart = parseInt(seasonMatch[2]);
                    } else {
                        seasonPart = 1;
                    }
                }
            }
            
            // Extract language (only if found in URL - check most specific first)
            if (href.includes('/vostfr')) {
                language = 'VOSTFR';
            } else if (href.includes('/vj')) {
                language = 'VJ';
            } else if (href.includes('/vf2')) {
                language = 'VF2';
            } else if (href.includes('/vf1')) {
                language = 'VF1';
            } else if (href.includes('/vf')) {
                language = 'VF';
            } else if (href.includes('/va')) {
                language = 'VA';
            } else if (href.includes('/vkr')) {
                language = 'VKR';
            } else if (href.includes('/vcn')) {
                language = 'VCN';
            } else if (href.includes('/vqc')) {
                language = 'VQC';
            }
            
            // Extract season and episode info from card text
            let seasonText = null;
            let episodeText = null;
            $infoItems.each((i, item) => {
                const text = $(item).text().trim();
                if (text.includes('Saison') || text.includes('Partie')) {
                    seasonText = text;
                    // Try to extract episode number from text
                    const episodeMatch = text.match(/[Éé]pisode?\s*(\d+)/i);
                    if (episodeMatch) {
                        episode = parseInt(episodeMatch[1]);
                        episodeText = episodeMatch[0];
                    }
                }
            });
            
            // Only add item if it has necessary data from the site
            const item = {
                animeId: animeId,
                animeTitle: animeTitle,
                season: season,
                seasonPart: seasonPart,
                episode: episode,
                language: language,
                seasonInfo: seasonText,
                episodeInfo: episodeText,
                url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                image: image,
                addedAt: new Date().toISOString(),
                type: 'recent'
            };
            
            recentEpisodes.push(item);
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
