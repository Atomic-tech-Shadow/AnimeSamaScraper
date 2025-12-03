const { getAnimeDetails } = require('../../utils/scraper');

module.exports = async (req, res) => {
    try {
        const id = req.params?.id || req.query?.id;

        if (!id || id.trim().length === 0) {
            return res.status(400).json({ 
                error: 'Anime ID is required',
                message: 'Utilisez /api/anime/:id'
            });
        }

        const details = await getAnimeDetails(id.trim());

        res.json({
            success: true,
            data: details
        });

    } catch (error) {
        console.error('Anime details API error:', error);
        res.status(500).json({
            error: 'Failed to fetch anime details',
            message: 'Impossible de récupérer les détails'
        });
    }
};
