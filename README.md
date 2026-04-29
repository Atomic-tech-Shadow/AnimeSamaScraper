# 🎌 Anime-Sama API (Anime + Scans)

A real-time REST API that scrapes [anime-sama.to](https://anime-sama.to) for **anime episodes** and **manga/scan chapters** in a single unified interface. Vercel-ready (fits within the 12-function Hobby tier limit).

## Features
- **Search** — find any title (anime or scan)
- **Recent** — latest added/updated content
- **Planning** — weekly release schedule (filter by `vf`, `vostfr`, `anime`, `scan`)
- **Popular** — trending & classics
- **Recommendations** — random discovery
- **Details** — full info including all seasons AND scan variants
- **Episodes** — episode list with streaming sources
- **Scans** — chapter list + page images for manga readers
- **Streaming** — direct embed links
- **Unified `contentType`** — every item is tagged `anime` | `film` | `oav` | `kai` | `scan`

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/search?query=naruto` | Search any title |
| `GET /api/recent` | Latest additions |
| `GET /api/planning?day=today&filter=scan` | Weekly schedule |
| `GET /api/popular` | Trending + classics |
| `GET /api/recommendations?page=1&limit=20` | Random discovery |
| `GET /api/anime/[animeId]` | Full details (anime + scan variants) |
| `GET /api/seasons/[animeId]` | All seasons + scan variants |
| `GET /api/episodes/[animeId]?season=saison1&language=VOSTFR` | Episode list (anime mode) |
| `GET /api/episodes/[animeId]?season=scan&language=VF` | Chapter list (scan mode, auto-detected) |
| `GET /api/episodes/[animeId]?season=scan&language=VF&chapter=1` | Single chapter with page images |
| `GET /api/episode-by-id/[episodeId]` | Streaming sources for an episode |
| `GET /api/embed?url=[animeUrl]` | Extract sources from any anime-sama URL |

## Scan reader flow (3 calls)

```bash
# 1. Discover scan variants
curl /api/anime/one-piece
# → seasons[] includes { value: "scan", type: "Scan", contentType: "scan", ... }

# 2. List chapters (lightweight, no images)
curl "/api/episodes/one-piece?season=scan&language=VF"
# → { realName: "One Piece Couleur", count: 1004, chapters: [{ number, title, pageCount }, ...] }

# 3. Load images for one chapter
curl "/api/episodes/one-piece?season=scan&language=VF&chapter=1"
# → { chapter: { number: 1, pageCount: 55, images: [".../1/1.jpg", ".../1/2.jpg", ...] } }
```

The `/api/episodes` endpoint **auto-switches to scan mode** when `season` starts with `scan` (e.g. `scan`, `scan_noir-et-blanc`).

## Development
```bash
npm install
npm start
```
Then open `http://localhost:5000` for the live interactive documentation.

## Deployment
Ready to deploy on Vercel — the project uses exactly **12 serverless functions** (the Hobby tier limit). Adding any new file under `/api/` will require removing or merging an existing one.

## Version
**v4.0.0** — Anime + Scans unified (April 2026)
