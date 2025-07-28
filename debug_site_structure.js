const axios = require('axios');
const cheerio = require('cheerio');

async function studySiteStructure() {
    try {
        console.log('🔍 Étude de la structure du site anime-sama.fr...\n');
        
        // Obtenir la page d'accueil
        const response = await axios.get('https://anime-sama.fr/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        console.log('📊 ANALYSE DES SECTIONS PRINCIPALES:');
        console.log('=====================================\n');
        
        // 1. Identifier toutes les sections avec titres
        $('h2, h3').each((i, el) => {
            const $el = $(el);
            const title = $el.text().trim();
            if (title) {
                console.log(`Section ${i + 1}: "${title}"`);
                
                // Compter les liens d'anime dans cette section
                let $next = $el.next();
                let animeLinks = 0;
                let attempts = 0;
                
                while ($next.length && attempts < 5) {
                    animeLinks += $next.find('a[href*="/catalogue/"]').length;
                    $next = $next.next();
                    attempts++;
                }
                
                console.log(`  → ${animeLinks} liens d'anime trouvés\n`);
            }
        });
        
        console.log('🖼️  ANALYSE DES IMAGES:');
        console.log('======================\n');
        
        // 2. Analyser comment les images sont structurées
        $('img').each((i, img) => {
            if (i < 20) { // Limiter à 20 premières images
                const $img = $(img);
                const src = $img.attr('src');
                const dataSrc = $img.attr('data-src');
                const alt = $img.attr('alt');
                
                console.log(`Image ${i + 1}:`);
                console.log(`  src: ${src}`);
                console.log(`  data-src: ${dataSrc}`);
                console.log(`  alt: ${alt}`);
                
                // Vérifier le contexte parent
                const parentTag = $img.parent()[0]?.tagName;
                const hasAnimeLink = $img.closest('a[href*="/catalogue/"]').length > 0;
                console.log(`  parent: ${parentTag}, lié à anime: ${hasAnimeLink}`);
                console.log('');
            }
        });
        
        console.log('📦 ANALYSE DES CONTENEURS:');
        console.log('==========================\n');
        
        // 3. Identifier les conteneurs principaux
        $('[id^="container"]').each((i, container) => {
            const $container = $(container);
            const id = $container.attr('id');
            const animeLinks = $container.find('a[href*="/catalogue/"]').length;
            
            console.log(`Conteneur: #${id}`);
            console.log(`  → ${animeLinks} liens d'anime`);
            
            // Examiner quelques liens d'exemple
            $container.find('a[href*="/catalogue/"]').slice(0, 3).each((j, link) => {
                const $link = $(link);
                const href = $link.attr('href');
                const text = $link.text().trim().substring(0, 50);
                const hasImage = $link.find('img').length > 0;
                
                console.log(`  Exemple ${j + 1}: ${text}...`);
                console.log(`    URL: ${href}`);
                console.log(`    A une image: ${hasImage}`);
            });
            console.log('');
        });
        
        console.log('🎯 ANALYSE DES SECTIONS SPÉCIFIQUES:');
        console.log('====================================\n');
        
        // 4. Chercher spécifiquement les sections problématiques
        const sectionsToFind = [
            'trending', 'tendance', 'populaire', 'récent', 'dernier',
            'pépites', 'découvrez', 'classiques', 'planning', 'sortie'
        ];
        
        sectionsToFind.forEach(term => {
            const matchingElements = $('*').filter((i, el) => {
                const text = $(el).text().toLowerCase();
                return text.includes(term) && text.length < 100;
            });
            
            if (matchingElements.length > 0) {
                console.log(`🔍 Éléments contenant "${term}":`);
                matchingElements.slice(0, 3).each((i, el) => {
                    const $el = $(el);
                    const text = $el.text().trim();
                    const tag = el.tagName.toLowerCase();
                    const id = $el.attr('id');
                    const className = $el.attr('class');
                    
                    console.log(`  ${tag}${id ? '#' + id : ''}${className ? '.' + className.split(' ')[0] : ''}: "${text.substring(0, 60)}..."`);
                });
                console.log('');
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'étude du site:', error.message);
    }
}

studySiteStructure();