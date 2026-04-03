const { scrapeAnimesama } = require('../utils/scraper');

let recommendationsCache = { data: [], lastUpdated: null, isUpdating: false };
const CACHE_DURATION = 5 * 60 * 1000;
let exploredPages = new Set();
const MAX_PAGES_TO_EXPLORE = 50;

function getRandomUnexploredPage() {
    if (exploredPages.size >= MAX_PAGES_TO_EXPLORE) exploredPages.clear();
    let randomPage;
    let attempts = 0;
    do {
        randomPage = Math.floor(Math.random() * 38) + 1;
        attempts++;
    } while (exploredPages.has(randomPage) && attempts < 20);
    exploredPages.add(randomPage);
    return randomPage;
}

async function refreshRecommendationsCache() {
    if (recommendationsCache.isUpdating) return;
    try {
        recommendationsCache.isUpdating = true;
        const targetPage = getRandomUnexploredPage();
        const $ = await scrapeAnimesama(`https://anime-sama.to/catalogue/?page=${targetPage}`);
        const recommendations = [];
        const seenAnimes = new Set();
        
        $('a[href*="/catalogue/"]').each((index, element) => {
            const href = $(element).attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            if (href.includes('/scan/') || href.includes('/manga/')) return;
            
            const animeIdRaw = href.split('/').filter(Boolean).pop();
            const animeId = animeIdRaw.toLowerCase().trim();
            if (seenAnimes.has(animeId)) return;
            
            const $card = $(element).closest('.shrink-0') || $(element);
            const cardText = $card.text().toLowerCase();
            
            seenAnimes.add(animeId);
            let title = $card.find('h1, .title, .name').first().text().trim() || $(element).attr('title') || $card.find('img').attr('alt');
            title = title ? title.replace(/(VOSTFR|VF|Saison\s*\d+|Episode\s*\d+|\[FIN\])/gi, '').trim() : animeId.replace(/-/g, ' ');
            
            recommendations.push({
                id: animeId, title, image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                url: href.startsWith('http') ? href : `https://anime-sama.to${href}`,
                contentType: 'anime', genres: ['Anime'], languages: ['VOSTFR'], category: 'recommendation'
            });
        });
        
        recommendationsCache.data = recommendations;
        recommendationsCache.lastUpdated = new Date();
        recommendationsCache.isUpdating = false;
    } catch (error) {
        recommendationsCache.isUpdating = false;
    }
}

async function getRecommendations(req, res) {
    try {
        if (recommendationsCache.data.length === 0 || (new Date() - recommendationsCache.lastUpdated) > CACHE_DURATION) {
            await refreshRecommendationsCache();
        }
        const page = parseInt(req.query.page) || 1, limit = parseInt(req.query.limit) || 50;
        const results = recommendationsCache.data.slice((page - 1) * limit, page * limit);
        res.json({
            success: true, data: results,
            pagination: { page, limit, total: recommendationsCache.data.length, totalPages: Math.ceil(recommendationsCache.data.length / limit) },
            metadata: { extractedAt: new Date().toISOString(), filtered: 'Animes only' }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

setInterval(refreshRecommendationsCache, CACHE_DURATION);
module.exports = getRecommendations;