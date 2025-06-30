# Anime-Sama API Documentation

## Vue d'ensemble

Cette API permet d'accéder aux données d'anime-sama.fr en temps réel, incluant la recherche, les détails d'anime, les épisodes, et le support multilingue complet.

**URL de base :** `http://localhost:5000` (développement)

## Authentification

Aucune authentification requise. L'API est publique et gratuite.

## Système de Langues

L'API supporte toutes les langues disponibles sur anime-sama.fr avec **détection automatique intelligente** :

| Code | Nom | Description |
|------|-----|-------------|
| `vostfr` | VOSTFR | Version Originale Sous-Titrée Française |
| `vf` | VF | Version Française (détecte automatiquement VF1, VF2 si disponible) |
| `vf1` | VF1 | Version Française 1 (ADN) |
| `vf2` | VF2 | Version Française 2 (Netflix) |
| `va` | VA | Version Anglaise |
| `vkr` | VKR | Version Coréenne |
| `vcn` | VCN | Version Chinoise |
| `vqc` | VQC | Version Québécoise |
| `vj` | VJ | Version Japonaise Sous-Titrée Française |

### Détection Automatique VF
Quand vous demandez `language=vf`, l'API détecte automatiquement la meilleure variante disponible :
- Dandadan : utilise automatiquement `vf1` 
- Autres anime : utilise `vf`, `vf1` ou `vf2` selon disponibilité
- Garantit toujours des données authentiques du site

## Endpoints

### 1. Recherche d'anime

**Endpoint :** `GET /api/search`

**Paramètres :**
- `query` (string, requis) : Terme de recherche

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/search?query=dandadan')
```

**Réponse :**
```json
{
  "success": true,
  "query": "dandadan",
  "count": 1,
  "results": [
    {
      "id": "dandadan",
      "title": "Dandadan",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/dandadan0.jpg",
      "url": "https://anime-sama.fr/catalogue/dandadan/"
    }
  ]
}
```

### 2. Détails d'un anime

**Endpoint :** `GET /api/anime/:id`

**Paramètres :**
- `id` (string, requis) : ID de l'anime

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/anime/dandadan')
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": "dandadan",
    "title": "Dandadan",
    "alternativeTitles": "Dan Da Dan",
    "synopsis": "Momo Ayase et Ken Takakura sont tous deux lycéens...",
    "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/dandadan0.jpg",
    "genres": ["Action", "Supernatural", "Comedy"],
    "status": "15 saisons disponibles",
    "correspondence": "Saison 1 Episode 12 -> Chapitre 34",
    "year": "2024",
    "type": "Série + Films + OAV",
    "seasons": [
      {
        "number": 1,
        "name": "Saison 1",
        "value": "saison1",
        "type": "Saison",
        "url": "saison1/vostfr",
        "fullUrl": "https://anime-sama.fr/catalogue/dandadan/saison1/vostfr",
        "languages": ["VOSTFR"],
        "available": true
      }
    ],
    "totalSeasons": 15,
    "availableLanguages": ["VOSTFR", "VF"],
    "hasFilms": true,
    "hasOAV": true,
    "url": "https://anime-sama.fr/catalogue/dandadan/"
  }
}
```

### 3. Saisons d'un anime

**Endpoint :** `GET /api/seasons/:animeId`

**Paramètres :**
- `animeId` (string, requis) : ID de l'anime

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/seasons/dandadan')
```

**Réponse :**
```json
{
  "success": true,
  "animeId": "dandadan",
  "count": 15,
  "seasons": [
    {
      "number": 1,
      "name": "Saison 1",
      "value": "1",
      "languages": ["VOSTFR"],
      "available": true
    },
    {
      "number": 1,
      "name": "Saison 1 (Avec VF ADN)",
      "value": "1",
      "languages": ["VF"],
      "available": true
    }
  ]
}
```

### 4. Épisodes d'une saison

**Endpoint :** `GET /api/episodes/:animeId`

**Paramètres :**
- `animeId` (string, requis) : ID de l'anime
- `season` (string, optionnel) : Numéro de saison (défaut: 1)
- `language` (string, optionnel) : Code de langue (défaut: vostfr)

**Exemples de requêtes :**

**Version française (détection automatique) :**
```javascript
fetch('http://localhost:5000/api/episodes/dandadan?season=1&language=vf')
// L'API détecte automatiquement VF1 pour Dandadan
```

**Version sous-titrée :**
```javascript
fetch('http://localhost:5000/api/episodes/dandadan?season=1&language=vostfr')
```

**Variante française spécifique :**
```javascript
fetch('http://localhost:5000/api/episodes/dandadan?season=1&language=vf1')
```

**Réponse (VF automatiquement détecté) :**
```json
{
  "success": true,
  "animeId": "dandadan",
  "season": 1,
  "language": "vf",
  "detectedLanguage": "vf1",
  "count": 12,
  "episodes": [
    {
      "number": 1,
      "title": "Épisode 1",
      "url": "https://anime-sama.fr/catalogue/dandadan/saison1/vf1/episode-1",
      "streamingSources": [
        {
          "server": "Sibnet",
          "url": "https://video.sibnet.ru/shell.php?videoid=5702327",
          "quality": "HD",
          "serverNumber": 1
        },
        {
          "server": "SendVid",
          "url": "https://sendvid.com/embed/6kntwzl3",
          "quality": "HD",
          "serverNumber": 4
        }
      ],
      "language": "VF",
      "season": 1,
      "available": true
    }
  ]
}
```

### 5. Sources de streaming pour un épisode

**Endpoint :** `GET /api/embed`

**Paramètres :**
- `url` (string, requis) : URL de l'épisode

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/embed?url=https://anime-sama.fr/catalogue/dandadan/saison1/vf1/episode-1')
```

