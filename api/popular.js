const cheerio = require('cheerio');
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
        const $ = await scrapeAnimesama('https://anime-sama.si/');
        
        const popularAnime = {
            classiques: [],
            pepites: []
        };
        
        const seenIds = new Set();
        
        // Extract Pépites from container
        const $pepitesContainer = $('#containerPepites');
        if ($pepitesContainer.length > 0) {
            $pepitesContainer.find('a[href*="/catalogue/"]').each((index, link) => {
                if (popularAnime.pepites.length >= 15) return false;
                
                const $link = $(link);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length
                    ? urlParts[catalogueIndex + 1]
                    : null;
                
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);
                const cleanId = animeId.toLowerCase().replace(/\/$/, '').trim();
                
                // Clean title - extract just the main title
                let title = $link.find('h2.card-title, .card-title, h1, h3, .title, p').first().text().trim() || $link.attr('alt') || $link.find('img').attr('alt') || $link.text().trim();
                title = title.replace(/\n/g, ' ')
                            .replace(/\s+/g, ' ')
                            .replace(/(\d{1,2}h\d{2})/g, '')
                            .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                            .replace(/Saison\s*\d+.*$/i, '')
                            .replace(/Partie\s*\d+.*$/i, '')
                            .replace(/Genres.*$/i, '')
                            .replace(/Types.*$/i, '')
                            .replace(/Langues.*$/i, '')
                            .replace(/Synopsis.*$/i, '')
                            .trim();
                
                // If title is still "Scans", try to get it from animeId
                if (title.toLowerCase() === 'scans' || !title || title.length < 2) {
                    title = cleanId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Try to get image from DOM first
                let image = $link.find('img').attr('src') || $link.find('img').attr('data-src');
                
                // Fallback to CDN if not found or if it's a relative path
                if (!image || !image.startsWith('http') || image.includes('anime-sama.si')) {
                    image = `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
                }
                
                popularAnime.pepites.push({
                    id: cleanId,
                    title: title,
                    image: image,
                    url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                    category: 'pepite'
                });
            });
        }
        
        // Extract Classiques from containerClassiques
        const $classiquesContainer = $('#containerClassiques');
        if ($classiquesContainer.length > 0) {
            $classiquesContainer.find('a[href*="/catalogue/"]').each((index, link) => {
                if (popularAnime.classiques.length >= 15) return false;
                
                const $link = $(link);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length
                    ? urlParts[catalogueIndex + 1]
                    : null;
                
                if (!animeId || seenIds.has(animeId)) return;
            
                seenIds.add(animeId);
                const cleanId = animeId.toLowerCase().replace(/\/$/, '').trim();
                
                // Clean title - extract just the main title
                let title = $link.find('h2.card-title, .card-title, h1, h3, .title, p').first().text().trim() || $link.attr('alt') || $link.find('img').attr('alt') || $link.text().trim();
                title = title.replace(/\n/g, ' ')
                            .replace(/\s+/g, ' ')
                            .replace(/(\d{1,2}h\d{2})/g, '')
                            .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                            .replace(/Saison\s*\d+.*$/i, '')
                            .replace(/Partie\s*\d+.*$/i, '')
                            .replace(/Genres.*$/i, '')
                            .replace(/Types.*$/i, '')
                            .replace(/Langues.*$/i, '')
                            .replace(/Synopsis.*$/i, '')
                            .trim();
                
                // If title is still "Scans", try to get it from animeId
                if (title.toLowerCase() === 'scans' || !title || title.length < 2) {
                    title = cleanId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Try to get image from DOM first
                let image = $link.find('img').attr('src') || $link.find('img').attr('data-src');
                
                // Fallback to CDN if not found or if it's a relative path
                if (!image || !image.startsWith('http') || image.includes('anime-sama.si')) {
                    image = `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
                }
                
                popularAnime.classiques.push({
                    id: cleanId,
                    title: title,
                    image: image,
                    url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                    category: 'classique'
                });
            });
        }
        
        // Fallback for Classiques if container not found
        if (popularAnime.classiques.length === 0) {
            $('.scan-card-premium a[href*="/catalogue/"]').each((index, link) => {
                if (popularAnime.classiques.length >= 15) return false;
                const $link = $(link);
                const href = $link.attr('href');
                if (!href) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length ? urlParts[catalogueIndex + 1] : null;
                
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);
                
                let title = $link.find('h2.card-title, .card-title, h1, .title, p').first().text().trim() || $link.attr('alt') || $link.find('img').attr('alt') || $link.text().trim();
                if (title.toLowerCase() === 'scans' || !title || title.length < 2) {
                    title = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                title = title.split('\n')[0].trim();
                
                popularAnime.classiques.push({
                    id: animeId,
                    title: title || animeId,
                    image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                    url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                    category: 'classique'
                });
            });
        }
        
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
            source: 'anime-sama.si homepage'
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
