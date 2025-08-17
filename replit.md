# Anime-Sama API Project

## Overview
API Node.js serverless qui scrape le site anime-sama.fr en temps réel pour fournir des données d'anime via des endpoints JSON. Compatible avec Vercel et Replit.

## Project Architecture
- **Server**: Express.js server running on port 5000
- **Dependencies**: axios, cheerio, cors, express
- **API Endpoints**:
  - `/api/search` - Search anime by query
  - `/api/recent` - Get recent episodes (fixed duplicate issue)
  - `/api/planning` - Get planning data
  - `/api/anime/:id` - Get anime details
  - `/api/seasons/:animeId` - Get seasons
  - `/api/episodes/:animeId` - Get episodes
  - `/api/episode-by-id/:episodeId` - Get episode sources
  - `/api/embed` - Embed player

## Recent Changes
- **2025-08-17**: Migrated from Replit Agent to standard Replit environment
- **2025-08-17**: Fixed duplicate episodes bug in `/api/recent` endpoint by implementing proper deduplication logic
- **2025-08-17**: Added double layer deduplication (button-level and episode-level) to prevent duplicate entries

## User Preferences
- Language: French preferred for communication
- Focus on data integrity and real-time scraping accuracy

## Known Issues
None - all endpoints working correctly, duplicates resolved.

## Deployment
Ready for deployment on Replit or Vercel. Server configured to run on 0.0.0.0:5000 for Replit compatibility.