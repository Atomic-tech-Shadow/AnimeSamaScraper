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
        // Scraper la page d'accueil pour extraire la section "derniers épisodes ajoutés"
        const $ = await scrapeAnimesama('https://anime-sama.fr/');
        
        const recentEpisodes = [];
        const seenEpisodes = new Set();
        
        console.log('🔍 Extraction de la section "derniers épisodes ajoutés"');
        
        // Méthode 1: Chercher le conteneur spécifique aux derniers épisodes
        const recentContainers = [
            'containerSorties',
            'containerRecent', 
            'containerLastEpisodes',
            'recent-episodes',
            'derniers-episodes'
        ];
        
        let foundRecentContainer = false;
        
        for (const containerId of recentContainers) {
            const $container = $(`#${containerId}`);
            if ($container.length && $container.find('a[href*="/catalogue/"]').length > 0) {
                console.log(`📦 Conteneur derniers épisodes trouvé: #${containerId}`);
                
                extractEpisodesFromContainer($container, 'Derniers Épisodes', recentEpisodes, 25);
                foundRecentContainer = true;
                break;
            }
        }
        
        // Méthode 2: Chercher par titre de section
        if (!foundRecentContainer) {
            console.log('🔍 Recherche par titre de section');
            
            // Chercher les headers qui indiquent la section des derniers épisodes
            const $recentHeader = $('h2, h3, .title, .section-title').filter((i, el) => {
                const text = $(el).text().toLowerCase();
                return text.includes('dernier') || text.includes('récent') || 
                       text.includes('ajouté') || text.includes('sortie');
            }).first();
            
            if ($recentHeader.length) {
                console.log('📝 Header derniers épisodes trouvé');
                
                // Parcourir les éléments suivants pour trouver les épisodes
                let $current = $recentHeader.nextAll().first();
                let attempts = 0;
                
                while ($current.length && recentEpisodes.length < 25 && attempts < 10) {
                    const catalogueLinks = $current.find('a[href*="/catalogue/"]').length;
                    
                    if (catalogueLinks >= 5) {
                        console.log(`📦 Section derniers épisodes détectée avec ${catalogueLinks} liens`);
                        extractEpisodesFromContainer($current, 'Derniers Épisodes', recentEpisodes, 25);
                        foundRecentContainer = true;
                        break;
                    }
                    
                    $current = $current.next();
                    attempts++;
                }
            }
        }
        
        // Méthode 3: Extraction générale des derniers contenus sortis
        if (!foundRecentContainer || recentEpisodes.length < 10) {
            console.log('🔄 Extraction générale des derniers contenus');
            
            // Chercher dans toutes les divs qui contiennent beaucoup de liens d'anime
            $('div').each((i, div) => {
                const $div = $(div);
                const catalogueLinks = $div.find('a[href*="/catalogue/"]').length;
                
                // Éviter les sections de navigation ou trop grandes
                if (catalogueLinks >= 10 && catalogueLinks <= 50 && recentEpisodes.length < 25) {
                    console.log(`📦 Section de contenu détectée avec ${catalogueLinks} liens`);
                    extractEpisodesFromContainer($div, 'Derniers Contenus', recentEpisodes, 25);
                    return false; // Arrêter après la première bonne section
                }
            });
        }
        
        // Fonction utilitaire pour extraire les épisodes d'un conteneur
        function extractEpisodesFromContainer($container, sectionName, targetArray, maxItems) {
            $container.find('a[href*="/catalogue/"]').each((i, link) => {
                if (targetArray.length >= maxItems) return false;
                
                const $link = $(link);
                const href = $link.attr('href');
                
                if (href && href.includes('/catalogue/')) {
                    const urlParts = href.split('/');
                    const catalogueIndex = urlParts.indexOf('catalogue');
                    const animeId = catalogueIndex >= 0 ? urlParts[catalogueIndex + 1] : null;
                    
                    if (animeId) {
                        // Créer un ID unique pour l'épisode (anime + épisode)
                        const episodeId = `${animeId}-${urlParts.slice(catalogueIndex + 2).join('-')}`;
                        
                        if (!seenEpisodes.has(episodeId)) {
                            seenEpisodes.add(episodeId);
                            
                            // Extraire le titre en nettoyant les espaces multiples
                            let title = $link.text().trim().replace(/\s+/g, ' ');
                            title = cleanTitleWithFallback(title, animeId);
                            
                            // Extraire l'image avec stratégies de fallback
                            const $img = $link.find('img').first();
                            let image = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy');
                            
                            // Chercher l'image dans les éléments parents/siblings si nécessaire
                            if (!image) {
                                image = $link.parent().find('img').first().attr('src') || 
                                       $link.siblings().find('img').first().attr('src');
                            }
                            
                            if (image && !image.startsWith('http')) {
                                image = image.startsWith('//') ? `https:${image}` : `https://anime-sama.fr${image}`;
                            }
                            
                            // Fallback vers l'image standard de l'anime
                            if (!image) {
                                image = `https://anime-sama.fr/s2/img/animes/${animeId}.jpg`;
                            }
                            
                            // Détecter le type de contenu et les métadonnées
                            const fullUrl = href.startsWith('http') ? href : `https://anime-sama.fr${href}`;
                            const seasonPath = urlParts[catalogueIndex + 2];
                            const episodePath = urlParts[catalogueIndex + 3];
                            const languagePath = urlParts[catalogueIndex + 4];
                            
                            let contentType = 'anime';
                            if (seasonPath && seasonPath.toLowerCase().includes('scan')) {
                                contentType = 'scan';
                            } else if (seasonPath && seasonPath.toLowerCase().includes('film')) {
                                contentType = 'film';
                            } else if (seasonPath && seasonPath.toLowerCase().includes('oav')) {
                                contentType = 'oav';
                            }
                            
                            // Détecter la langue
                            let language = 'VOSTFR'; // Défaut
                            if (languagePath) {
                                language = languagePath.toUpperCase();
                            } else if (title.includes('VF')) {
                                language = 'VF';
                            }
                            
                            // Extraire numéro d'épisode et saison
                            const episodeMatch = title.match(/Episode\s*(\d+)/i) || 
                                               episodePath?.match(/ep?(\d+)/i);
                            const seasonMatch = title.match(/Saison\s*(\d+)/i) ||
                                              seasonPath?.match(/saison?(\d+)/i);
                            
                            // Détecter les métadonnées spéciales
                            const isFinale = title.includes('[FIN]') || title.includes('Finale');
                            const isVFCrunchyroll = title.includes('VF Crunchyroll');
                            
                            targetArray.push({
                                id: episodeId,
                                animeId: animeId,
                                title: title,
                                image: image,
                                url: fullUrl,
                                contentType: contentType,
                                language: language,
                                season: seasonMatch ? parseInt(seasonMatch[1]) : null,
                                episode: episodeMatch ? parseInt(episodeMatch[1]) : null,
                                seasonPath: seasonPath,
                                episodePath: episodePath,
                                isFinale: isFinale,
                                isVFCrunchyroll: isVFCrunchyroll,
                                extractedFrom: sectionName,
                                addedAt: new Date().toISOString()
                            });
                            
                            console.log(`✅ ${sectionName}: ${title} (${episodeId})`);
                        }
                    }
                }
            });
        }
        
        console.log(`📊 Extraction terminée: ${recentEpisodes.length} épisodes récents`);
        
        // Trier par date d'ajout (plus récents en premier)
        recentEpisodes.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        
        // Return recent episodes data
        res.status(200).json({
            success: true,
            count: recentEpisodes.length,
            recentEpisodes: recentEpisodes,
            extractedAt: new Date().toISOString(),
            source: 'anime-sama.fr section derniers épisodes ajoutés'
        });
        
    } catch (error) {
        console.error('Recent Episodes API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch recent episodes',
            message: 'Unable to retrieve recent episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};