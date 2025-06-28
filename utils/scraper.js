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
        // First try to get basic info from homepage/search results
        const basicInfo = await getBasicAnimeInfo(animeId);
        
        // Try different URL patterns for anime pages
        const possibleUrls = [
            `https://anime-sama.fr/catalogue/${animeId}`,
            `https://anime-sama.fr/catalogue/${animeId}/`,
            `https://anime-sama.fr/${animeId}`,
            `https://anime-sama.fr/anime/${animeId}`
        ];
        
        for (const url of possibleUrls) {
            try {
                const $ = await scrapeAnimesama(url);
                
                // Check if we got a valid page (not a redirect)
                const bodyText = $('body').text();
                if (bodyText.includes('301 Moved Permanently') || bodyText.length < 100) {
                    continue;
                }
                
                // Extract detailed information
                const title = $('.anime-title, .title, h1, .main-title').first().text().trim() || basicInfo.title;
                const synopsis = $('.synopsis, .description, .anime-synopsis, .summary, .plot').first().text().trim();
                const image = $('.anime-image img, .poster img, .cover img, .main-image img').attr('src') || 
                             $('.anime-image img, .poster img, .cover img, .main-image img').attr('data-src') ||
                             basicInfo.image;
                
                // Extract genres
                const genres = [];
                $('.genre, .genres span, .genre-tag, .tag, .category').each((index, element) => {
                    const genre = $(element).text().trim();
                    if (genre && genre.length > 1) genres.push(genre);
                });
                
                // Extract other metadata
                const status = $('.status, .anime-status, .state').text().trim();
                const year = $('.year, .anime-year, .release-year, .date').text().trim();
                const studio = $('.studio, .anime-studio, .producer').text().trim();
                const type = $('.type, .content-type').text().trim();
                const episodes = $('.episodes, .episode-count').text().trim();
                
                return {
                    id: animeId,
                    title: title || basicInfo.title,
                    synopsis: synopsis || 'Synopsis non disponible',
                    image: image ? (image.startsWith('http') ? image : `https://anime-sama.fr${image}`) : basicInfo.image,
                    genres: genres.length > 0 ? genres : ['Non spécifié'],
                    status: status || 'Inconnu',
                    year: year || 'Inconnu',
                    studio: studio || 'Inconnu',
                    type: type || 'Anime',
                    episodes: episodes || 'Inconnu',
                    url: `https://anime-sama.fr/catalogue/${animeId}`
                };
                
            } catch (error) {
                console.log(`Failed to get details from ${url}:`, error.message);
                continue;
            }
        }
        
        // If no detailed page found, return basic info with constructed details
        return {
            id: animeId,
            title: basicInfo.title || animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            synopsis: 'Synopsis non disponible pour le moment',
            image: basicInfo.image,
            genres: ['Non spécifié'],
            status: 'Disponible',
            year: 'Inconnu',
            studio: 'Inconnu',
            type: basicInfo.type || 'Anime',
            episodes: 'Multiple',
            url: `https://anime-sama.fr/catalogue/${animeId}`
        };
        
    } catch (error) {
        console.error('Error getting anime details:', error.message);
        
        // Return minimal info in case of complete failure
        return {
            id: animeId,
            title: animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            synopsis: 'Informations non disponibles',
            image: null,
            genres: ['Non spécifié'],
            status: 'Inconnu',
            year: 'Inconnu',
            studio: 'Inconnu',
            type: 'Anime',
            episodes: 'Inconnu',
            url: `https://anime-sama.fr/catalogue/${animeId}`
        };
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
        // Use the homepage search to find available seasons
        const $ = await scrapeAnimesama('https://anime-sama.fr');
        
        const seasons = new Map();
        
        // Find all links that contain the anime ID and extract seasons
        $(`a[href*="${animeId}/"], a[href*="${animeId}/saison"]`).each((index, element) => {
            const $el = $(element);
            const link = $el.attr('href');
            
            if (!link) return;
            
            // Extract season number from URL pattern like /catalogue/anime-id/saison2/
            const seasonMatch = link.match(/\/saison(\d+)\//);
            if (seasonMatch) {
                const seasonNum = parseInt(seasonMatch[1]);
                const seasonText = $el.text().trim();
                
                // Clean up season text
                let seasonName = seasonText.replace(/\s+/g, ' ')
                                          .replace(/\n/g, ' ')
                                          .replace(/\t/g, ' ')
                                          .replace(/\s*VF\s*/gi, '')
                                          .replace(/\s*VOSTFR\s*/gi, '')
                                          .replace(/\s*Episode\s*\d+.*$/gi, '')
                                          .replace(/\s*\[FIN\]\s*/gi, '')
                                          .trim();
                
                if (!seasonName || seasonName.length < 3) {
                    seasonName = `Saison ${seasonNum}`;
                }
                
                // Check if this season has both VF and VOSTFR
                const languages = [];
                if (link.includes('/vf/')) languages.push('VF');
                if (link.includes('/vostfr/')) languages.push('VOSTFR');
                
                const seasonKey = `season_${seasonNum}`;
                if (!seasons.has(seasonKey)) {
                    seasons.set(seasonKey, {
                        number: seasonNum,
                        name: seasonName,
                        languages: languages,
                        available: true
                    });
                } else {
                    // Merge languages
                    const existing = seasons.get(seasonKey);
                    existing.languages = [...new Set([...existing.languages, ...languages])];
                }
            }
        });
        
        // Convert Map to Array and sort by season number
        const seasonsArray = Array.from(seasons.values()).sort((a, b) => a.number - b.number);
        
        // If no seasons found, try to infer from basic info
        if (seasonsArray.length === 0) {
            // Check if we can find any reference to this anime
            const basicInfo = await getBasicAnimeInfo(animeId);
            if (basicInfo) {
                seasonsArray.push({
                    number: 1,
                    name: "Saison 1",
                    languages: ['VOSTFR'],
                    available: true
                });
            }
        }
        
        return seasonsArray;
        
    } catch (error) {
        console.error('Error getting anime seasons:', error.message);
        
        // Return default season 1 in case of error
        return [{
            number: 1,
            name: "Saison 1", 
            languages: ['VOSTFR'],
            available: true
        }];
    }
}

