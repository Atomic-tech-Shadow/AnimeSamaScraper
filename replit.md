# Anime-Sama API Project v2.0

## Overview
API Node.js serverless avancée qui scrape le site anime-sama.fr en temps réel pour fournir des données d'anime via des endpoints JSON. Compatible avec Vercel et Replit.

## Version 2.0 Features
- **Smart Recommendations System**: Exploration aléatoire intelligente de tout le catalogue (38 pages)
- **Advanced Caching**: Cache optimisé de 5 minutes avec rotation automatique des pages
- **Zero Duplication**: Système anti-répétition double couche (cache + requête)
- **Complete Catalog Coverage**: Découverte de ~1500-2000 animes de tout le site
- **Production Ready**: Système respectueux du serveur avec exploration efficace

## Project Architecture
- **Server**: Express.js server running on port 5000
- **Dependencies**: axios, cheerio, cors, express
- **API Endpoints**:
  - `/api/search` - Search anime by query
  - `/api/recent` - Get recent episodes (fixed duplicate issue)
  - `/api/planning` - Get planning data
  - `/api/recommendations` - Get anime recommendations from catalogue (animes only, no scans)
  - `/api/anime/:id` - Get anime details
  - `/api/seasons/:animeId` - Get seasons
  - `/api/episodes/:animeId` - Get episodes
  - `/api/episode-by-id/:episodeId` - Get episode sources
  - `/api/embed` - Embed player

## Recent Changes
- **2025-08-17**: Migrated from Replit Agent to standard Replit environment
- **2025-08-17**: Fixed duplicate episodes bug in `/api/recent` endpoint by implementing proper deduplication logic
- **2025-08-17**: Added double layer deduplication (button-level and episode-level) to prevent duplicate entries
- **2025-08-17**: Added new `/api/recommendations` endpoint to scrape catalogue page for anime recommendations (filters out scans)
- **2025-08-17**: Implemented intelligent randomization system for recommendations with double shuffle (cache-level + request-level)
- **2025-08-17**: Added smart random page exploration system - explores up to 50 different random pages without repetition, auto-resets for infinite variety
- **2025-08-17**: Optimized cache duration to 5 minutes and improved page range detection to reduce empty page requests and server load
- **2025-08-17**: Verified anime-sama.fr catalogue contains 38 pages maximum, optimized random page selection to pages 1-38 for 100% valid content
- **2025-08-17**: Upgraded to version 2.0.0 and cleaned up documentation (removed API_DOCUMENTATION.md, FRONTEND_EXAMPLES.md, LANGUAGE_SELECTOR_GUIDE.md, QUICK_START.md)

## User Preferences
- Language: French preferred for communication
- Focus on data integrity and real-time scraping accuracy

## Known Issues
None - all endpoints working correctly, duplicates resolved.

## Deployment
Ready for deployment on Replit or Vercel. Server configured to run on 0.0.0.0:5000 for Replit compatibility.