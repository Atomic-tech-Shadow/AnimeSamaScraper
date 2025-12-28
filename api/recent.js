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
        const $ = await scrapeAnimesama('https://anime-sama.tv/');
        
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
            
            // Get title and metadata from card
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
            
            // Get image - Use direct CDN URL for instant loading
            const image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            
            // Extract season and episode
            const infoText = $link.find('.info-text').text().trim() || $link.text();
            
            // Extract Season
            const seasonMatch = href.match(/\/saison(\d+)/i) || infoText.match(/Saison\s*(\d+)/i);
            const season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            
            // Extract Episode
            // Pattern 1: "Episode 1154"
            // Pattern 2: "Saison 1 Episode 15"
            const epMatch = infoText.match(/Episode\s*(\d+)/i);
            const episode = epMatch ? parseInt(epMatch[1]) : null;

            // Extract special statuses
            const isFin = infoText.includes('[FIN]') || infoText.toLowerCase().includes('fin');
            const isReporte = infoText.toLowerCase().includes('reporté') || infoText.toLowerCase().includes('reporte');
            
            // Language
            let language = 'VOSTFR';
            const langBadge = $link.find('.language-badge-top img').attr('title') || $link.find('.language-badge-top img').attr('alt');
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
                isFin: isFin,
                isReporte: isReporte,
                url: href.startsWith('http') ? href : `https://anime-sama.tv${href}`,
                image: image,
                addedAt: new Date().toISOString(),
                type: 'anime',
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