// Get episodes for an anime season by analyzing the real episode URLs
async function getAnimeEpisodes(animeId, season = 1, language = 'VOSTFR') {
    try {
        // First, try to access the specific season/language page
        const languageCode = language.toLowerCase() === 'vf' ? 'vf' : 'vostfr';
        const seasonUrl = `https://anime-sama.fr/catalogue/${animeId}/saison${season}/${languageCode}/`;
        
        let $ = null;
        
        try {
            $ = await scrapeAnimesama(seasonUrl);
            
            // Check if we got redirected or blocked
            const bodyText = $('body').text();
            if (bodyText.includes('301 Moved Permanently') || bodyText.length < 100) {
                throw new Error('Page not accessible');
            }
            
            // Try to get the episodes.js file for this specific anime/season
            const episodesJsUrl = `${seasonUrl}episodes.js`;
            try {
                const episodesJsResponse = await scrapeAnimesama(episodesJsUrl);
                
                // Parse the JavaScript file to extract episode data
                const jsContent = episodesJsResponse.html ? episodesJsResponse.html() : episodesJsResponse;
                
                if (typeof jsContent === 'string' && jsContent.includes('var eps')) {
                    // Extract episode arrays from the JavaScript
                    const episodeServers = [];
                    
                    // Look for different episode servers (eps1, eps2, etc.)
                    const episodeArrayMatches = jsContent.match(/var eps(\d+) = \[([\s\S]*?)\];/g);
                    
                    if (episodeArrayMatches) {
                        episodeArrayMatches.forEach((match, serverIndex) => {
                            const serverNum = match.match(/var eps(\d+)/)[1];
                            const urlsMatch = match.match(/\[([\s\S]*?)\]/);
                            
                            if (urlsMatch) {
                                const urlsContent = urlsMatch[1];
                                const urls = urlsContent.match(/'([^']+)'/g);
                                
                                if (urls) {
                                    urls.forEach((url, episodeIndex) => {
                                        const cleanUrl = url.replace(/'/g, '');
                                        const episodeNum = episodeIndex + 1;
                                        
                                        if (!episodes.find(ep => ep.number === episodeNum)) {
                                            episodes.push({
                                                number: episodeNum,
                                                title: `Épisode ${episodeNum}`,
                                                url: seasonUrl,
                                                streamingSources: episodes.find(ep => ep.number === episodeNum)?.streamingSources || [],
                                                language: language.toUpperCase(),
                                                season: parseInt(season),
                                                available: true
                                            });
                                        }
                                        
                                        // Add streaming source to existing episode
                                        const existingEpisode = episodes.find(ep => ep.number === episodeNum);
                                        if (existingEpisode) {
                                            if (!existingEpisode.streamingSources) {
                                                existingEpisode.streamingSources = [];
                                            }
                                            existingEpisode.streamingSources.push({
                                                server: `Server ${serverNum}`,
                                                url: cleanUrl,
                                                quality: 'HD'
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (jsError) {
                console.log('Could not fetch episodes.js:', jsError.message);
            }
            
        } catch (error) {
            // If direct access fails, try to get episode links from homepage
            $ = await scrapeAnimesama('https://anime-sama.fr');
        }
        
        const episodes = [];
        const seenEpisodes = new Set();
        
        // Look for episode links in the page
        const episodePattern = new RegExp(`${animeId}/saison${season}/${languageCode}/episode-(\\d+)`, 'i');
        const episodeAlternatePattern = new RegExp(`${animeId}/saison${season}/${languageCode}/[^/]*?(\\d+)`, 'i');
        
        $('a[href*="episode"], a[href*="eps"], [onclick*="episode"], [onclick*="eps"]').each((index, element) => {
            const $el = $(element);
            const link = $el.attr('href') || $el.attr('onclick');
            
            if (!link || !link.includes(animeId) || !link.includes(`saison${season}`) || !link.includes(languageCode)) {
                return;
            }
            
            // Extract episode number from URL
            let episodeMatch = link.match(episodePattern);
            if (!episodeMatch) {
                episodeMatch = link.match(episodeAlternatePattern);
            }
            
            if (episodeMatch) {
                const episodeNum = parseInt(episodeMatch[1]);
                
                if (seenEpisodes.has(episodeNum)) return;
                seenEpisodes.add(episodeNum);
                
                const episodeTitle = $el.text().trim() || `Épisode ${episodeNum}`;
                const cleanTitle = episodeTitle.replace(/\s+/g, ' ')
                                             .replace(/\n/g, ' ')
                                             .replace(/\t/g, ' ')
                                             .replace(/\s*VF\s*/gi, '')
                                             .replace(/\s*VOSTFR\s*/gi, '')
                                             .replace(/\s*\[FIN\]\s*/gi, '')
                                             .trim();
                
                episodes.push({
                    number: episodeNum,
                    title: cleanTitle || `Épisode ${episodeNum}`,
                    url: link.startsWith('http') ? link : `https://anime-sama.fr${link}`,
                    language: language.toUpperCase(),
                    season: parseInt(season),
                    available: true
                });
            }
        });
        
        // Sort episodes by number
        episodes.sort((a, b) => a.number - b.number);
        
        // If no episodes found, generate a basic list
        if (episodes.length === 0) {
            // Try to estimate number of episodes (common ranges)
            const commonEpisodeCounts = [12, 13, 24, 25, 26, 50, 100];
            const defaultCount = 12;
            
            for (let i = 1; i <= defaultCount; i++) {
                episodes.push({
                    number: i,
                    title: `Épisode ${i}`,
                    url: `https://anime-sama.fr/catalogue/${animeId}/saison${season}/${languageCode}/episode-${i}`,
                    language: language.toUpperCase(),
                    season: parseInt(season),
                    available: false // Mark as potentially unavailable
                });
            }
        }
        
        return episodes;
        
    } catch (error) {
        console.error('Error getting anime episodes:', error.message);
        
        // Return basic episode structure
        return [{
            number: 1,
            title: "Épisode 1",
            url: `https://anime-sama.fr/catalogue/${animeId}/saison${season}/${language.toLowerCase()}/episode-1`,
            language: language.toUpperCase(),
            season: parseInt(season),
            available: false
        }];
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
