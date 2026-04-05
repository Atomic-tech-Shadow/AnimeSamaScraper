const axios = require('axios');
const cheerio = require('cheerio');
const { cleanTitleWithFallback } = require('./title-cleaner');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0'
];

const LANGUAGE_SYSTEM = {
    'vostfr': { code: 'vostfr', name: 'VOSTFR', fullName: 'Version Originale Sous-Titrée Française', flag: 'jp', priority: 1 },
    'vf': { code: 'vf', name: 'VF', fullName: 'Version Française', flag: 'fr', priority: 2 },
    'va': { code: 'va', name: 'VA', fullName: 'Version Anglaise', flag: 'en', priority: 3 },
    'vkr': { code: 'vkr', name: 'VKR', fullName: 'Version Coréenne', flag: 'kr', priority: 4 },
    'vcn': { code: 'vcn', name: 'VCN', fullName: 'Version Chinoise', flag: 'cn', priority: 5 },
    'vqc': { code: 'vqc', name: 'VQC', fullName: 'Version Québécoise', flag: 'qc', priority: 6 },
    'var': { code: 'var', name: 'VAR', fullName: 'Version Arabe', flag: 'ar', priority: 10 },
    'vf1': { code: 'vf1', name: 'VF1', fullName: 'Version Française 1', flag: 'fr', priority: 7 },
    'vf2': { code: 'vf2', name: 'VF2', fullName: 'Version Française 2', flag: 'fr', priority: 8 },
    'vj': { code: 'vj', name: 'VJ', fullName: 'Version Japonaise Sous-Titrée Française', flag: 'jp', priority: 9 }
};

const SERVER_MAPPING = {
    'sibnet.ru': 'Sibnet', 'sendvid.com': 'SendVid', 'vidmoly.to': 'Vidmoly', 'smoothpre.com': 'SmoothPre',
    'oneupload.to': 'OneUpload', 'doodstream.com': 'DoodStream', 'streamtape.com': 'StreamTape', 'upstream.to': 'Upstream',
    'embedgram.com': 'EmbedGram', 'mixdrop.co': 'Mixdrop', 'voe.sx': 'Voe', 'ok.ru': 'OK.ru', 'vidoza.net': 'Vidoza', 'fembed.com': 'Fembed'
};

function getRandomUserAgent() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }

function randomDelay(min = 100, max = 300) { return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)); }

async function scrapeAnimesama(url, options = {}) {
    try {
        await randomDelay();
        const response = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                ...options.headers
            }
        });
        return cheerio.load(response.data);
    } catch (error) {
        throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
}

async function searchAnime(query) {
    try {
        await randomDelay();
        const response = await axios.post('https://anime-sama.to/template-php/defaut/fetch.php', `query=${encodeURIComponent(query)}`, {
            timeout: 8000,
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://anime-sama.to/',
                'Origin': 'https://anime-sama.to'
            }
        });
        const $ = cheerio.load(response.data);
        const results = [];
        const seenTitles = new Set();
        $('a[href*="/catalogue/"]').each((index, element) => {
            const link = $(element).attr('href');
            if (!link || !link.includes('/catalogue/')) return;
            const fullUrl = link.startsWith('http') ? link : `https://anime-sama.to${link}`;
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            let animeId = urlParts[catalogueIndex + 1].replace(/\/$/, '');
            let title = $(element).find('h3').text().trim() || $(element).find('.title, .name').text().trim() || $(element).attr('title') || $(element).find('img').attr('alt');
            if (!title || title.length < 3) title = animeId.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            title = title.replace(/\s+/g, ' ').trim();
            const image = $(element).find('img').attr('src') || $(element).find('img').attr('data-src');
            if (title && animeId && !seenTitles.has(animeId)) {
                seenTitles.add(animeId);
                results.push({ id: animeId, title, image: image ? (image.startsWith('http') ? image : `https://anime-sama.to${image}`) : null, url: fullUrl });
            }
        });
        if (results.length === 0) return await fallbackHomepageSearch(query);
        return results.slice(0, 15);
    } catch (error) {
        return await fallbackHomepageSearch(query);
    }
}

async function fallbackHomepageSearch(query) {
    const $ = await scrapeAnimesama('https://anime-sama.to');
    const results = [];
    const queryLower = query.toLowerCase();
    const seenTitles = new Set();
    $('a[href*="/catalogue/"]').each((index, element) => {
        const link = $(element).attr('href');
        if (!link || link === 'https://anime-sama.to/catalogue' || link.split('/').length < 5) return;
        const urlParts = link.split('/');
        const catalogueIndex = urlParts.indexOf('catalogue');
        if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
        const animeId = urlParts[catalogueIndex + 1];
        let title = cleanTitleWithFallback($(element).text().trim() || $(element).attr('title') || $(element).find('img').attr('alt'), animeId);
        if ((title.toLowerCase().includes(queryLower) || animeId.toLowerCase().includes(queryLower)) && !seenTitles.has(title.toLowerCase())) {
            seenTitles.add(title.toLowerCase());
            const image = $(element).find('img').attr('src') || $(element).find('img').attr('data-src');
            results.push({ id: animeId, title, image: image ? (image.startsWith('http') ? image : `https://anime-sama.to${image}`) : null, url: `https://anime-sama.to/catalogue/${animeId}` });
        }
    });
    return results.slice(0, 15);
}

