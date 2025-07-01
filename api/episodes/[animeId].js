const { getAnimeEpisodes, getMangaChapters, getAnimeSeasons } = require('../../utils/scraper');

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
        // Get animeId from params OR query (support both route patterns)
        const animeId = req.params?.animeId || req.query?.animeId;
        const { season = '1', language = 'VOSTFR' } = req.query;

        // Validate anime ID
        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Please provide a valid anime ID (use /api/episodes/:animeId)'
            });
        }

        // Determine if this is a scan/manga request or anime episodes
        const isScanRequest = season === 'scan' || season.toLowerCase().includes('scan') || 
                             season.toLowerCase().includes('manga') || season.toLowerCase().includes('novel');
        
        let episodes;
        let contentType;
        
        if (isScanRequest) {
            // For scans, try to get the correct language from seasons data first
            let scanLanguage = language;
            try {
                const seasonsData = await getAnimeSeasons(animeId.trim());
                const scanSeason = seasonsData.find(s => 
                    s.value === 'scan' || s.type.toLowerCase().includes('scan') || 
                    s.name.toLowerCase().includes('scan')
                );
                
                if (scanSeason && scanSeason.languages && scanSeason.languages.length > 0) {
                    // Use the first available language for this scan
                    scanLanguage = scanSeason.languages[0];
                    console.log(`Auto-detected scan language: ${scanLanguage} for ${animeId}`);
                }
            } catch (seasonError) {
                console.log('Could not auto-detect scan language, using default:', language);
            }
            
            // Get manga chapters
            episodes = await Promise.race([
                getMangaChapters(animeId.trim(), season, scanLanguage),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Manga chapters request timeout')), 8000)
                )
            ]);
            contentType = 'manga';
        } else {
            // Get anime episodes
            episodes = await Promise.race([
                getAnimeEpisodes(animeId.trim(), season, language),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Episodes request timeout')), 8000)
                )
            ]);
            contentType = 'anime';
        }

        // Return episodes/chapters
        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            season: season,
            language: language,
            contentType: contentType,
            count: episodes.length,
            episodes: episodes
        });

    } catch (error) {
        console.error('Episodes API error:', error);
        
        res.status(500).json({
            error: 'Failed to fetch anime episodes',
            message: 'Unable to retrieve anime episodes at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
