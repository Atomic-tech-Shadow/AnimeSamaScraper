const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

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
            const urlParts = href.replace(/\/$/, '').split('/');
            const animeId = urlParts[urlParts.indexOf('catalogue') + 1];
            if (!animeId) return;
            
            const cleanId = animeId.toLowerCase().trim();
            let title = $link.find('.card-title, h3').first().text().trim() || $link.attr('title') || $link.text().trim();
            title = title.split('\n')[0].replace(/(VOSTFR|VF|Saison\s*\d+|Episode\s*\d+)/gi, '').trim();
            if (!title || title.length < 2) title = cleanId.replace(/-/g, ' ');

            let image = $link.find('img').attr('src') || $link.find('img').attr('data-src');
            if (!image || !image.startsWith('http') || image.includes('anime-sama.to')) {
                image = `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
            }
            
            const infoText = $link.find('.info-text').text().trim() || $link.text();
            if (infoText.toLowerCase().includes('scan') || infoText.toLowerCase().includes('manga')) return;

            const seasonMatch = infoText.match(/Saison\s*(\d+)/i) || href.match(/\/saison(\d+)/i);
            const epMatch = infoText.match(/Episode\s*(\d+)/i);
            
            let type = 'anime';
            if (infoText.toLowerCase().includes('film') || href.includes('/film/')) type = 'film';
            else if (infoText.toLowerCase().includes('oav') || href.includes('/oav/')) type = 'oav';
            else if (infoText.toLowerCase().includes('special') || href.includes('/special/')) type = 'special';

            recentEpisodes.push({
                animeId, animeTitle: title, season: seasonMatch ? parseInt(seasonMatch[1]) : 1,
                episode: epMatch ? parseInt(epMatch[1]) : null,
                language: href.includes('/vf/') ? 'VF' : 'VOSTFR',
                url: href.startsWith('http') ? href : `https://anime-sama.to${href}`,
                image, type, addedAt: new Date().toISOString()
            });
        });
        
        res.status(200).json({ success: true, count: recentEpisodes.length, recentEpisodes });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent episodes', message: error.message });
    }
};