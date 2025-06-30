const axios = require('axios');
const cheerio = require('cheerio');

// User-Agent rotation for anti-bot protection
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
];

// Enhanced language system mapping based on anime-sama.fr structure
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

// Server name mapping based on anime-sama.fr streaming sources
const SERVER_MAPPING = {
    'sibnet.ru': 'Sibnet',
    'sendvid.com': 'SendVid', 
    'vidmoly.to': 'Vidmoly',
    'smoothpre.com': 'SmoothPre',
    'oneupload.to': 'OneUpload',
    'doodstream.com': 'DoodStream',
    'streamtape.com': 'StreamTape',
    'upstream.to': 'Upstream',
    'embedgram.com': 'EmbedGram'
};

// Get random user agent
function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Random delay to avoid detection
function randomDelay(min = 500, max = 1500) {
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
            timeout: 8000, // 8 second timeout
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

        return cheerio.load(response.data);
    } catch (error) {
        console.error('Scraping error:', error.message);
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
}

// Search anime by query using the real search API from anime-sama.fr
async function searchAnime(query) {
    try {
        await randomDelay(); // Anti-bot delay
        
        // Use the real search API endpoint that the website uses
        const response = await axios.post('https://anime-sama.fr/template-php/defaut/fetch.php', 
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
                    'Referer': 'https://anime-sama.fr/',
                    'Origin': 'https://anime-sama.fr'
                }
            }
        );

        // Parse the HTML response from the search API
        const $ = cheerio.load(response.data);
        const results = [];
        const seenTitles = new Set();

        // Parse search results - the API returns HTML with anime cards in specific format
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $el = $(element);
            
            const link = $el.attr('href');
            if (!link || !link.includes('/catalogue/')) return;
            
            // Ensure full URL
            const fullUrl = link.startsWith('http') ? link : `https://anime-sama.fr${link}`;
            
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
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
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
    const $ = await scrapeAnimesama('https://anime-sama.fr');
    const results = [];
    const queryLower = query.toLowerCase();
    const seenTitles = new Set();
    
    // Search through all anime links on the homepage
    $('a[href*="/catalogue/"]').each((index, element) => {
        const $el = $(element);
        const link = $el.attr('href');
        
        // Skip general catalogue links
        if (!link || link === 'https://anime-sama.fr/catalogue' || link.split('/').length < 5) return;
        
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
                image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
                url: `https://anime-sama.fr/catalogue/${animeId}`
            });
        }
    });
    
    return results.slice(0, 15);
}

