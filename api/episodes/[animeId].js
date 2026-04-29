const { getAnimeEpisodes, getScanChapters } = require('../../utils/scraper');

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
        const { season = '1', language = 'VOSTFR', chapter } = req.query;

        // Validate anime ID
        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({
                error: 'Anime ID is required',
                message: 'Please provide a valid anime ID (use /api/episodes/:animeId)'
            });
        }

        // ----------------------------------------------------------------
        // SCAN MODE — détection : season commence par "scan" (insensible à la casse)
        // Exemples : season=scan ou season=scan_noir-et-blanc
        // - Sans `chapter` -> liste légère des chapitres { number, pageCount }
        // - Avec `chapter=N` -> les URLs des images du chapitre N
        // ----------------------------------------------------------------
        const seasonStr = String(season).trim();
        const isScan = seasonStr.toLowerCase().startsWith('scan');

        if (isScan) {
            const scanLang = (language || 'VF').toUpperCase();
            const chapterNum = chapter != null && chapter !== '' ? parseInt(chapter, 10) : null;

            const result = await Promise.race([
                getScanChapters(animeId.trim(), seasonStr, scanLang, chapterNum),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Scan request timeout')), 10000)
                )
            ]);

            // Réponse pour un seul chapitre
            if (chapterNum != null) {
                return res.status(200).json({
                    success: true,
                    animeId: animeId.trim(),
                    season: seasonStr,
                    language: result.language,
                    contentType: 'scan',
                    realName: result.realName,
                    chapter: result.chapter
                });
            }

            // Réponse légère : juste la liste des chapitres
            return res.status(200).json({
                success: true,
                animeId: animeId.trim(),
                season: seasonStr,
                language: result.language,
                contentType: 'scan',
                realName: result.realName,
                count: result.totalChapters,
                chapters: result.chapters
            });
        }

        // ----------------------------------------------------------------
        // ANIME MODE (comportement existant)
        // ----------------------------------------------------------------
        const episodes = await Promise.race([
            getAnimeEpisodes(animeId.trim(), season, language),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Episodes request timeout')), 8000)
            )
        ]);

        res.status(200).json({
            success: true,
            animeId: animeId.trim(),
            season: season,
            language: language,
            contentType: 'anime',
            count: episodes.length,
            episodes: episodes
        });

    } catch (error) {
        console.error('Episodes API error:', error);

        res.status(500).json({
            error: 'Failed to fetch episodes/chapters',
            message: 'Unable to retrieve content at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
