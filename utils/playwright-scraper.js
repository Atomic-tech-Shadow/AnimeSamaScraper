const { chromium } = require('playwright');
const cheerio = require('cheerio');

let browserInstance = null;
let lastUsed = Date.now();
const BROWSER_TIMEOUT = 5 * 60 * 1000;
let browserCheckInterval = null;

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function getBrowser() {
    if (browserInstance && browserInstance.isConnected()) {
        lastUsed = Date.now();
        return browserInstance;
    }

    console.log('🚀 Launching Playwright with System Chromium...');
    
    const launchOptions = {
        headless: true,
        args: [
            '--single-process',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled'
        ]
    };
    
    if (process.env.CHROMIUM_PATH) {
        launchOptions.executablePath = process.env.CHROMIUM_PATH;
    }
    
    browserInstance = await chromium.launch(launchOptions);

    lastUsed = Date.now();
    
    if (!browserCheckInterval) {
        browserCheckInterval = setInterval(async () => {
            if (browserInstance && Date.now() - lastUsed > BROWSER_TIMEOUT) {
                console.log('🔄 Closing idle browser...');
                await closeBrowser();
            }
        }, 60000);
    }

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

async function createContext(browser) {
    return await browser.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'fr-FR',
        extraHTTPHeaders: {
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        ignoreHTTPSErrors: true
    });
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
        context = await createContext(browser);
        page = await context.newPage();

        console.log(`🌐 [Playwright] Navigating to: ${url}`);
        
        const response = await page.goto(url, {
            waitUntil: waitFor,
            timeout: timeout
        });

        if (waitForSelector) {
            await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {});
        }

        await page.waitForTimeout(1500);

        const statusCode = response ? response.status() : 0;
        console.log(`📊 [Playwright] Response status: ${statusCode}`);

        const html = await page.content();
        
        await page.close();
        await context.close();
        
        return { html, statusCode, success: statusCode === 200 || statusCode === 304 };

    } catch (error) {
        console.error(`❌ [Playwright] Error for ${url}:`, error.message);
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (context) {
            try { await context.close(); } catch (e) {}
        }
        throw error;
    }
}

async function scrapeWithRetry(url, options = {}, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔄 [Playwright] Attempt ${i + 1}/${maxRetries} for ${url}`);
            const result = await scrapeWithPlaywright(url, options);
            if (result.success) {
                return result;
            }
            lastError = new Error(`HTTP ${result.statusCode}`);
        } catch (error) {
            lastError = error;
            console.error(`❌ [Playwright] Attempt ${i + 1} failed:`, error.message);
            
            if (i < maxRetries - 1) {
                const delay = (i + 1) * 1500;
                console.log(`⏳ [Playwright] Waiting ${delay}ms before retry...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    
    throw lastError;
}

async function scrapeToCheerio(url, options = {}) {
    try {
        const result = await scrapeWithRetry(url, options);
        if (result.success && result.html) {
            return cheerio.load(result.html);
        }
        throw new Error('Failed to get page content');
    } catch (error) {
        console.error(`❌ [Playwright] scrapeToCheerio failed for ${url}:`, error.message);
        throw error;
    }
}

async function postWithPlaywright(url, postData, options = {}) {
    const {
        timeout = 30000,
        waitFor = 'networkidle'
    } = options;

    let page = null;
    let context = null;
    
    try {
        const browser = await getBrowser();
        context = await createContext(browser);
        page = await context.newPage();

        console.log(`🌐 [Playwright POST] Sending to: ${url}`);

        let responseData = null;
        
        page.on('response', async (response) => {
            if (response.url().includes(url) || response.url().includes('fetch.php')) {
                try {
                    responseData = await response.text();
                } catch (e) {}
            }
        });

        await page.goto('https://anime-sama.org/', {
            waitUntil: 'domcontentloaded',
            timeout: timeout
        });

        responseData = await page.evaluate(async ({ url, postData }) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: postData
            });
            return await response.text();
        }, { url, postData });

        await page.close();
        await context.close();

        return { html: responseData, success: true };

    } catch (error) {
        console.error(`❌ [Playwright POST] Error:`, error.message);
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (context) {
            try { await context.close(); } catch (e) {}
        }
        throw error;
    }
}

async function fetchJavaScriptFile(url, options = {}) {
    const {
        timeout = 15000,
        referer = null
    } = options;

    let page = null;
    let context = null;
    
    try {
        const browser = await getBrowser();
        context = await createContext(browser);
        page = await context.newPage();

        let jsContent = null;

        page.on('response', async (response) => {
            if (response.url() === url || response.url().includes('episodes.js')) {
                try {
                    jsContent = await response.text();
                } catch (e) {}
            }
        });

        if (referer) {
            await page.goto(referer, {
                waitUntil: 'domcontentloaded',
                timeout: timeout
            });
        }

        console.log(`🌐 [Playwright JS] Fetching: ${url}`);
        
        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: timeout
        });

        if (!jsContent) {
            jsContent = await page.content();
            const preMatch = jsContent.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
            if (preMatch) {
                jsContent = preMatch[1];
            } else {
                jsContent = await response.text().catch(() => jsContent);
            }
        }

        await page.close();
        await context.close();

        return { content: jsContent, success: true };

    } catch (error) {
        console.error(`❌ [Playwright JS] Error fetching ${url}:`, error.message);
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (context) {
            try { await context.close(); } catch (e) {}
        }
        throw error;
    }
}

async function checkUrlExists(url, options = {}) {
    const { timeout = 10000 } = options;
    
    let page = null;
    let context = null;
    
    try {
        const browser = await getBrowser();
        context = await createContext(browser);
        page = await context.newPage();

        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: timeout
        });

        const statusCode = response ? response.status() : 0;
        const content = await page.content();
        
        await page.close();
        await context.close();

        const exists = statusCode === 200 && content.length > 100;
        return { exists, statusCode, contentLength: content.length };

    } catch (error) {
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (context) {
            try { await context.close(); } catch (e) {}
        }
        return { exists: false, statusCode: 0, error: error.message };
    }
}

async function fetchMultipleUrls(urls, options = {}) {
    const results = [];
    
    for (const url of urls) {
        try {
            const result = await scrapeWithPlaywright(url, options);
            results.push({ url, ...result });
        } catch (error) {
            results.push({ url, success: false, error: error.message });
        }
    }
    
    return results;
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
    scrapeToCheerio,
    postWithPlaywright,
    fetchJavaScriptFile,
    checkUrlExists,
    fetchMultipleUrls,
    testCloudflareBypass,
    getRandomUserAgent
};
