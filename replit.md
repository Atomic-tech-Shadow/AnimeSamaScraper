# Anime-Sama API

## Overview

This is a Node.js-based API that scrapes the anime-sama.fr website to provide anime data in real-time. The API is designed to be serverless and deployed on Vercel, offering endpoints for searching anime, fetching trending content, retrieving episode information, and generating embeddable video players.

## System Architecture

### Backend Architecture
- **Runtime**: Node.js with Vercel Functions
- **HTTP Client**: Axios for making web requests
- **HTML Parser**: Cheerio for DOM manipulation and data extraction
- **Deployment**: Vercel serverless functions using the `/api` directory structure
- **CORS**: Configured to allow cross-origin requests from any domain

### Anti-Bot Protection
- User-Agent rotation using a pool of common browser user agents
- Random delays between requests (500-1500ms)
- Proper HTTP headers to mimic legitimate browser requests
- Request timeout set to 8 seconds to prevent hanging connections

## Key Components

### API Endpoints
1. **Search API** (`/api/search`) - Search for anime by query string
2. **Trending API** (`/api/trending`) - Get currently trending anime
3. **Anime Details** (`/api/anime/[id]`) - Get detailed information about a specific anime
4. **Seasons** (`/api/seasons/[animeId]`) - Get available seasons for an anime
5. **Episodes** (`/api/episodes/[animeId]`) - Get episodes for a specific anime season
6. **Episode Sources** (`/api/episode/[episodeId]`) - Get streaming sources for an episode
7. **Embed Player** (`/api/embed`) - Generate embeddable HTML player
8. **Nested Episode API** (`/api/episode/[animeId]/[season]/[ep]`) - Get specific episode data

### Core Utilities
- **Scraper Module** (`/utils/scraper.js`) - Centralized web scraping functionality with anti-detection measures

### Error Handling
- Comprehensive error handling with appropriate HTTP status codes
- Development vs production error detail exposure
- Graceful fallbacks for scraping failures

## Data Flow

1. **Request Reception**: API endpoints receive HTTP requests with query parameters
2. **Parameter Validation**: Input validation and sanitization
3. **Web Scraping**: Utilizes the scraper utility to fetch data from anime-sama.fr
4. **Data Processing**: Cheerio parses HTML and extracts structured data
5. **Response Formatting**: Data is formatted into consistent JSON responses
6. **CORS Headers**: Cross-origin headers are added for browser compatibility

## External Dependencies

### NPM Packages
- **axios** (^1.10.0) - HTTP client for web requests
- **cheerio** (^1.1.0) - Server-side DOM manipulation
- **cors** (^2.8.5) - Cross-origin resource sharing middleware

### Target Website
- **anime-sama.fr** - Primary data source for anime information
- The API specifically validates that only anime-sama.fr URLs are processed for security

## Deployment Strategy

### Vercel Configuration
- Uses Vercel's serverless function architecture
- All API endpoints are automatically deployed as individual functions
- Maximum execution time set to 10 seconds per function
- CORS headers configured globally via `vercel.json`

### Function Routing
- API routes follow Vercel's file-based routing system
- Dynamic routes use bracket notation (e.g., `[id].js`, `[animeId]/[season]/[ep].js`)
- Nested routing supported for complex endpoint structures

### Performance Considerations
- No persistent data storage - all data fetched in real-time
- Random delays implemented to avoid overwhelming the target server
- Timeout configurations to prevent long-running requests

## Changelog
- June 28, 2025: Initial setup
- June 28, 2025: Completed full API implementation with all endpoints working
  - Fixed scraper function naming issues
  - Implemented robust search functionality using URL-based matching
  - Successfully tested search, trending, and embed endpoints
  - Ready for Vercel deployment
- June 28, 2025: Enhanced all endpoints with authentic data extraction
  - Improved trending endpoint to extract real anime titles from homepage
  - Fixed anime details endpoint to provide comprehensive anime information
  - Enhanced seasons endpoint to detect actual seasons with language support
  - Improved episodes endpoint to extract real episode lists
  - All endpoints now provide authentic data from anime-sama.fr

## Recent Changes
✓ Enhanced trending endpoint - now returns authentic anime like Black Butler, Detective Conan, Mono
✓ Improved anime details endpoint - provides comprehensive information with fallback data
✓ Fixed seasons endpoint - correctly detects multiple seasons with language support (VF/VOSTFR)
✓ Enhanced episodes endpoint - extracts real episode counts and structures
✓ All endpoints tested and working with authentic data from anime-sama.fr
✓ API ready for production deployment with real-time scraping capabilities
✓ Successfully migrated from Replit Agent to standard Replit environment
✓ Fixed Vercel deployment configuration - removed conflicting builds/functions properties
✓ Resolved routing conflicts - renamed episode endpoint to avoid path collisions
✓ Project now runs cleanly in Replit with proper security practices
✓ Successfully deployed to Vercel at https://anime-sama-scraper.vercel.app/
✓ All API endpoints tested and working with authentic data in production
✓ Fixed root URL - added proper documentation page and API index
✓ Deployment fully functional with all endpoints accessible

## User Preferences
Preferred communication style: Simple, everyday language.