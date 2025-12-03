const { getAnimeDetails } = require('../../utils/scraper');

module.exports = async (req, res) => {
    try {
        const animeId = req.params?.animeId || req.query?.animeId;

        if (!animeId || animeId.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Utilisez /api/seasons/:animeId'
            });
        }

        const animeDetails = await getAnimeDetails(animeId.trim());

        const formattedSeasons = animeDetails.seasons.map(season => ({
            number: season.number,
            name: season.name,
            value: season.value || season.number.toString(),
            type: season.type,
            languages: season.languages || ['VOSTFR'],
            available: season.available !== false,
            contentType: season.contentType,
            url: season.url,
            fullUrl: season.fullUrl
        }));

        res.json({
            success: true,
            animeId: animeId.trim(),
            title: animeDetails.title,
            synopsis: animeDetails.synopsis,
            image: animeDetails.image,
            genres: animeDetails.genres,
            status: animeDetails.status,
            year: animeDetails.year,
            count: formattedSeasons.length,
            seasons: formattedSeasons
        });

    } catch (error) {
        console.error('Seasons API error:', error);
        res.status(500).json({
            error: 'Failed to fetch anime seasons',
            message: 'Impossible de récupérer les saisons'
        });
    }
};
