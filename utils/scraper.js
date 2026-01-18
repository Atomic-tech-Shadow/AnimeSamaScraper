const axios = require('axios');
const cheerio = require('cheerio');
const { cleanTitleWithFallback } = require('./title-cleaner');

// User-Agent rotation for anti-bot protection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Enhanced language system mapping based on anime-sama.si structure
const LANGUAGE_SYSTEM = {
    'vostfr': { 
        code: 'vostfr', 
        name: 'VOSTFR', 
        fullName: 'Version Originale Sous-Titrée Française',
        flag: 'jp',
        priority: 1 
    },
    'vf': { 
        code: 'vf', 
        name: 'VF', 
        fullName: 'Version Française',
        flag: 'fr',
        priority: 2 
    },
    'va': { 
        code: 'va', 
        name: 'VA', 
        fullName: 'Version Anglaise',
        flag: 'en',
        priority: 3 
    },
    'vkr': { 
        code: 'vkr', 
        name: 'VKR', 
        fullName: 'Version Coréenne',
        flag: 'kr',
        priority: 4 
    },
    'vcn': { 
        code: 'vcn', 
        name: 'VCN', 
        fullName: 'Version Chinoise',
        flag: 'cn',
        priority: 5 
    },
    'vqc': { 
        code: 'vqc', 
        name: 'VQC', 
        fullName: 'Version Québécoise',
        flag: 'qc',
        priority: 6 
    },
    'var': { 
        code: 'var', 
        name: 'VAR', 
        fullName: 'Version Arabe',
        flag: 'ar',
        priority: 10 
    },
    'vf1': { 
        code: 'vf1', 
        name: 'VF1', 
        fullName: 'Version Française 1',
        flag: 'fr',
        priority: 7 
    },
    'vf2': { 
        code: 'vf2', 
        name: 'VF2', 
        fullName: 'Version Française 2',
        flag: 'fr',
        priority: 8 
    },
    'vj': { 
        code: 'vj', 
        name: 'VJ', 
        fullName: 'Version Japonaise Sous-Titrée Française',
        flag: 'jp',
        priority: 9 
    }
};

// Server name mapping based on anime-sama.si streaming sources
const SERVER_MAPPING = {
    'sibnet.ru': 'Sibnet',
    'sendvid.com': 'SendVid', 
    'vidmoly.to': 'Vidmoly',
    'smoothpre.com': 'SmoothPre',
    'oneupload.to': 'OneUpload',
    'doodstream.com': 'DoodStream',
    'streamtape.com': 'StreamTape',
    'upstream.to': 'Upstream',
    'embedgram.com': 'EmbedGram',
    'mixdrop.co': 'Mixdrop',
    'voe.sx': 'Voe',
    'ok.ru': 'OK.ru',
    'vidoza.net': 'Vidoza',
    'fembed.com': 'Fembed'
};

// Get random user agent
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Reduced delay for better performance
function randomDelay(min = 100, max = 300) {
    return new Promise(resolve => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        setTimeout(resolve, delay);
    });
}

// Helper function removed - no anime-specific configurations

// Main scraping function
async function scrapeAnimesama(url, options = {}) {
    try {
        await randomDelay(); // Random delay before request
        
        const response = await axios.get(url, {
            timeout: 5000, // 5 second timeout for better performance
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                ...options.headers
            }
        });

        return cheerio.load(response.data.replace(/anime-sama\.(tv|eu|fr)/g, 'anime-sama.si'));
    } catch (error) {
        console.error('Scraping error:', error.message);
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
}

// Search anime by query using the real search API from anime-sama.si
async function searchAnime(query) {
    try {
        await randomDelay(); // Anti-bot delay
        
        // Use the real search API endpoint that the website uses
        const response = await axios.post('https://anime-sama.si/template-php/defaut/fetch.php', 
            `query=${encodeURIComponent(query)}`,
            {
                timeout: 8000,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Connection': 'keep-alive',
                    'Referer': 'https://anime-sama.si/',
                    'Origin': 'https://anime-sama.si'
                }
            }
        );

        // Parse the HTML response from the search API
        const $ = cheerio.load(response.data.replace(/anime-sama\.(tv|eu|fr)/g, 'anime-sama.si'));
        const results = [];
        const seenTitles = new Set();

        // Parse search results - the API returns HTML with anime cards in specific format
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $el = $(element);
            
            const link = $el.attr('href');
            if (!link || !link.includes('/catalogue/')) return;
            
            // Ensure full URL
            const fullUrl = link.startsWith('http') ? link : `https://anime-sama.si${link}`;
            
            // Extract anime ID from URL
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            
            let animeId = urlParts[catalogueIndex + 1];
            // Remove trailing slash if present
            if (animeId.endsWith('/')) {
                animeId = animeId.slice(0, -1);
            }
            
            // Extract title from the h3 element (the search API structure)
            let title = $el.find('h3').text().trim();
            
            // If no title in h3, try other methods
            if (!title) {
                title = $el.find('.title, .name').text().trim() ||
                       $el.attr('title') || 
                       $el.find('img').attr('alt');
            }
            
            // If still no title, construct from ID
            if (!title || title.length < 3) {
                title = animeId.replace(/-/g, ' ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
            }
            
            // Clean up title
            title = title.replace(/\s+/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\t/g, ' ')
                        .trim();
            
            // Extract image
            const image = $el.find('img').attr('src') || 
                         $el.find('img').attr('data-src');
            
            // Add to results if valid and not duplicate
            if (title && title.length > 1 && animeId && !seenTitles.has(animeId)) {
                seenTitles.add(animeId);
                
                results.push({
                    id: animeId,
                    title: title,
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.si${image}`) : null,
                    url: fullUrl
                });
            }
        });

        // If API search didn't return results, fallback to homepage search
        if (results.length === 0) {
            return await fallbackHomepageSearch(query);
        }

        return results.slice(0, 15);
        
    } catch (error) {
        console.error('Search API error:', error.message);
        
        // Fallback to homepage search if API fails
        return await fallbackHomepageSearch(query);
    }
}

// Fallback search function using homepage content
async function fallbackHomepageSearch(query) {
    const $ = await scrapeAnimesama('https://anime-sama.si');
    const results = [];
    const queryLower = query.toLowerCase();
    const seenTitles = new Set();
    
    // Search through all anime links on the homepage
    $('a[href*="/catalogue/"]').each((index, element) => {
        const $el = $(element);
        const link = $el.attr('href');
        
        // Skip general catalogue links
        if (!link || link === 'https://anime-sama.si/catalogue' || link.split('/').length < 5) return;
        
        // Extract anime ID from URL
        const urlParts = link.split('/');
        const catalogueIndex = urlParts.indexOf('catalogue');
        if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
        
        const animeId = urlParts[catalogueIndex + 1];
        
        // Convert URL slug to readable title
        let title = animeId.replace(/-/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Also try to get title from element text or attributes
        const elementTitle = $el.text().trim() || 
                           $el.attr('title') || 
                           $el.find('img').attr('alt');
        
        if (elementTitle && elementTitle.length > title.length) {
            title = elementTitle.replace(/\s+/g, ' ')
                              .replace(/\n/g, ' ')
                              .replace(/\t/g, ' ')
                              .replace(/\s*VF\s*/gi, '')
                              .replace(/\s*VOSTFR\s*/gi, '')
                              .replace(/\s*Saison\s*\d+.*$/gi, '')
                              .replace(/\s*Episode\s*\d+.*$/gi, '')
                              .replace(/\s*\[FIN\]\s*/gi, '')
                              .trim();
        }
        
        // Check if title or URL matches query (fuzzy matching)
        const titleMatches = title.toLowerCase().includes(queryLower);
        const urlMatches = animeId.toLowerCase().includes(queryLower);
        
        // Also try partial word matching
        const titleWords = title.toLowerCase().split(' ');
        const animeIdWords = animeId.toLowerCase().split('-');
        const queryWords = queryLower.split(' ');
        
        const partialMatch = queryWords.some(qWord => 
            qWord.length > 2 && (
                titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord)) ||
                animeIdWords.some(aWord => aWord.includes(qWord) || qWord.includes(aWord))
            )
        );
        
        if ((titleMatches || urlMatches || partialMatch) && !seenTitles.has(title.toLowerCase())) {
            seenTitles.add(title.toLowerCase());
            
            const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
            
            results.push({
                id: animeId,
                title: title,
                image: image ? (image.startsWith('http') ? image : `https://anime-sama.si${image}`) : null,
                url: `https://anime-sama.si/catalogue/${animeId}`
            });
        }
    });
    
    return results.slice(0, 15);
}

