const { chromium } = require('playwright');

let browserInstance = null;
let lastUsed = Date.now();
const BROWSER_TIMEOUT = 5 * 60 * 1000;

async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        lastUsed = Date.now();
        return browserInstance;
    }

    console.log('🚀 Launching Playwright with Chromium...');
    
    browserInstance = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
        ]
    });

    lastUsed = Date.now();
    
    setInterval(async () => {
        if (browserInstance && Date.now() - lastUsed > BROWSER_TIMEOUT) {
            console.log('🔄 Closing idle browser...');
            await closeBrowser();
        }
    }, 60000);

    return browserInstance;
}

async function closeBrowser() {
    if (browserInstance) {
        try {
            await browserInstance.close();
        } catch (e) {
            console.error('Error closing browser:', e.message);
        }
        browserInstance = null;
    }
}

async function scrapeWithPlaywright(url, options = {}) {
    const {
        waitFor = 'networkidle',
        timeout = 30000,
        waitForSelector = null
    } = options;

    let page = null;
    let context = null;
    
    try {
        const browser = await getBrowser();
        
        context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'fr-FR',
            extraHTTPHeaders: {
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        page = await context.newPage();

        console.log(`🌐 Navigating to: ${url}`);
        
        const response = await page.goto(url, {
            waitUntil: waitFor,
            timeout: timeout
        });

        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
        }

        await page.waitForTimeout(2000);

        const statusCode = response ? response.status() : 0;
        console.log(`📊 Response status: ${statusCode}`);

        const html = await page.content();
        
        await page.close();
        await context.close();
        
        return { html, statusCode, success: statusCode === 200 };

    } catch (error) {
        console.error(`❌ Playwright error for ${url}:`, error.message);
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (context) {
            try { await context.close(); } catch (e) {}
        }
        throw error;
    }
}

async function scrapeWithRetry(url, options = {}, maxRetries = 2) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔄 Attempt ${i + 1}/${maxRetries} for ${url}`);
            const result = await scrapeWithPlaywright(url, options);
            if (result.success) {
                return result;
            }
            lastError = new Error(`HTTP ${result.statusCode}`);
        } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${i + 1} failed:`, error.message);
            
            if (i < maxRetries - 1) {
                const delay = (i + 1) * 2000;
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    
    throw lastError;
}

async function testCloudflareBypass() {
    console.log('🧪 Testing Cloudflare bypass with Playwright...');
    
    try {
        const result = await scrapeWithPlaywright('https://anime-sama.org/', {
            waitFor: 'networkidle',
            timeout: 30000
        });
        
        if (result.success && result.html.length > 1000) {
            console.log('✅ Cloudflare bypass successful!');
            console.log(`📄 Page size: ${result.html.length} characters`);
            return true;
        } else {
            console.log('❌ Cloudflare bypass failed - page too small or error');
            return false;
        }
    } catch (error) {
        console.error('❌ Cloudflare bypass test failed:', error.message);
        return false;
    }
}

module.exports = {
    getBrowser,
    closeBrowser,
    scrapeWithPlaywright,
    scrapeWithRetry,
    testCloudflareBypass
};
