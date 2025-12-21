# Anime-Sama API v2.0 - Project Notes

## Project Overview
**Anime-Sama API** is a real-time anime scraping API that fetches data from anime-sama.eu (migrated from anime-sama.fr). The API provides 11 complete endpoints for searching, retrieving, and streaming anime content.

## Current Status ✅
- **Domain**: anime-sama.eu (Updated Dec 21, 2025)
- **All 11 endpoints**: Fully tested and operational
- **Latest update**: Endpoints now scrape homepage sections ("Sorties du...", Recent episodes, Classiques, Pépites)
- **Workflow status**: Running and healthy

## Key Features
✅ Search anime by query
✅ Trending anime with smart cache
✅ Recent episodes from homepage (30 items)
✅ Popular anime with Classiques & Pépites sections
✅ Planning by day (Sorties du Dimanche/Lundi/etc.)
✅ Recommendations with rotation
✅ Anime details with full metadata
✅ Seasons and episodes
✅ Streaming sources extraction
✅ Embed player support
✅ CORS enabled for all routes

## Tech Stack
- Node.js 20+
- Express.js 4.x
- Axios (HTTP client)
- Cheerio (HTML parsing)
- Cors middleware

## Recent Changes (December 21, 2025)

### Homepage Scraping Optimization
All main endpoints now scrape sections directly from homepage (https://anime-sama.eu):

1. **`/api/planning`** - Scrapes "Sorties du Dimanche/Lundi/etc." sections
   - Extracts release times, anime titles, languages, types
   - Supports timezone conversion
   - Filters by day/type/language

2. **`/api/recent`** - Scrapes "dernière épisode ajouté" section
   - Extracts latest episode information
   - Includes season, episode number, language info
   - Returns up to 30 recent episodes

3. **`/api/popular`** - Scrapes "Classique" and "Pépites" sections
   - Extracts both classic and hidden gem anime
   - Organized by category
   - 15 items per category

### Files Modified (Dec 21, 2025)
- `api/planning.js` - Complete rewrite to scrape "Sorties du..." sections
- `api/recent.js` - Optimized to target homepage recent episodes section
- `api/popular.js` - Enhanced with section-based scraping for Classiques & Pépites

## API Endpoints
1. `GET /` - Root documentation
2. `GET /api/search?query=xxx` - Search anime
3. `GET /api/popular` - Popular anime (Classiques + Pépites)
4. `GET /api/recent` - Recent episodes
5. `GET /api/planning` - Daily planning by release day
6. `GET /api/recommendations` - Smart recommendations
7. `GET /api/anime/:id` - Anime details
8. `GET /api/seasons/:animeId` - Seasons list
9. `GET /api/episodes/:animeId` - Episodes with sources
10. `GET /api/episode/:animeId/:season/:ep` - Episode sources
11. `GET /api/embed?url=xxx` - Source extraction

## Known Limitations
- Depends on anime-sama.eu availability
- Rate limited to avoid overloading source
- Cache: 5 minutes for recommendations
- HTML structure dependent (may need updates if site changes)

## Workflow Configuration
- **Name**: Anime API Server
- **Command**: npm start
- **Port**: 5000
- **Status**: Running

## User Preferences
- Language: French
- Focus: Fast, efficient implementation
- Testing: Thorough endpoint verification
- Documentation: Complete

## Next Steps (if needed)
- Monitor anime-sama.eu for structure changes
- Add rate limiting headers
- Consider adding database caching
- Implement webhook support