async function getTrendingAnime() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.to');
        const trending = [];
        const seenAnimes = new Set();
        $('.bg-cyan-600').each((index, button) => {
            if (trending.length >= 25) return false;
            const $animeLink = $(button).closest('a[href*="/catalogue/"]');
            if (!$animeLink.length) return;
            const href = $animeLink.attr('href');
            if (!href || !href.includes('/catalogue/')) return;
            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.to${href}`;
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            const animeId = urlParts[catalogueIndex + 1];
            const seasonPath = urlParts[catalogueIndex + 2];
            if (seasonPath && (seasonPath.toLowerCase().includes('scan') || seasonPath.toLowerCase().includes('manga'))) return;
            const uniqueId = `${animeId}-${urlParts.slice(catalogueIndex + 2).join('-')}`;
            if (seenAnimes.has(uniqueId)) return;
            seenAnimes.add(uniqueId);
            let title = cleanTitleWithFallback($animeLink.text().trim(), animeId);
            const image = $animeLink.find('img').first().attr('src') || `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            const episodeText = $(button).text().trim();
            const episodeMatch = episodeText.match(/Episode\s*(\d+)/i);
            const seasonMatch = episodeText.match(/Saison\s*(\d+)/i);
            trending.push({
                id: uniqueId, animeId, title, image, url: fullUrl,
                contentType: seasonPath && seasonPath.toLowerCase().includes('film') ? 'film' : 'anime',
                language: LANGUAGE_SYSTEM[urlParts[catalogueIndex + 3]?.toLowerCase()] || LANGUAGE_SYSTEM.vostfr,
                episodeInfo: episodeText,
                currentEpisode: episodeMatch ? parseInt(episodeMatch[1]) : null,
                currentSeason: seasonMatch ? parseInt(seasonMatch[1]) : null,
                isTrending: true
            });
        });
        return trending.slice(0, 20);
    } catch (error) {
        return [];
    }
}

async function getAnimeDetails(animeId) {
    try {
        const url = `https://anime-sama.to/catalogue/${animeId}/`;
        const $ = await scrapeAnimesama(url);
        if ($('body').text().includes('301 Moved Permanently')) throw new Error('Anime page not found');
        
        const title = $('h4#titreOeuvre').text().trim() || $('meta[property="og:title"]').attr('content') || $('title').text().split('|')[0].trim() || animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const alternativeTitle = $('h2#titreAlter').text().trim();
        const synopsis = $('#synopsis').text().trim() || $('p.text-sm.text-gray-300.leading-relaxed').first().text().trim() || 'Synopsis non disponible';
        const image = $('meta[property="og:image"]').attr('content') || `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
        
        // Champs d'informations spécifiques détectés sur le site
        const status = $('h2:contains("Statut")').next().text().trim();
        const releaseYear = $('h2:contains("Année de sortie")').next().text().trim();
        const studio = $('h2:contains("Studio")').next().text().trim();
        const types = $('h2:contains("Types")').next().text().trim();
        const actualite = $('p:contains("Actualité :")').find('span').text().trim();
        const correspondence = $('p:contains("Correspondance (Anime/Manga) :")').find('span').text().trim();

        let genres = [];
        $('a, p, span').each((i, el) => {
            const text = $(el).text().trim();
            if (text.includes('Action') && text.includes('Comédie') && text.includes(',')) {
                genres = text.split(',').map(g => g.trim()).filter(g => g.length > 2 && !['Manga', 'Scan', 'Lecture en ligne'].includes(g));
                return false;
            }
        });
        
        const seasons = await getAnimeSeasons(animeId);
        
        return { 
            id: animeId, 
            title, 
            alternativeTitle: alternativeTitle || null,
            synopsis, 
            image, 
            genres: genres.length > 0 ? genres : ['Anime'], 
            details: {
                status: status || null,
                releaseYear: releaseYear || null,
                studio: studio || null,
                types: types || null,
                actualite: (actualite && actualite !== 'Aucune donnée.') ? actualite : null,
                correspondence: (correspondence && correspondence !== 'Aucune donnée.') ? correspondence : null
            },
            seasons, 
            url 
        };
    } catch (error) {
        throw error;
    }
}

async function getSeasonLanguages(animeId, seasonValue) {
    const possibleLanguages = ['vostfr', 'vf', 'vf1', 'vf2', 'va'];
    const results = await Promise.allSettled(possibleLanguages.map(async (lang) => {
        try {
            const res = await axios.get(`https://anime-sama.to/catalogue/${animeId}/${seasonValue}/${lang}/episodes.js`, { timeout: 2000, headers: { 'User-Agent': getRandomUserAgent() } });
            return (res.status === 200 && res.data && (res.data.includes('var eps') || res.data.includes('eps1'))) ? lang.toUpperCase() : null;
        } catch (e) { return null; }
    }));
    const available = results.filter(r => r.status === 'fulfilled' && r.value).map(r => r.value);
    return available.length > 0 ? available : ['VOSTFR'];
}

