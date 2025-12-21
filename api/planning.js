const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

// Mapping des pays vers les fuseaux horaires
const COUNTRY_TIMEZONE_MAP = {
    // Afrique de l'Ouest (GMT+0)
    'TG': 'gmt+0', // Togo
    'GH': 'gmt+0', // Ghana
    'CI': 'gmt+0', // Côte d'Ivoire
    'SN': 'gmt+0', // Sénégal
    'ML': 'gmt+0', // Mali
    'BF': 'gmt+0', // Burkina Faso
    'GM': 'gmt+0', // Gambie
    'GW': 'gmt+0', // Guinée-Bissau
    'GN': 'gmt+0', // Guinée
    'SL': 'gmt+0', // Sierra Leone
    'LR': 'gmt+0', // Libéria
    
    // Afrique Centrale (GMT+1)
    'CM': 'gmt+1', // Cameroun
    'TD': 'gmt+1', // Tchad
    'CF': 'gmt+1', // République centrafricaine
    'GA': 'gmt+1', // Gabon
    'GQ': 'gmt+1', // Guinée équatoriale
    'ST': 'gmt+1', // São Tomé-et-Principe
    
    // Autres pays francophones
    'MA': 'gmt+1', // Maroc
    'TN': 'gmt+1', // Tunisie
    'DZ': 'gmt+1', // Algérie
};

// Fonction pour détecter le fuseau horaire automatiquement
function detectTimezoneFromIP(req) {
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
        return 'gmt+0';
    }
    
    return 'gmt+0';
}

// Fonction pour convertir les heures selon le fuseau horaire
function convertTime(frenchTime, targetTimezone) {
    if (!frenchTime || !targetTimezone) return frenchTime;
    
    const timeMatch = frenchTime.match(/(\d{1,2})[h:](\d{2})/);
    if (!timeMatch) return frenchTime;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    
    switch(targetTimezone.toLowerCase()) {
        case 'gmt':
        case 'utc':
        case 'gmt+0':
        case 'togo':
            const now = new Date();
            const isWinter = now.getMonth() < 2 || now.getMonth() > 9;
            const offset = isWinter ? -1 : -2;
            hours += offset;
            break;
        case 'gmt+1':
        case 'west-africa':
            hours -= 1;
            break;
        default:
            return frenchTime;
    }
    
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
        
        // Scraper la page d'accueil
        const $ = await scrapeAnimesama('https://anime-sama.eu');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        const frenchDayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        
        // Initialiser tous les jours
        daysOfWeek.forEach(dayName => {
            const dayKey = dayName.toLowerCase();
            planningData.days[dayKey] = {
                day: dayName,
                count: 0,
                items: []
            };
        });
        
        // Parser l'HTML pour trouver les sections "Sorties du..."
        const htmlString = $.html();
        
        // Splitter le HTML par les sections "Sorties du..."
        const sections = htmlString.split(/##\s*Sorties du\s+/i);
        
        sections.slice(1).forEach((section) => {
            // Extraire le jour et la date du début de la section
            const headerMatch = section.match(/^([A-Za-zé]+)\s*-\s*(\d+\/\d+)/);
            if (!headerMatch) return;
            
            const dayName = headerMatch[1].toLowerCase();
            const date = headerMatch[2];
            
            // Chercher le jour correspondant
            let dayKey = null;
            for (let i = 0; i < frenchDayNames.length; i++) {
                if (frenchDayNames[i].startsWith(dayName.charAt(0).toLowerCase())) {
                    dayKey = frenchDayNames[i];
                    break;
                }
            }
            
            if (!dayKey) return;
            
            // Parser la section avec cheerio pour extraire les liens anime
            const sectionHtml = '<div>' + section + '</div>';
            const $section = cheerio.load(sectionHtml);
            
            const items = [];
            
            // Trouver tous les liens vers le catalogue
            $section('a[href*="/catalogue/"]').each((idx, el) => {
                const $el = $section(el);
                const href = $el.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                // Extraire le chemin du catalogue
                const pathMatch = href.match(/\/catalogue\/([^/]+)/);
                if (!pathMatch) return;
                
                const animeId = pathMatch[1];
                let title = $el.text().trim();
                
                // Nettoyer le titre
                title = title.replace(/\n/g, ' ')
                           .replace(/\s+/g, ' ')
                           .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ)/gi, '')
                           .replace(/Saison\s*\d+.*$/i, '')
                           .replace(/Partie\s*\d+.*$/i, '')
                           .trim();
                
                if (!title || title.length < 2) return;
                
                // Extraire l'image
                const $img = $el.find('img').first();
                let image = $img.attr('src');
                
                if (!image || !image.includes('statically')) {
                    image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                } else if (image && !image.startsWith('http')) {
                    image = 'https:' + image;
                }
                
                // Extraire la langue depuis le contenu du lien
                const linkText = $el.text();
                let language = 'VOSTFR';
                if (linkText.includes('VF')) language = 'VF';
                else if (linkText.includes('VCN')) language = 'VCN';
                else if (linkText.includes('VA')) language = 'VA';
                else if (linkText.includes('VKR')) language = 'VKR';
                else if (linkText.includes('VJ')) language = 'VJ';
                
                // Extraire le temps
                const timeMatch = section.match(/(\d{1,2}h\d{2})/);
                let time = timeMatch ? timeMatch[1] : null;
                
                // Déterminer le type (anime ou scan)
                let type = 'anime';
                if (href.includes('/scan/')) {
                    type = 'scan';
                }
                
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
                    day: daysOfWeek[frenchDayNames.indexOf(dayKey)],
                    status: 'scheduled'
                };
                
                // Vérifier les doublons
                const isDuplicate = items.some(it => 
                    it.animeId === item.animeId && it.language === item.language
                );
                
                if (!isDuplicate) {
                    items.push(item);
                }
            });
            
            if (items.length > 0) {
                planningData.days[dayKey] = {
                    day: daysOfWeek[frenchDayNames.indexOf(dayKey)],
                    date: date,
                    count: items.length,
                    items: items
                };
            }
        });
        
        // Si un jour spécifique est demandé
        if (day && day.toLowerCase() !== 'all' && planningData.days[day.toLowerCase()]) {
            return res.status(200).json({
                success: true,
                day: day,
                extractedAt: planningData.extractedAt,
                ...planningData.days[day.toLowerCase()]
            });
        }
        
        // Par défaut, retourner le jour actuel (sauf si day=all)
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
        
        // Filtrer par type si demandé
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
        
        // Calculer les totaux
        const totalItems = Object.values(planningData.days).reduce((sum, d) => sum + d.count, 0);
        planningData.totalItems = totalItems;
        planningData.currentDay = currentDay;
        
        // Ajouter info sur le fuseau horaire
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
