const { scrapeAnimesama } = require('../utils/scraper');

// Get anime recommendations from catalogue page
async function getRecommendations(req, res) {
    try {
        console.log('🎯 Récupération des recommandations depuis le catalogue...');
        
        // Scrape the catalogue page
        const $ = await scrapeAnimesama('https://anime-sama.fr/catalogue/');
        
        const recommendations = [];
        const seenAnimes = new Set();
        
        // Extract ALL cards and filter properly
        console.log('🔍 Searching for anime cards...');
        
        // More flexible approach - find all cards containing catalogue links
        $('a[href*="/catalogue/"]').each((index, element) => {
            const $link = $(element);
            const href = $link.attr('href');
            
            if (!href || !href.includes('/catalogue/')) return;
            
            // Ensure full URL
            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.fr${href}`;
            const urlParts = fullUrl.split('/');
            const catalogueIndex = urlParts.findIndex(part => part === 'catalogue');
            
            if (catalogueIndex === -1 || catalogueIndex + 1 >= urlParts.length) return;
            
            const animeId = urlParts[catalogueIndex + 1];
            
            // Skip if it's just the catalogue root or already seen
            if (!animeId || animeId === '' || seenAnimes.has(animeId)) return;
            
            // Get the parent card or the link itself
            const $card = $link.closest('.shrink-0') || $link;
            
            // Check for scan indicators in the card text
            const cardText = $card.text().toLowerCase();
            const isScans = cardText.includes('scans') || 
                           cardText.includes('manga') ||
                           cardText.includes('manhwa') ||
                           cardText.includes('manhua');
            
            // Log what we're processing
            console.log(`📋 Processing: ${animeId} | Text includes Scans: ${isScans}`);
            
            // Skip scans
            if (isScans) {
                console.log(`🚫 Skipping scan: ${animeId}`);
                return;
            }
            
            seenAnimes.add(animeId);
            
            // Extract title from the h1 element in the card
            let title = $card.find('h1').text().trim();
            
            // Fallback title extraction methods
            if (!title) {
                title = $card.find('.title, .name').text().trim() ||
                       $link.attr('title') || 
                       $card.find('img').attr('alt');
            }
            
            // If no title found, construct from anime ID
            if (!title || title.length < 3) {
                title = animeId.replace(/-/g, ' ')
                              .split(' ')
                              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ');
            }
            
            // Clean up title (remove hashtag and extra formatting)
            title = title.replace(/^#/, '') // Remove leading hashtag
                        .replace(/\s+/g, ' ')
                        .replace(/\n/g, ' ')
                        .replace(/\t/g, ' ')
                        .replace(/\s*VF\s*/gi, '')
                        .replace(/\s*VOSTFR\s*/gi, '')
                        .replace(/\s*Saison\s*\d+.*$/gi, '')
                        .replace(/\s*Episode\s*\d+.*$/gi, '')
                        .replace(/\s*\[FIN\]\s*/gi, '')
                        .trim();
            
            // Extract image from the card
            const $img = $card.find('img.imageCarteHorizontale').first();
            let image = $img.attr('src') || $img.attr('data-src');
            
            // Use the standard CDN pattern for anime images if no image found
            if (!image || !image.includes('http')) {
                image = `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`;
            }
            
            // Extract genres from the card
            const genreElements = $card.find('p.text-gray-300.font-medium.text-xs');
            let genres = [];
            genreElements.each((i, el) => {
                const text = $(el).text().trim();
                if (text && text !== 'Anime' && text !== 'Scans' && !text.includes('http')) {
                    genres.push(text);
                }
            });
            
            // Content type is always anime (since we filtered scans)
            const contentType = 'anime';
            
            // Default language info
            const languages = ['VOSTFR'];
            
            recommendations.push({
                id: animeId,
                title: title,
                image: image,
                url: fullUrl,
                contentType: contentType,
                genres: genres.length > 0 ? genres : ['Genre non spécifié'],
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