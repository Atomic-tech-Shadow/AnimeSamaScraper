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
    // Récupérer l'IP du client
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Pour les IPs locales/de développement, on suppose GMT+0 (Togo)
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
        return 'gmt+0'; // Par défaut Togo pour le développement
    }
    
    // Détection simplifiée basée sur les plages d'IP africaines
    // Pour une vraie production, on utiliserait une API de géolocalisation
    // Mais pour cette démo, on suppose que la plupart des utilisateurs sont du Togo
    return 'gmt+0';
}

// Fonction pour convertir les heures selon le fuseau horaire
function convertTime(frenchTime, targetTimezone) {
    if (!frenchTime || !targetTimezone) return frenchTime;
    
    // Parser l'heure française (format: "15h45" ou "15:45")
    const timeMatch = frenchTime.match(/(\d{1,2})[h:](\d{2})/);
    if (!timeMatch) return frenchTime;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2];
    
    // Convertir selon le fuseau horaire cible
    switch(targetTimezone.toLowerCase()) {
        case 'gmt':
        case 'utc':
        case 'gmt+0':
        case 'togo':
            // France (GMT+2 en été, GMT+1 en hiver) vers GMT+0
            const now = new Date();
            const isWinter = now.getMonth() < 2 || now.getMonth() > 9; // Approximation hiver/été
            const offset = isWinter ? -1 : -2; // GMT+1 en hiver, GMT+2 en été
            hours += offset;
            break;
        case 'gmt+1':
        case 'west-africa':
            hours -= 1; // GMT+2 vers GMT+1
            break;
        default:
            return frenchTime; // Pas de conversion
    }
    
    // Gérer les heures négatives/supérieures à 24
    if (hours < 0) hours += 24;
    if (hours >= 24) hours -= 24;
    
    return `${hours.toString().padStart(2, '0')}h${minutes}`;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get optional day filter from query params
        const { day, filter, timezone } = req.query;
        
        // Détection automatique du fuseau horaire si non spécifié
        const detectedTimezone = timezone || detectTimezoneFromIP(req);
        const autoDetected = !timezone;
        
        // Déterminer le jour actuel
        const today = new Date();
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        const currentDay = dayNames[today.getDay()];
        
        // Scraper la page planning dédiée
        const $ = await scrapeAnimesama('https://anime-sama.eu/planning');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        // Jours de la semaine en français
        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        // Extraire les appels cartePlanningAnime depuis le JavaScript
        const pageHtml = $.html();
        const planningMatches = pageHtml.match(/cartePlanningAnime\([^)]+\)/g);
        const scanMatches = pageHtml.match(/cartePlanningScan\([^)]+\)/g);
        
        // Mapper les indices de scripts aux jours (basé sur l'ordre observé)
        const scriptToDayMap = {
            8: 'lundi',      // Script 8 = Lundi
            9: 'mardi',      // Script 9 = Mardi  
            10: 'mercredi',  // Script 10 = Mercredi
            11: 'jeudi',     // Script 11 = Jeudi
            12: 'vendredi',  // Script 12 = Vendredi
            13: 'samedi',    // Script 13 = Samedi
            14: 'dimanche'   // Script 14 = Dimanche
        };
        
        // Parser les appels cartePlanningAnime par script/jour
        $('script').each((scriptIndex, script) => {
            const content = $(script).html();
            if (!content || !content.includes('cartePlanningAnime')) return;
            
            const dayKey = scriptToDayMap[scriptIndex];
            if (!dayKey) return;
            
            const dayName = daysOfWeek.find(d => d.toLowerCase() === dayKey);
            if (!dayName) return;
            
            const dayItems = [];
            const lines = content.split('\n');
            
            lines.forEach(line => {
                // Parser cartePlanningAnime
                const animeMatch = line.match(/cartePlanningAnime\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)",\s*"([^"]+)"\)/);
                if (animeMatch) {
                    const [, title, path, imageId, time, status, language] = animeMatch;
                    
                    // Ignorer les templates (nom, url, image)
                    if (title === 'nom' || path === 'url' || imageId === 'image') return;
                    
                    const convertedTime = convertTime(time, detectedTimezone);
                    
                    dayItems.push({
                        animeId: imageId,
                        title: title.trim(),
                        url: `https://anime-sama.eu/catalogue/${path}`,
                        image: `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${imageId}.jpg`,
                        releaseTime: convertedTime,
                        originalTime: autoDetected || detectedTimezone !== 'paris' ? time : undefined,
                        language: language,
                        type: 'anime',
                        day: dayName,
                        isReported: status.includes('Retardé') || status.includes('Reporté'),
                        status: status || 'scheduled'
                    });
                }
                
                // Parser cartePlanningScan
                const scanMatch = line.match(/cartePlanningScan\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)",\s*"([^"]+)"\)/);
                if (scanMatch) {
                    const [, title, path, imageId, time, status, language] = scanMatch;
                    
                    // Ignorer les templates
                    if (title === 'nom' || path === 'url' || imageId === 'image') return;
                    
                    const convertedTime = convertTime(time, detectedTimezone);
                    
                    dayItems.push({
                        animeId: imageId,
                        title: title.trim(),
                        url: `https://anime-sama.eu/catalogue/${path}`,
                        image: `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${imageId}.jpg`,
                        releaseTime: convertedTime,
                        originalTime: autoDetected || detectedTimezone !== 'paris' ? time : undefined,
                        language: language,
                        type: 'scan',
                        day: dayName,
                        isReported: status.includes('Retardé') || status.includes('Reporté'),
                        status: status || 'scheduled'
                    });
                }
            });
            
            planningData.days[dayKey] = {
                day: dayName,
                count: dayItems.length,
                items: dayItems
            };
        });
        
        // Initialiser les jours vides
        daysOfWeek.forEach(dayName => {
            const dayKey = dayName.toLowerCase();
            if (!planningData.days[dayKey]) {
                planningData.days[dayKey] = {
                    day: dayName,
                    count: 0,
                    items: []
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
        
        // Par défaut, retourner seulement le jour actuel (sauf si day=all)
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
        
        // Si on arrive ici, c'est que day=all ou le jour actuel n'existe pas
        // Calculer les totaux
        const totalItems = Object.values(planningData.days).reduce((sum, day) => sum + day.count, 0);
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