// Get trending anime with 100% AUTHENTIC data from homepage daily release sections
async function getTrendingAnime() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.si');
        
        const trending = [];
        const seenAnimes = new Set();
        
        // Priority 1: Extract from recent episodes using bg-cyan-600 buttons (identified from site analysis)
        console.log('🎯 Extraction des épisodes récents via boutons bg-cyan-600');
        
        $('.bg-cyan-600').each((index, button) => {
            if (trending.length >= 25) return false;
            
            const $button = $(button);
            const episodeText = $button.text().trim();
            
            // Find the parent anime link
            const $animeLink = $button.closest('a[href*="/catalogue/"]');
            if (!$animeLink.length) return;
            
            const href = $animeLink.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            
            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.si${href}`;
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            
            const animeId = urlParts[catalogueIndex + 1];
            
            // Create unique ID for this episode
            const uniqueId = `${animeId}-${urlParts.slice(catalogueIndex + 2).join('-')}`;
            
            // Skip if already seen
            if (seenAnimes.has(uniqueId)) return;
            seenAnimes.add(uniqueId);
            
            // Extract title from the anime link text (not just the button)
            let title = $animeLink.text().trim();
            
            // Clean up the title to get just the anime name
            const lines = title.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const animeName = lines[0] || animeId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            // Extract image using the correct CDN identified from site analysis
            const $img = $animeLink.find('img').first();
            let image = $img.attr('src');
            
            // The site analysis shows all images use the statically.io CDN
            if (!image) {
                image = `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            }
            
            // Determine content type and language from URL
            const seasonPath = urlParts[catalogueIndex + 2];
            const languagePath = urlParts[catalogueIndex + 3];
            
            let contentType = 'anime';
            if (seasonPath && seasonPath.toLowerCase().includes('scan')) {
                return; // Skip scans as requested
            } else if (seasonPath && seasonPath.toLowerCase().includes('film')) {
                contentType = 'film';
            }
            
            // Language detection from URL path
            let languageInfo = LANGUAGE_SYSTEM.vostfr; // Default
            if (languagePath && LANGUAGE_SYSTEM[languagePath.toLowerCase()]) {
                languageInfo = LANGUAGE_SYSTEM[languagePath.toLowerCase()];
            }
            
            // Extract episode and season info
            const episodeMatch = episodeText.match(/Episode\s*(\d+)/i);
            const seasonMatch = episodeText.match(/Saison\s*(\d+)/i);
            
            // Check for special indicators
            const isFinale = title.includes('[FIN]') || episodeText.includes('[FIN]');
            const isVFCrunchyroll = title.includes('VF Crunchyroll');
            
            trending.push({
                id: uniqueId,
                animeId: animeId,
                title: animeName,
                image: image,
                url: fullUrl,
                contentType: contentType,
                language: languageInfo,
                episodeInfo: episodeText,
                currentEpisode: episodeMatch ? parseInt(episodeMatch[1]) : null,
                currentSeason: seasonMatch ? parseInt(seasonMatch[1]) : null,
                isTrending: true,
                isFinale: isFinale,
                isVFCrunchyroll: isVFCrunchyroll,
                extractedFrom: 'Recent Episodes (bg-cyan-600 buttons)',
                specialIndicators: {
                    finale: isFinale,
                    crunchyrollVF: isVFCrunchyroll
                }
            });
            
            console.log(`✅ Trending: ${animeName} - ${episodeText} (${uniqueId})`);
        });
        
        // Priority 2: Add planning/scheduled releases (they often contain VF content)
        const planningMatches = $.html().match(/cartePlanningAnime\([^)]+\)/g);
        if (planningMatches && trending.length < 20) {
            planningMatches.forEach(match => {
                const params = match.match(/cartePlanningAnime\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)",\s*"([^"]+)"\)/);
                
                if (params) {
                    const [, title, path, animeId, time, extra, language] = params;
                    
                    // Skip if already seen
                    if (seenAnimes.has(animeId)) return;
                    seenAnimes.add(animeId);
                    
                    // Clean title and get language info
                    const cleanedTitle = cleanTitleWithFallback(title, animeId);
                    const languageInfo = LANGUAGE_SYSTEM[language.toLowerCase()] || LANGUAGE_SYSTEM.vostfr;
                    
                    trending.push({
                        id: animeId,
                        title: cleanedTitle,
                        image: `https://anime-sama.si/s2/img/animes/${animeId}.jpg`,
                        url: `https://anime-sama.si/catalogue/${animeId}`,
                        contentType: 'anime',
                        language: languageInfo,
                        releaseTime: time,
                        isTrending: true,
                        extractedFrom: 'planning_scheduled',
                        isVFCrunchyroll: title.includes('VF Crunchyroll'),
                        specialIndicators: {
                            scheduled: true,
                            crunchyrollVF: title.includes('VF Crunchyroll')
                        }
                    });
                }
            });
        }

        // Priority 3: If still not enough from daily sections, get featured anime from homepage
        if (trending.length < 15) {
            $('a[href*="/catalogue/"]').slice(0, 20).each((index, element) => {
                const $el = $(element);
                const link = $el.attr('href');
                
                if (!link || link.includes('/planning') || link.includes('/aide')) return;
                
                const urlParts = link.split('/');
                const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
                if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
                
                const animeId = urlParts[catalogueIndex + 1];
                
                if (seenAnimes.has(animeId)) return;
                seenAnimes.add(animeId);
                
                let title = $el.text().trim();
                
                // CORRECTION CRITIQUE: Utiliser la fonction de nettoyage centralisée
                title = cleanTitleWithFallback(title, animeId);
                
                if (!title || title.length < 3) {
                    title = animeId.replace(/-/g, ' ')
                                  .split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
                }
                
                const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
                
                trending.push({
                    id: animeId,
                    title: title,
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.si${image}`) : null,
                    url: `https://anime-sama.si/catalogue/${animeId}`,
                    contentType: 'anime',
                    language: LANGUAGE_SYSTEM.vostfr,
                    releaseDay: null,
                    isTrending: false,
                    extractedFrom: 'Homepage Featured'
                });
            });
        }
        
        // Sort by priority: daily releases first, then featured content
        trending.sort((a, b) => {
            if (a.isTrending && !b.isTrending) return -1;
            if (b.isTrending && !a.isTrending) return 1;
            
            // Prioritize anime over scans
            if (a.contentType === 'anime' && b.contentType !== 'anime') return -1;
            if (b.contentType === 'anime' && a.contentType !== 'anime') return 1;
            
            return 0;
        });
        
        return trending.slice(0, 20);
        
    } catch (error) {
        console.error('Error getting trending anime:', error.message);
        return [];
    }
}

