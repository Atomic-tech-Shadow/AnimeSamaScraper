const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const $ = await scrapeAnimesama('https://anime-sama.tv/');
        const popularAnime = { classiques: [], pepites: [] };
        const seenIds = new Set();
        
        const extract = (containerId, category) => {
            $(containerId).find('a[href*="/catalogue/"]').each((index, link) => {
                const href = $(link).attr('href');
                if (!href || href.includes('/scan/') || href.includes('/manga/')) return;
                const animeId = href.split('/').filter(Boolean).pop();
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);
                let title = $(link).find('h2, h3, .title').first().text().trim() || animeId.replace(/-/g, ' ');
                title = title.replace(/(VOSTFR|VF|Saison\s*\d+|Episode\s*\d+)/gi, '').trim();
                popularAnime[category].push({
                    id: animeId, title, category,
                    image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                    url: `https://anime-sama.tv${href}`
                });
            });
        };

        extract('#containerPepites', 'pepites');
        extract('#containerClassiques', 'classiques');
        
        res.status(200).json({ success: true, categories: popularAnime, allPopular: [...popularAnime.classiques, ...popularAnime.pepites] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular anime', message: error.message });
    }
};