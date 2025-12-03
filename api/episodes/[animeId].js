const { getAnimeEpisodes, getMangaChapters, getAnimeSeasons } = require('../../utils/scraper');

module.exports = async (req, res) => {
    try {
        const animeId = req.params?.animeId || req.query?.animeId;
        const { season = '1', language = 'VOSTFR' } = req.query;

        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Utilisez /api/episodes/:animeId'
            });
        }

        const isScanRequest = season === 'scan' || 
                             season.toLowerCase().includes('scan') || 
                             season.toLowerCase().includes('manga');
        
        let episodes;
        let contentType;
        
        if (isScanRequest) {
            let scanLanguage = language;
            try {
                const seasonsData = await getAnimeSeasons(animeId.trim());
                const scanSeason = seasonsData.find(s => 
                    s.value === 'scan' || s.type.toLowerCase().includes('scan')
                );
                
                if (scanSeason?.languages?.length > 0) {
                    scanLanguage = scanSeason.languages[0];
                }
            } catch (e) {}
            
            episodes = await getMangaChapters(animeId.trim(), season, scanLanguage);
            contentType = 'manga';
        } else {
            episodes = await getAnimeEpisodes(animeId.trim(), season, language);
            contentType = 'anime';
        }

        res.json({
            success: true,
            animeId: animeId.trim(),
            season,
            language,
            contentType,
            count: episodes.length,
            episodes
        });

    } catch (error) {
        console.error('Episodes API error:', error);
        res.status(500).json({
            error: 'Failed to fetch episodes',
            message: 'Impossible de récupérer les épisodes'
        });
    }
};
