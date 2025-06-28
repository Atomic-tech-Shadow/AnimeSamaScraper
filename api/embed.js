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
        const { url } = req.query;

        // Validate URL parameter
        if (!url) {
            return res.status(400).json({ 
                error: 'URL parameter is required',
                message: 'Please provide a URL to embed'
            });
        }

        // Decode URL
        const decodedUrl = decodeURIComponent(url);

        // Validate that it's an anime-sama.fr URL
        if (!decodedUrl.includes('anime-sama.fr')) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'Only anime-sama.fr URLs are allowed'
            });
        }

        // Generate HTML embed page
        const embedHtml = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anime-Sama Player</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            background: #000;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }
        
        .player-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .player-frame {
            width: 100%;
            height: 100%;
            border: none;
            background: #000;
        }
        
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            z-index: 10;
        }
        
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b6b;
            text-align: center;
            z-index: 10;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            margin: 0 auto 20px;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Chargement du lecteur...</div>
        </div>
        <iframe 
            class="player-frame" 
            id="player" 
            src="${decodedUrl}"
            allowfullscreen
            style="display: none;"
            onload="hideLoading()"
            onerror="showError()">
        </iframe>
    </div>

    <script>
        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('player').style.display = 'block';
        }
        
        function showError() {
            document.getElementById('loading').innerHTML = 
                '<div class="error">' +
                '<h3>Erreur de chargement</h3>' +
                '<p>Impossible de charger le lecteur vidéo.</p>' +
                '<p><a href="${decodedUrl}" target="_blank" style="color: #3498db;">Ouvrir dans un nouvel onglet</a></p>' +
                '</div>';
        }
        
        // Timeout fallback
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading.style.display !== 'none') {
                showError();
            }
        }, 10000);
    </script>
</body>
</html>`;

        // Set content type to HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(embedHtml);

    } catch (error) {
        console.error('Embed API error:', error);
        
        res.status(500).json({
            error: 'Failed to generate embed',
            message: 'Unable to generate embed page at this time. Please try again later.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
