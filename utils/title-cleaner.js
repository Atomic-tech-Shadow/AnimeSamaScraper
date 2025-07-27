// Fonction utilitaire pour nettoyer les titres de toutes les impuretés identifiées dans l'audit
function cleanTitle(rawTitle) {
    if (!rawTitle) return '';
    
    let cleaned = rawTitle;
    
    // Étape 1: Nettoyer les caractères whitespace (problème critique identifié)
    cleaned = cleaned.replace(/\s+/g, ' ')                    // Espaces multiples -> un seul
                    .replace(/\n/g, ' ')                      // Newlines -> espaces
                    .replace(/\t/g, ' ')                      // Tabs -> espaces
                    .trim();                                  // Trim edges
    
    // Étape 2: Supprimer les informations de langue et épisode (parasites)
    cleaned = cleaned.replace(/\bVOSTFR\b/gi, '')           // Enlever VOSTFR
                    .replace(/\bVF\b/gi, '')                 // Enlever VF
                    .replace(/\bVA\b/gi, '')                 // Enlever VA
                    .replace(/\bVJSTFR\b/gi, '')             // Enlever VJSTFR
                    .replace(/Episode\s*\d+/gi, '')          // Enlever "Episode 123"
                    .replace(/Saison\s*\d+/gi, '')           // Enlever "Saison 1"
                    .replace(/\[FIN\]/gi, '')                // Enlever [FIN]
                    .replace(/\(VF Crunchyroll\)/gi, '')     // Enlever (VF Crunchyroll)
                    .trim();
    
    // Étape 3: Nettoyer les caractères résiduels
    cleaned = cleaned.replace(/\s+/g, ' ')                   // Re-normaliser les espaces
                    .replace(/^[\s\-\.\,]+|[\s\-\.\,]+$/g, '') // Enlever ponctuations en début/fin
                    .trim();
    
    // Étape 4: Si le titre est vide ou trop court, retourner null pour fallback
    if (!cleaned || cleaned.length < 2) {
        return null;
    }
    
    return cleaned;
}

// Fonction pour nettoyer un titre et fournir un fallback depuis l'animeId
function cleanTitleWithFallback(rawTitle, animeId) {
    const cleaned = cleanTitle(rawTitle);
    
    if (cleaned) {
        return cleaned;
    }
    
    // Fallback: construire un titre propre depuis l'animeId
    if (animeId) {
        return animeId.replace(/-/g, ' ')
                     .split(' ')
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                     .join(' ');
    }
    
    return 'Titre inconnu';
}

module.exports = {
    cleanTitle,
    cleanTitleWithFallback
};