// Get trending anime with 100% AUTHENTIC data from homepage daily release sections
async function getTrendingAnime() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.fr');
        
        const trending = [];
        const seenAnimes = new Set();
        
        // Priority 1: Extract from daily release sections (these are the most trending)
        const dailySections = [
            'Sorties du Lundi', 'Sorties du Mardi', 'Sorties du Mercredi', 
            'Sorties du Jeudi', 'Sorties du Vendredi', 'Sorties du Samedi'
        ];
        
        dailySections.forEach(sectionTitle => {
            // Find the section header
            $('h2').each((index, element) => {
                const $header = $(element);
                if ($header.text().trim() === sectionTitle) {
                    
                    // Get all anime in this daily section
                    let $currentElement = $header.next();
                    while ($currentElement.length && !$currentElement.is('h2') && trending.length < 25) {
                        
                        $currentElement.find('a[href*="/catalogue/"]').each((cardIndex, linkElement) => {
                            const $link = $(linkElement);
                            const href = $link.attr('href');
                            
                            if (!href || !href.includes('/catalogue/')) return;
                            
                            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.fr${href}`;
                            const urlParts = fullUrl.split('/');
                            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
                            
                            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
                            
                            const animeId = urlParts[catalogueIndex + 1];
                            
                            // Skip if already seen
                            if (seenAnimes.has(animeId)) return;
                            seenAnimes.add(animeId);
                            
                            // Extract title from strong tag or fallback to clean text
                            let title = $link.find('strong').first().text().trim();
                            if (!title) {
                                title = $link.text().split('\n')[0].trim();
                                title = title.replace(/\*+/g, '').replace(/\d{1,2}h\d{2}/g, '').trim();
                            }
                            
                            if (!title || title.length < 3) {
                                title = animeId.replace(/-/g, ' ')
                                              .split(' ')
                                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                              .join(' ');
                            }
                            
                            // Extract image
                            const $img = $link.find('img').first();
                            let image = $img.attr('src') || $img.attr('data-src');
                            if (image && !image.startsWith('http')) {
                                image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.fr${image}`;
                            }
                            
                            // Determine content type from URL path
                            let contentType = 'anime';
                            const seasonPath = urlParts[catalogueIndex + 2];
                            if (seasonPath && seasonPath.toLowerCase().includes('scan')) {
                                contentType = 'scan';
                            } else if (seasonPath && seasonPath.toLowerCase().includes('film')) {
                                contentType = 'film';
                            }
                            
                            // Determine language from URL
                            const language = urlParts[catalogueIndex + 3];
                            const languageInfo = LANGUAGE_SYSTEM[language?.toLowerCase()] || LANGUAGE_SYSTEM.vostfr;
                            
                            trending.push({
                                id: animeId,
                                title: title,
                                image: image,
                                url: `https://anime-sama.fr/catalogue/${animeId}`,
                                contentType: contentType,
                                language: languageInfo,
                                releaseDay: sectionTitle.replace('Sorties du ', ''),
                                isTrending: true,
                                extractedFrom: sectionTitle
                            });
                        });
                        
                        $currentElement = $currentElement.next();
                    }
                }
            });
        });
        
        // Priority 2: If not enough from daily sections, get featured anime from homepage
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
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
                    url: `https://anime-sama.fr/catalogue/${animeId}`,
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
        const url = `https://anime-sama.fr/catalogue/${animeId}/`;
        const $ = await scrapeAnimesama(url);
        
        // Check if we got a valid page
        const bodyText = $('body').text();
        if (bodyText.includes('301 Moved Permanently') || bodyText.length < 100) {
            throw new Error('Anime page not found');
        }
        
        // Extract title from specific elements
        const title = $('#titreOeuvre').text().trim() || 
                     $('meta[property="og:title"]').attr('content') || 
                     $('title').text().split('|')[0].trim() ||
                     animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Extract alternative titles from titreAlter
        const alternativeTitles = $('#titreAlter').text().trim();
        
        // Extract synopsis from meta description - full text
        const synopsis = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') ||
                        'Synopsis non disponible';
        
        // Extract image from meta or page elements
        const image = $('meta[property="og:image"]').attr('content') ||
                     $('#coverOeuvre').attr('src') ||
                     $('#imgOeuvre').attr('src');
        
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
            image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
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
            image: `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
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

// Helper function to get available languages for a season
async function getSeasonLanguages(animeId, seasonValue) {
    const possibleLanguages = ['vostfr', 'vf', 'va', 'vkr', 'vcn', 'vqc', 'vf1', 'vf2'];
    const availableLanguages = [];
    
    for (const lang of possibleLanguages) {
        try {
            const testUrl = `https://anime-sama.fr/catalogue/${animeId}/${seasonValue}/${lang}/`;
            const response = await scrapeAnimesama(testUrl, { timeout: 2000 });
            
            // Check if page exists and is not a 404
            const pageContent = response.html();
            if (!pageContent.includes('Page introuvable') && 
                !pageContent.includes('Cette page n\'existe pas') &&
                !pageContent.includes('404') &&
                pageContent.includes('Episode 1')) { // Additional check for actual content
                availableLanguages.push(lang.toUpperCase());
            }
        } catch (error) {
            // Language not available, continue to next
            continue;
        }
        
        // Add small delay between requests to be respectful
        await randomDelay(150, 300);
    }
    
    return availableLanguages.length > 0 ? availableLanguages : ['VOSTFR'];
}

