# Anime API Server

A real-time REST API server for scraping anime data from anime-sama.tv.

## Features
- Search anime
- Recent episodes
- Anime details (synopsis, genres, year, seasons)
- Episode lists with streaming sources
- Support for VOSTFR, VF, and VA

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
