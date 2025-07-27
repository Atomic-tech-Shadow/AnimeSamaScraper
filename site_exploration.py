#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import json

def explore_anime_sama():
    print("🔍 Exploration du site anime-sama.fr pour trouver les sections Classique et Pépite...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get('https://anime-sama.fr/', headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Rechercher les sections contenant "classique" ou "pépite"
        print("\n📋 Recherche des sections avec 'classique' ou 'pépite'...")
        
        # Chercher dans les titres h1, h2, h3, h4
        headers_found = []
        for header in soup.find_all(['h1', 'h2', 'h3', 'h4']):
            text = header.get_text().strip().lower()
            if 'classique' in text or 'pépite' in text or 'populaire' in text:
                headers_found.append({
                    'tag': header.name,
                    'text': header.get_text().strip(),
                    'class': header.get('class', []),
                    'id': header.get('id', '')
                })
        
        print(f"✅ Titres trouvés: {len(headers_found)}")
        for h in headers_found:
            print(f"   {h['tag']}: {h['text']}")
        
        # Chercher dans les div avec classes spécifiques
        print("\n📋 Recherche des conteneurs avec classes potentielles...")
        
        container_classes = [
            'classique', 'pepite', 'populaire', 'popular', 'featured',
            'recommande', 'selection', 'top', 'best'
        ]
        
        containers_found = []
        for class_name in container_classes:
            containers = soup.find_all('div', class_=lambda x: x and class_name in ' '.join(x).lower())
            for container in containers:
                containers_found.append({
                    'class': container.get('class', []),
                    'id': container.get('id', ''),
                    'content_preview': container.get_text()[:100].strip()
                })
        
        print(f"✅ Conteneurs trouvés: {len(containers_found)}")
        for c in containers_found[:5]:  # Limiter l'affichage
            print(f"   Classe: {c['class']}, ID: {c['id']}")
            print(f"   Aperçu: {c['content_preview'][:50]}...")
        
        # Rechercher les liens catalogue dans ces sections
        print("\n📋 Recherche des liens /catalogue/ dans les sections...")
        
        catalogue_links = soup.find_all('a', href=lambda x: x and '/catalogue/' in x)
        print(f"✅ Liens catalogue trouvés: {len(catalogue_links)}")
        
        # Analyser la structure générale
        print("\n📋 Structure générale de la page...")
        main_containers = soup.find_all('div', class_=lambda x: x and any(
            word in ' '.join(x).lower() for word in ['container', 'section', 'grid', 'flex']
        ))
        
        print(f"✅ Conteneurs principaux: {len(main_containers[:10])}")
        
        # Sauvegarder les résultats
        results = {
            'headers_found': headers_found,
            'containers_found': containers_found[:10],
            'catalogue_links_count': len(catalogue_links),
            'page_title': soup.title.string if soup.title else 'No title'
        }
        
        with open('site_exploration_results.json', 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📁 Résultats sauvegardés dans site_exploration_results.json")
        
        return results
        
    except Exception as e:
        print(f"❌ Erreur lors de l'exploration: {e}")
        return None

if __name__ == "__main__":
    explore_anime_sama()