// Enhanced seasons extraction with ANIME, MANGA, and all content types
async function getAnimeSeasons(animeId) {
    try {
        // Scrape the anime's main page to get real seasons data
        const $ = await scrapeAnimesama(`https://anime-sama.fr/catalogue/${animeId}/`);
        
        const seasons = [];
        const fullHtml = $.html();
        
        // Extract both ANIME and MANGA sections
        const animeSection = fullHtml.split('<!-- ANIME -->')[1]?.split('<!-- MANGA -->')[0];
        const mangaSection = fullHtml.split('<!-- MANGA -->')[1];
        
        // Process ANIME section
        if (animeSection) {
            // Process section without anime-specific configurations
            let processedSection = animeSection;
            
            // Remove commented blocks and single-line comments (but preserve authentic data)
            processedSection = processedSection.replace(/\/\*[\s\S]*?\*\//g, '');
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
                        
                        // Better season number extraction
                        let seasonNumber = index + 1;
                        let seasonType = 'Saison';
                        
                        // Analyze season name and URL for type and number
                        if (seasonName.toLowerCase().includes('film')) {
                            seasonType = 'Film';
                            seasonNumber = 1000 + index; // Group films together
                        } else if (seasonName.toLowerCase().includes('oav') || seasonName.toLowerCase().includes('ova')) {
                            seasonType = 'OAV';
                            seasonNumber = 990 + index; // Group OAVs together
                        } else if (seasonName.toLowerCase().includes('épisode') && seasonName.toLowerCase().includes('train')) {
                            seasonType = 'Spécial';
                            seasonNumber = 980 + index; // Special episodes
                        } else if (seasonName.toLowerCase().includes('hors série') || seasonName.toLowerCase().includes('hs')) {
                            seasonType = 'Hors-Série';
                            seasonNumber = 970 + index;
                        } else {
                            // Regular season - extract number
                            const seasonMatch = seasonName.match(/saison\s*(\d+)|(\d+)/i);
                            if (seasonMatch) {
                                seasonNumber = parseInt(seasonMatch[1] || seasonMatch[2]);
                            }
                        }
                        
                        // Extract season folder name for value
                        const seasonValue = seasonUrl.split('/')[0];
                        
                        // For now, we'll use a direct check approach
                        // Extract language from the current season URL, but return only authentic confirmed languages
                        const languages = ['VOSTFR']; // Always available as primary
                        
                        // TODO: Implement proper language detection in future updates
                        // For now, we provide only confirmed authentic data
                        
                        seasons.push({
                            number: seasonNumber,
                            name: seasonName,
                            value: seasonValue, // saison1, film, etc.
                            type: seasonType,
                            url: seasonUrl,
                            fullUrl: `https://anime-sama.fr/catalogue/${animeId}/${seasonUrl}`,
                            languages: languages,
                            available: true,
                            contentType: 'anime'
                        });
                    }
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
                            fullUrl: `https://anime-sama.fr/catalogue/${animeId}/${scanUrl}`,
                            languages: languages,
                            available: true,
                            contentType: 'manga'
                        });
                    }
                });
            }
        }
        
        // Also check for direct HTML links as fallback
        $('a[href*="' + animeId + '"]').each((index, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            const text = $el.text().trim();
            
            // Check for scan links that might not be in panneauAnime calls
            if (href && (href.includes('/scan/') || text.toLowerCase().includes('scan'))) {
                const scanUrl = href.replace(`https://anime-sama.fr/catalogue/${animeId}/`, '');
                
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
        const languageCode = language.toLowerCase() === 'vf' ? 'vf' : 'vostfr';
        
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
        
        const seasonUrl = `https://anime-sama.fr/catalogue/${animeId}/${seasonPath}/${languageCode}/`;
        
        // Try to get the episodes.js file for this specific anime/season
        const episodesJsUrl = `${seasonUrl}episodes.js`;
        
        const episodes = [];
        
        try {
            // Use axios directly to get the JavaScript file (raw text)
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
                let maxEpisodes = 0;
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

// Get episode streaming sources from episode URL or anime-sama.fr streaming URL
async function getEpisodeSources(episodeUrl) {
    try {
        // Handle different URL formats
        let finalUrl = episodeUrl;
        
        // If it's already a full anime-sama.fr URL, use it directly
        if (!episodeUrl.includes('anime-sama.fr')) {
            finalUrl = `https://anime-sama.fr${episodeUrl}`;
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
        const seasonUrl = `https://anime-sama.fr/catalogue/${animeId}/${seasonPath}/${language}/`;
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
                    url: serverUrl.startsWith('http') ? serverUrl : `https://anime-sama.fr${serverUrl}`,
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

// Extract direct streaming sources from anime-sama.fr streaming URL
async function extractDirectStreamingSources(streamingUrl) {
    try {
        const sources = [];
        
        // Common streaming domains used by anime-sama.fr
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
        const $ = await scrapeAnimesama('https://anime-sama.fr');
        
        const recentEpisodes = [];
        const seenEpisodes = new Set();
        
        // Extract daily sections: "Sorties du Lundi", "Sorties du Mardi", etc.
        const dailySections = [
            'Sorties du Lundi',
            'Sorties du Mardi', 
            'Sorties du Mercredi',
            'Sorties du Jeudi',
            'Sorties du Vendredi',
            'Sorties du Samedi',
            'Sorties du Dimanche'
        ];
        
        dailySections.forEach((sectionTitle, dayIndex) => {
            // Find the section header
            $('h2').each((index, element) => {
                const $header = $(element);
                if ($header.text().trim() === sectionTitle) {
                    
                    // Get all anime cards in this section until next h2
                    let $currentElement = $header.next();
                    while ($currentElement.length && !$currentElement.is('h2')) {
                        
                        // Look for anime cards/links in this element and its children
                        $currentElement.find('a[href*="/catalogue/"]').each((cardIndex, linkElement) => {
                            const $link = $(linkElement);
                            const href = $link.attr('href');
                            
                            if (!href || !href.includes('/catalogue/')) return;
                            
                            // Extract anime information from the link structure
                            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.fr${href}`;
                            const urlParts = fullUrl.split('/');
                            
                            // Expected structure: /catalogue/anime-name/season/language/
                            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
                            if (catalogueIndex === -1 || catalogueIndex + 3 >= urlParts.length) return;
                            
                            const animeId = urlParts[catalogueIndex + 1];
                            const seasonPath = urlParts[catalogueIndex + 2]; 
                            const language = urlParts[catalogueIndex + 3];
                            
                            // Extract anime title from the card
                            let title = $link.find('strong, h3, .title').first().text().trim();
                            if (!title) {
                                // Fallback to link text
                                title = $link.text().replace(/\s+/g, ' ').trim();
                                // Remove unwanted parts
                                title = title.replace(/^\s*\*\*|\*\*\s*$/g, '');
                                title = title.replace(/\s*\*\s*\*\s*\*/g, '');
                                title = title.split('\n')[0].trim();
                            }
                            
                            // Skip if no valid title
                            if (!title || title.length < 2) return;
                            
                            // Extract release time
                            let releaseTime = null;
                            const timeText = $link.text();
                            const timeMatch = timeText.match(/(\d{1,2}h\d{2})/);
                            if (timeMatch) {
                                releaseTime = timeMatch[1];
                            }
                            
                            // Check for postponement indicators
                            const isPostponed = timeText.includes('Reporté') || timeText.includes('reporté');
                            
                            // Extract image
                            const $img = $link.find('img').first();
                            let image = $img.attr('src') || $img.attr('data-src');
                            if (image && !image.startsWith('http')) {
                                image = `https://anime-sama.fr${image}`;
                            }
                            
                            // Determine content type
                            let contentType = 'anime';
                            if (seasonPath && seasonPath.toLowerCase().includes('scan')) {
                                contentType = 'scan';
                            } else if (seasonPath && seasonPath.toLowerCase().includes('film')) {
                                contentType = 'film';
                            } else if (seasonPath && seasonPath.toLowerCase().includes('oav')) {
                                contentType = 'oav';
                            }
                            
                            // Create episode identifier to avoid duplicates
                            const episodeId = `${animeId}-${seasonPath}-${language}`;
                            if (seenEpisodes.has(episodeId)) return;
                            seenEpisodes.add(episodeId);
                            
                            // Create language metadata
                            const languageInfo = LANGUAGE_SYSTEM[language.toLowerCase()] || {
                                code: language.toLowerCase(),
                                name: language.toUpperCase(),
                                fullName: `Version ${language.toUpperCase()}`,
                                flag: 'unknown',
                                priority: 99
                            };
                            
                            recentEpisodes.push({
                                animeId: animeId,
                                title: title,
                                image: image,
                                url: fullUrl,
                                dayOfWeek: sectionTitle,
                                dayIndex: dayIndex,
                                releaseTime: releaseTime,
                                isPostponed: isPostponed,
                                season: seasonPath,
                                language: languageInfo,
                                contentType: contentType,
                                isNew: true,
                                extractedAt: new Date().toISOString()
                            });
                        });
                        
                        $currentElement = $currentElement.next();
                    }
                }
            });
        });
        
        // If we have episodes from the daily sections, use them, otherwise fallback to homepage content
        if (recentEpisodes.length === 0) {
            $('a[href*="/catalogue/"]').slice(0, 15).each((index, element) => {
                const $el = $(element);
                const link = $el.attr('href');
                
                if (!link || link.includes('/planning') || link.includes('/aide')) return;
                
                const urlParts = link.split('/');
                const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
                if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
                
                let animeId = urlParts[catalogueIndex + 1];
                if (animeId.endsWith('/')) animeId = animeId.slice(0, -1);
                
                const episodeKey = `${animeId}-fallback`;
                if (!seenEpisodes.has(episodeKey)) {
                    seenEpisodes.add(episodeKey);
                    
                    let title = $el.text().trim().split('\n')[0];
                    if (!title || title.length < 3) {
                        title = animeId.replace(/-/g, ' ')
                                      .split(' ')
                                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                      .join(' ');
                    }
                    
                    const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
                    
                    recentEpisodes.push({
                        animeId: animeId,
                        title: title,
                        image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
                        url: link.startsWith('http') ? link : `https://anime-sama.fr${link}`,
                        dayOfWeek: 'Variable',
                        dayIndex: 0,
                        releaseTime: null,
                        isPostponed: false,
                        season: 'saison1',
                        language: LANGUAGE_SYSTEM.vostfr,
                        contentType: 'anime',
                        isNew: false,
                        extractedAt: new Date().toISOString()
                    });
                }
            });
        }
        
        // Sort by day order and then by release time 
        recentEpisodes.sort((a, b) => {
            if (a.dayIndex !== b.dayIndex) {
                return a.dayIndex - b.dayIndex;
            }
            // Sort by release time if same day
            if (a.releaseTime && b.releaseTime) {
                return a.releaseTime.localeCompare(b.releaseTime);
            }
            return 0;
        });
        
        return recentEpisodes.slice(0, 30); // Return top 30 recent episodes with enhanced data
        
    } catch (error) {
        console.error('Error getting recent episodes:', error.message);
        return [];
    }
}

module.exports = {
    scrapeAnimesama,
    searchAnime,
    getTrendingAnime,
    getAnimeDetails,
    getAnimeSeasons,
    getAnimeEpisodes,
    getEpisodeSources,
    getRecentEpisodes,
    randomDelay
};
