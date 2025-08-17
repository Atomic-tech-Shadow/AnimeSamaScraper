const { scrapeAnimesama } = require('../utils/scraper');

// Get anime recommendations from catalogue page
async function getRecommendations(req, res) {
    try {
        console.log('🎯 Récupération des recommandations depuis le catalogue...');
        
        // Scrape the catalogue page
        const $ = await scrapeAnimesama('https://anime-sama.fr/catalogue/');
        
        const recommendations = [];
        const seenAnimes = new Set();
        
        // Extract all anime links from catalogue page
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $el = $(element);
            const href = $el.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            // Ensure full URL
            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.fr${href}`;
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            
            const animeId = urlParts[catalogueIndex + 1];
            
            // Skip if it's just the catalogue root or already seen
            if (!animeId || animeId === '' || seenAnimes.has(animeId)) return;
            
            // Check if it's an anime and not a scan
            const pathSegments = urlParts.slice(catalogueIndex + 1);
            
            // Skip if it contains scan-related keywords
            const isScans = pathSegments.some(segment => 
                segment.toLowerCase().includes('scan') ||
                segment.toLowerCase().includes('manga') ||
                segment.toLowerCase().includes('manhwa') ||
                segment.toLowerCase().includes('manhua')
            );
            
            if (isScans) return;
            
            // Only include anime entries (should have specific structure)
            if (pathSegments.length < 2) return; // Must have at least anime/season structure
            
            seenAnimes.add(animeId);
            
            // Extract title from element or construct from ID
            let title = $el.find('h3').text().trim() || 
                       $el.find('.title, .name').text().trim() ||
                       $el.attr('title') || 
                       $el.find('img').attr('alt');
            
            // If no title found, construct from anime ID
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
                        .replace(/\s*VF\s*/gi, '')
                        .replace(/\s*VOSTFR\s*/gi, '')
                        .replace(/\s*Saison\s*\d+.*$/gi, '')
                        .replace(/\s*Episode\s*\d+.*$/gi, '')
                        .replace(/\s*\[FIN\]\s*/gi, '')
                        .trim();
            
            // Extract image
            const $img = $el.find('img').first();
            let image = $img.attr('src') || $img.attr('data-src');
            
            // Use the standard CDN pattern for anime images
            if (!image || !image.includes('http')) {
                image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            }
            
            // Determine content type and season info
            const seasonPath = pathSegments[1];
            let contentType = 'anime';
            let season = null;
            
            if (seasonPath) {
                if (seasonPath.toLowerCase().includes('film')) {
                    contentType = 'film';
                } else if (seasonPath.match(/saison-?(\d+)/i)) {
                    const seasonMatch = seasonPath.match(/saison-?(\d+)/i);
                    season = seasonMatch ? parseInt(seasonMatch[1]) : null;
                }
            }
            
            // Get available languages from the URL structure
            const languages = [];
            if (pathSegments.length > 2) {
                const langPath = pathSegments[2];
                if (langPath) {
                    if (langPath.toLowerCase().includes('vostfr')) languages.push('VOSTFR');
                    if (langPath.toLowerCase().includes('vf')) languages.push('VF');
                    if (langPath.toLowerCase().includes('va')) languages.push('VA');
                }
            }
            
            // Default to VOSTFR if no languages detected
            if (languages.length === 0) {
                languages.push('VOSTFR');
            }
            
            recommendations.push({
                id: animeId,
                title: title,
                image: image,
                url: fullUrl,
                contentType: contentType,
                season: season,
                languages: languages,
                category: 'recommendation',
                extractedFrom: 'Catalogue Page'
            });
        });
        
        // Remove duplicates based on anime ID and sort by title
        const uniqueRecommendations = recommendations
            .filter((anime, index, self) => 
                index === self.findIndex(a => a.id === anime.id)
            )
            .sort((a, b) => a.title.localeCompare(b.title));
        
        console.log(`✅ ${uniqueRecommendations.length} recommandations extraites du catalogue`);
        
        // Pagination support
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        
        const paginatedResults = uniqueRecommendations.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                page: page,
                limit: limit,
                total: uniqueRecommendations.length,
                totalPages: Math.ceil(uniqueRecommendations.length / limit),
                hasNext: endIndex < uniqueRecommendations.length,
                hasPrev: page > 1
            },
            metadata: {
                extractedAt: new Date().toISOString(),
                source: 'anime-sama.fr/catalogue/',
                totalFound: uniqueRecommendations.length,
                filtered: 'Animes only (scans excluded)'
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des recommandations:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recommendations',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = getRecommendations;