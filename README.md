# 🎌 Anime-Sama API (Anime Only)

A real-time REST API for scraping anime data from anime-sama.tv. This API is strictly 100% anime and excludes all manga/scan content.

## Features
- **Search**: Search for any anime
- **Recent**: Get the latest added episodes
- **Planning**: See the weekly release schedule
- **Popular**: Discover trending and classic anime
- **Details**: Full anime information and seasons
- **Episodes**: List episodes for any season/language
- **Streaming**: Get direct streaming embed links
- **100% Anime**: No manga or scan results

## Endpoints
- `GET /api/search?query=naruto`
- `GET /api/recent`
- `GET /api/planning?day=today`
- `GET /api/popular`
- `GET /api/recommendations`
- `GET /api/anime/[animeId]`
- `GET /api/seasons/[animeId]`
- `GET /api/episodes/[animeId]?season=1&language=VOSTFR`
- `GET /api/episode-sources?url=[episodeUrl]`
- `GET /api/embed?url=[animeUrl]`

## Development
```bash
npm install
npm start
```
