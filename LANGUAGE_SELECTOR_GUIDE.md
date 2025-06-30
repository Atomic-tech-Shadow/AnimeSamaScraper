# Guide Sélecteur de Langue - Style Anime-Sama

## Interface Originale du Site

Sur anime-sama.fr, le sélecteur de langue apparaît comme ceci :

```
[🇯🇵 VO] [🇫🇷 VF] [🇺🇸 VA] [🇰🇷 VKR] [🇨🇳 VCN] [🇨🇦 VQC] [🇫🇷 VF1] [🇫🇷 VF2]
```

Chaque bouton contient :
- **Drapeau du pays** (image PNG)
- **Code de langue** (VO, VF, VA, etc.)
- **Style bouton cliquable** avec bordures
- **Disposition horizontale** en ligne

## Implémentation React Native

### 1. Composant Principal

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';

const LANGUAGE_FLAGS = {
  'vostfr': { flag: '🇯🇵', code: 'VO', name: 'VOSTFR' },
  'vf': { flag: '🇫🇷', code: 'VF', name: 'VF' },
  'va': { flag: '🇺🇸', code: 'VA', name: 'VA' },
  'vkr': { flag: '🇰🇷', code: 'VKR', name: 'VKR' },
  'vcn': { flag: '🇨🇳', code: 'VCN', name: 'VCN' },
  'vqc': { flag: '🇨🇦', code: 'VQC', name: 'VQC' },
  'vf1': { flag: '🇫🇷', code: 'VF1', name: 'VF ADN' },
  'vf2': { flag: '🇫🇷', code: 'VF2', name: 'VF Netflix' },
  'vj': { flag: '🇯🇵', code: 'VJ', name: 'VJ' }
};

const AnimeSamaLanguageSelector = ({ 
  availableLanguages, 
  selectedLanguage, 
  onLanguageChange 
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {availableLanguages.map((langCode) => {
          const lang = LANGUAGE_FLAGS[langCode.toLowerCase()];
          const isSelected = selectedLanguage === langCode.toLowerCase();
          
          return (
            <TouchableOpacity
              key={langCode}
              style={[
                styles.languageButton,
                isSelected && styles.selectedButton
              ]}
              onPress={() => onLanguageChange(langCode.toLowerCase())}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[
                styles.languageCode,
                isSelected && styles.selectedText
              ]}>
                {lang.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  scrollView: {
    flexDirection: 'row',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    minWidth: 65,
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  flag: {
    fontSize: 16,
    marginRight: 6,
  },
  languageCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
};

export default AnimeSamaLanguageSelector;
```

### 2. Utilisation dans votre écran d'anime

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import AnimeSamaLanguageSelector from './AnimeSamaLanguageSelector';
import AnimeAPI from './AnimeAPI';

const AnimeDetailScreen = ({ animeId }) => {
  const [animeData, setAnimeData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('vostfr');

  useEffect(() => {
    loadAnimeDetails();
  }, [animeId]);

  const loadAnimeDetails = async () => {
    try {
      const response = await AnimeAPI.getAnimeDetails(animeId);
      if (response.success) {
        setAnimeData(response.data);
        // Définir la langue par défaut basée sur les langues disponibles
        if (response.data.availableLanguages.length > 0) {
          setSelectedLanguage(response.data.availableLanguages[0].toLowerCase());
        }
      }
    } catch (error) {
      console.error('Erreur chargement anime:', error);
    }
  };

  const handleLanguageChange = (languageCode) => {
    setSelectedLanguage(languageCode);
    // Recharger les épisodes avec la nouvelle langue
    loadEpisodesForLanguage(languageCode);
  };

  const loadEpisodesForLanguage = async (languageCode) => {
    try {
      const response = await AnimeAPI.getEpisodes(
        animeId, 
        'saison1', 
        languageCode
      );
      // Traiter les épisodes...
    } catch (error) {
      console.error('Erreur chargement épisodes:', error);
    }
  };

  if (!animeData) {
    return <Text>Chargement...</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{animeData.title}</Text>
      
      {/* Sélecteur de langue style anime-sama */}
      <AnimeSamaLanguageSelector
        availableLanguages={animeData.availableLanguages}
        selectedLanguage={selectedLanguage}
        onLanguageChange={handleLanguageChange}
      />
      
      {/* Reste de votre interface */}
    </View>
  );
};
```

### 3. Version avec animations (optionnel)

```javascript
import { Animated } from 'react-native';

const AnimatedLanguageSelector = ({ availableLanguages, selectedLanguage, onLanguageChange }) => {
  const [animations] = useState(
    availableLanguages.reduce((acc, lang) => {
      acc[lang] = new Animated.Value(1);
      return acc;
    }, {})
  );

  const handlePress = (langCode) => {
    // Animation de press
    Animated.sequence([
      Animated.timing(animations[langCode], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animations[langCode], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onLanguageChange(langCode);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {availableLanguages.map((langCode) => {
        const lang = LANGUAGE_FLAGS[langCode.toLowerCase()];
        const isSelected = selectedLanguage === langCode.toLowerCase();
        
        return (
          <Animated.View
            key={langCode}
            style={{ transform: [{ scale: animations[langCode] }] }}
          >
            <TouchableOpacity
              style={[
                styles.languageButton,
                isSelected && styles.selectedButton
              ]}
              onPress={() => handlePress(langCode)}
            >
              <Text style={styles.flag}>{lang.flag}</Text>
              <Text style={[
                styles.languageCode,
                isSelected && styles.selectedText
              ]}>
                {lang.code}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};
```

### 4. Styles avancés pour correspondre exactement

```javascript
const advancedStyles = {
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flexDirection: 'row',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e3e3e3',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 70,
    justifyContent: 'center',
  },
  selectedButton: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
    shadowColor: '#4a90e2',
    shadowOpacity: 0.3,
  },
  flag: {
    fontSize: 18,
    marginRight: 8,
  },
  languageCode: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333333',
    letterSpacing: 0.5,
  },
  selectedText: {
    color: '#ffffff',
  },
};
```

### 5. Integration avec persistance

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const useLanguagePersistence = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('vostfr');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('@anime_language_preference');
      if (saved) {
        setSelectedLanguage(saved);
      }
    } catch (error) {
      console.error('Erreur chargement langue:', error);
    }
  };

  const saveLanguage = async (languageCode) => {
    try {
      await AsyncStorage.setItem('@anime_language_preference', languageCode);
      setSelectedLanguage(languageCode);
    } catch (error) {
      console.error('Erreur sauvegarde langue:', error);
    }
  };

  return {
    selectedLanguage,
    saveLanguage
  };
};
```

## Rendu Final

Votre sélecteur ressemblera exactement à celui d'anime-sama.fr :

```
[🇯🇵 VO] [🇫🇷 VF] [🇺🇸 VA] [🇰🇷 VKR] [🇨🇳 VCN] [🇨🇦 VQC] [🇫🇷 VF1] [🇫🇷 VF2]
```

- **Disposition horizontale** avec scroll
- **Drapeaux + codes** identiques au site
- **Style bouton** avec bordures et ombres
- **Sélection visuelle** avec changement de couleur
- **Animations** de press optionnelles

Ce composant reproduit fidèlement l'interface d'anime-sama.fr pour une expérience utilisateur cohérente dans votre application React Native !