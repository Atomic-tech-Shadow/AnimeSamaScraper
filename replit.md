# Anime-Sama API v2.0 - Project Notes

## Project Overview
**Anime-Sama API** is a real-time anime scraping API that fetches data from anime-sama.eu (migrated from anime-sama.fr). The API provides 11 complete endpoints for searching, retrieving, and streaming anime content.

## Current Status ✅
- **Domain**: anime-sama.eu (Updated Dec 20, 2025)
- **All 11 endpoints**: Fully tested and operational
- **Latest update**: Popular endpoint now includes "Pépites" section
- **Workflow status**: Running and healthy

## Key Features
✅ Search anime by query
✅ Trending anime with smart cache
✅ Recent episodes (30 items)
✅ Popular anime (15 Classiques + 15 Pépites)
✅ Planning by day
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

## Recent Changes (December 20, 2025)

### Domain Migration
- Migrated from `anime-sama.fr` to `anime-sama.eu` across all files
- Updated all scraping endpoints and URLs

### Endpoint Fixes
1. **Fixed `/api/recent`** - Updated HTML selectors to work with new site structure
2. **Fixed `/api/popular`** - Now correctly extracts both classiques and pépites sections
3. **Fixed `/api/anime/:id`** - Improved title extraction from meta tags
4. **Fixed `/api/seasons/:animeId`** - Updated season extraction logic
5. **Verified all endpoints** - 11 endpoints tested and working

### Files Modified
- server.js - Updated domain in examples
- api/recent.js - Complete rewrite for new HTML structure
- api/popular.js - Added containerPepites extraction
- api/embed.js - Updated domain validation
- api/planning.js - Updated all URLs
- utils/scraper.js - Updated getAnimeDetails() function
- README.md - Complete documentation update

## API Endpoints
1. `GET /` - Root documentation
2. `GET /api/search?query=xxx` - Search anime
3. `GET /api/popular` - Popular + Pépites
4. `GET /api/recent` - Recent episodes
5. `GET /api/planning` - Daily planning
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
- Documentation: Complete and bilingual

## Next Steps (if needed)
- Monitor anime-sama.eu for structure changes
- Add rate limiting headers
- Consider adding database caching
- Implement webhook support
