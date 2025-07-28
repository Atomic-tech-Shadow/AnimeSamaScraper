const axios = require('axios');
const cheerio = require('cheerio');

async function studyTrendingAndPlanning() {
    try {
        console.log('🎯 Étude approfondie des sections Trending et Planning...\n');
        
        const response = await axios.get('https://anime-sama.fr/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        console.log('📈 SECTION TRENDING (Sorties quotidiennes):');
        console.log('==========================================\n');
        
        // Analyser les sections de sorties quotidiennes
        const dailySections = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
        
        dailySections.forEach(day => {
            const sectionTitle = `Sorties du ${day}`;
            console.log(`🗓️  ${sectionTitle}:`);
            
            $('h2').each((i, h2) => {
                const $h2 = $(h2);
                if ($h2.text().trim() === sectionTitle) {
                    console.log(`  Header trouvé: "${$h2.text()}"`);
                    
                    // Examiner le contenu suivant le header
                    let $next = $h2.next();
                    let sectionContent = [];
                    let attempts = 0;
                    
                    while ($next.length && attempts < 5) {
                        const tag = $next[0]?.tagName?.toLowerCase();
                        const classes = $next.attr('class');
                        const id = $next.attr('id');
                        const animeLinks = $next.find('a[href*="/catalogue/"]').length;
                        
                        if (animeLinks > 0) {
                            console.log(`    → ${tag}${id ? '#' + id : ''}${classes ? '.' + classes.split(' ')[0] : ''} contient ${animeLinks} liens d'anime`);
                            
                            // Examiner les premiers liens
                            $next.find('a[href*="/catalogue/"]').slice(0, 3).each((j, link) => {
                                const $link = $(link);
                                const href = $link.attr('href');
                                const $img = $link.find('img');
                                const imgSrc = $img.attr('src');
                                const text = $link.text().trim().substring(0, 40);
                                
                                console.log(`      Anime ${j + 1}: "${text}..."`);
                                console.log(`        URL: ${href}`);
                                console.log(`        Image: ${imgSrc ? 'OUI' : 'NON'} ${imgSrc ? '(' + imgSrc + ')' : ''}`);
                            });
                        }
                        
                        $next = $next.next();
                        attempts++;
                    }
                    console.log('');
                }
            });
        });
        
        console.log('📅 SECTION PLANNING:');
        console.log('====================\n');
        
        // Analyser le planning
        const pageHTML = $.html();
        const planningMatches = pageHTML.match(/cartePlanningAnime\([^)]+\)/g);
        
        if (planningMatches) {
            console.log(`🎯 ${planningMatches.length} appels cartePlanningAnime trouvés:`);
            
            planningMatches.slice(0, 5).forEach((match, i) => {
                console.log(`\nPlanning ${i + 1}: ${match}`);
                
                const params = match.match(/cartePlanningAnime\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]*)",\s*"([^"]+)"\)/);
                
                if (params) {
                    const [, title, path, animeId, time, extra, language] = params;
                    console.log(`  Titre: ${title}`);
                    console.log(`  Anime ID: ${animeId}`);
                    console.log(`  Heure: ${time}`);
                    console.log(`  Langue: ${language}`);
                    
                    // Tester différentes URLs d'image possibles
                    const possibleImageUrls = [
                        `https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/${animeId}.jpg`,
                        `https://anime-sama.fr/s2/img/animes/${animeId}.jpg`,
                        `https://anime-sama.fr/img/animes/${animeId}.jpg`
                    ];
                    
                    console.log(`  Images possibles:`);
                    possibleImageUrls.forEach(url => {
                        console.log(`    - ${url}`);
                    });
                }
            });
        } else {
            console.log('❌ Aucun appel cartePlanningAnime trouvé');
        }
        
        console.log('\n🖼️  ANALYSE DES CHEMINS D\'IMAGES:');
        console.log('==================================\n');
        
        // Analyser tous les chemins d'images d'anime
        const animeImages = [];
        $('a[href*="/catalogue/"] img').each((i, img) => {
            const $img = $(img);
            const src = $img.attr('src');
            if (src && src.includes('contenu/')) {
                animeImages.push(src);
            }
        });
        
        console.log(`📊 ${animeImages.length} images d'anime trouvées:`);
        const uniquePatterns = [...new Set(animeImages.map(src => {
            if (src.includes('statically.io')) return 'statically.io CDN';
            if (src.includes('anime-sama.fr')) return 'anime-sama.fr';
            return 'autre';
        }))];
        
        uniquePatterns.forEach(pattern => {
            const count = animeImages.filter(src => {
                if (pattern === 'statically.io CDN') return src.includes('statically.io');
                if (pattern === 'anime-sama.fr') return src.includes('anime-sama.fr');
                return true;
            }).length;
            console.log(`  ${pattern}: ${count} images`);
        });
        
        console.log('\n📝 Exemples d\'images trouvées:');
        animeImages.slice(0, 10).forEach((src, i) => {
            console.log(`  ${i + 1}. ${src}`);
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'étude:', error.message);
    }
}

studyTrendingAndPlanning();