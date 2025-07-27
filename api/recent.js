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
        
        // CORRECTION CRITIQUE: Extraire des boutons bg-cyan-600 identifiés dans l'audit
        $('button.bg-cyan-600').each((index, element) => {
            const $button = $(element);
            const buttonText = $button.text().trim();
            
            // Trouver le lien parent ou voisin pour obtenir l'URL de l'anime
            const $container = $button.closest('a[href*="/catalogue/"]') || 
                              $button.parent().find('a[href*="/catalogue/"]') ||
                              $button.siblings('a[href*="/catalogue/"]');
            
            const href = $container.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            
            // Parser le texte du bouton pour extraire les informations
            const isFinale = buttonText.includes('[FIN]');
            const isVFCrunchyroll = buttonText.includes('VF Crunchyroll');
            
            // Extract episode info from button text
            let seasonNumber = null;
            let episodeNumber = null;
            let animeTitle = '';
            
            // Patterns possibles: "Episode 1137", "Saison 1 Episode 4", "Saison 2 Episode 24 [FIN]"
            const episodeMatch = buttonText.match(/Episode\s*(\d+)/i);
            const seasonMatch = buttonText.match(/Saison\s*(\d+)/i);
            
            if (episodeMatch) {
                episodeNumber = parseInt(episodeMatch[1]);
            }
            if (seasonMatch) {
                seasonNumber = parseInt(seasonMatch[1]);
            } else {
                seasonNumber = 1; // Default
            }
            
            // Extract anime ID from URL
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            if (!animeId || !episodeNumber) return;
            
            // Obtenir le titre de l'anime depuis l'élément parent
            animeTitle = $container.find('strong, h1, h2, h3').first().text().trim();
            if (!animeTitle) {
                // Fallback: construire le titre depuis l'ID
                animeTitle = animeId.replace(/-/g, ' ')
                                   .split(' ')
                                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                   .join(' ');
            }
            
            // Nettoyer le titre
            animeTitle = animeTitle.replace(/\s+/g, ' ')
                                  .replace(/\n/g, ' ')
                                  .replace(/\t/g, ' ')
                                  .trim();
            
            // Obtenir l'image
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
        
        // Fallback: Si pas d'éléments trouvés avec bg-cyan-600, utiliser l'ancienne méthode
        if (recentEpisodes.length === 0) {
            $('#containerAjoutsAnimes .relative').each((index, element) => {
            const $el = $(element);
            const $link = $el.find('a');
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            // Extract anime info with better selectors
            const $img = $el.find('img');
            const title = $el.find('h1.text-gray-200').text().trim();
            const image = $img.attr('src');
            const altImage = $img.attr('alt'); // Backup image URL
            
            // Extract anime ID from URL path
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            // Extract season and language from URL structure  
            const seasonMatch = href.match(/saison(\d+)/);
            const languageFromUrl = href.includes('/vf/') ? 'VF' : 'VOSTFR';
            
            // Extract detailed badge information
            const badges = $el.find('button').map((i, btn) => $(btn).text().trim()).get();
            const languageBadge = badges.find(badge => badge === 'VF' || badge === 'VOSTFR') || languageFromUrl;
            const episodeBadge = badges.find(badge => badge.includes('Episode') || badge.includes('Saison'));
            
            // Enhanced episode parsing
            let seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            let episodeNumber = null;
            let isFinale = false;
            
            if (episodeBadge) {
                // Parse "Saison 2 Episode 10" or "Saison 1 Episode 13 [FIN]"
                const epMatch = episodeBadge.match(/Saison (\d+) Episode (\d+)/);
                const finMatch = episodeBadge.includes('[FIN]');
                
                if (epMatch) {
                    seasonNumber = parseInt(epMatch[1]);
                    episodeNumber = parseInt(epMatch[2]);
                    isFinale = finMatch;
                }
            }
            
            // Generate proper image URL
            let finalImage = null;
            if (image && image.startsWith('http')) {
                finalImage = image;
            } else if (altImage && altImage.startsWith('http')) {
                finalImage = altImage;
            } else if (animeId) {
                finalImage = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            }
            
            // Only add if we have essential data
            if (title && animeId && seasonNumber && episodeNumber) {
                recentEpisodes.push({
                    animeId: animeId,
                    animeTitle: title,
                    season: seasonNumber,
                    episode: episodeNumber,
                    language: languageBadge,
                    isFinale: isFinale,
                    url: href,
                    image: finalImage,
                    badgeInfo: episodeBadge, // Keep original badge text for reference
                    addedAt: new Date().toISOString(),
                    type: isFinale ? 'finale' : 'episode'
                });
            }
        });
        }
        
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