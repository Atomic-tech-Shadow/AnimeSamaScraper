const cheerio = require('cheerio');
const { scrapeAnimesama } = require('../utils/scraper');

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
        const $ = await scrapeAnimesama('https://anime-sama.eu/');
        
        const popularAnime = {
            classiques: [],
            pepites: []
        };
        
        const seenIds = new Set();
        const htmlString = $.html();
        
        // Split HTML by sections marked with ##
        const sections = htmlString.split(/##\s+/i);
        
        // Function to extract animes from a section
        const extractAnimesFromSection = (sectionContent, category) => {
            const $section = cheerio.load('<div>' + sectionContent + '</div>');
            const animes = [];
            
            $section('a[href*="/catalogue/"]').each((index, element) => {
                if (category === 'classiques' && animes.length >= 15) return false;
                if (category === 'pepites' && animes.length >= 15) return false;
                
                const $link = $section(element);
                const href = $link.attr('href');
                
                if (!href || !href.includes('/catalogue/')) return;
                
                const urlParts = href.split('/');
                const catalogueIndex = urlParts.indexOf('catalogue');
                const animeId = catalogueIndex >= 0 && catalogueIndex + 1 < urlParts.length
                    ? urlParts[catalogueIndex + 1]
                    : null;
                
                if (!animeId || seenIds.has(animeId)) return;
                seenIds.add(animeId);
                
                // Get title from link text
                let title = $link.text().trim();
                title = title.replace(/\n/g, ' ')
                            .replace(/\s+/g, ' ')
                            .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ)/gi, '')
                            .replace(/Saison\s*\d+.*$/i, '')
                            .trim();
                
                if (!title || title.length < 2) {
                    title = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                }
                
                // Get image
                const $img = $link.find('img').first();
                let image = $img.attr('src');
                
                if (!image || !image.includes('statically')) {
                    image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                } else if (image && !image.startsWith('http')) {
                    image = 'https:' + image;
                }
                
                animes.push({
                    id: animeId,
                    title: title,
                    image: image,
                    url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                    category: category
                });
            });
            
            return animes;
        };
        
        // Find and process "Classiques" section
        sections.forEach((section, index) => {
            const sectionTitle = section.split('\n')[0].trim().toLowerCase();
            
            // Check for Classiques section
            if (sectionTitle.includes('classique')) {
                const classiques = extractAnimesFromSection(section, 'classiques');
                popularAnime.classiques = [...popularAnime.classiques, ...classiques];
            }
            
            // Check for Pépites section
            if (sectionTitle.includes('pépite') || sectionTitle.includes('pepite')) {
                const pepites = extractAnimesFromSection(section, 'pepites');
                popularAnime.pepites = [...popularAnime.pepites, ...pepites];
            }
        });
        
        // If sections not found with markdown pattern, fallback to ID-based containers
        if (popularAnime.classiques.length === 0 || popularAnime.pepites.length === 0) {
            // Try to find by container IDs (legacy approach)
            const $pepitesContainer = $('#containerPepites');
            if ($pepitesContainer.length > 0 && popularAnime.pepites.length === 0) {
                $pepitesContainer.find('a[href*="/catalogue/"]').each((index, link) => {
                    if (popularAnime.pepites.length >= 15) return false;
                    
                    const $link = $(link);
                    const href = $link.attr('href');
                    
                    if (!href || !href.includes('/catalogue/')) return;
                    
                    const urlParts = href.split('/');
                    const catalogueIndex = urlParts.indexOf('catalogue');
                    const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                    
                    if (!animeId || seenIds.has(animeId)) return;
                    seenIds.add(animeId);
                    
                    let title = $link.text().trim();
                    title = title.replace(/\n/g, ' ')
                                .replace(/\s+/g, ' ')
                                .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ)/gi, '')
                                .trim();
                    
                    if (!title || title.length < 2) {
                        title = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                    
                    const $img = $link.find('img').first();
                    let image = $img.attr('src');
                    
                    if (!image || !image.includes('statically')) {
                        image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                    } else if (image && !image.startsWith('http')) {
                        image = 'https:' + image;
                    }
                    
                    popularAnime.pepites.push({
                        id: animeId,
                        title: title,
                        image: image,
                        url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                        category: 'pepite'
                    });
                });
            }
            
            // Extract classiques from general catalogue links
            if (popularAnime.classiques.length === 0) {
                $('a[href*="/catalogue/"]').each((index, link) => {
                    if (popularAnime.classiques.length >= 15) return false;
                    
                    const $link = $(link);
                    const href = $link.attr('href');
                    
                    if (!href || !href.includes('/catalogue/')) return;
                    
                    const urlParts = href.split('/');
                    const catalogueIndex = urlParts.indexOf('catalogue');
                    const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                    
                    if (!animeId || seenIds.has(animeId)) return;
                    seenIds.add(animeId);
                    
                    // Skip if in pepites container
                    if ($link.closest('#containerPepites').length > 0) return;
                    
                    let title = $link.text().trim();
                    title = title.replace(/\n/g, ' ')
                                .replace(/\s+/g, ' ')
                                .replace(/(VOSTFR|VF|VCN|VA|VKR|VJ)/gi, '')
                                .trim();
                    
                    if (!title || title.length < 2) {
                        title = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    }
                    
                    const $img = $link.find('img').first();
                    let image = $img.attr('src');
                    
                    if (!image || !image.includes('statically')) {
                        image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
                    } else if (image && !image.startsWith('http')) {
                        image = 'https:' + image;
                    }
                    
                    popularAnime.classiques.push({
                        id: animeId,
                        title: title,
                        image: image,
                        url: href.startsWith('http') ? href : `https://anime-sama.eu${href}`,
                        category: 'classique'
                    });
                });
            }
        }
        
        const allPopular = [...popularAnime.classiques, ...popularAnime.pepites];
        
        res.status(200).json({
            success: true,
            totalCount: allPopular.length,
            categories: {
                classiques: {
                    count: popularAnime.classiques.length,
                    anime: popularAnime.classiques
                },
                pepites: {
                    count: popularAnime.pepites.length,
                    anime: popularAnime.pepites
                }
            },
            allPopular: allPopular,
            extractedAt: new Date().toISOString(),
            source: 'anime-sama.eu homepage'
        });
        
    } catch (error) {
        console.error('Popular API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch popular anime',
            message: 'Unable to retrieve popular anime at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
