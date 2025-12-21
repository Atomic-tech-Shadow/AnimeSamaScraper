const cheerio = require('cheerio');
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
        // Scrape the homepage
        const $ = await scrapeAnimesama('https://anime-sama.eu/');
        
        const recentEpisodes = [];
        const seenLinks = new Set();
        
        // Target specific containers for recent additions
        // containerAjoutsAnimes: Recent Anime Episodes
        // containerAjoutsScans: Recent Manga Scans
        // containerAjoutsFilms: Recent Films
        
        const containers = [
            { id: '#containerAjoutsAnimes', type: 'anime' },
            { id: '#containerAjoutsScans', type: 'scan' },
            { id: '#containerAjoutsFilms', type: 'film' }
        ];

        containers.forEach(container => {
            $(container.id).find('a[href*="/catalogue/"]').each((index, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/') || seenLinks.has(href)) {
                    return;
                }
                
                seenLinks.add(href);
                
                // Extract anime ID from URL
                const urlParts = href.replace(/\/$/, '').split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length 
                    ? urlParts[catalogueIndex + 1] 
                    : null;
                
                if (!animeId) return;
                
                // Get title and metadata from card
                // The structure usually has the title and episode info in different elements
                let animeTitle = $link.find('.card-title').text().trim() || $link.find('h3').text().trim() || $link.attr('title') || $link.text().trim();
                
                // Clean up title
                animeTitle = animeTitle.split('\n')[0].trim()
                                      .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                                      .replace(/Saison\s*\d+.*$/i, '')
                                      .replace(/Partie\s*\d+.*$/i, '')
                                      .trim();
                
                if (!animeTitle || animeTitle.length < 2) {
                    animeTitle = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Get image
                const $img = $link.find('img').first();
                let image = $img.attr('src') || $img.attr('data-src');
                
                if (!image || !image.includes('statically')) {
                    image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                } else if (image && !image.startsWith('http')) {
                    image = 'https:' + image;
                }
                
                // Extract season and episode
                const infoText = $link.find('.info-text').text().trim() || $link.text();
                const seasonMatch = href.match(/\/saison(\d+)/i) || infoText.match(/Saison\s*(\d+)/i);
                const season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
                
                const episodeMatch = infoText.match(/[Éé]pisode?\s*(\d+)/i);
                const episode = episodeMatch ? parseInt(episodeMatch[1]) : null;
                
                // Language
                let language = 'VOSTFR';
                const langBadge = $link.find('.language-badge-top img').attr('title');
                if (langBadge) {
                    language = langBadge.toUpperCase();
                } else if (href.includes('/vf2') || infoText.includes('VF2')) {
                    language = 'VF2';
                } else if (href.includes('/vf1') || infoText.includes('VF1')) {
                    language = 'VF1';
                } else if (href.includes('/vf') || infoText.includes('VF')) {
                    language = 'VF';
                }
                
                const item = {
                    animeId: animeId,
                    animeTitle: animeTitle,
                    season: season,
                    episode: episode,
                    language: language,
                    url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                    image: image,
                    addedAt: new Date().toISOString(),
                    type: container.type
                };
                
                recentEpisodes.push(item);
            });
        });
        
        // Limit to 40 most recent across all categories
        const limitedEpisodes = recentEpisodes.slice(0, 40);
        
        // Return recent episodes
        res.status(200).json({
            success: true,
            count: limitedEpisodes.length,
            recentEpisodes: limitedEpisodes,
            extractedAt: new Date().toISOString()
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
