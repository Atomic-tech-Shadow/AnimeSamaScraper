const axios = require('axios');
const cheerio = require('cheerio');

async function analyzeScans() {
  try {
    const response = await axios.get('https://anime-sama.fr/catalogue/dandadan/scan/vf/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 8000
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('=== ANALYZING PAGE STRUCTURE ===');
    
    // Check for JavaScript that might generate chapters
    $('script').each((i, elem) => {
      const content = $(elem).html();
      if (content && content.length > 100) {
        if (content.includes('chapitre') || content.includes('198') || content.includes('scan')) {
          console.log(`\n=== Script ${i} contains chapter data ===`);
          // Look for chapter generation patterns
          if (content.includes('for') && content.includes('chapitre')) {
            console.log('Found chapter generation loop!');
            console.log(content.substring(0, 1000));
          }
        }
      }
    });
    
    // Check for any external scripts
    $('script[src]').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src.includes('scan') || src.includes('chapitre')) {
        console.log('External script with scan data:', src);
      }
    });
    
    // Check for any data attributes or hidden elements
    $('[data-chapter], [data-chapters], #chapterData').each((i, elem) => {
      console.log('Found chapter data element:', $(elem).attr('data-chapter') || $(elem).text());
    });
    
    // Look for the specific pattern we know exists (198 chapters)
    const bodyText = $('body').text();
    if (bodyText.includes('Chapitre 198')) {
      console.log('Found reference to Chapter 198 in body text');
      
      // Try to extract the chapter text differently
      const fullText = $.html();
      const chapterPattern = /Chapitre\s*\d+/g;
      const matches = fullText.match(chapterPattern);
      if (matches) {
        console.log(`Found ${matches.length} chapter references in HTML`);
        console.log('First 10:', matches.slice(0, 10));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

analyzeScans();