**Réponse :**
```json
{
  "success": true,
  "url": "https://anime-sama.fr/catalogue/dandadan/saison1/vf1/episode-1",
  "sources": [
    {
      "server": "Sibnet",
      "url": "https://video.sibnet.ru/shell.php?videoid=5702327",
      "quality": "HD",
      "type": "streaming",
      "episode": 1,
      "serverNumber": 1
    },
    {
      "server": "SendVid",
      "url": "https://sendvid.com/embed/6kntwzl3",
      "quality": "HD",
      "type": "streaming",
      "episode": 1,
      "serverNumber": 4
    }
  ],
  "count": 5
}
```

### 6. Anime en tendance

**Endpoint :** `GET /api/trending`

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/trending')
```

**Réponse :**
```json
{
  "success": true,
  "count": 20,
  "trending": [
    {
      "id": "dandadan",
      "title": "Dandadan",
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/dandadan0.jpg",
      "url": "https://anime-sama.fr/catalogue/dandadan/",
      "type": "anime"
    }
  ]
}
```

### 7. Épisodes récents

**Endpoint :** `GET /api/recent`

**Exemple de requête :**
```javascript
fetch('http://localhost:5000/api/recent')
```

**Réponse :**
```json
{
  "success": true,
  "count": 30,
  "recent": [
    {
      "animeId": "dandadan",
      "animeTitle": "Dandadan",
      "season": 2,
      "episode": null,
      "language": "VOSTFR",
      "languageInfo": {
        "code": "vostfr",
        "name": "VOSTFR",
        "fullName": "Version Originale Sous-Titrée Française",
        "flag": "jp"
      },
      "contentType": "anime",
      "releaseTime": "18h30",
      "releaseDay": "Jeudi",
      "isFinale": false,
      "isPostponed": false,
      "image": "https://cdn.statically.io/gh/Anime-Sama/IMG/img/contenu/dandadan.jpg",
      "url": "https://anime-sama.fr/catalogue/dandadan/saison2/vostfr/",
      "isNew": true
    }
  ]
}
```

## Configuration du changement de langue

### Pour React Native

#### 1. Composant sélecteur de langue

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

const LANGUAGES = [
  { code: 'vostfr', name: 'VOSTFR', flag: '🇯🇵' },
  { code: 'vf', name: 'VF', flag: '🇫🇷' },
  { code: 'vf1', name: 'VF ADN', flag: '🇫🇷' },
  { code: 'vf2', name: 'VF Netflix', flag: '🇫🇷' },
  { code: 'va', name: 'VA', flag: '🇺🇸' },
  { code: 'vkr', name: 'VKR', flag: '🇰🇷' },
  { code: 'vcn', name: 'VCN', flag: '🇨🇳' },
  { code: 'vqc', name: 'VQC', flag: '🇨🇦' }
];

const LanguageSelector = ({ selectedLanguage, onLanguageChange, availableLanguages }) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const filteredLanguages = LANGUAGES.filter(lang => 
    availableLanguages.includes(lang.code.toUpperCase())
  );

  return (
    <View>
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        style={styles.languageButton}
      >
        <Text>{selectedLanguage} 🔽</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.languageOption}
                  onPress={() => {
                    onLanguageChange(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text>{item.flag} {item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
```

#### 2. Service API avec gestion des langues

