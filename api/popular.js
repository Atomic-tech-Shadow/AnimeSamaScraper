const { scrapeAnimesama } = require('../utils/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const $ = await scrapeAnimesama('https://anime-sama.eu/');
        
        const popularAnime = {
            classiques: [],
            pepites: []
        };
        
        const seenIds = new Set();
        
        // Extract Pépites from the pépites container
        const $pepitesContainer = $('#containerPepites');
        if ($pepitesContainer.length > 0) {
            $pepitesContainer.find('a[href*="/catalogue/"]').each((index, link) => {
                if (popularAnime.pepites.length >= 15) return false;
                
                const $link = $(link);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);
                
                const $card = $link.closest('.anime-card-premium, .card-base, .shrink-0') || $link;
                const $title = $card.find('.card-title');
                const title = $title.length > 0 ? $title.text().trim() : animeId.replace(/-/g, ' ');
                
                const $img = $card.find('.card-image');
                const image = $img.attr('src') || $img.attr('data-src') || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                
                popularAnime.pepites.push({
                    id: animeId,
                    title: title,
                    image: image,
                    url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                    category: 'pepite'
                });
            });
        }
        
        // Extract other popular/classiques from main page (not in pepites container)
        $('a[href*="/catalogue/"]').each((index, link) => {
            if (popularAnime.classiques.length >= 15) return false;
            
            const $link = $(link);
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            if (!animeId || seenIds.has(animeId)) return;
            seenIds.add(animeId);
            
            const $card = $link.closest('.anime-card-premium, .card-base') || $link;
            
            // Skip if this is in the pepites container
            if ($card.closest('#containerPepites').length > 0) return;
            
            const $title = $card.find('.card-title');
            const title = $title.length > 0 ? $title.text().trim() : animeId.replace(/-/g, ' ');
            
            const $img = $card.find('.card-image');
            const image = $img.attr('src') || $img.attr('data-src') || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            
            popularAnime.classiques.push({
                id: animeId,
                title: title,
                image: image,
                url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                category: 'classique'
            });
        });
        
        const allPopular = [...popularAnime.classiques, ...popularAnime.pepites];
        
        res.status(200).json({
            success: true,
            totalCount: allPopular.length,
            categories: {
                classiques: {
                    count: popularAnime.classiques.length,
                    anime: popularAnime.classiques
                },
                pepites: {
                    count: popularAnime.pepites.length,
                    anime: popularAnime.pepites
                }
            },
            allPopular: allPopular,
            extractedAt: new Date().toISOString(),
            source: 'anime-sama.eu homepage'
        });
        
    } catch (error) {
        console.error('Popular API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch popular anime',
            message: 'Unable to retrieve popular anime at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
