const { scrapeAnimesama } = require('../utils/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const $ = await scrapeAnimesama('https://anime-sama.to/');
        const popularAnime = { classiques: [], pepites: [] };
        const seenIds = new Set();

        const extract = (containerId, category) => {
            $(containerId).find('a[href*="/catalogue/"]').each((index, link) => {
                const href = $(link).attr('href');
                if (!href || href.includes('/scan/') || href.includes('/manga/')) return;

                const parts = href.split('/').filter(Boolean);
                const catalogueIdx = parts.indexOf('catalogue');
                if (catalogueIdx === -1 || catalogueIdx + 1 >= parts.length) return;
                const animeId = parts[catalogueIdx + 1];
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);

                const title = $(link).find('h2, h3, .title, .card-title').first().text().trim() || null;
                const image = $(link).find('img').attr('src') || $(link).find('img').attr('data-src') || `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;

                popularAnime[category].push({
                    id: animeId,
                    title,
                    category,
                    image: image.startsWith('http') ? image : `https://anime-sama.to${image}`,
                    url: `https://anime-sama.to/catalogue/${animeId}`
                });
            });
        };

        extract('#containerPepites', 'pepites');
        extract('#containerClassiques', 'classiques');

        res.status(200).json({
            success: true,
            categories: popularAnime,
            allPopular: [...popularAnime.classiques, ...popularAnime.pepites]
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch popular anime', message: error.message });
    }
};
