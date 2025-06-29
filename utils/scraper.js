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

// Get trending anime from homepage using the real anime sections
async function getTrendingAnime() {
    const $ = await scrapeAnimesama('https://anime-sama.fr');
    
    const trending = [];
    const seenAnimes = new Set();
    
    // Extract anime from the homepage sections in the order they appear (most trending first)
    $('a[href*="/catalogue/"]').each((index, element) => {
        const $el = $(element);
        const link = $el.attr('href');
        
        // Skip general catalogue links, navigation elements, and non-anime links
        if (!link || 
            link === 'https://anime-sama.fr/catalogue' || 
            link.includes('/planning') ||
            link.includes('/aide') ||
            link.includes('/profil') ||
            link === 'https://anime-sama.fr/' ||
            link.split('/').length < 5) return;
        
        // Extract anime ID from URL
        const urlParts = link.split('/');
        const catalogueIndex = urlParts.indexOf('catalogue');
        if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
        
        let animeId = urlParts[catalogueIndex + 1];
        // Remove trailing slash if present
        if (animeId.endsWith('/')) {
            animeId = animeId.slice(0, -1);
        }
        
        // Skip if we already have this anime
        if (seenAnimes.has(animeId)) return;
        seenAnimes.add(animeId);
        
        // Extract title from element text or construct from ID
        let title = $el.text().trim() || $el.attr('title') || $el.find('img').attr('alt');
        
        // Clean up title (remove extra content like episode info, language tags)
        if (title) {
            title = title.replace(/\s+/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\t/g, ' ')
                        .replace(/\s*VF\s*/gi, '')
                        .replace(/\s*VOSTFR\s*/gi, '')
                        .replace(/\s*Saison\s*\d+.*$/gi, '')
                        .replace(/\s*Episode\s*\d+.*$/gi, '')
                        .replace(/\s*\[FIN\]\s*/gi, '')
                        .replace(/\s*Manga\s*FR.*$/gi, '')
                        .replace(/\s*Webtoon\s*FR.*$/gi, '')
                        .replace(/\s*Chapitre\s*\d+.*$/gi, '')
                        .trim();
        }
        
        // If no title or too short, construct from anime ID
        if (!title || title.length < 3) {
            title = animeId.replace(/-/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
        }
        
        // Extract image
        const image = $el.find('img').attr('src') || $el.find('img').attr('data-src');
        
        // Determine content type based on URL and title
        let type = 'anime';
        if (title.toLowerCase().includes('manga') || link.includes('manga')) {
            type = 'manga';
        } else if (title.toLowerCase().includes('webtoon')) {
            type = 'webtoon';
        }
        
        // Add to trending if valid (filter out navigation elements and short titles)
        const titleLower = title.toLowerCase();
        const skipTitles = ['menu', 'catalogue', 'planning', 'aide', 'profil', 'logo', 'banniere', 'actualisation', 'page aide'];
        const shouldSkip = skipTitles.some(skip => titleLower.includes(skip)) || 
                          title.length < 3 || 
                          titleLower === animeId.replace(/-/g, ' ');
        
        if (title && !shouldSkip) {
            trending.push({
                id: animeId,
                title: title,
                image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : null,
                url: `https://anime-sama.fr/catalogue/${animeId}`,
                type: type
            });
        }
        
        // Limit to 30 items for performance
        if (trending.length >= 30) return false;
    });
    
    // Sort by relevance (anime first, then by title length - shorter titles usually more popular)
    trending.sort((a, b) => {
        // Anime content first
        if (a.type === 'anime' && b.type !== 'anime') return -1;
        if (a.type !== 'anime' && b.type === 'anime') return 1;
        
        // Then by title length (shorter = more popular usually)
        return a.title.length - b.title.length;
    });
    
    return trending.slice(0, 20); // Return top 20
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
        
        // Extract genres from keywords - better filtering
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        const genres = keywords.split(',')
                              .map(g => g.trim())
                              .filter(g => g && 
                                     !g.toLowerCase().includes('anime-sama') && 
                                     !g.toLowerCase().includes('streaming') && 
                                     !g.toLowerCase().includes('vostfr') && 
                                     !g.toLowerCase().includes('vf') && 
                                     !g.toLowerCase().includes('scan') && 
                                     !g.toLowerCase().includes('sans pubs') &&
                                     g.length > 2)
                              .slice(0, 8); // More genres for better categorization
        
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

// Get seasons for an anime by analyzing homepage patterns
async function getAnimeSeasons(animeId) {
    try {
        // Scrape the anime's main page to get real seasons data
        const $ = await scrapeAnimesama(`https://anime-sama.fr/catalogue/${animeId}/`);
        
        const seasons = [];
        
        // Extract only from ANIME section, not MANGA section
        const fullHtml = $.html();
        const animeSection = fullHtml.split('<!-- ANIME -->')[1]?.split('<!-- MANGA -->')[0];
        
        if (!animeSection) {
            throw new Error('No anime section found on page');
        }
        
        // Extract panneauAnime calls from anime section only
        const panneauMatches = animeSection.match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/g);
        
        if (panneauMatches) {
            panneauMatches.forEach((match, index) => {
                const parts = match.match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/);
                if (parts && parts.length >= 3) {
                    const seasonName = parts[1];
                    const seasonUrl = parts[2];
                    
                    // Better season number extraction
                    let seasonNumber = index + 1;
                    let seasonType = 'Saison';
                    
                    // Analyze season name and URL for type and number
                    if (seasonName.toLowerCase().includes('film')) {
                        seasonType = 'Film';
                        seasonNumber = 990 + index; // Group films together
                    } else if (seasonName.toLowerCase().includes('oav') || seasonName.toLowerCase().includes('ova')) {
                        seasonType = 'OAV';
                        seasonNumber = 980 + index; // Group OAVs together
                    } else if (seasonName.toLowerCase().includes('épisode') && seasonName.toLowerCase().includes('train')) {
                        seasonType = 'Spécial';
                        seasonNumber = 970 + index; // Special episodes
                    } else if (seasonName.toLowerCase().includes('hors série') || seasonName.toLowerCase().includes('hs')) {
                        seasonType = 'Hors-Série';
                        seasonNumber = 960 + index;
                    } else {
                        // Regular season - extract number
                        const seasonMatch = seasonName.match(/saison\s*(\d+)|(\d+)/i);
                        if (seasonMatch) {
                            seasonNumber = parseInt(seasonMatch[1] || seasonMatch[2]);
                        }
                    }
                    
                    // Determine available languages
                    const languages = [];
                    if (seasonUrl.includes('/vf')) languages.push('VF');
                    if (seasonUrl.includes('/vostfr')) languages.push('VOSTFR');
                    if (languages.length === 0) languages.push('VOSTFR'); // default
                    
                    // Extract season folder name for value
                    const seasonValue = seasonUrl.split('/')[0];
                    
                    seasons.push({
                        number: seasonNumber,
                        name: seasonName,
                        value: seasonValue, // saison1, film, etc.
                        type: seasonType,
                        url: seasonUrl,
                        fullUrl: `https://anime-sama.fr/catalogue/${animeId}/${seasonUrl}`,
                        languages: languages,
                        available: true
                    });
                }
            });
        }
        
        // Sort seasons: regular seasons first, then specials, then films
        seasons.sort((a, b) => {
            // Regular seasons (1-99) come first
            if (a.number < 100 && b.number < 100) return a.number - b.number;
            if (a.number < 100) return -1;
            if (b.number < 100) return 1;
            
            // For special content (>100), sort by original order
            return a.number - b.number;
        });
        
        // Re-index for API consistency while keeping original numbering for type detection
        seasons.forEach((season, index) => {
            season.apiIndex = index + 1;
        });
        
        return seasons;
        
    } catch (error) {
        console.error('Error getting anime seasons:', error.message);
        return [{
            number: 1,
            name: "Saison 1",
            url: "saison1/vostfr", 
            languages: ['VOSTFR'],
            available: true
        }];
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
                            
                            if (serverUrl.includes('sibnet.ru')) {
                                serverName = 'Sibnet';
                            } else if (serverUrl.includes('sendvid.com')) {
                                serverName = 'SendVid';
                            } else if (serverUrl.includes('Smoothpre.com')) {
                                serverName = 'SmoothPre';
                            } else if (serverUrl.includes('oneupload.to')) {
                                serverName = 'OneUpload';
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

// Get episode streaming sources
async function getEpisodeSources(episodeId) {
    const episodeUrl = `https://anime-sama.fr/episode/${episodeId}`;
    const $ = await scrapeAnimesama(episodeUrl);
    
    const sources = [];
    
    // Look for video sources and streaming servers
    $('.server-option, .video-server, .player-option').each((index, element) => {
        const $el = $(element);
        const serverName = $el.text().trim() || $el.attr('data-server');
        const serverUrl = $el.attr('href') || $el.attr('data-url');
        
        if (serverName && serverUrl) {
            sources.push({
                server: serverName,
                url: serverUrl.startsWith('http') ? serverUrl : `https://anime-sama.fr${serverUrl}`,
                quality: $el.attr('data-quality') || 'HD'
            });
        }
    });
    
    return sources;
}

module.exports = {
    scrapeAnimesama,
    searchAnime,
    getTrendingAnime,
    getAnimeDetails,
    getAnimeSeasons,
    getAnimeEpisodes,
    getEpisodeSources,
    randomDelay
};
