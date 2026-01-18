# Anime-Sama API v2.0 - Project Notes

## Current Status ✅
- **Domain**: anime-sama.si (Updated Jan 18, 2026)
- **All 11 endpoints**: Fully tested and operational
- **Focus**: 100% Anime (Scans/Mangas removed)
- **Timezone**: Native GMT+0 conversion
- **Workflow status**: Running and healthy
- **Data Accuracy**: 100% verified against live website

## Project Overview
**Anime-Sama API** is a real-time anime scraping API that fetches data from anime-sama.si (migrated from anime-sama.eu). The API provides 11 complete endpoints for searching, retrieving, and streaming anime content.


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

## Recent Changes (January 18, 2026)

### Optimization & Feature Enrichment
- **Account Readiness**: Added metadata for new Anime-Sama account features (synchronization).
- **Extended Language Support**: Added support for VAR (Arabe), VKR (Coréen), VCN (Chinois), VA (Anglais), and VQC (Québécois).
- **Refined Content Detection**: Enhanced detection for Films, OAVs, and Specials across all endpoints.
- **Improved Title Cleaning**: More aggressive filtering of language tags and metadata from titles.
- **Image Stability**: All images are now sourced directly from the GitHub raw content repository for maximum reliability.

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
