const { scrapeAnimesama } = require('../utils/scraper');

function convertTime(frenchTime) {
    if (!frenchTime) return null;
    const match = frenchTime.match(/(\d{1,2})[h:](\d{2})/);
    if (!match) return frenchTime;
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const offset = new Date().getMonth() > 2 && new Date().getMonth() < 10 ? 2 : 1;
    hours = (hours - offset + 24) % 24;
    return `${hours.toString().padStart(2, '0')}h${minutes}`;
}

function extractAnimeId(href) {
    const parts = href.split('/').filter(Boolean);
    const catalogueIdx = parts.indexOf('catalogue');
    if (catalogueIdx === -1 || catalogueIdx + 1 >= parts.length) return null;
    return parts[catalogueIdx + 1];
}

function extractLanguage(href) {
    const langCodes = ['vostfr', 'vf1', 'vf2', 'vf', 'va', 'vcn', 'vkr', 'vqc', 'var', 'vj'];
    const lower = href.toLowerCase();
    for (const code of langCodes) {
        if (lower.includes(`/${code}/`) || lower.endsWith(`/${code}`)) {
            return code.toUpperCase();
        }
    }
    return 'VOSTFR';
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { day, filter } = req.query;
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const currentDay = dayNames[new Date().getDay()];

        // Scraper la vraie page planning (pas la homepage qui ne montre qu'un jour)
        const $ = await scrapeAnimesama('https://anime-sama.to/planning/');

        const planningData = { success: true, days: {} };
        dayNames.forEach(d => planningData.days[d] = { day: d, count: 0, items: [] });

        // Parcourir les h2 de jours (class="titreJours") et leurs siblings d'anime cards
        $('h2.titreJours').each((i, el) => {
            const headingText = $(el).text().trim().toLowerCase();
            const dayKey = dayNames.find(d => headingText === d || headingText.startsWith(d));
            if (!dayKey) return;

            let $sibling = $(el).next();
            while ($sibling.length > 0 && !$sibling.is('h2.titreJours')) {
                $sibling.find('a[href*="/catalogue/"]').each((j, link) => {
                    const href = $(link).attr('href') || '';
                    const fullHref = href.startsWith('http') ? href : `https://anime-sama.to${href}`;

                    // Exclure scans/manga
                    if (fullHref.includes('/scan') || fullHref.includes('/manga')) return;

                    const animeId = extractAnimeId(fullHref);
                    if (!animeId) return;

                    const language = extractLanguage(fullHref);

                    // Filtre optionnel de langue
                    if (filter === 'vf' && !['VF', 'VF1', 'VF2'].includes(language)) return;
                    if (filter === 'vostfr' && language !== 'VOSTFR') return;

                    const titleEl = $(link).find('strong, b').first().text().trim();
                    const linkText = $(link).text();
                    const timeMatch = linkText.match(/(\d{1,2}h\d{2})/);
                    const seasonMatch = linkText.match(/Saison\s*(.+?)(?:\s{2,}|$)/i);

                    const item = {
                        animeId,
                        title: titleEl || animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                        url: fullHref,
                        image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                        releaseTime: timeMatch ? convertTime(timeMatch[1]) : null,
                        season: seasonMatch ? seasonMatch[1].trim() : null,
                        language
                    };

                    const key = `${animeId}-${language}`;
                    if (!planningData.days[dayKey].items.find(it => `${it.animeId}-${it.language}` === key)) {
                        planningData.days[dayKey].items.push(item);
                        planningData.days[dayKey].count++;
                    }
                });
                $sibling = $sibling.next();
            }
        });

        const requestedDay = (day && dayNames.includes(day.toLowerCase())) ? day.toLowerCase() : currentDay;

        if (day === 'all') {
            return res.status(200).json(planningData);
        }

        res.status(200).json({
            success: true,
            currentDay,
            day: requestedDay,
            count: planningData.days[requestedDay].count,
            items: planningData.days[requestedDay].items
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch planning data', message: error.message });
    }
};
