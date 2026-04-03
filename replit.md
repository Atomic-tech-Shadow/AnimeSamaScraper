# Anime API Server (Anime Only)

A real-time REST API server for scraping anime data from anime-sama.to. This API is strictly focused on anime content and excludes all manga/scan references.

## Features
- Search anime (Filtered)
- Recent episodes (Anime/Films only)
- Anime details (synopsis, genres, year, seasons)
- Episode lists with streaming sources
- Support for VOSTFR, VF, and VA
- **No Scans/Manga**: All manga and scan content is filtered out.
- **Pure Anime Experience**: Optimized for video content.

## API Endpoints
- `GET /api/search?q=query`
- `GET /api/recent`
- `GET /api/anime/:id`
- `GET /api/episodes/:animeId?season=saison1&lang=vostfr`
- `GET /api/embed?url=source_url`

## Development
```bash
npm install
npm start
```