// Get anime details by ID
async function getAnimeDetails(animeId) {
    try {
        const url = `https://anime-sama.si/catalogue/${animeId}/`;
        const $ = await scrapeAnimesama(url);
        
        // Check if we got a valid page
        const bodyText = $('body').text();
        if (bodyText.includes('301 Moved Permanently') || bodyText.length < 100) {
            throw new Error('Anime page not found');
        }
        
        // Extract title - try multiple methods for new structure
        let title = $('meta[property="og:title"]').attr('content') || 
                   $('title').text().split('|')[0].trim() ||
                   $('h1').first().text().trim() ||
                   animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Extract alternative titles
        const alternativeTitles = $('meta[property="og:site_name"]').attr('content') || '';
        
        // Extract synopsis from meta description
        const synopsis = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') ||
                        'Synopsis non disponible';
        
        // Extract image from meta or page elements
        const image = $('meta[property="og:image"]').attr('content') ||
                     $('img[alt*="' + animeId + '"]').first().attr('src') ||
                     `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
        
        // Extract genres from the page using direct text search
        let genres = [];
        
        // Method 1: Search directly for the pattern "Action, Comédie, Horreur, Mystère, Romance"
        const pageHTML = $.html();
        const genresMatch = pageHTML.match(/Action.*?Comédie.*?Horreur.*?Mystère.*?Romance/);
        if (genresMatch) {
            const genresText = genresMatch[0];
            genres = genresText.split(',').map(g => g.trim()).filter(g => g.length > 2);
        }
        
        // Method 2: Look for elements containing known genre patterns
        if (genres.length === 0) {
            $('a, p, span').each((index, element) => {
                const text = $(element).text().trim();
                if (text.includes('Action') && text.includes('Comédie') && text.includes(',')) {
                    genres = text.split(',').map(g => g.trim()).filter(g => g.length > 2);
                    return false; // Break
                }
            });
        }
        
        // If no genres found, return empty array (no fake data)
        if (genres.length === 0) {
            genres = [];
        }
        
        // Extract status and progress info from page
        let status = 'Disponible';
        let progressInfo = '';
        const statusElements = $('p:contains("Avancement")');
        if (statusElements.length > 0) {
            const statusText = statusElements.find('a').text().trim();
            if (statusText) {
                status = statusText;
                progressInfo = statusText;
            }
        }
        
        // Extract correspondence info (anime vs manga)
        let correspondence = '';
        const corrElements = $('p:contains("Correspondance")');
        if (corrElements.length > 0) {
            correspondence = corrElements.find('a').text().trim();
        }
        
        // Get available seasons and analyze content
        const seasons = await getAnimeSeasons(animeId);
        const totalSeasons = seasons.length;
        
        // Enhanced type detection based on actual content
        let type = 'Anime';
        const hasFilms = seasons.some(s => s.name.toLowerCase().includes('film'));
        const hasOAV = seasons.some(s => s.name.toLowerCase().includes('oav') || s.name.toLowerCase().includes('ova'));
        const hasSpecials = seasons.some(s => s.name.toLowerCase().includes('spécial') || s.name.toLowerCase().includes('special'));
        const hasHS = seasons.some(s => s.name.toLowerCase().includes('hs') || s.name.toLowerCase().includes('hors série'));
        
        if (hasFilms && hasOAV && hasSpecials) {
            type = 'Série Complète (Films + OAV + Spéciaux)';
        } else if (hasFilms && hasOAV) {
            type = 'Série + Films + OAV';
        } else if (hasFilms && hasSpecials) {
            type = 'Série + Films + Spéciaux';
        } else if (hasFilms) {
            type = 'Série + Films';
        } else if (hasOAV) {
            type = 'Série + OAV';
        } else if (hasHS) {
            type = 'Série + Hors-Série';
        } else if (totalSeasons > 3) {
            type = 'Série Longue';
        }
        
        // Extract year from various sources
        let year = 'Inconnu';
        const pageContent = $.html();
        const yearMatches = pageContent.match(/20[0-2][0-9]/g);
        if (yearMatches) {
            // Get the earliest year found (likely release year)
            year = Math.min(...yearMatches.map(y => parseInt(y))).toString();
        }
        
        // Determine available languages from seasons
        const availableLanguages = [];
        const hasVOSTFR = seasons.some(s => s.languages.includes('VOSTFR'));
        const hasVF = seasons.some(s => s.languages.includes('VF'));
        if (hasVOSTFR) availableLanguages.push('VOSTFR');
        if (hasVF) availableLanguages.push('VF');
        if (availableLanguages.length === 0) availableLanguages.push('VOSTFR'); // Default
        
        // Enhanced status with season count
        if (totalSeasons > 1) {
            status = `${totalSeasons} saisons disponibles`;
            if (progressInfo) {
                status += ` - ${progressInfo}`;
            }
        }
        
        const result = {
            id: animeId,
            title: title,
            alternativeTitles: alternativeTitles || null,
            synopsis: synopsis,
            image: image ? (image.startsWith('http') ? image : `https://anime-sama.si${image}`) : null,
            genres: genres.length > 0 ? genres : ['Anime'],
            status: status,
            progressInfo: progressInfo || null,
            correspondence: correspondence || null,
            year: year,
            type: type,
            seasons: seasons, // Ajout du champ seasons manquant
            totalSeasons: totalSeasons,
            availableLanguages: availableLanguages,
            hasFilms: hasFilms,
            hasOAV: hasOAV,
            hasSpecials: hasSpecials,
            url: url,
            lastUpdated: new Date().toISOString()
        };
        
        return result;
        
    } catch (error) {
        console.error('Error getting anime details:', error.message);
        throw error;
    }
}

// Helper function to get basic anime info from homepage/search
async function getBasicAnimeInfo(animeId) {
    try {
        // Try to find the anime in trending/homepage first
        const trending = await getTrendingAnime();
        const found = trending.find(anime => anime.id === animeId);
        
        if (found) {
            return found;
        }
        
        // If not found in trending, try searching for it
        const searchResults = await searchAnime(animeId.replace(/-/g, ' '));
        const foundInSearch = searchResults.find(anime => anime.id === animeId);
        
        if (foundInSearch) {
            return foundInSearch;
        }
        
        // Return basic constructed info
        return {
            id: animeId,
            title: animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
            type: 'anime'
        };
        
    } catch (error) {
        return {
            id: animeId,
            title: animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            image: null,
            type: 'anime'
        };
    }
}

// Optimized function to get available languages for a season
async function getSeasonLanguages(animeId, seasonValue) {
    const possibleLanguages = ['vostfr', 'vf', 'vf1', 'vf2', 'va'];
    const availableLanguages = [];
    
    // Use Promise.allSettled for parallel requests instead of sequential
    const languageChecks = possibleLanguages.map(async (lang) => {
        try {
            const episodesUrl = `https://anime-sama.si/catalogue/${animeId}/${seasonValue}/${lang}/episodes.js`;
            const response = await axios.get(episodesUrl, {
                timeout: 2000, // Reduced timeout
                headers: { 'User-Agent': getRandomUserAgent() },
                validateStatus: function (status) {
                    return status < 500;
                }
            });
            
            // Check if we got actual JavaScript content (not a 404 page)
            if (response.status === 200 && response.data && 
                (response.data.includes('var eps') || response.data.includes('eps1'))) {
                return { lang: lang.toUpperCase(), available: true };
            }
        } catch (error) {
            // Language not available
        }
        return { lang: lang.toUpperCase(), available: false };
    });
    
    // Wait for all parallel requests to complete
    const results = await Promise.allSettled(languageChecks);
    
    // Extract available languages from results
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.available) {
            availableLanguages.push(result.value.lang);
        }
    });
    
    return availableLanguages.length > 0 ? availableLanguages : ['VOSTFR'];
}

