const cheerio = require('cheerio');
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
        // Scrape the homepage
        const $ = await scrapeAnimesama('https://anime-sama.eu/');
        
        const recentEpisodes = [];
        const seenLinks = new Set();
        
        const htmlString = $.html();
        
        // Split by sections and find the "dernière épisode ajouté" section
        // Look for pattern: "## Reprenez votre visionnage" or similar patterns
        const sections = htmlString.split(/##\s+/i);
        
        let recentSection = null;
        
        // Find the section with recent episodes
        sections.forEach((section) => {
            // Check if this is the recent episodes section
            if (section.toLowerCase().includes('reprenez votre visionnage') || 
                section.toLowerCase().includes('dernière')) {
                recentSection = section;
            }
        });
        
        // If no specific section found, use the first section after the title (which contains recent releases)
        if (!recentSection && sections.length > 1) {
            recentSection = sections[1]; // Usually the first content section has recent episodes
        }
        
        if (!recentSection) {
            recentSection = htmlString; // Fallback to entire page
        }
        
        // Parse the section with cheerio to extract anime links
        const $section = cheerio.load('<div>' + recentSection + '</div>');
        
        // Extract all catalogue links from the section
        $section('a[href*="/catalogue/"]').each((index, element) => {
            const $link = $section(element);
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/') || seenLinks.has(href)) {
                return;
            }
            
            seenLinks.add(href);
            
            // Extract anime ID from URL
            const urlParts = href.split('/');
            const catalogueIndex = urlParts.indexOf('catalogue');
            const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length 
                ? urlParts[catalogueIndex + 1] 
                : null;
            
            if (!animeId) return;
            
            // Get title from link text
            let animeTitle = $link.text().trim();
            animeTitle = animeTitle.replace(/\n/g, ' ')
                                  .replace(/\s+/g, ' ')
                                  .replace(/(\d{1,2}h\d{2})/g, '')
                                  .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ|VF1|VF2)/gi, '')
                                  .replace(/Saison\s*\d+.*$/i, '')
                                  .replace(/Partie\s*\d+.*$/i, '')
                                  .replace(/Genres.*$/i, '')
                                  .trim();
            
            if (!animeTitle || animeTitle.length < 2) {
                animeTitle = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            }
            
            // Get image
            const $img = $link.find('img').first();
            let image = $img.attr('src');
            
            if (!image || !image.includes('statically')) {
                image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            } else if (image && !image.startsWith('http')) {
                image = 'https:' + image;
            }
            
            // Extract season from URL
            let season = null;
            let seasonPart = 1;
            const seasonMatch = href.match(/\/saison(\d+)(?:-(\d+))?/);
            if (seasonMatch) {
                season = parseInt(seasonMatch[1]);
                if (seasonMatch[2]) {
                    seasonPart = parseInt(seasonMatch[2]);
                }
            }
            
            // Extract language from URL (check most specific first)
            let language = 'VOSTFR';
            if (href.includes('/vf2')) language = 'VF2';
            else if (href.includes('/vf1')) language = 'VF1';
            else if (href.includes('/vf')) language = 'VF';
            else if (href.includes('/vj')) language = 'VJ';
            else if (href.includes('/va')) language = 'VA';
            else if (href.includes('/vkr')) language = 'VKR';
            else if (href.includes('/vcn')) language = 'VCN';
            else if (href.includes('/vqc')) language = 'VQC';
            else if (href.includes('/vostfr')) language = 'VOSTFR';
            
            // Extract episode info from link text
            const linkText = $link.text();
            const episodeMatch = linkText.match(/[Éé]pisode?\s*(\d+)/i);
            const episode = episodeMatch ? parseInt(episodeMatch[1]) : null;
            
            // Determine content type
            let type = 'anime';
            if (href.includes('/scan/')) {
                type = 'scan';
            } else if (href.includes('/film/')) {
                type = 'film';
            }
            
            const item = {
                animeId: animeId,
                animeTitle: animeTitle,
                season: season,
                seasonPart: seasonPart,
                episode: episode,
                language: language,
                url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                image: image,
                addedAt: new Date().toISOString(),
                type: type
            };
            
            recentEpisodes.push(item);
        });
        
        // Limit to 30 most recent
        const limitedEpisodes = recentEpisodes.slice(0, 30);
        
        // Return recent episodes
        res.status(200).json({
            success: true,
            count: limitedEpisodes.length,
            recentEpisodes: limitedEpisodes,
            extractedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Recent episodes API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch recent episodes',
            message: 'Unable to retrieve recent episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
