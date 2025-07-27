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
        // Scraper le planning des sorties Crunchyroll depuis la homepage
        const $ = await scrapeAnimesama('https://anime-sama.fr/');
        
        const planningItems = [];
        
        // Extraire les éléments de planning avec cartePlanningAnime
        const pageHTML = $.html();
        
        // Rechercher les appels à cartePlanningAnime dans le code JavaScript
        const planningMatches = pageHTML.match(/cartePlanningAnime\([^)]+\)/g);
        
        if (planningMatches) {
            planningMatches.forEach(match => {
                // Parse cartePlanningAnime("Dandadan VF Crunchyroll", "dandadan/saison2/vf1/", "dandadan", "19h00", "", "VF");
                const params = match.match(/cartePlanningAnime\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)",\s*"([^"]+)"\)/);
                
                if (params) {
                    const [, title, path, animeId, time, extra, language] = params;
                    
                    planningItems.push({
                        title: title,
                        animeId: animeId,
                        path: path,
                        releaseTime: time,
                        language: language,
                        isVFCrunchyroll: title.includes('VF Crunchyroll'),
                        url: `https://anime-sama.fr/catalogue/${path}`,
                        type: 'scheduled_release'
                    });
                }
            });
        }
        
        // Extraire aussi les éléments de planning depuis les boutons visibles
        $('*:contains("VF Crunchyroll")').each((index, element) => {
            const $el = $(element);
            const text = $el.text().trim();
            
            if (text.includes('VF Crunchyroll') && text.includes('h')) {
                // Extraire les informations depuis le texte visible
                const timeMatch = text.match(/(\d{1,2}h\d{2})/);
                const animeMatch = text.match(/^([^V]+)\s*VF Crunchyroll/);
                
                if (timeMatch && animeMatch) {
                    const animeTitle = animeMatch[1].trim();
                    const animeId = animeTitle.toLowerCase()
                                            .replace(/[^a-z0-9\s-]/g, '')
                                            .replace(/\s+/g, '-');
                    
                    // Éviter les doublons
                    const exists = planningItems.some(item => item.animeId === animeId);
                    if (!exists) {
                        planningItems.push({
                            title: `${animeTitle} VF Crunchyroll`,
                            animeId: animeId,
                            releaseTime: timeMatch[1],
                            language: 'VF',
                            isVFCrunchyroll: true,
                            url: `https://anime-sama.fr/catalogue/${animeId}`,
                            type: 'crunchyroll_scheduled'
                        });
                    }
                }
            }
        });
        
        // Return planning data
        res.status(200).json({
            success: true,
            count: planningItems.length,
            planning: planningItems,
            extractedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Planning API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch planning data',
            message: 'Unable to retrieve planning information at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};