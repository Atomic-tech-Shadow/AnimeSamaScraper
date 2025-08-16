const { scrapeAnimesama } = require('../utils/scraper');

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
        const { day, filter } = req.query;
        
        // Scraper la page planning dédiée
        const $ = await scrapeAnimesama('https://anime-sama.fr/planning');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        // Jours de la semaine en français
        const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        // Parcourir chaque jour
        daysOfWeek.forEach(dayName => {
            const dayItems = [];
            
            // Trouver la section du jour (h2 ou h3 contenant le nom du jour)
            const dayHeader = $(`h2:contains("${dayName}"), h3:contains("${dayName}")`);
            
            if (dayHeader.length > 0) {
                // Récupérer tous les éléments après le header jusqu'au prochain jour
                let nextElement = dayHeader.next();
                
                while (nextElement.length > 0 && !daysOfWeek.some(d => nextElement.text().includes(d))) {
                    // Si c'est un lien d'anime
                    if (nextElement.is('a') && nextElement.attr('href') && nextElement.attr('href').includes('/catalogue/')) {
                        const $link = nextElement;
                        const href = $link.attr('href');
                        const $img = $link.find('img');
                        
                        // Extraire les informations de l'anime
                        const title = $link.find('strong').text().trim() || 
                                     $img.attr('alt') || 
                                     $link.text().replace(/\*\*\*/g, '').trim();
                        
                        // Extraire l'heure
                        const timeMatch = $link.text().match(/(\d{1,2}h\d{2})/);
                        const reportedMatch = $link.text().match(/(Reporté|Retardé)/);
                        
                        // Extraire le type (Anime, Scans) et langue (VOSTFR, VF)
                        const isAnime = $link.text().includes('Anime');
                        const isScan = $link.text().includes('Scans');
                        const language = $link.text().includes('AnimeVF') || $link.text().includes('ScansVF') ? 'VF' : 'VOSTFR';
                        
                        // Extraire l'ID anime depuis l'URL
                        const urlParts = href.split('/');
                        const catalogueIndex = urlParts.indexOf('catalogue');
                        const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                        
                        // Obtenir l'image
                        const imgSrc = $img.attr('src');
                        const image = imgSrc && imgSrc.startsWith('http') ? imgSrc : 
                                     imgSrc ? `https://anime-sama.fr${imgSrc}` : 
                                     `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                        
                        if (title && animeId) {
                            dayItems.push({
                                animeId: animeId,
                                title: title.replace(/\*\*\*/g, '').trim(),
                                url: href.startsWith('http') ? href : `https://anime-sama.fr${href}`,
                                image: image,
                                releaseTime: timeMatch ? timeMatch[1] : '?',
                                language: language,
                                type: isAnime ? 'anime' : isScan ? 'scan' : 'unknown',
                                day: dayName,
                                isReported: reportedMatch ? true : false,
                                status: reportedMatch ? reportedMatch[1] : 'scheduled'
                            });
                        }
                    }
                    
                    nextElement = nextElement.next();
                }
            }
            
            planningData.days[dayName.toLowerCase()] = {
                day: dayName,
                count: dayItems.length,
                items: dayItems
            };
        });
        
        // Si un jour spécifique est demandé
        if (day && planningData.days[day.toLowerCase()]) {
            return res.status(200).json({
                success: true,
                day: day,
                extractedAt: planningData.extractedAt,
                ...planningData.days[day.toLowerCase()]
            });
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
        const totalItems = Object.values(planningData.days).reduce((sum, day) => sum + day.count, 0);
        planningData.totalItems = totalItems;
        
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