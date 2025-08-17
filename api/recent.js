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
        const seenEpisodes = new Set(); // Pour éviter les doublons
        
        // Extract from bg-cyan-600 buttons
        const processedButtons = new Set(); // Pour éviter de traiter le même bouton plusieurs fois
        
        $('button.bg-cyan-600').each((index, element) => {
            const $button = $(element);
            const buttonText = $button.text().trim();
            
            // Créer un identifiant unique pour ce bouton basé sur le texte et la position
            const buttonId = `${index}-${buttonText}`;
            if (processedButtons.has(buttonId)) return;
            processedButtons.add(buttonId);
            
            // Find parent link
            const $container = $button.closest('a[href*="/catalogue/"]') || 
                              $button.parent().find('a[href*="/catalogue/"]') ||
                              $button.siblings('a[href*="/catalogue/"]');
            
            const href = $container.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            
            // Parse button text
            const isFinale = buttonText.includes('[FIN]');
            const isVFCrunchyroll = buttonText.includes('VF Crunchyroll');
            
            const episodeMatch = buttonText.match(/Episode\s*(\d+)/i);
            const seasonMatch = buttonText.match(/Saison\s*(\d+)/i);
            
            let seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            let episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : null;
            
            // Extract anime ID from URL
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            if (!animeId || !episodeNumber) return;
            
            // Create unique identifier to prevent duplicates
            const uniqueKey = `${animeId}-s${seasonNumber}-e${episodeNumber}-${isVFCrunchyroll ? 'VF' : 'VOSTFR'}`;
            if (seenEpisodes.has(uniqueKey)) return;
            seenEpisodes.add(uniqueKey);
            
            // Get anime title
            let animeTitle = $container.find('strong, h1, h2, h3').first().text().trim();
            if (!animeTitle) {
                animeTitle = animeId.replace(/-/g, ' ')
                                   .split(' ')
                                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                   .join(' ');
            }
            
            // Clean title
            animeTitle = animeTitle.replace(/\s+/g, ' ').trim();
            
            // Get image
            const $img = $container.find('img').first();
            let image = $img.attr('src') || $img.attr('data-src');
            if (image && !image.startsWith('http')) {
                image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.fr${image}`;
            }
            
            recentEpisodes.push({
                animeId: animeId,
                animeTitle: animeTitle,
                season: seasonNumber,
                episode: episodeNumber,
                language: isVFCrunchyroll ? 'VF' : 'VOSTFR',
                isFinale: isFinale,
                isVFCrunchyroll: isVFCrunchyroll,
                url: href.startsWith('http') ? href : `https://anime-sama.fr${href}`,
                image: image || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                badgeInfo: buttonText,
                addedAt: new Date().toISOString(),
                type: isFinale ? 'finale' : 'episode'
            });
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