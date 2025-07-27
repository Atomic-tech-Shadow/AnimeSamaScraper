const { scrapeAnimesama } = require('./utils/scraper');

async function debugPopularSections() {
    try {
        const $ = await scrapeAnimesama('https://anime-sama.fr/');
        
        console.log('=== DEBUG: Recherche des sections populaires ===');
        
        // Trouver tous les h2
        const allH2 = $('h2').map((i, el) => $(el).text().trim()).get();
        console.log('Tous les H2 trouvés:', allH2);
        
        // Chercher spécifiquement les sections
        const $classiqueHeader = $('h2:contains("classiques")');
        console.log('Headers classiques trouvés:', $classiqueHeader.length);
        
        if ($classiqueHeader.length) {
            console.log('Premier header classique:', $classiqueHeader.first().text());
            
            // Analyser la structure autour des sections
            const $classiqueParent = $classiqueHeader.first().parent();
            console.log(`Conteneur parent classiques: <${$classiqueParent[0]?.tagName}> class="${$classiqueParent.attr('class')}"`);
            
            // Chercher liens catalogue dans le parent
            const parentLinks = $classiqueParent.find('a[href*="/catalogue/"]').length;
            console.log(`Liens catalogue dans le parent: ${parentLinks}`);
            
            if (parentLinks > 0) {
                $classiqueParent.find('a[href*="/catalogue/"]').slice(0, 5).each((j, link) => {
                    const href = $(link).attr('href');
                    const text = $(link).text().trim().slice(0, 50);
                    console.log(`    Parent Link ${j}: ${href} - "${text}"`);
                });
            }
            
            // Analyser les éléments suivants
            const $nextAll = $classiqueHeader.first().nextAll().slice(0, 10);
            console.log('Éléments suivants:', $nextAll.length);
            
            $nextAll.each((i, el) => {
                const $el = $(el);
                const tagName = el.tagName;
                const classes = $el.attr('class') || 'no-class';
                const linksCount = $el.find('a[href*="/catalogue/"]').length;
                
                console.log(`  ${i}: <${tagName}> class="${classes}" liens_catalogue=${linksCount}`);
                
                if (linksCount > 0) {
                    $el.find('a[href*="/catalogue/"]').slice(0, 3).each((j, link) => {
                        const href = $(link).attr('href');
                        const text = $(link).text().trim().slice(0, 50);
                        console.log(`    Lien ${j}: ${href} - "${text}"`);
                    });
                }
            });
            
            // Nouvelle approche: chercher dans toute la page les patterns de sections populaires
            console.log('\n=== Analyse globale des conteneurs avec beaucoup de liens ===');
            $('div, section').each((i, container) => {
                const $container = $(container);
                const catalogueLinks = $container.find('a[href*="/catalogue/"]').length;
                
                if (catalogueLinks >= 5 && catalogueLinks <= 30) { // Zones intéressantes
                    const classes = $container.attr('class') || 'no-class';
                    const id = $container.attr('id') || 'no-id';
                    console.log(`Conteneur intéressant: <${container.tagName}> class="${classes}" id="${id}" liens=${catalogueLinks}`);
                    
                    // Vérifier s'il y a des mots-clés populaires dans le contenu
                    const content = $container.text().toLowerCase();
                    if (content.includes('classique') || content.includes('pépite') || content.includes('populaire')) {
                        console.log(`  ⭐ POTENTIEL: Contient mots-clés populaires`);
                    }
                }
            });
        }
        
        // Compter tous les liens catalogue sur la page
        const allCatalogueLinks = $('a[href*="/catalogue/"]').length;
        console.log(`Total liens catalogue sur la page: ${allCatalogueLinks}`);
        
        // Exemple d'extraction générale
        console.log('\n=== Échantillon de liens catalogue ===');
        $('a[href*="/catalogue/"]').slice(0, 5).each((i, link) => {
            const $link = $(link);
            const href = $link.attr('href');
            const text = $link.text().trim().slice(0, 50);
            const hasImg = $link.find('img').length > 0;
            console.log(`${i}: ${href} - "${text}" (img: ${hasImg})`);
        });
        
    } catch (error) {
        console.error('Erreur debug:', error.message);
    }
}

debugPopularSections();