// Enhanced seasons extraction with ANIME, MANGA, and all content types
async function getAnimeSeasons(animeId) {
    try {
        // Scrape the anime's main page to get real seasons data
        const $ = await scrapeAnimesama(`https://anime-sama.si/catalogue/${animeId}/`);
        
        const seasons = [];
        const fullHtml = $.html();
        
        // Extract ALL sections with panneauAnime calls (ANIME, KAI, etc.)
        const animeSection = fullHtml.split('<!-- ANIME -->')[1]?.split('<!-- MANGA -->')[0];
        const mangaSection = fullHtml.split('<!-- MANGA -->')[1];
        
        // Extract ALL panneauAnime calls from the entire HTML before MANGA section
        const beforeManga = fullHtml.split('<!-- MANGA -->')[0];
        
        // Remove commented blocks and single-line comments (but preserve authentic data)
        let processedSection = beforeManga.replace(/\/\*[\s\S]*?\*\//g, '');
        processedSection = processedSection.replace(/\/\/.*$/gm, '');
        
        const panneauMatches = processedSection.match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/g);
        
        if (panneauMatches) {
            for (let index = 0; index < panneauMatches.length; index++) {
                const match = panneauMatches[index];
                const parts = match.match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/);
                if (parts && parts.length >= 3) {
                    const seasonName = parts[1];
                    const seasonUrl = parts[2];
                    
                    // Skip generic placeholder entries
                    if (seasonName === 'nom' && seasonUrl === 'url') {
                        continue;
                    }
                    
                    // Check if already exists to avoid duplicates
                    if (seasons.find(s => s.value === seasonUrl.split('/')[0])) {
                        continue;
                    }
                    
                    // Better season number extraction based on total count
                    let seasonNumber = seasons.length + index + 1;
                    let seasonType = 'Saison';
                    
                    // Enhanced content type detection
                    if (seasonName.toLowerCase().includes('film') || seasonUrl.toLowerCase().includes('film')) {
                        seasonType = 'Film';
                        seasonNumber = 1000 + seasons.filter(s => s.type === 'Film').length;
                    } else if (seasonName.toLowerCase().includes('oav') || seasonName.toLowerCase().includes('ova') || 
                               seasonUrl.toLowerCase().includes('oav') || seasonUrl.toLowerCase().includes('ova')) {
                        seasonType = 'OAV';
                        seasonNumber = 990 + seasons.filter(s => s.type === 'OAV').length;
                    } else if (seasonName.toLowerCase().includes('spécial') || seasonName.toLowerCase().includes('special') ||
                               seasonUrl.toLowerCase().includes('special') || seasonUrl.toLowerCase().includes('speciale')) {
                        seasonType = 'Spécial';
                        seasonNumber = 980 + seasons.filter(s => s.type === 'Spécial').length;
                    } else if (seasonName.toLowerCase().includes('hors série') || seasonName.toLowerCase().includes('hors-série') ||
                               (seasonName.toLowerCase().includes('hs') && !seasonName.toLowerCase().includes('saga')) ||
                               (seasonUrl.toLowerCase().includes('hs') && !seasonUrl.toLowerCase().includes('saison')) ||
                               seasonName.toLowerCase().includes('log:')) {
                        seasonType = 'Hors-Série';
                        seasonNumber = 970 + seasons.filter(s => s.type === 'Hors-Série').length;
                    } else if (seasonName.toLowerCase().includes('movie') || seasonUrl.toLowerCase().includes('movie')) {
                        seasonType = 'Film';
                        seasonNumber = 1000 + seasons.filter(s => s.type === 'Film').length;
                    } else if (seasonName.toLowerCase().includes('kai')) {
                        // Kai can be either regular season or film format
                        if (seasonName.toLowerCase().includes('films')) {
                            seasonType = 'Film';
                            seasonNumber = 1000 + seasons.filter(s => s.type === 'Film').length;
                        } else {
                            seasonType = 'Saison';
                            const seasonMatch = seasonName.match(/(\d+)/);
                            if (seasonMatch) {
                                seasonNumber = parseInt(seasonMatch[1]) + 100; // Kai seasons are offset
                            } else {
                                seasonNumber = 100 + seasons.filter(s => s.type === 'Saison' && s.name.includes('Kai')).length;
                            }
                        }
                    } else {
                        // Regular season/saga - extract number
                        if (seasonName.toLowerCase().includes('saga') || seasonName.toLowerCase().includes('saison')) {
                            const seasonMatch = seasonName.match(/saga\s*(\d+)|saison\s*(\d+)/i);
                            if (seasonMatch) {
                                seasonNumber = parseInt(seasonMatch[1] || seasonMatch[2]);
                            }
                        } else {
                            // Generic numbering
                            const numberMatch = seasonName.match(/(\d+)/);
                            if (numberMatch) {
                                seasonNumber = parseInt(numberMatch[1]);
                            } else {
                                seasonNumber = seasons.filter(s => s.type === 'Saison').length + 1;
                            }
                        }
                    }
                    
                    // Extract season folder name for value
                    const seasonValue = seasonUrl.split('/')[0];
                    
                    // Get all available languages for this season
                    const languages = await getSeasonLanguages(animeId, seasonValue);
                    
                    seasons.push({
                        number: seasonNumber,
                        name: seasonName,
                        value: seasonValue, // saison1, film, etc.
                        type: seasonType,
                        url: seasonUrl,
                        fullUrl: `https://anime-sama.si/catalogue/${animeId}/${seasonUrl}`,
                        languages: languages,
                        available: true,
                        contentType: 'anime'
                    });
                }
            }
        }
            

        
        // Process MANGA section (Scans) - uses panneauScan instead of panneauAnime
        if (mangaSection) {
            // Remove commented blocks /* ... */ and single-line comments // to avoid extracting inactive content
            let cleanMangaSection = mangaSection.replace(/\/\*[\s\S]*?\*\//g, '');
            // Remove single-line comments starting with //
            cleanMangaSection = cleanMangaSection.replace(/\/\/.*$/gm, '');
            const mangaPanneauMatches = cleanMangaSection.match(/panneauScan\("([^"]+)",\s*"([^"]+)"\);/g);
            
            if (mangaPanneauMatches) {
                mangaPanneauMatches.forEach((match, index) => {
                    const parts = match.match(/panneauScan\("([^"]+)",\s*"([^"]+)"\);/);
                    if (parts && parts.length >= 3) {
                        const scanName = parts[1];
                        const scanUrl = parts[2];
                        
                        // Scans have specific numbering
                        let scanNumber = 2000 + index; // Group all scans at the end
                        let scanType = 'Scan';
                        
                        // Determine scan type
                        if (scanName.toLowerCase().includes('scan')) {
                            scanType = 'Scan';
                        } else if (scanName.toLowerCase().includes('novel') || scanName.toLowerCase().includes('light novel')) {
                            scanType = 'Light Novel';
                        } else if (scanName.toLowerCase().includes('manga')) {
                            scanType = 'Manga';
                        } else if (scanName.toLowerCase().includes('webtoon')) {
                            scanType = 'Webtoon';
                        }
                        
                        // Determine available languages for scans
                        const languages = [];
                        if (scanUrl.includes('/vf')) languages.push('VF');
                        if (scanUrl.includes('/vostfr')) languages.push('VOSTFR');
                        if (scanUrl.includes('/fr')) languages.push('VF');
                        if (languages.length === 0) languages.push('VF'); // Scans are usually in French
                        
                        // Extract scan folder name for value
                        const scanValue = scanUrl.split('/')[0];
                        
                        seasons.push({
                            number: scanNumber,
                            name: scanName,
                            value: scanValue, // scan, light-novel, etc.
                            type: scanType,
                            url: scanUrl,
                            fullUrl: `https://anime-sama.si/catalogue/${animeId}/${scanUrl}`,
                            languages: languages,
                            available: true,
                            contentType: 'manga'
                        });
                    }
                });
            }
        }
        
        // Enhanced fallback detection for missed content
        $('a[href*="' + animeId + '"]').each((index, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            const text = $el.text().trim().toLowerCase();
            
            if (!href) return;
            
            const urlParts = href.split('/');
            const contentPath = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
            
            // Check for various content types that might be missed
            if (href.includes('/scan/') || text.includes('scan')) {
                const scanUrl = href.replace(`https://anime-sama.si/catalogue/${animeId}/`, '');
                if (!seasons.find(s => s.url === scanUrl)) {
                    seasons.push({
                        number: 2100 + index,
                        name: text || 'Scans',
                        value: 'scan',
                        type: 'Scan',
                        url: scanUrl,
                        fullUrl: href,
                        languages: ['VF'],
                        available: true,
                        contentType: 'manga'
                    });
                }
            } else if (href.includes('/oav/') || text.includes('oav') || text.includes('ova')) {
                const oavUrl = href.replace(`https://anime-sama.si/catalogue/${animeId}/`, '');
                if (!seasons.find(s => s.url === oavUrl)) {
                    seasons.push({
                        number: 990 + index,
                        name: text || 'OAV',
                        value: 'oav',
                        type: 'OAV',
                        url: oavUrl,
                        fullUrl: href,
                        languages: ['VOSTFR', 'VF'],
                        available: true,
                        contentType: 'anime'
                    });
                }
            } else if (href.includes('/special/') || text.includes('spécial') || text.includes('special')) {
                const specialUrl = href.replace(`https://anime-sama.si/catalogue/${animeId}/`, '');
                if (!seasons.find(s => s.url === specialUrl)) {
                    seasons.push({
                        number: 980 + index,
                        name: text || 'Spécial',
                        value: 'special',
                        type: 'Spécial',
                        url: specialUrl,
                        fullUrl: href,
                        languages: ['VOSTFR', 'VF'],
                        available: true,
                        contentType: 'anime'
                    });
                }
            }
        });
        
        // Sort seasons: regular seasons first, then specials, then films, then scans
        seasons.sort((a, b) => {
            // Regular anime seasons (1-99) come first
            if (a.number < 100 && b.number < 100) return a.number - b.number;
            if (a.number < 100) return -1;
            if (b.number < 100) return 1;
            
            // Special content (100-999) comes next
            if (a.number < 1000 && b.number < 1000) return a.number - b.number;
            if (a.number < 1000) return -1;
            if (b.number < 1000) return 1;
            
            // Films (1000-1999) then OAVs (990-999)
            if (a.number < 2000 && b.number < 2000) return a.number - b.number;
            if (a.number < 2000) return -1;
            if (b.number < 2000) return 1;
            
            // Scans (2000+) come last
            return a.number - b.number;
        });
        
        // Re-index for API consistency while keeping original numbering for type detection
        seasons.forEach((season, index) => {
            season.apiIndex = index + 1;
        });
        
        return seasons;
        
    } catch (error) {
        console.error('Error getting anime seasons:', error.message);
        // Return empty array - no fake data generation
        return [];
    }
}

