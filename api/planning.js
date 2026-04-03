const cheerio = require('cheerio');
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

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { day } = req.query;
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const currentDay = dayNames[new Date().getDay()];
        const $ = await scrapeAnimesama('https://anime-sama.to');
        const planningData = { success: true, days: {} };
        
        dayNames.forEach(d => planningData.days[d] = { day: d, count: 0, items: [] });

        $('h1, h2, h3').each((i, el) => {
            const headerText = $(el).text().trim();
            const dayMatch = headerText.match(/Sorties du (\w+)/i);
            if (!dayMatch) return;
            const dayKey = dayNames.find(d => dayMatch[1].toLowerCase().includes(d));
            if (!dayKey) return;

            let $sibling = $(el).next();
            while ($sibling.length > 0 && !$sibling.is('h1, h2, h3')) {
                $sibling.find('a[href*="/catalogue/"]').each((j, link) => {
                    const href = $(link).attr('href');
                    if (!href || href.includes('/scan/') || href.includes('/manga/')) return;
                    const animeId = href.split('/').filter(Boolean).pop();
                    const text = $(link).text();
                    if (text.toLowerCase().includes('scan') || text.toLowerCase().includes('manga')) return;
                    
                    const timeMatch = text.match(/(\d{1,2}h\d{2})/);
                    const item = {
                        animeId, title: $(link).find('strong, b').first().text().trim() || animeId.replace(/-/g, ' '),
                        url: `https://anime-sama.to${href}`,
                        image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                        releaseTime: timeMatch ? convertTime(timeMatch[1]) : null,
                        language: text.includes('VF') ? 'VF' : 'VOSTFR'
                    };
                    if (!planningData.days[dayKey].items.find(it => it.animeId === item.animeId && it.language === item.language)) {
                        planningData.days[dayKey].items.push(item);
                        planningData.days[dayKey].count++;
                    }
                });
                $sibling = $sibling.next();
            }
        });

        const requestedDay = (day && dayNames.includes(day.toLowerCase())) ? day.toLowerCase() : currentDay;
        res.status(200).json(day === 'all' ? planningData : { success: true, currentDay, ...planningData.days[requestedDay] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch planning data', message: error.message });
    }
};