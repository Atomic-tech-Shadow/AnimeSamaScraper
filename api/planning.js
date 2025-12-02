const { scrapeAnimesama } = require('../utils/scraper');

function detectTimezoneFromIP(req) {
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress;
    
    if (!clientIP || clientIP === '127.0.0.1' || clientIP === '::1' || 
        clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
        return 'gmt+0';
    }
    return 'gmt+0';
}

function convertTime(frenchTime, targetTimezone) {
    if (!frenchTime || !targetTimezone || frenchTime === '?') return frenchTime;
    
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
        
        const $ = await scrapeAnimesama('https://anime-sama.org/planning');
        
        console.log('🔍 Extraction du planning depuis anime-sama.org/planning...');
        
        const planningData = {
            success: true,
            extractedAt: new Date().toISOString(),
            days: {}
        };
        
        const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
        const daysFrench = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        daysOfWeek.forEach((dayKey, index) => {
            planningData.days[dayKey] = {
                day: daysFrench[index],
                count: 0,
                items: []
            };
        });
        
        const pageHtml = $.html();
        const dayPositions = [];
        
        daysOfWeek.forEach(dayKey => {
            const dayFrench = daysFrench[daysOfWeek.indexOf(dayKey)];
            const regex = new RegExp(`##\\s*${dayFrench}|<h2[^>]*>\\s*${dayFrench}|>\\s*${dayFrench}\\s*<\\/`, 'gi');
            let match;
            while ((match = regex.exec(pageHtml)) !== null) {
                dayPositions.push({ day: dayKey, position: match.index });
            }
        });
        
        dayPositions.sort((a, b) => a.position - b.position);
        console.log('📅 Jours détectés:', dayPositions.map(d => d.day).join(', '));
        
        function getDayForPosition(pos) {
            let currentDay = 'dimanche';
            for (const dp of dayPositions) {
                if (dp.position > pos) break;
                currentDay = dp.day;
            }
            return currentDay;
        }
        
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            const hasSeasonOrScan = href.includes('/saison') || href.includes('/scan');
            if (!hasSeasonOrScan) return;
            
            const cardText = $link.text().trim();
            
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            if (catalogueIndex === -1) return;
            
            const animeId = urlParts[catalogueIndex + 1];
            if (!animeId || animeId === '') return;
            
            let language = 'VOSTFR';
            const $flag = $link.find('img[src*="flag_"]');
            if ($flag.length) {
                const flagSrc = $flag.attr('src') || '';
                if (flagSrc.includes('flag_fr')) language = 'VF';
                else if (flagSrc.includes('flag_jp')) language = 'VOSTFR';
                else if (flagSrc.includes('flag_cn')) language = 'VCN';
                else if (flagSrc.includes('flag_kr')) language = 'VKR';
            }
            if (href.includes('/vf/') || href.includes('/vf1/')) language = 'VF';
            else if (href.includes('/vj/')) language = 'VJ';
            
            let contentType = 'anime';
            if (href.includes('/scan/') || cardText.toLowerCase().includes('scans')) {
                contentType = 'scan';
            }
            
            const timeMatch = cardText.match(/(\d{1,2}h\d{2})/);
            const releaseTime = timeMatch ? timeMatch[1] : '?';
            
            let title = '';
            const $strong = $link.find('strong').first();
            if ($strong.length) {
                title = $strong.text().trim();
            }
            if (!title) {
                title = animeId.replace(/-/g, ' ')
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }
            
            const seasonMatch = cardText.match(/Saison\s*(\d+)/i);
            const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            
            let image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            const $img = $link.find('img[src*="/contenu/"]').first();
            if ($img.length) {
                image = $img.attr('src');
            }
            
            const isReported = cardText.toLowerCase().includes('reporté') || cardText.toLowerCase().includes('retardé');
            
            const elementHtml = $.html(element);
            const elementPosition = pageHtml.indexOf(elementHtml);
            let daySection = getDayForPosition(elementPosition);
            
            const convertedTime = convertTime(releaseTime, detectedTimezone);
            
            const item = {
                animeId: animeId,
                title: title,
                url: href.startsWith('http') ? href : `https://anime-sama.org${href}`,
                image: image,
                releaseTime: convertedTime,
                originalTime: autoDetected && releaseTime !== '?' ? releaseTime : undefined,
                language: language,
                type: contentType,
                season: seasonNumber,
                isReported: isReported,
                status: isReported ? 'reporté' : 'scheduled'
            };
            
            if (planningData.days[daySection]) {
                const exists = planningData.days[daySection].items.some(
                    existing => existing.animeId === animeId && existing.language === language
                );
                if (!exists) {
                    planningData.days[daySection].items.push(item);
                    planningData.days[daySection].count++;
                }
            }
        });
        
        Object.keys(planningData.days).forEach(dayKey => {
            planningData.days[dayKey].items.sort((a, b) => {
                if (a.releaseTime === '?' && b.releaseTime !== '?') return 1;
                if (a.releaseTime !== '?' && b.releaseTime === '?') return -1;
                return a.releaseTime.localeCompare(b.releaseTime);
            });
        });
        
        const totalItems = Object.values(planningData.days).reduce((sum, day) => sum + day.count, 0);
        console.log(`✅ Planning extrait: ${totalItems} items au total`);
        
        if (day && day.toLowerCase() !== 'all' && planningData.days[day.toLowerCase()]) {
            return res.status(200).json({
                success: true,
                day: day,
                extractedAt: planningData.extractedAt,
                ...planningData.days[day.toLowerCase()]
            });
        }
        
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
        
        planningData.totalItems = Object.values(planningData.days).reduce((sum, day) => sum + day.count, 0);
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