async function getAnimeSeasons(animeId) {
    try {
        const $ = await scrapeAnimesama(`https://anime-sama.to/catalogue/${animeId}/`);
        const seasons = [];
        const fullHtml = $.html();
        const beforeManga = fullHtml.split('<!-- MANGA -->')[0];
        const panneauMatches = beforeManga.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/g);
        if (panneauMatches) {
            for (let i = 0; i < panneauMatches.length; i++) {
                const parts = panneauMatches[i].match(/panneauAnime\("([^"]+)",\s*"([^"]+)"\);/);
                if (parts && parts[1] !== 'nom') {
                    const seasonName = parts[1];
                    const seasonUrl = parts[2];
                    const seasonValue = seasonUrl.split('/')[0];
                    if (seasons.find(s => s.value === seasonValue)) continue;
                    const languages = await getSeasonLanguages(animeId, seasonValue);
                    seasons.push({ number: seasons.length + 1, name: seasonName, value: seasonValue, type: seasonName.toLowerCase().includes('film') ? 'Film' : 'Saison', url: seasonUrl, fullUrl: `https://anime-sama.to/catalogue/${animeId}/${seasonUrl}`, languages, available: true, contentType: 'anime' });
                }
            }
        }
        seasons.sort((a, b) => a.number - b.number).forEach((s, i) => s.apiIndex = i + 1);
        return seasons;
    } catch (error) { return []; }
}

