const { scrapeAnimesama } = require('../utils/scraper');
const { cleanTitleWithFallback } = require('../utils/title-cleaner');

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
        // Scraper la page d'accueil pour extraire les sections Classiques et Pépites
        const $ = await scrapeAnimesama('https://anime-sama.fr/');
        
        const popularAnime = {
            classiques: [],
            pepites: []
        };
        
        // Méthode optimisée: utiliser les conteneurs spécifiques identifiés par le debug
        console.log('🎯 Début extraction sections populaires avec conteneurs spécifiques');
        
        // Fonction utilitaire pour extraire anime d'un conteneur
        function extractAnimeFromContainer(containerId, sectionName, targetArray, maxItems = 15) {
            const $container = $(`#${containerId}`);
            if (!$container.length) {
                console.log(`❌ Conteneur ${containerId} non trouvé`);
                return;
            }
            
            console.log(`🔍 Extraction ${sectionName} depuis #${containerId}`);
            
            $container.find('a[href*="/catalogue/"]').each((i, link) => {
                if (targetArray.length >= maxItems) return false;
                
                const $link = $(link);
                const href = $link.attr('href');
                
                if (href && href.includes('/catalogue/')) {
                    const urlParts = href.split('/');
                    const catalogueIndex = urlParts.indexOf('catalogue');
                    const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                    
                    if (animeId && !targetArray.some(anime => anime.id === animeId)) {
                        // Extraire le titre en nettoyant les espaces multiples
                        let title = $link.text().trim().replace(/\s+/g, ' ');
                        
                        // Nettoyage et formatage du titre
                        title = cleanTitleWithFallback(title, animeId);
                        
                        // Extraire l'image
                        const $img = $link.find('img').first();
                        let image = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy');
                        if (image && !image.startsWith('http')) {
                            image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.fr${image}`;
                        }
                        
                        targetArray.push({
                            id: animeId,
                            title: title,
                            image: image || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                            url: href.startsWith('http') ? href : `https://anime-sama.fr${href}`,
                            category: sectionName.toLowerCase(),
                            extractedFrom: `Section ${sectionName} (${containerId})`
                        });
                        
                        console.log(`✅ ${sectionName}: ${title} (${animeId})`);
                    }
                }
            });
        }
        
        // Extraire depuis les conteneurs spécifiques identifiés
        extractAnimeFromContainer('containerClassiques', 'Classiques', popularAnime.classiques, 20);
        
        // Pour les pépites, utiliser les derniers contenus sortis ou derniers ajouts
        // comme source alternative authentique
        extractAnimeFromContainer('containerSorties', 'Pépites', popularAnime.pepites, 15);
        
        // Pour les pépites, essayer différentes stratégies
        const $pepiteHeader = $('h2').filter((i, el) => {
            return $(el).text().toLowerCase().includes('pépites');
        }).first();
        
        if ($pepiteHeader.length) {
            console.log('💎 Header Pépites trouvé, recherche du conteneur associé');
            
            // Stratégie 1: Chercher un conteneur avec ID spécifique
            const pepiteContainers = ['containerPepites', 'containerPopular', 'containerRecommended'];
            let foundPepiteContainer = false;
            
            for (const containerId of pepiteContainers) {
                const $container = $(`#${containerId}`);
                if ($container.length && $container.find('a[href*="/catalogue/"]').length > 0) {
                    console.log(`📦 Conteneur Pépites trouvé: #${containerId}`);
                    extractAnimeFromContainer(containerId, 'Pépites', popularAnime.pepites, 20);
                    foundPepiteContainer = true;
                    break;
                }
            }
            
            // Stratégie 2: Si pas de conteneur spécifique, chercher dans les éléments suivants
            if (!foundPepiteContainer) {
                console.log('🔄 Recherche alternative des pépites dans les éléments suivants');
                
                let $current = $pepiteHeader.nextAll().first();
                let attempts = 0;
                
                while ($current.length && popularAnime.pepites.length === 0 && attempts < 10) {
                    const catalogueLinks = $current.find('a[href*="/catalogue/"]').length;
                    
                    console.log(`Tentative ${attempts}: ${$current[0]?.tagName} avec ${catalogueLinks} liens`);
                    
                    if (catalogueLinks >= 5) { // Conteneur avec beaucoup de liens
                        console.log(`📦 Conteneur Pépites trouvé avec ${catalogueLinks} liens`);
                        
                        $current.find('a[href*="/catalogue/"]').each((i, link) => {
                            if (popularAnime.pepites.length >= 20) return false;
                            
                            const $link = $(link);
                            const href = $link.attr('href');
                            
                            if (href && href.includes('/catalogue/')) {
                                const urlParts = href.split('/');
                                const catalogueIndex = urlParts.indexOf('catalogue');
                                const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                                
                                if (animeId && !popularAnime.pepites.some(anime => anime.id === animeId)) {
                                    let title = $link.text().trim().replace(/\s+/g, ' ');
                                    title = cleanTitleWithFallback(title, animeId);
                                    
                                    const $img = $link.find('img').first();
                                    let image = $img.attr('src') || $img.attr('data-src');
                                    if (image && !image.startsWith('http')) {
                                        image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.fr${image}`;
                                    }
                                    
                                    popularAnime.pepites.push({
                                        id: animeId,
                                        title: title,
                                        image: image || `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                                        url: href.startsWith('http') ? href : `https://anime-sama.fr${href}`,
                                        category: 'pépite',
                                        extractedFrom: 'Section Pépites'
                                    });
                                    
                                    console.log(`✅ Pépite: ${title} (${animeId})`);
                                }
                            }
                        });
                        break; // Arrêter après avoir trouvé le bon conteneur
                    }
                    
                    $current = $current.next();
                    attempts++;
                }
            }
        }
        
        console.log(`📊 Extraction terminée: ${popularAnime.classiques.length} classiques, ${popularAnime.pepites.length} pépites`);
        
        // Combiner toutes les catégories populaires
        const allPopular = [
            ...popularAnime.classiques,
            ...popularAnime.pepites
        ];
        
        // Return popular anime data
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
            source: 'anime-sama.fr sections Classiques et Pépites'
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