```javascript
class AnimeAPI {
  constructor(baseURL = 'http://localhost:5000') {
    this.baseURL = baseURL;
  }

  async searchAnime(query) {
    const response = await fetch(`${this.baseURL}/api/search?query=${encodeURIComponent(query)}`);
    return response.json();
  }

  async getAnimeDetails(animeId) {
    const response = await fetch(`${this.baseURL}/api/anime/${animeId}`);
    return response.json();
  }

  async getEpisodes(animeId, season = 'saison1', language = 'vostfr') {
    const response = await fetch(
      `${this.baseURL}/api/episodes/${animeId}?season=${season}&language=${language}`
    );
    return response.json();
  }

  async getStreamingSources(episodeUrl) {
    const response = await fetch(
      `${this.baseURL}/api/embed?url=${encodeURIComponent(episodeUrl)}`
    );
    return response.json();
  }

  async getTrending() {
    const response = await fetch(`${this.baseURL}/api/trending`);
    return response.json();
  }

  async getRecent() {
    const response = await fetch(`${this.baseURL}/api/recent`);
    return response.json();
  }
}

export default new AnimeAPI();
```

#### 3. Hook pour la gestion des langues

```javascript
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useLanguageManager = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('vostfr');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('preferred_language');
      if (saved) setSelectedLanguage(saved);
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const changeLanguage = async (languageCode) => {
    try {
      setSelectedLanguage(languageCode);
      await AsyncStorage.setItem('preferred_language', languageCode);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  return {
    selectedLanguage,
    changeLanguage
  };
};
```

## Serveurs de streaming supportés

L'API extrait les URLs authentiques de ces serveurs :

- **Sibnet** : `sibnet.ru`
- **SendVid** : `sendvid.com`
- **Vidmoly** : `vidmoly.to`
- **SmoothPre** : `smoothpre.com`
- **OneUpload** : `oneupload.to`
- **DoodStream** : `doodstream.com`
- **StreamTape** : `streamtape.com`
- **Upstream** : `upstream.to`
- **EmbedGram** : `embedgram.com`

## Gestion d'erreurs

Toutes les réponses d'erreur suivent ce format :

```json
{
  "success": false,
  "error": "Description de l'erreur",
  "message": "Message détaillé pour l'utilisateur"
}
```

## Codes d'état HTTP

- `200` : Succès
- `400` : Requête invalide
- `404` : Ressource non trouvée
- `500` : Erreur serveur

## Nouvelles Fonctionnalités (Juin 2025)

### 🎯 Détection Automatique des Langages VF

L'API intègre désormais un système intelligent de détection automatique pour les versions françaises :

**Fonctionnement :**
- Quand vous demandez `language=vf`, l'API teste automatiquement `vf1`, `vf2`, puis `vf`
- Pour Dandadan : détecte automatiquement `vf1` au lieu de retourner une erreur
- Valide le contenu JavaScript réel des épisodes (pas seulement l'existence des pages)
- Retourne le langage exact utilisé dans la réponse (`detectedLanguage`)

**Exemple :**
```javascript
// Vous demandez VF générique
fetch('/api/episodes/dandadan?language=vf')

// L'API détecte automatiquement VF1 et retourne :
{
  "language": "vf",           // Votre demande
  "detectedLanguage": "vf1",  // Ce qui a été trouvé
  "episodes": [...] // Épisodes authentiques VF1
}
```

### 🔒 Garantie d'Authenticité des Données

**Validation en temps réel :**
- Chaque épisode est vérifié directement sur anime-sama.fr
- Validation du contenu JavaScript `episodes.js` 
- Aucune donnée inventée ou mise en cache
- Sources de streaming extraites en temps réel

**Système anti-échec :**
- Tests multiples pour chaque langage demandé
- Fallback intelligent sur les variantes disponibles
- Validation du contenu (présence de `var eps1`, etc.)
- Gestion gracieuse des erreurs sans données factices

### 📊 Amélioration de la Performance

**Optimisations de requêtes :**
- Détection par validation de contenu JavaScript
- Timeouts configurés (3 secondes max par test)
- Agents utilisateur rotatifs pour éviter la détection
- Délais respectueux entre requêtes

## Limites et considérations

- **Délai anti-bot** : L'API intègre des délais aléatoires pour éviter la détection
- **Timeout** : 8 secondes par requête
- **Données en temps réel** : Toutes les données proviennent directement d'anime-sama.fr
- **Pas de cache** : Les données sont toujours fraîches mais les requêtes peuvent être plus lentes

## Support

Pour toute question ou problème, vérifiez que :
1. L'URL de base est correcte
2. Les paramètres sont bien encodés
3. L'anime existe sur anime-sama.fr
4. La langue demandée est disponible pour cet anime