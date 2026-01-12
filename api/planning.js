const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

function detectTimezoneFromIP(req) {
    // Force GMT+0 by default as requested by the user
    return 'gmt+0';
}

function convertTime(frenchTime, targetTimezone) {
    if (!frenchTime) return frenchTime;
    const timeMatch = frenchTime.match(/(\d{1,2})[h:](\d{2})/);
    if (!timeMatch) return frenchTime;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    
    // Anime-Sama is based on Paris time (CET/CEST)
    // Paris is GMT+1 in winter and GMT+2 in summer
    const now = new Date();
    // Simplified DST check for France (standard approximation)
    const isSummerTime = now.getMonth() > 2 && now.getMonth() < 10;
    const parisOffset = isSummerTime ? 2 : 1;

    // Convert to GMT (UTC+0)
    hours -= parisOffset;
    
    if (hours < 0) hours += 24;
    if (hours >= 24) hours -= 24;
    
    return `${hours.toString().padStart(2, '0')}h${minutes}`;
}

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
        const { day, filter, timezone } = req.query;
        const detectedTimezone = timezone || detectTimezoneFromIP(req);
        
        const today = new Date();
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const currentDay = dayNames[today.getDay()];
        
        const $ = await scrapeAnimesama('https://anime-sama.si');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        dayNames.forEach(d => {
            planningData.days[d] = {
                day: d.charAt(0).toUpperCase() + d.slice(1),
                count: 0,
                items: []
            };
        });

        const processLink = (dayKey, linkEl) => {
            const $link = $(linkEl);
            const href = $link.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = urlParts[catalogueIndex + 1];
            
            let title = $link.find('strong, b').first().text().trim();
            const linkText = $link.text();
            
            // Refined title extraction to ignore generic "Anime" or "Scans" labels
            if (!title || ['anime', 'scans'].includes(title.toLowerCase())) {
                const lines = linkText.split('\n').map(t => t.trim()).filter(t => t.length > 1);
                title = lines.find(t => 
                    !['anime', 'scans', 'vostfr', 'vf', 'vj', 'vcn'].includes(t.toLowerCase()) && 
                    !t.match(/\d{1,2}h\d{2}/)
                ) || title;
            }

            const timeMatch = linkText.match(/(\d{1,2}h\d{2})/);
            let time = timeMatch ? timeMatch[1] : null;

            // Extract Season and Episode information
            const seasonMatch = linkText.match(/Saison\s*(\d+)/i) || href.match(/\/saison(\d+)/i);
            const season = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            
            const epMatch = linkText.match(/(?:Episode|Ep\.?|E)\s*(\d+)/i);
            const episode = epMatch ? parseInt(epMatch[1]) : null;

            let language = 'VOSTFR';
            const flagImg = $link.find('img[src*="flag_"], img[src*="flag-"], img[src*="flag"]').attr('src') || '';
            if (flagImg.includes('fr') || linkText.includes(' VF')) language = 'VF';
            else if (flagImg.includes('cn') || linkText.includes(' VCN')) language = 'VCN';
            
            let type = 'anime';
            if (linkText.toLowerCase().includes('scans') || href.includes('/scan/')) {
                type = 'scan';
            }

            const $img = $link.find('img').not('[src*="flag"]').first();
            let image = $img.attr('src') || $img.attr('data-src');
            
            const cleanId = animeId.replace(/\/$/, '');
            if (!image || !image.startsWith('http')) {
                image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
            } else if (image.includes('anime-sama.si')) {
                // If it's a relative path or local image, prefer the CDN for stability
                image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${cleanId}.jpg`;
            }

            const item = {
                animeId,
                title: title || animeId.replace(/-/g, ' '),
                season,
                episode,
                url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                image,
                releaseTime: time ? convertTime(time, detectedTimezone) : null,
                originalTime: time,
                language,
                type,
                day: dayKey.charAt(0).toUpperCase() + dayKey.slice(1),
                isFin: linkText.includes('[FIN]') || linkText.toLowerCase().includes('fin'),
                isReporte: linkText.toLowerCase().includes('reporté') || linkText.toLowerCase().includes('reporte'),
                status: 'scheduled'
            };

            // Avoid duplicate entries for the same anime/language combination in a day section
            if (!planningData.days[dayKey].items.find(it => it.animeId === item.animeId && it.language === item.language)) {
                planningData.days[dayKey].items.push(item);
                planningData.days[dayKey].count++;
            }
        };

        const processedDays = new Set();
        // Target headers like "Sorties du Dimanche - 21/12"
        $('h1, h2, h3').each((i, el) => {
            const headerText = $(el).text().trim();
            const dayMatch = headerText.match(/Sorties du (\w+)/i);
            if (!dayMatch) return;
            
            const dayNameRaw = dayMatch[1].toLowerCase();
            const dayKey = dayNames.find(d => dayNameRaw.includes(d));
            if (!dayKey || processedDays.has(dayKey)) return;
            processedDays.add(dayKey);

            // Process all cards following this header until the next header
            let $sibling = $(el).next();
            while ($sibling.length > 0 && !$sibling.is('h1, h2, h3')) {
                if ($sibling.is('a[href*="/catalogue/"]')) {
                    processLink(dayKey, $sibling);
                } else {
                    $sibling.find('a[href*="/catalogue/"]').each((j, l) => processLink(dayKey, l));
                }
                $sibling = $sibling.next();
            }
        });

        // Fallback: If no headers were matched, try classic container IDs
        if (Object.values(planningData.days).every(d => d.count === 0)) {
            dayNames.forEach(dk => {
                const id = 'container' + dk.charAt(0).toUpperCase() + dk.slice(1);
                $(`#${id}`).find('a[href*="/catalogue/"]').each((j, l) => processLink(dk, l));
            });
        }

        // Handle specific day or "all" request
        if (day && day.toLowerCase() === 'all') {
            if (filter) {
                Object.keys(planningData.days).forEach(dk => {
                    planningData.days[dk].items = planningData.days[dk].items.filter(item => {
                        const f = filter.toLowerCase();
                        if (f === 'anime' || f === 'animes') return item.type === 'anime';
                        if (f === 'scan' || f === 'scans') return item.type === 'scan';
                        if (f === 'vf') return item.language === 'VF';
                        if (f === 'vostfr' || f === 'vo') return item.language === 'VOSTFR';
                        return true;
                    });
                    planningData.days[dk].count = planningData.days[dk].items.length;
                });
            }
            return res.status(200).json(planningData);
        }

        const requestedDay = (day && day.toLowerCase() !== 'today' && dayNames.includes(day.toLowerCase())) ? day.toLowerCase() : currentDay;
        const resultData = planningData.days[requestedDay];

        return res.status(200).json({
            success: true,
            currentDay,
            extractedAt: planningData.extractedAt,
            ...resultData
        });
        
    } catch (error) {
        console.error('Planning API error:', error);
        res.status(500).json({
            error: 'Failed to fetch planning data',
            message: error.message
        });
    }
};