async function getAnimeEpisodes(animeId, season = 1, language = 'VOSTFR') {
    try {
        const seasonPath = typeof season === 'string' && season.startsWith('saison')
            ? season
            : /^\d+$/.test(String(season))
                ? `saison${season}`
                : String(season);
        const requestedLang = language.toLowerCase();
        const langsToTest = requestedLang === 'vf' ? ['vf1', 'vf2', 'vf', 'vostfr'] : [requestedLang, 'vostfr'];
        let languageCode = 'vostfr';
        for (const testLang of langsToTest) {
            try {
                const res = await axios.get(`https://anime-sama.to/catalogue/${animeId}/${seasonPath}/${testLang}/episodes.js`, { timeout: 2000, headers: { 'User-Agent': getRandomUserAgent() } });
                if (res.status === 200 && res.data && (res.data.includes('var eps') || res.data.includes('eps1'))) {
                    languageCode = testLang;
                    break;
                }
            } catch (e) {}
        }
        const seasonUrl = `https://anime-sama.to/catalogue/${animeId}/${seasonPath}/${languageCode}/`;
        const response = await axios.get(`${seasonUrl}episodes.js`, { timeout: 4000, headers: { 'User-Agent': getRandomUserAgent(), Referer: seasonUrl } });
        const jsContent = response.data;
        const episodes = [];
        if (typeof jsContent === 'string' && jsContent.includes('var eps')) {
            const servers = new Map();
            jsContent.match(/var eps(\d+)\s*=\s*\[([\s\S]*?)\];/g)?.forEach(match => {
                const sm = match.match(/var eps(\d+)\s*=\s*\[([\s\S]*?)\];/);
                if (sm) {
                    const urls = sm[2].match(/(['"])(.*?)\1/g)?.map(u => u.substring(1, u.length - 1).trim()).filter(u => u.length > 0);
                    if (urls) servers.set(parseInt(sm[1]), urls);
                }
            });
            let maxEps = 0;
            servers.forEach(u => maxEps = Math.max(maxEps, u.length));
            for (let i = 1; i <= maxEps; i++) {
                const sources = [];
                servers.forEach((urls, sNum) => {
                    if (urls[i - 1]) {
                        const sUrl = urls[i - 1];
                        let sName = `Server ${sNum}`;
                        for (const [domain, name] of Object.entries(SERVER_MAPPING)) { if (sUrl.toLowerCase().includes(domain)) { sName = name; break; } }
                        sources.push({ server: sName, url: sUrl, quality: 'HD', serverNumber: sNum });
                    }
                });
                episodes.push({ number: i, title: `Épisode ${i}`, url: `${seasonUrl}episode-${i}`, streamingSources: sources, language: language.toUpperCase(), season: parseInt(season), available: sources.length > 0 });
            }
        }
        if (episodes.length === 0) throw new Error('No episodes found');
        return episodes;
    } catch (error) { throw error; }
}

async function getRecentEpisodes() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.to');
        const recentEpisodes = [];
        const seenEpisodes = new Set();
        $('.bg-cyan-600').each((index, button) => {
            const $animeLink = $(button).closest('a[href*="/catalogue/"]');
            const href = $animeLink.attr('href');
            if (!href || href.includes('/scan/')) return;
            const urlParts = href.split('/');
            const animeId = urlParts[urlParts.indexOf('catalogue') + 1];
            const episodeMatch = $(button).text().match(/Episode\s*(\d+)/i);
            const seasonMatch = $(button).text().match(/Saison\s*(\d+)/i);
            const epNum = episodeMatch ? parseInt(episodeMatch[1]) : 1;
            const sNum = seasonMatch ? parseInt(seasonMatch[1]) : 1;
            const lang = href.includes('/vf/') ? 'VF' : 'VOSTFR';
            const key = `${animeId}-s${sNum}-e${epNum}-${lang}`;
            if (seenEpisodes.has(key)) return;
            seenEpisodes.add(key);
            recentEpisodes.push({ animeId, animeTitle: cleanTitleWithFallback($animeLink.text(), animeId), season: sNum, episode: epNum, language: lang, url: href.startsWith('http') ? href : `https://anime-sama.to${href}`, image: `https://raw.githubusercontent.com/Anime-Sama/IMG/img/contenu/${animeId}.jpg`, addedAt: new Date().toISOString() });
        });
        return recentEpisodes;
    } catch (error) { return []; }
}

async function getEpisodeSources(episodeUrl) {
    try {
        // Handle custom ID format: {animeId}-s{season}-e{episode} (e.g. naruto-s1-e1)
        if (!episodeUrl.includes('/')) {
            const idMatch = episodeUrl.match(/^(.+)-s(\d+)-e(\d+)$/);
            if (!idMatch) return [];
            const [, animeId, season, ep] = idMatch;
            // Try to find the actual language available for this season
            const langsToTest = ['vostfr', 'vf', 'vf1', 'vf2', 'va'];
            let resolvedLang = 'vostfr';
            for (const lang of langsToTest) {
                try {
                    const resolvedSeasonPath = /^\d+$/.test(String(season)) ? `saison${season}` : String(season);
                    const check = await axios.get(`https://anime-sama.to/catalogue/${animeId}/${resolvedSeasonPath}/${lang}/episodes.js`, { timeout: 3000, headers: { 'User-Agent': getRandomUserAgent() } });
                    if (check.status === 200 && check.data && check.data.includes('var eps')) {
                        resolvedLang = lang;
                        break;
                    }
                } catch (e) {}
            }
            episodeUrl = `https://anime-sama.to/catalogue/${animeId}/saison${season}/${resolvedLang}/episode-${ep}`;
        }

        if (episodeUrl.includes('/catalogue/') && episodeUrl.includes('/episode-')) {
            const parts = episodeUrl.split('/');
            const animeId = parts[4], seasonPath = parts[5], lang = parts[6], epNum = parseInt(parts[7].replace('episode-', ''));
            const res = await axios.get(`https://anime-sama.to/catalogue/${animeId}/${seasonPath}/${lang}/episodes.js`, { timeout: 8000, headers: { 'User-Agent': getRandomUserAgent() } });
            const sources = [];
            res.data.match(/var eps(\d+)\s*=\s*\[([\s\S]*?)\];/g)?.forEach(match => {
                const sm = match.match(/var eps(\d+)\s*=\s*\[([\s\S]*?)\];/);
                if (sm) {
                    const urls = sm[2].match(/(['"])(.*?)\1/g);
                    if (urls && urls[epNum - 1]) {
                        const url = urls[epNum - 1].substring(1, urls[epNum - 1].length - 1).trim();
                        if (url.startsWith('http')) {
                            let sName = `Server ${sm[1]}`;
                            for (const [domain, name] of Object.entries(SERVER_MAPPING)) {
                                if (url.toLowerCase().includes(domain)) { sName = name; break; }
                            }
                            sources.push({ server: sName, url, quality: 'HD', type: 'streaming', episode: epNum, serverNumber: parseInt(sm[1]) });
                        }
                    }
                }
            });
            return sources;
        }
        return [];
    } catch (error) { return []; }
}

module.exports = { searchAnime, getTrendingAnime, getAnimeDetails, getAnimeSeasons, getAnimeEpisodes, getRecentEpisodes, getEpisodeSources, scrapeAnimesama };