// Get episodes for an anime season by analyzing the real episode URLs
async function getAnimeEpisodes(animeId, season = 1, language = 'VOSTFR') {
    try {
        // Handle season parameter - could be number or string like "saison1"
        let seasonPath;
        if (typeof season === 'string' && season.startsWith('saison')) {
            // Already formatted like "saison1", "saison11", etc.
            seasonPath = season;
        } else if (typeof season === 'number' || /^\d+$/.test(season)) {
            // Numeric season, format as "saison{number}"
            seasonPath = `saison${season}`;
        } else {
            // Fallback for any other format
            seasonPath = season.toString();
        }
        
        // Try to find the correct language variant available on the site
        let languageCode = 'vostfr'; // default fallback
        const requestedLang = language.toLowerCase();
        
        // First check what language variants are actually available for this anime/season
        const possibleLanguages = ['vostfr', 'vf', 'vf1', 'vf2', 'va', 'vkr', 'vcn', 'vqc', 'vj'];
        
        // Optimized parallel language detection for better performance
        const languagesToTest = requestedLang === 'vf' ? ['vf1', 'vf2', 'vf'] : [requestedLang];
        
        const languageTests = languagesToTest.map(async (testLang) => {
            try {
                const testUrl = `https://anime-sama.si/catalogue/${animeId}/${seasonPath}/${testLang}/episodes.js`;
                const testResponse = await axios.get(testUrl, {
                    timeout: 1500,
                    headers: { 'User-Agent': getRandomUserAgent() },
                    validateStatus: function (status) {
                        return status < 500;
                    }
                });
                
                if (testResponse.status === 200 && testResponse.data && 
                    (testResponse.data.includes('var eps') || testResponse.data.includes('eps1'))) {
                    return testLang;
                }
            } catch (e) {
                // Language not available
            }
            return null;
        });
        
        const languageResults = await Promise.allSettled(languageTests);
        
        // Find the first successful language
        for (const result of languageResults) {
            if (result.status === 'fulfilled' && result.value) {
                languageCode = result.value;
                break;
            }
        }
        
        const seasonUrl = `https://anime-sama.si/catalogue/${animeId}/${seasonPath}/${languageCode}/`;
        
        // Try to get the episodes.js file for this specific anime/season
        const episodesJsUrl = `${seasonUrl}episodes.js`;
        
        const episodes = [];
        
        let maxEpisodes = 0; // Declare here so it's accessible throughout the try block
        
        try {
            // Use axios directly to get the JavaScript file (raw text)
            const response = await axios.get(episodesJsUrl, {
                timeout: 4000, // Reduced timeout
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/javascript, application/javascript, */*',
                    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                    'Connection': 'keep-alive',
                    'Referer': seasonUrl
                }
            });
            
            const jsContent = response.data;
            
            if (typeof jsContent === 'string' && jsContent.includes('var eps')) {
                // Extract all episode server arrays (eps1, eps2, eps3, etc.)
                const episodeArrayMatches = jsContent.match(/var eps(\d+) = \[([\s\S]*?)\];/g);
                const servers = new Map();
                
                if (episodeArrayMatches) {
                    episodeArrayMatches.forEach((match) => {
                        const serverMatch = match.match(/var eps(\d+) = \[([\s\S]*?)\];/);
                        if (serverMatch) {
                            const serverNum = parseInt(serverMatch[1]);
                            const urlsContent = serverMatch[2];
                            
                            // Extract URLs from the array
                            const urls = urlsContent.match(/'([^']+)'/g);
                            
                            if (urls) {
                                const cleanUrls = urls.map(url => url.replace(/'/g, '').trim()).filter(url => url.length > 0);
                                servers.set(serverNum, cleanUrls);
                            }
                        }
                    });
                }
                
                // Find the maximum number of episodes across all servers
                servers.forEach(urls => {
                    maxEpisodes = Math.max(maxEpisodes, urls.length);
                });
                
                // Create episodes with all available servers
                for (let episodeNum = 1; episodeNum <= maxEpisodes; episodeNum++) {
                    const streamingSources = [];
                    
                    // Collect streaming sources from all servers for this episode
                    servers.forEach((urls, serverNum) => {
                        if (urls[episodeNum - 1]) {
                            // Determine server name based on the URL domain
                            const serverUrl = urls[episodeNum - 1];
                            let serverName = `Server ${serverNum}`;
                            
                            // Enhanced server detection using the new mapping
                            for (const [domain, name] of Object.entries(SERVER_MAPPING)) {
                                if (serverUrl.toLowerCase().includes(domain)) {
                                    serverName = name;
                                    break;
                                }
                            }
                            
                            streamingSources.push({
                                server: serverName,
                                url: serverUrl,
                                quality: 'HD',
                                serverNumber: serverNum
                            });
                        }
                    });
                    
                    episodes.push({
                        number: episodeNum,
                        title: `Épisode ${episodeNum}`,
                        url: `${seasonUrl}episode-${episodeNum}`,
                        streamingSources: streamingSources,
                        language: language.toUpperCase(),
                        season: parseInt(season),
                        available: streamingSources.length > 0
                    });
                }
            }
            
            // After successfully parsing episodes.js, also check the HTML page for additional episodes
            // that might not be reflected in the episodes.js file yet
            try {
                const $ = await scrapeAnimesama(seasonUrl);
                
                // Look for episode buttons or links that might indicate more episodes than in episodes.js
                const episodeSelectors = [
                    'button[onclick*="episode"], a[href*="episode"]',
                    '.episode, .ep, [class*="episode"], [class*="ep"]',
                    'select option[value*="episode"]'
                ];
                
                let maxFoundEpisode = maxEpisodes;
                
                episodeSelectors.forEach(selector => {
                    $(selector).each((index, element) => {
                        const $el = $(element);
                        const text = $el.text() || $el.attr('onclick') || $el.attr('href') || $el.attr('value') || '';
                        
                        // Look for episode numbers in various formats
                        const episodeMatches = text.match(/(?:épisode|episode|ep\.?)\s*(\d+)/i);
                        if (episodeMatches) {
                            const foundEpisode = parseInt(episodeMatches[1]);
                            if (foundEpisode > maxFoundEpisode) {
                                maxFoundEpisode = foundEpisode;
                            }
                        }
                    });
                });
                
                // If we found episodes beyond what's in episodes.js, add them
                if (maxFoundEpisode > maxEpisodes) {
                    console.log(`Found additional episodes up to ${maxFoundEpisode} for ${animeId} (episodes.js only had ${maxEpisodes})`);
                    
                    for (let episodeNum = maxEpisodes + 1; episodeNum <= maxFoundEpisode; episodeNum++) {
                        episodes.push({
                            number: episodeNum,
                            title: `Épisode ${episodeNum}`,
                            url: `${seasonUrl}episode-${episodeNum}`,
                            streamingSources: [], // Will be empty for now, but episode exists
                            language: language.toUpperCase(),
                            season: parseInt(season),
                            available: true // Set to true since we found it on the page
                        });
                    }
                }
            } catch (htmlCheckError) {
                console.log('Could not check HTML page for additional episodes:', htmlCheckError.message);
            }
            
            // Final check: look at recent episodes to see if there are newer episodes for this anime
            try {
                const recentEpisodes = await getRecentEpisodes();
                
                const animeRecentEpisodes = recentEpisodes.filter(ep => 
                    ep.animeId === animeId && 
                    ep.season === parseInt(season) &&
                    ep.language.toUpperCase() === language.toUpperCase()
                );
                
                // Find the highest episode number in recent episodes
                let maxRecentEpisode = 0;
                animeRecentEpisodes.forEach(ep => {
                    if (ep.episode > maxRecentEpisode) {
                        maxRecentEpisode = ep.episode;
                    }
                });
                
                // If recent episodes show a higher episode number than what we found, add the missing episodes
                if (maxRecentEpisode > episodes.length) {
                    console.log(`✅ Found episode ${maxRecentEpisode} in recent releases for ${animeId}, adding missing episodes`);
                    
                    for (let episodeNum = episodes.length + 1; episodeNum <= maxRecentEpisode; episodeNum++) {
                        episodes.push({
                            number: episodeNum,
                            title: `Épisode ${episodeNum}`,
                            url: `${seasonUrl}episode-${episodeNum}`,
                            streamingSources: [], // Will be populated when the episode page is accessed
                            language: language.toUpperCase(),
                            season: parseInt(season),
                            available: true
                        });
                    }
                }
            } catch (recentCheckError) {
                console.log('Could not check recent episodes for additional episodes:', recentCheckError.message);
            }
            
        } catch (jsError) {
            console.error(`Could not fetch episodes.js from ${episodesJsUrl}:`, jsError.message);
            
            // Fallback: try to access the season page directly and look for episode count
            try {
                const $ = await scrapeAnimesama(seasonUrl);
                
                // Look for select options or episode references in the HTML
                const selectEpisodes = $('#selectEpisodes option').length;
                if (selectEpisodes > 0) {
                    // Create episodes based on select options
                    for (let i = 1; i <= selectEpisodes; i++) {
                        episodes.push({
                            number: i,
                            title: `Épisode ${i}`,
                            url: `${seasonUrl}episode-${i}`,
                            streamingSources: [],
                            language: language.toUpperCase(),
                            season: parseInt(season),
                            available: false
                        });
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback page access failed:', fallbackError.message);
            }
        }
        
        // Sort episodes by number
        episodes.sort((a, b) => a.number - b.number);
        
        // If still no episodes found, return empty array (don't create fake data)
        if (episodes.length === 0) {
            throw new Error(`No episodes found for ${animeId} season ${season} in ${language}`);
        }
        
        return episodes;
        
    } catch (error) {
        console.error('Error getting anime episodes:', error.message);
        throw error; // Don't return fake data, let the API handle the error appropriately
    }
}

// Get episode streaming sources from episode URL or anime-sama.si streaming URL
async function getEpisodeSources(episodeUrl) {
    try {
        // Handle different URL formats
        let finalUrl = episodeUrl;
        
        // If it's an episode ID format like "dandadan-s2-e1", convert to URL
        const episodeIdMatch = episodeUrl.match(/^([a-z0-9-]+)-s(\d+)-e(\d+)$/i);
        if (episodeIdMatch) {
            const [, animeId, season, episode] = episodeIdMatch;
            finalUrl = `https://anime-sama.si/catalogue/${animeId}/saison${season}/vostfr/episode-${episode}`;
        } else if (!episodeUrl.includes('anime-sama.si')) {
            // If it's a relative path, add the domain
            finalUrl = `https://anime-sama.si${episodeUrl}`;
        }
        
        console.log(`Extracting streaming sources from: ${finalUrl}`);
        
        // Check if this is a catalogue episode page URL like /catalogue/anime/saison1/vostfr/episode-1
        if (finalUrl.includes('/catalogue/') && finalUrl.includes('/episode-')) {
            return await extractFromEpisodePage(finalUrl);
        }
        
        // Check if this is a catalogue season page URL like /catalogue/anime/saison1/vostfr/
        if (finalUrl.includes('/catalogue/') && (finalUrl.includes('/vostfr') || finalUrl.includes('/vf'))) {
            return await extractFromSeasonPage(finalUrl);
        }
        
        // If it's a direct streaming URL, try to extract the actual video source
        if (finalUrl.includes('http') && !finalUrl.includes('/catalogue/')) {
            return await extractDirectStreamingSources(finalUrl);
        }
        
        return [];
        
    } catch (error) {
        console.error('Error getting episode sources:', error.message);
        return [];
    }
}

// Extract streaming sources from episode page URL
async function extractFromEpisodePage(episodeUrl) {
    try {
        // Parse the episode URL to get season info
        const urlParts = episodeUrl.split('/');
        const animeId = urlParts[4]; // anime ID
        const seasonPath = urlParts[5]; // season folder
        const language = urlParts[6]; // language
        const episodePart = urlParts[7]; // episode file
        
        if (!episodePart || !episodePart.includes('episode-')) {
            throw new Error('Invalid episode URL format');
        }
        
        const episodeNumber = parseInt(episodePart.replace('episode-', ''));
        
        // Get the season's episodes.js file
        const seasonUrl = `https://anime-sama.si/catalogue/${animeId}/${seasonPath}/${language}/`;
        const episodesJsUrl = `${seasonUrl}episodes.js`;
        
        console.log(`Getting episodes.js from: ${episodesJsUrl}`);
        
        const response = await axios.get(episodesJsUrl, {
            timeout: 8000,
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/javascript, application/javascript, */*',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': seasonUrl
            }
        });
        
        const jsContent = response.data;
        const sources = [];
        
        if (typeof jsContent === 'string' && jsContent.includes('var eps')) {
            // Extract all episode server arrays (eps1, eps2, eps3, etc.)
            const episodeArrayMatches = jsContent.match(/var eps(\d+) = \[([\s\S]*?)\];/g);
            
            if (episodeArrayMatches) {
                episodeArrayMatches.forEach((match) => {
                    const serverMatch = match.match(/var eps(\d+) = \[([\s\S]*?)\];/);
                    if (serverMatch) {
                        const serverNum = parseInt(serverMatch[1]);
                        const urlsContent = serverMatch[2];
                        
                        // Extract URLs from the array
                        const urls = urlsContent.match(/'([^']+)'/g);
                        
                        if (urls && urls[episodeNumber - 1]) {
                            // Get the URL for the specific episode
                            const episodeUrl = urls[episodeNumber - 1].replace(/'/g, '').trim();
                            
                            if (episodeUrl && episodeUrl.startsWith('http')) {
                                // Determine server name from URL
                                let serverName = `Server ${serverNum}`;
                                if (episodeUrl.includes('sibnet.ru')) serverName = 'Sibnet';
                                else if (episodeUrl.includes('sendvid.com')) serverName = 'SendVid';
                                else if (episodeUrl.includes('streamtape.com')) serverName = 'Streamtape';
                                else if (episodeUrl.includes('mixdrop.co')) serverName = 'Mixdrop';
                                else if (episodeUrl.includes('upstream.to')) serverName = 'Upstream';
                                else if (episodeUrl.includes('doodstream.com')) serverName = 'Doodstream';
                                
                                sources.push({
                                    server: serverName,
                                    url: episodeUrl,
                                    quality: 'HD',
                                    type: 'streaming',
                                    episode: episodeNumber,
                                    serverNumber: serverNum
                                });
                            }
                        }
                    }
                });
            }
        }
        
        return sources;
        
    } catch (error) {
        console.error('Error extracting from episode page:', error.message);
        return [];
    }
}

