const { getAnimeEpisodes } = require('../../utils/scraper');

module.exports = async (req, res) => {
    try {
        const { animeId, season = '1', language = 'VOSTFR', server = 'eps1' } = req.query;

        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Utilisez ?animeId=...'
            });
        }

        const episodes = await getAnimeEpisodes(animeId.trim(), season, language);

        res.json({
            success: true,
            animeId: animeId.trim(),
            season: parseInt(season),
            language,
            server,
            count: episodes.length,
            episodes: episodes.map(episode => ({
                ...episode,
                server
            }))
        });

    } catch (error) {
        console.error('Seasons index API error:', error);
        res.status(500).json({
            error: 'Failed to fetch season episodes',
            message: 'Impossible de récupérer les épisodes de la saison'
        });
    }
};
