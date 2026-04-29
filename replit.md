# Anime-Sama API (Anime + Scans unifié)

API REST temps réel qui scrape `anime-sama.to` pour fournir données d'anime **et** chapitres de scans (manga). Compatible Vercel serverless (free tier — limite de 12 fonctions respectée).

## Versions
- **v4.0.0** — Fusion anime + scans dans les endpoints existants (avril 2026)
- **v3.0.0** — Anime only

## Philosophie : fusion plutôt que séparation
Pour rester dans la limite de 12 fonctions serverless de Vercel free, **aucun nouvel endpoint n'a été créé**. Le support des scans est branché sur les endpoints existants via le champ `contentType` (`anime` | `film` | `oav` | `kai` | `scan`).

## Endpoints

| Endpoint | Rôle | Champs scan |
|---|---|---|
| `GET /api/search?query=` | Recherche multi-type | `contentType` à inférer côté client via `/api/anime/:id` |
| `GET /api/recent` | Derniers ajouts | `contentType`, `chapter` (au lieu de `episode` pour les scans) |
| `GET /api/planning?day=&filter=` | Planning hebdo | filtres `vf` `vostfr` `anime` `scan` |
| `GET /api/popular` | Classiques + pépites | `contentType` |
| `GET /api/recommendations?page=&limit=` | Découverte aléatoire | `contentType` |
| `GET /api/anime/:id` | Fiche complète | `seasons[]` inclut les variantes scan (type `Scan`) |
| `GET /api/seasons/:animeId` | Liste seasons + scans | type `Scan`, `contentType: 'scan'` |
| `GET /api/episodes/:animeId?season=&language=&chapter=` | **Polymorphe** : épisodes OU chapitres | Voir flux scan ci-dessous |
| `GET /api/episode-by-id/:episodeId` | Sources d'un épisode (anime) | — |
| `GET /api/embed?url=` | Extraction sources depuis URL anime-sama | — |

## Flux scan (mode polymorphe sur `/api/episodes`)

L'endpoint `/api/episodes/:animeId` détecte automatiquement le mode scan : si `season` commence par `scan` (ex: `scan`, `scan_noir-et-blanc`), il bascule en mode lecteur de scan.

**Étape 1 — Découverte des variantes scan :**
```
GET /api/anime/one-piece
→ seasons[] contient :
  { name: "Scans (couleur)", value: "scan", type: "Scan", contentType: "scan", languages: ["VF"] }
  { name: "Scans (noir et blanc)", value: "scan_noir-et-blanc", type: "Scan", contentType: "scan", languages: ["VF"] }
```

**Étape 2 — Liste légère des chapitres (pas d'images) :**
```
GET /api/episodes/one-piece?season=scan&language=VF
→ {
    realName: "One Piece Couleur",
    count: 1004,
    chapters: [
      { number: 1, title: "Chapitre 1", pageCount: 55, language: "VF", contentType: "scan" },
      { number: 2, title: "Chapitre 2", pageCount: 23, ... },
      ...
    ]
  }
```

**Étape 3 — Images d'un chapitre spécifique :**
```
GET /api/episodes/one-piece?season=scan&language=VF&chapter=1
→ {
    chapter: {
      number: 1,
      title: "Chapitre 1",
      pageCount: 55,
      images: [
        "https://anime-sama.to/s2/scans/One%20Piece%20Couleur/1/1.jpg",
        "https://anime-sama.to/s2/scans/One%20Piece%20Couleur/1/2.jpg",
        ...
      ],
      language: "VF",
      contentType: "scan"
    }
  }
```

## Architecture interne

### Découvertes critiques sur anime-sama.to (à savoir si on touche au scraper)

1. **Source de vérité des scans** dans la fiche anime : appels JS inline `panneauScan(nom, url)` (cousin de `panneauAnime`). Ex pour One Piece :
   ```js
   panneauScan("Scans (couleur)", "scan/vf");
   panneauScan("Scans (noir et blanc)", "scan_noir-et-blanc/vf");
   ```

2. **API interne du CDN** :
   ```
   GET https://anime-sama.to/s2/scans/get_nb_chap_et_img.php?oeuvre={titre_exact}
   → { "1": 55, "2": 23, "3": 22, ... }   (clé = numéro chapitre, valeur = nb images)
   ```

3. **Format des images** :
   ```
   https://anime-sama.to/s2/scans/{titre_exact}/{num_chapitre}/{i}.jpg
   ```
   où `i` va de 1 à `pageCount`. Toujours en `.jpg`.

4. **PIÈGE MAJEUR — le titre exact** : il ne se déduit PAS du slug. Il faut le lire dans `<h3 id="titreOeuvre">` de la page lecteur. Exemples observés :
   - `/catalogue/one-piece/scan/vf/` → titre `"One Piece Couleur"`
   - `/catalogue/one-piece/scan_noir-et-blanc/vf/` → titre `"One Piece  "` **(2 espaces de fin intentionnels !)**
   - C'est pourquoi `getScanRealName()` ne `.trim()` PAS la fin du titre. Un fallback `trim()` est tenté si le premier appel échoue.

### Fichiers modifiés pour le support scan
- `utils/scraper.js`
  - `getAnimeSeasons()` : étendu pour parser aussi `panneauScan(...)`
  - `getScanRealName(animeId, scanValue, language)` : extrait `#titreOeuvre` brut
  - `fetchScanChapterMap(realName)` : appelle `/s2/scans/get_nb_chap_et_img.php` (avec fallback trim)
  - `buildScanImageUrls(realName, chapterNum, pageCount)` : génère les URLs
  - `getScanChapters(animeId, scanValue, language, chapterNum?)` : pipeline complet
  - `getRecentEpisodes()` et `getTrendingAnime()` : retirés les filtres anti-scan, ajout du tag `contentType`
- `api/episodes/[animeId].js` : détection auto `season=scan...` → mode scan
- `api/recent.js`, `api/popular.js`, `api/recommendations.js`, `api/planning.js` : filtres anti-scan retirés, `contentType` ajouté
- `api/planning.js` : nouveau filtre `?filter=scan` (et `?filter=anime` exclut maintenant les scans)
- `server.js` : doc API mise à jour (v4.0.0)

## Lancement
```bash
npm install
npm start
```
Puis `http://localhost:5000` pour la doc complète.

## Déploiement Vercel
Compte les fonctions serverless (1 par fichier dans `/api`) :
- `api/search.js`, `api/recent.js`, `api/planning.js`, `api/popular.js`, `api/recommendations.js`,
  `api/anime/[id].js`, `api/seasons/[animeId].js`, `api/seasons/index.js`,
  `api/episodes/[animeId].js`, `api/episode-by-id.js`, `api/episode/[animeId]/[season]/[ep].js`,
  `api/embed.js`
= **12 fonctions** → pile dans la limite Vercel Hobby. Ne pas créer de nouveaux fichiers dans `/api` sans en supprimer un.
