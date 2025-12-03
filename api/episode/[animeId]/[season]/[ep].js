const { getAnimeEpisodes, getEpisodeSources } = require('../../../../utils/scraper');

module.exports = async (req, res) => {
    try {
        const { animeId, season, ep, language = 'VOSTFR' } = req.query;

        if (!animeId || !season || !ep) {
            return res.status(400).json({ 
                error: 'Missing required parameters',
                message: 'Utilisez /api/episode/:animeId/:season/:ep'
            });
        }

        const episodes = await getAnimeEpisodes(animeId.trim(), season, language);
        const targetEpisode = episodes.find(episode => episode.number === parseInt(ep));

        if (!targetEpisode) {
            return res.status(404).json({
                error: 'Episode not found',
                message: `Episode ${ep} non trouvé`
            });
        }

        let sources = [];
        if (targetEpisode.url) {
            try {
                const episodeId = `${animeId}-s${season}-e${ep}`;
                sources = await getEpisodeSources(episodeId);
            } catch (e) {}
        }

        res.json({
            success: true,
            animeId: animeId.trim(),
            season: parseInt(season),
            episode: parseInt(ep),
            language,
            episodeDetails: targetEpisode,
            sources
        });

    } catch (error) {
        console.error('Specific episode API error:', error);
        res.status(500).json({
            error: 'Failed to fetch episode details',
            message: 'Impossible de récupérer les détails de l\'épisode'
        });
    }
};
