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

function extractSeasonValue(href) {
    const parts = href.split('/').filter(Boolean);
    const catalogueIdx = parts.indexOf('catalogue');
    if (catalogueIdx === -1 || catalogueIdx + 2 >= parts.length) return null;
    const segment = parts[catalogueIdx + 2];
    const langCodes = ['vostfr', 'vf1', 'vf2', 'vf', 'va', 'vcn', 'vkr', 'vqc', 'var', 'vj'];
    if (langCodes.includes(segment.toLowerCase())) return null;
    return segment;
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

function resolveContentType(seasonValue) {
    if (!seasonValue) return 'anime';
    const v = seasonValue.toLowerCase();
    if (v === 'film' || v === 'films') return 'film';
    if (v === 'oav' || v === 'ova') return 'oav';
    if (v.startsWith('kai')) return 'kai';
    if (v.startsWith('saison')) return 'anime';
    return 'anime';
}

function resolveSeasonDisplay(seasonValue, textSeasonInfo) {
    if (textSeasonInfo) return textSeasonInfo.trim();
    if (!seasonValue) return null;
    const v = seasonValue.toLowerCase();
    if (v === 'film' || v === 'films') return 'Film';
    if (v === 'oav' || v === 'ova') return 'OAV';
    if (v.startsWith('kai')) return seasonValue.toUpperCase();
    if (v.startsWith('saison')) {
        const num = v.replace('saison', '');
        return num ? `Saison ${num}` : 'Saison';
    }
    return seasonValue;
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

        const $ = await scrapeAnimesama('https://anime-sama.to/planning/');

        const planningData = { success: true, days: {} };
        dayNames.forEach(d => planningData.days[d] = { day: d, count: 0, items: [] });

        $('h2.titreJours').each((i, el) => {
            const headingText = $(el).text().trim().toLowerCase();
            const dayKey = dayNames.find(d => headingText === d || headingText.startsWith(d));
            if (!dayKey) return;

            let $sibling = $(el).next();
            while ($sibling.length > 0 && !$sibling.is('h2.titreJours')) {
                $sibling.find('a[href*="/catalogue/"]').each((j, link) => {
                    const href = $(link).attr('href') || '';
                    const fullHref = href.startsWith('http') ? href : `https://anime-sama.to${href}`;

                    if (fullHref.includes('/scan') || fullHref.includes('/manga')) return;

                    const animeId = extractAnimeId(fullHref);
                    if (!animeId) return;

                    const language = extractLanguage(fullHref);

                    if (filter === 'vf' && !['VF', 'VF1', 'VF2'].includes(language)) return;
                    if (filter === 'vostfr' && language !== 'VOSTFR') return;
                    if (filter === 'anime') {
                        const $card = $(link).closest('[class*="planning-card"]');
                        const cardClass = $card.attr('class') || '';
                        if (!cardClass.toLowerCase().includes('anime')) return;
                    }

                    const seasonValue = extractSeasonValue(fullHref);
                    const contentType = resolveContentType(seasonValue);

                    const title = $(link).find('h2.card-title').first().text().trim()
                        || $(link).find('.card-title').first().text().trim()
                        || $(link).find('strong, b').first().text().trim()
                        || animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    const timeEl = $(link).find('.info-text.font-bold').first().text().trim();
                    const timeMatch = timeEl.match(/(\d{1,2}h\d{2})/);

                    const seasonInfoEl = $(link).find('.info-item.episode').not(':has(.time-icon-svg)').find('.info-text').first().text().trim();
                    const seasonDisplay = resolveSeasonDisplay(seasonValue, seasonInfoEl || null);

                    const item = {
                        animeId,
                        title,
                        url: fullHref,
                        image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                        releaseTime: timeMatch ? convertTime(timeMatch[1]) : null,
                        season: seasonDisplay,
                        seasonValue,
                        contentType,
                        language
                    };

                    const key = `${animeId}-${language}-${seasonValue}`;
                    if (!planningData.days[dayKey].items.find(it => `${it.animeId}-${it.language}-${it.seasonValue}` === key)) {
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
