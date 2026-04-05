const { scrapeAnimesama } = require('../utils/scraper');

function extractLanguage(href) {
    const langCodes = ['vostfr', 'vf1', 'vf2', 'vf', 'va', 'vcn', 'vkr', 'vqc', 'var', 'vj'];
    const lower = href.toLowerCase();
    for (const code of langCodes) {
        if (lower.includes(`/${code}/`) || lower.endsWith(`/${code}`)) {
            return code.toUpperCase();
        }
    }
    return null;
}

function extractSeasonValue(href) {
    const parts = href.split('/').filter(Boolean);
    const catalogueIdx = parts.indexOf('catalogue');
    if (catalogueIdx === -1 || catalogueIdx + 2 >= parts.length) return null;
    const segment = parts[catalogueIdx + 2];
    const langCodes = ['vostfr', 'vf1', 'vf2', 'vf', 'va', 'vcn', 'vkr', 'vqc', 'var', 'vj'];
    if (langCodes.includes(segment.toLowerCase())) return null;
    return segment;
}

function resolveContentType(seasonValue) {
    if (!seasonValue) return 'anime';
    const v = seasonValue.toLowerCase();
    if (v === 'film' || v === 'films') return 'film';
    if (v === 'oav' || v === 'ova') return 'oav';
    if (v.startsWith('kai')) return 'kai';
    return 'anime';
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const $ = await scrapeAnimesama('https://anime-sama.to/');
        const recentEpisodes = [];
        const seenLinks = new Set();

        $('#containerAjoutsAnimes').find('a[href*="/catalogue/"]').each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');

            if (!href || !href.includes('/catalogue/') || seenLinks.has(href)) return;
            if (href.includes('/scan/') || href.includes('/manga/')) return;

            seenLinks.add(href);

            const parts = href.split('/').filter(Boolean);
            const catalogueIdx = parts.indexOf('catalogue');
            if (catalogueIdx === -1 || catalogueIdx + 1 >= parts.length) return;
            const animeId = parts[catalogueIdx + 1];
            if (!animeId) return;

            const title = $link.find('.card-title, h2, h3').first().text().trim() || null;

            let image = $link.find('img').attr('src') || $link.find('img').attr('data-src') || null;
            if (image && !image.startsWith('http')) image = `https://anime-sama.to${image}`;

            const infoText = $link.find('.info-text').text().trim();
            if (infoText.toLowerCase().includes('scan') || infoText.toLowerCase().includes('manga')) return;

            const seasonValue = extractSeasonValue(href);
            const contentType = resolveContentType(seasonValue);
            const language = extractLanguage(href);

            const seasonMatch = infoText.match(/Saison\s*(\d+)/i);
            const epMatch = infoText.match(/Episode\s*(\d+)/i);

            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.to${href}`;

            recentEpisodes.push({
                animeId,
                title,
                season: seasonMatch ? parseInt(seasonMatch[1]) : null,
                seasonValue,
                episode: epMatch ? parseInt(epMatch[1]) : null,
                language,
                contentType,
                url: fullUrl,
                image,
                addedAt: new Date().toISOString()
            });
        });

        res.status(200).json({ success: true, count: recentEpisodes.length, recentEpisodes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent episodes', message: error.message });
    }
};
