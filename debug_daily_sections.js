const axios = require('axios');
const cheerio = require('cheerio');

async function studyDailySections() {
    try {
        console.log('📅 Étude des sections quotidiennes en détail...\n');
        
        const response = await axios.get('https://anime-sama.fr/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const html = response.data;
        
        console.log('🎯 RECHERCHE JAVASCRIPT/BUTTONS POUR CONTENU QUOTIDIEN:');
        console.log('=====================================================\n');
        
        // Chercher tous les boutons ou éléments avec des classes bg-*
        const coloredButtons = $('[class*="bg-"]').filter((i, el) => {
            const text = $(el).text().trim();
            return text.length > 3 && text.length < 100;
        });
        
        console.log(`📊 ${coloredButtons.length} éléments colorés trouvés:`);
        
        coloredButtons.slice(0, 20).each((i, el) => {
            const $el = $(el);
            const classes = $el.attr('class');
            const text = $el.text().trim();
            const href = $el.attr('href') || $el.find('a').attr('href');
            
            console.log(`${i + 1}. ${classes}: "${text}"`);
            if (href) console.log(`   → ${href}`);
        });
        
        console.log('\n🔍 RECHERCHE DES BOUTONS CYAN (bg-cyan-600):');
        console.log('============================================\n');
        
        // Spécifiquement chercher les boutons cyan mentionnés dans les logs
        const cyanButtons = $('.bg-cyan-600, [class*="cyan"]');
        console.log(`🎯 ${cyanButtons.length} boutons cyan trouvés:`);
        
        cyanButtons.each((i, button) => {
            const $button = $(button);
            const text = $button.text().trim();
            const href = $button.attr('href') || $button.closest('a').attr('href');
            const parent = $button.parent()[0]?.tagName;
            
            console.log(`Bouton cyan ${i + 1}: "${text}"`);
            console.log(`  Parent: ${parent}`);
            console.log(`  Lien: ${href}`);
            
            // Chercher les informations d'anime autour de ce bouton
            const $animeLink = $button.closest('a[href*="/catalogue/"]');
            if ($animeLink.length) {
                const animeHref = $animeLink.attr('href');
                const $img = $animeLink.find('img');
                const imgSrc = $img.attr('src');
                
                console.log(`  🎬 Anime associé: ${animeHref}`);
                console.log(`  🖼️  Image: ${imgSrc}`);
            }
            console.log('');
        });
        
        console.log('📋 RECHERCHE DIRECTE DANS LE HTML:');
        console.log('==================================\n');
        
        // Chercher directement les patterns dans le HTML
        const patterns = [
            'bg-cyan-600',
            'Sorties du',
            'Episode',
            'Épisode',
            'VF Crunchyroll',
            'VOSTFR'
        ];
        
        patterns.forEach(pattern => {
            const matches = html.match(new RegExp(`.{0,50}${pattern}.{0,50}`, 'gi'));
            if (matches && matches.length > 0) {
                console.log(`🔍 Pattern "${pattern}" trouvé ${matches.length} fois:`);
                matches.slice(0, 5).forEach((match, i) => {
                    console.log(`  ${i + 1}. ...${match}...`);
                });
                console.log('');
            }
        });
        
        console.log('🎪 CONTAINERS ET SECTIONS DYNAMIQUES:');
        console.log('=====================================\n');
        
        // Chercher tous les conteneurs qui pourraient contenir du contenu chargé dynamiquement
        $('[id*="container"], [class*="container"]').each((i, container) => {
            const $container = $(container);
            const id = $container.attr('id');
            const classes = $container.attr('class');
            const innerHTML = $container.html();
            
            if (innerHTML && innerHTML.length > 100) {
                console.log(`Conteneur ${i + 1}:`);
                console.log(`  ID: ${id}`);
                console.log(`  Classes: ${classes}`);
                console.log(`  Contenu: ${innerHTML.substring(0, 200)}...`);
                console.log('');
            }
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'étude:', error.message);
    }
}

studyDailySections();