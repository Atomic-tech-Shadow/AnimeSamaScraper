# Anime-Sama API

## Overview
A Node.js API server that scrapes anime-sama.tv in real-time to provide anime data via JSON endpoints. Built with Express.

## Project Architecture
- **server.js** - Main Express server entry point (port 5000)
- **api/** - Route handlers for each endpoint
  - `search.js` - Search anime by query
  - `recent.js` - Get recent anime
  - `planning.js` - Get anime planning/schedule
  - `popular.js` - Get popular anime
  - `recommendations.js` - Get anime recommendations
  - `anime/[id].js` - Get anime details by ID
  - `seasons/[animeId].js` - Get seasons for an anime
  - `seasons/index.js` - General seasons endpoint
  - `episodes/[animeId].js` - Get episodes for an anime
  - `episode-by-id.js` - Get episode sources by ID
  - `episode/[animeId]/[season]/[ep].js` - Get specific episode
  - `embed.js` - Get embed player for an anime URL
- **utils/** - Utility modules
  - `scraper.js` - Web scraping logic
  - `title-cleaner.js` - Title formatting utilities

## Dependencies
- express - Web framework
- axios - HTTP client for scraping
- cheerio - HTML parsing for scraping
- cors - Cross-origin resource sharing

## Recent Changes
- 2026-03-01: Migration complète vers anime-sama.tv. Purge de tous les anciens domaines (.fr, .eu, .me, .li, .to, .ee, .si) dans l'ensemble du projet.
- 2026-03-01: Mise à jour des headers anti-bot (Chrome 122).
- 2026-02-12: Initial import and setup in Replit environment.
