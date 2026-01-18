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
        const $ = await scrapeAnimesama('https://anime-sama.si/');
        
        const recentEpisodes = [];
        const seenLinks = new Set();
        
        // Target the "Derniers épisodes ajoutés" container specifically
        const containerId = '#containerAjoutsAnimes';
        
        $(containerId).find('a[href*="/catalogue/"]').each((index, element) => {
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
            const cleanId = animeId.toLowerCase().replace(/\/$/, '').trim();
            
            // Get title and metadata from card
            let animeTitle = $link.find('.card-title').text().trim() || $link.find('h3').text().trim() || $link.attr('title') || $link.text().trim();
            
            // Clean up title
            animeTitle = animeTitle.split('\n')[0].trim()
                                  .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                                  .replace(/Saison\s*\d+.*$/i, '')
                                  .replace(/Partie\s*\d+.*$/i, '')
                                  .trim();
            
            if (!animeTitle || animeTitle.length < 2) {
                animeTitle = cleanId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            
            // Try to get image from DOM first
            let image = $link.find('img').attr('src') || $link.find('img').attr('data-src');
            
            // Fallback to CDN if not found or if it's a relative path
            if (!image || !image.startsWith('http') || image.includes('anime-sama.si')) {
                image = `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
            }
            
            // Extract season and episode
            const infoText = $link.find('.info-text').text().trim() || $link.text();
            
            // Extract Season
            const seasonMatch = infoText.match(/(?:Saison|Partie|Part|S)\s*(\d+)/i) || href.match(/\/saison(\d+)/i);
            const season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            
            // Extract Episode
            const epMatch = infoText.match(/(?:Episode|Ep\.?|E)\s*(\d+)/i);
            const episode = epMatch ? parseInt(epMatch[1]) : null;

            // NEW: Improved Type Detection (Film, OAV, Special)
            let type = 'anime';
            if (infoText.toLowerCase().includes('scan') || href.includes('/scan/')) {
                return; // Skip scans
            } else if (infoText.toLowerCase().includes('film') || href.includes('/film/')) {
                type = 'film';
            } else if (infoText.toLowerCase().includes('oav') || href.includes('/oav/')) {
                type = 'oav';
            } else if (infoText.toLowerCase().includes('special') || href.includes('/special/')) {
                type = 'special';
            }
            
            const item = {
                animeId: animeId,
                animeTitle: animeTitle,
                season: season,
                episode: episode,
                language: language,
                isFin: isFin,
                isReporte: isReporte,
                url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                image: image,
                addedAt: new Date().toISOString(),
                type: type,
                infoText: infoText // Added for debugging and clarity
            };
            
            recentEpisodes.push(item);
        });
        
        // Return recent episodes
        res.status(200).json({
            success: true,
            count: recentEpisodes.length,
            recentEpisodes: recentEpisodes,
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
