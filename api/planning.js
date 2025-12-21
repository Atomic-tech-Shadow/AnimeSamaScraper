const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

const COUNTRY_TIMEZONE_MAP = {
    'TG': 'gmt+0', 'GH': 'gmt+0', 'CI': 'gmt+0', 'SN': 'gmt+0', 'ML': 'gmt+0',
    'BF': 'gmt+0', 'GM': 'gmt+0', 'GW': 'gmt+0', 'GN': 'gmt+0', 'SL': 'gmt+0', 'LR': 'gmt+0',
    'CM': 'gmt+1', 'TD': 'gmt+1', 'CF': 'gmt+1', 'GA': 'gmt+1', 'GQ': 'gmt+1', 'ST': 'gmt+1',
    'MA': 'gmt+1', 'TN': 'gmt+1', 'DZ': 'gmt+1',
};

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
        const autoDetected = !timezone;
        
        const today = new Date();
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const currentDay = dayNames[today.getDay()];
        
        const $ = await scrapeAnimesama('https://anime-sama.eu');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const frenchDayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        
        // Initialize all days
        daysOfWeek.forEach(dayName => {
            const dayKey = dayName.toLowerCase();
            planningData.days[dayKey] = {
                day: dayName,
                count: 0,
                items: []
            };
        });
        
        // Extraction depuis la section "Sorties du jour"
        // Sur anime-sama.eu, les sorties du jour sont dans des divs avec ID #containerLundi, #containerMardi, etc.
        // mais l'utilisateur précise que la cible est la section "Sorties du..."
        
        frenchDayNames.forEach(dayKey => {
            const dayName = daysOfWeek[frenchDayNames.indexOf(dayKey)];
            
            // On cherche le titre qui contient le jour (ex: "Sorties du Lundi")
            const $dayTitle = $(`h1:contains("Sorties du ${dayName}"), h2:contains("Sorties du ${dayName}"), h3:contains("Sorties du ${dayName}")`).first();
            
            let $container;
            if ($dayTitle.length > 0) {
                // Le container est généralement le div suivant ou un parent contenant les cartes
                $container = $dayTitle.nextAll('div').first();
            } else {
                // Fallback sur les IDs classiques si le titre n'est pas trouvé
                const containerId = 'container' + dayName;
                $container = $(`#${containerId}`);
            }

            if (!$container || $container.length === 0) return;
            
            const items = [];
            
            // Les éléments sont des liens contenant /catalogue/
            $container.find('a[href*="/catalogue/"]').each((idx, el) => {
                const $link = $(el);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
                
                const animeId = urlParts[catalogueIndex + 1];
                let title = $link.text().trim();
                
                // Extraction de l'heure si présente (format 12h30)
                const timeMatch = title.match(/(\d{1,2}h\d{2})/);
                let time = timeMatch ? timeMatch[1] : null;

                // Nettoyage du titre
                title = title.replace(/\n/g, ' ')
                           .replace(/\s+/g, ' ')
                           .replace(/(\d{1,2}h\d{2})/g, '')
                           .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                           .replace(/Saison\s*\d+.*$/i, '')
                           .replace(/Partie\s*\d+.*$/i, '')
                           .trim();
                
                if (!title || title.length < 2) {
                    title = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Image
                const $img = $link.find('img').first();
                let image = $img.attr('src') || $img.attr('data-src');
                
                if (!image) {
                    image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                } else if (!image.startsWith('http')) {
                    image = image.startsWith('//') ? 'https:' + image : `https://anime-sama.eu${image}`;
                }
                
                // Langue
                const linkText = $link.text();
                let language = 'VOSTFR';
                if (linkText.includes('VF')) language = 'VF';
                
                // Type
                let type = href.includes('/scan/') ? 'scan' : 'anime';
                
                const convertedTime = time ? convertTime(time, detectedTimezone) : time;
                
                const item = {
                    animeId: animeId,
                    title: title,
                    url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                    image: image,
                    releaseTime: convertedTime,
                    originalTime: autoDetected || detectedTimezone !== 'paris' ? time : undefined,
                    language: language,
                    type: type,
                    day: dayName,
                    status: 'scheduled'
                };
                
                const isDuplicate = items.some(it => 
                    it.animeId === item.animeId && it.language === item.language
                );
                
                if (!isDuplicate) {
                    items.push(item);
                }
            });
            
            if (items.length > 0) {
                planningData.days[dayKey] = {
                    day: dayName,
                    count: items.length,
                    items: items
                };
            }
        });
        
        // If specific day requested
        if (day && day.toLowerCase() !== 'all' && planningData.days[day.toLowerCase()]) {
            return res.status(200).json({
                success: true,
                day: day,
                extractedAt: planningData.extractedAt,
                ...planningData.days[day.toLowerCase()]
            });
        }
        
        // Default: return today
        if (!day || day.toLowerCase() !== 'all') {
            const todayData = planningData.days[currentDay];
            if (todayData) {
                return res.status(200).json({
                    success: true,
                    currentDay: currentDay,
                    extractedAt: planningData.extractedAt,
                    ...todayData
                });
            }
        }
        
        // Filter if requested
        if (filter) {
            Object.keys(planningData.days).forEach(dayKey => {
                planningData.days[dayKey].items = planningData.days[dayKey].items.filter(item => {
                    switch (filter.toLowerCase()) {
                        case 'anime':
                        case 'animes':
                            return item.type === 'anime';
                        case 'scan':
                        case 'scans':
                            return item.type === 'scan';
                        case 'vf':
                            return item.language === 'VF';
                        case 'vo':
                        case 'vostfr':
                            return item.language === 'VOSTFR';
                        default:
                            return true;
                    }
                });
                planningData.days[dayKey].count = planningData.days[dayKey].items.length;
            });
        }
        
        const totalItems = Object.values(planningData.days).reduce((sum, d) => sum + d.count, 0);
        planningData.totalItems = totalItems;
        planningData.currentDay = currentDay;
        
        if (detectedTimezone && detectedTimezone !== 'paris') {
            planningData.timezoneInfo = {
                detected: detectedTimezone,
                autoDetected: autoDetected,
                originalTimezone: 'GMT+2 (Paris)',
                note: autoDetected ? 
                    'Fuseau horaire détecté automatiquement et heures converties' : 
                    'Heures converties selon le fuseau horaire demandé'
            };
        }
        
        res.status(200).json(planningData);
        
    } catch (error) {
        console.error('Planning API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch planning data',
            message: 'Unable to retrieve planning information at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