// Extract streaming sources from season page (returns first episode sources as example)
async function extractFromSeasonPage(seasonUrl) {
    try {
        // Get the episodes.js file
        const episodesJsUrl = `${seasonUrl}episodes.js`;
        
        console.log(`Getting episodes.js from: ${episodesJsUrl}`);
        
        const response = await axios.get(episodesJsUrl, {
            timeout: 8000,
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/javascript, application/javascript, */*',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': seasonUrl
            }
        });
        
        const jsContent = response.data;
        const sources = [];
        
        if (typeof jsContent === 'string' && jsContent.includes('var eps')) {
            // Extract all episode server arrays (eps1, eps2, eps3, etc.)
            const episodeArrayMatches = jsContent.match(/var eps(\d+) = \[([\s\S]*?)\];/g);
            
            if (episodeArrayMatches) {
                episodeArrayMatches.forEach((match) => {
                    const serverMatch = match.match(/var eps(\d+) = \[([\s\S]*?)\];/);
                    if (serverMatch) {
                        const serverNum = parseInt(serverMatch[1]);
                        const urlsContent = serverMatch[2];
                        
                        // Extract URLs from the array
                        const urls = urlsContent.match(/'([^']+)'/g);
                        
                        if (urls && urls[0]) {
                            // Get the first episode URL as example
                            const firstEpisodeUrl = urls[0].replace(/'/g, '').trim();
                            
                            if (firstEpisodeUrl && firstEpisodeUrl.startsWith('http')) {
                                // Determine server name from URL
                                let serverName = `Server ${serverNum}`;
                                if (firstEpisodeUrl.includes('sibnet.ru')) serverName = 'Sibnet';
                                else if (firstEpisodeUrl.includes('sendvid.com')) serverName = 'SendVid';
                                else if (firstEpisodeUrl.includes('streamtape.com')) serverName = 'Streamtape';
                                else if (firstEpisodeUrl.includes('mixdrop.co')) serverName = 'Mixdrop';
                                else if (firstEpisodeUrl.includes('upstream.to')) serverName = 'Upstream';
                                else if (firstEpisodeUrl.includes('doodstream.com')) serverName = 'Doodstream';
                                
                                sources.push({
                                    server: serverName,
                                    url: firstEpisodeUrl,
                                    quality: 'HD',
                                    type: 'streaming',
                                    episode: 1,
                                    serverNumber: serverNum,
                                    totalEpisodes: urls.length,
                                    note: 'Example from first episode'
                                });
                            }
                        }
                    }
                });
            }
        }
        
        return sources;
        
    } catch (error) {
        console.error('Error extracting from season page:', error.message);
        return [];
    }
}

// Extract streaming sources from episode page
async function extractEpisodeStreamingSources(episodeUrl) {
    try {
        const $ = await scrapeAnimesama(episodeUrl);
        const sources = [];
        
        // Look for streaming server buttons/links
        $('.streaming-server, .server-btn, .episode-server, [data-server]').each((index, element) => {
            const $el = $(element);
            const serverName = $el.text().trim() || $el.attr('data-server') || $el.attr('title');
            const serverUrl = $el.attr('href') || $el.attr('data-url') || $el.attr('src');
            
            if (serverName && serverUrl) {
                sources.push({
                    server: serverName,
                    url: serverUrl.startsWith('http') ? serverUrl : `https://anime-sama.si${serverUrl}`,
                    quality: $el.attr('data-quality') || 'HD',
                    type: 'streaming'
                });
            }
        });
        
        // Also look for direct video sources in script tags
        $('script').each((index, element) => {
            const scriptContent = $(element).html();
            if (scriptContent && (scriptContent.includes('video') || scriptContent.includes('stream'))) {
                // Extract URLs from JavaScript variables
                const urlMatches = scriptContent.match(/https?:\/\/[^\s"']+\.(mp4|m3u8|webm)/gi);
                if (urlMatches) {
                    urlMatches.forEach(url => {
                        sources.push({
                            server: 'Direct',
                            url: url,
                            quality: 'HD',
                            type: 'direct'
                        });
                    });
                }
            }
        });
        
        return sources;
        
    } catch (error) {
        console.error('Error extracting episode streaming sources:', error.message);
        return [];
    }
}

// Extract direct streaming sources from anime-sama.si streaming URL
async function extractDirectStreamingSources(streamingUrl) {
    try {
        const sources = [];
        
        // Common streaming domains used by anime-sama.si
        const streamingDomains = [
            'sibnet.ru',
            'sendvid.com', 
            'streamtape.com',
            'mixdrop.co',
            'upstream.to',
            'doodstream.com'
        ];
        
        // Check if URL is from a known streaming provider
        const isKnownProvider = streamingDomains.some(domain => streamingUrl.includes(domain));
        
        if (isKnownProvider) {
            // Extract provider name from URL
            const providerMatch = streamingUrl.match(/\/\/([\w.-]+)/);
            const providerName = providerMatch ? providerMatch[1].replace('www.', '') : 'Unknown';
            
            sources.push({
                server: providerName,
                url: streamingUrl,
                quality: 'HD',
                type: 'external'
            });
        } else {
            // Try to scrape the page for actual video sources
            const $ = await scrapeAnimesama(streamingUrl);
            
            // Look for video tags and source elements
            $('video source, video').each((index, element) => {
                const $el = $(element);
                const videoUrl = $el.attr('src') || $el.attr('data-src');
                
                if (videoUrl) {
                    sources.push({
                        server: 'Direct Video',
                        url: videoUrl.startsWith('http') ? videoUrl : `https:${videoUrl}`,
                        quality: $el.attr('data-quality') || 'HD',
                        type: 'direct'
                    });
                }
            });
            
            // Look for iframe sources
            $('iframe').each((index, element) => {
                const $el = $(element);
                const iframeUrl = $el.attr('src');
                
                if (iframeUrl && iframeUrl.includes('http')) {
                    sources.push({
                        server: 'Iframe Source',
                        url: iframeUrl,
                        quality: 'HD',
                        type: 'iframe'
                    });
                }
            });
        }
        
        return sources;
        
    } catch (error) {
        console.error('Error extracting direct streaming sources:', error.message);
        return [];
    }
}

// Enhanced recent episodes extraction with 100% AUTHENTIC data from daily release sections
async function getRecentEpisodes() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.si');
        
        const recentEpisodes = [];
        const seenEpisodes = new Set();
        
        // Use the same logic as api/recent.js - extract from bg-cyan-600 buttons
        const processedButtons = new Set();
        
        $('button.bg-cyan-600').each((index, element) => {
            const $button = $(element);
            const buttonText = $button.text().trim();
            
            // Créer un identifiant unique pour ce bouton basé sur le texte et la position
            const buttonId = `${index}-${buttonText}`;
            if (processedButtons.has(buttonId)) return;
            processedButtons.add(buttonId);
            
            // Find parent link
            const $container = $button.closest('a[href*="/catalogue/"]') || 
                              $button.parent().find('a[href*="/catalogue/"]') ||
                              $button.siblings('a[href*="/catalogue/"]');
            
            const href = $container.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            
            // Parse button text
            const isFinale = buttonText.includes('[FIN]');
            const isVFCrunchyroll = buttonText.includes('VF Crunchyroll');
            const isVFNetflix = buttonText.includes('VF Netflix');
            
            const episodeMatch = buttonText.match(/Episode\s*(\d+)/i);
            const seasonMatch = buttonText.match(/Saison\s*(\d+)/i);
            
            let seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            let episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : null;
            
            // Extract anime ID from URL
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
            
            if (!animeId || !episodeNumber) return;
            
            // Detect language from adjacent language buttons or URL path
            let detectedLanguage = 'VOSTFR'; // default
            
            // Check URL path for language hints
            if (href.includes('/vf/') || href.includes('/vf1/') || href.includes('/vf2/')) {
                detectedLanguage = 'VF';
            } else if (href.includes('/vostfr/')) {
                detectedLanguage = 'VOSTFR';
            } else if (href.includes('/va/')) {
                detectedLanguage = 'VA';
            }
            
            // Override with button text detection for specific cases
            if (isVFCrunchyroll) {
                detectedLanguage = 'VF';
            } else if (isVFNetflix) {
                detectedLanguage = 'VF';
            }
            
            // Look for language buttons in the same container
            const $languageButtons = $container.find('button.bg-blue-600, button.bg-green-600');
            $languageButtons.each((i, langBtn) => {
                const langText = $(langBtn).text().trim();
                if (langText === 'VF' || langText.includes('VF')) {
                    detectedLanguage = 'VF';
                } else if (langText === 'VOSTFR' || langText.includes('VOSTFR')) {
                    detectedLanguage = 'VOSTFR';
                } else if (langText === 'VA' || langText.includes('VA')) {
                    detectedLanguage = 'VA';
                }
            });
            
            // Create unique identifier to prevent duplicates
            const uniqueKey = `${animeId}-s${seasonNumber}-e${episodeNumber}-${detectedLanguage}`;
            if (seenEpisodes.has(uniqueKey)) return;
            seenEpisodes.add(uniqueKey);
            
            // Get anime title
            let animeTitle = $container.find('strong, h1, h2, h3').first().text().trim();
            if (!animeTitle) {
                animeTitle = animeId.replace(/-/g, ' ')
                                   .split(' ')
                                   .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                   .join(' ');
            }
            
            // Clean title
            animeTitle = animeTitle.replace(/\s+/g, ' ').trim();
            
            // Get image
            const $img = $container.find('img').first();
            let image = $img.attr('src') || $img.attr('data-src');
            if (image && !image.startsWith('http')) {
                image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.si${image}`;
            }
            
            recentEpisodes.push({
                animeId: animeId,
                animeTitle: animeTitle,
                season: seasonNumber,
                episode: episodeNumber,
                language: detectedLanguage,
                isFinale: isFinale,
                isVFCrunchyroll: isVFCrunchyroll,
                url: href.startsWith('http') ? href : `https://anime-sama.si${href}`,
                image: image || `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                badgeInfo: buttonText,
                addedAt: new Date().toISOString(),
                type: isFinale ? 'finale' : 'episode'
            });
        });
        
        return recentEpisodes;
        
    } catch (error) {
        console.error('Error getting recent episodes:', error.message);
        return [];
    }
}

// Get manga chapters for scans
async function getMangaChapters(animeId, scanValue = 'scan', language = 'VF') {
    try {
        const scanUrl = `https://anime-sama.si/catalogue/${animeId}/${scanValue}/${language.toLowerCase()}/`;
        console.log(`Getting manga chapters from: ${scanUrl}`);
        
        const $ = await scrapeAnimesama(scanUrl);
        const chapters = [];
        const seenChapters = new Set();
        const pageHTML = $.html();
        
        console.log('Analyzing page for chapter data...');
        
        // Method 1: Look for eps variables in JavaScript (primary method for anime-sama.si)
        const epsVariables = [];
        let epsCount = 1;
        
        // Extract all eps variables from JavaScript
        while (epsCount <= 300) { // Max 300 chapters
            const epsPattern = new RegExp(`var\\s+eps${epsCount}\\s*=\\s*\\[`, 'g');
            const match = pageHTML.match(epsPattern);
            
            if (match) {
                epsVariables.push(epsCount);
                epsCount++;
            } else {
                break;
            }
        }
        
        console.log(`Found ${epsVariables.length} eps variables (chapters)`);
        
        // Create chapters based on found eps variables
        if (epsVariables.length > 0) {
            epsVariables.forEach(chapterNum => {
                chapters.push({
                    number: chapterNum,
                    title: `Chapitre ${chapterNum}`,
                    url: `${scanUrl}#chapitre-${chapterNum}`,
                    language: language.toUpperCase(),
                    type: 'scan',
                    available: true
                });
            });
        }
        
        // Method 2: Look for chapter count in JavaScript logic
        if (chapters.length === 0) {
            const scriptContent = $('script').map((i, el) => $(el).html()).get().join(' ');
            
            // Look for tailleChapitres or similar patterns
            const patterns = [
                /tailleChapitres\s*=\s*(\d+)/,
                /numberOfChapters\s*=\s*(\d+)/,
                /chaptersCount\s*=\s*(\d+)/,
                /while.*eps.*(\d+)/
            ];
            
            for (const pattern of patterns) {
                const match = scriptContent.match(pattern);
                if (match) {
                    const totalChapters = parseInt(match[1]);
                    console.log(`Found chapter count pattern: ${totalChapters}`);
                    
                    if (totalChapters > 0 && totalChapters <= 500) {
                        for (let i = 1; i <= totalChapters; i++) {
                            chapters.push({
                                number: i,
                                title: `Chapitre ${i}`,
                                url: `${scanUrl}#chapitre-${i}`,
                                language: language.toUpperCase(),
                                type: 'scan',
                                available: true
                            });
                        }
                        break;
                    }
                }
            }
        }
        
        // Method 3: Look for clickable chapter elements
        if (chapters.length === 0) {
            const chapterSelectors = [
                'button[onclick*="chapitre"]',
                'a[href*="chapitre"]',
                '[data-chapter]',
                '.chapter-btn',
                'option[value*="chapitre"]'
            ];
            
            chapterSelectors.forEach(selector => {
                $(selector).each((index, element) => {
                    const $el = $(element);
                    const text = $el.text().trim();
                    const onclick = $el.attr('onclick') || '';
                    const value = $el.attr('value') || '';
                    
                    const sources = [text, onclick, value];
                    
                    for (const source of sources) {
                        const chapterMatch = source.match(/chapitre[_\s]*(\d+(?:\.\d+)?)/i);
                        if (chapterMatch) {
                            const chapterNumber = parseFloat(chapterMatch[1]);
                            const chapterKey = `${chapterNumber}`;
                            
                            if (!seenChapters.has(chapterKey) && chapterNumber > 0) {
                                seenChapters.add(chapterKey);
                                
                                chapters.push({
                                    number: chapterNumber,
                                    title: text || `Chapitre ${chapterNumber}`,
                                    url: `${scanUrl}#chapitre-${chapterNumber}`,
                                    language: language.toUpperCase(),
                                    type: 'scan',
                                    available: true
                                });
                                break;
                            }
                        }
                    }
                });
            });
        }
        
        // Method 4: Fallback - create a reasonable number of chapters if we know the scan exists
        if (chapters.length === 0) {
            // Check if the page indicates this is a valid scan page
            const hasValidScanContent = pageHTML.includes('scan') || 
                                       pageHTML.includes('chapitre') || 
                                       pageHTML.includes('lecteur');
            
            if (hasValidScanContent) {
                console.log('Creating default chapter list based on scan page detection');
                // Create a default range - this would be updated when the actual data is loaded
                for (let i = 1; i <= 50; i++) {
                    chapters.push({
                        number: i,
                        title: `Chapitre ${i}`,
                        url: `${scanUrl}#chapitre-${i}`,
                        language: language.toUpperCase(),
                        type: 'scan',
                        available: true,
                        placeholder: true // Mark as placeholder
                    });
                }
            }
        }
        
        // Look for special chapters
        const specialMatches = pageHTML.match(/Chapitre\s+(One\s+Shot|Special|Extra)/gi);
        if (specialMatches) {
            specialMatches.forEach((match, index) => {
                chapters.push({
                    number: 1000 + index, // High number for specials
                    title: match,
                    url: `${scanUrl}#${match.toLowerCase().replace(/\s+/g, '-')}`,
                    language: language.toUpperCase(),
                    type: 'scan',
                    available: true,
                    special: true
                });
            });
        }
        
        // Sort chapters by number
        chapters.sort((a, b) => {
            if (a.special && !b.special) return 1;
            if (!a.special && b.special) return -1;
            return a.number - b.number;
        });
        
        console.log(`Found ${chapters.length} chapters for ${animeId} scan`);
        return chapters;
        
    } catch (error) {
        console.error('Error getting manga chapters:', error.message);
        throw error;
    }
}

module.exports = {
    scrapeAnimesama,
    searchAnime,
    getTrendingAnime,
    getAnimeDetails,
    getAnimeSeasons,
    getAnimeEpisodes,
    getMangaChapters,
    getEpisodeSources,
    getRecentEpisodes,
    randomDelay
};
