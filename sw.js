// Update the service worker with version-aware cache naming and hash-based cache busting
importScripts('config.js');

const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const CACHE_NAME = `abacus-v${APP_CONFIG.VERSION}`;
const BASE_PATH = '/aloha/';
const PRESERVED_KEYS = ['selectedLanguage'];

async function checkVersionAndHash() {
    try {
        const response = await fetch(`${BASE_PATH}version.json?t=${Date.now()}`);
        const data = await response.json();
        
        // In development, always invalidate cache
        if (isDev && APP_CONFIG.FORCE_REFRESH) {
            console.log('Development mode: forcing cache refresh');
            return true;
        }

        // In production, check version, date, and content hash
        if (!isDev && (
            data.version !== APP_CONFIG.VERSION ||
            data.timestamp !== new Date().toISOString().split('T')[0] ||
            data.hash !== await calculateHash()
        )) {
            console.log('Version, date, or content hash mismatch detected');
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking version:', error);
        return false;
    }
}

async function calculateHash() {
    // In production, calculate hash of critical resources
    const criticalFiles = ['index.html', 'styles.css', 'script.js'];
    const hash = await Promise.all(
        criticalFiles.map(async file => {
            const response = await fetch(`${BASE_PATH}${file}?t=${Date.now()}`);
            const text = await response.text();
            return text;
        })
    );
    return hash.join('').split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
    }, 0).toString(16);
}

self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // Clear old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Check version and hash
            checkVersionAndHash().then(shouldInvalidate => {
                if (shouldInvalidate) {
                    return caches.delete(CACHE_NAME)
                        .then(() => self.clients.claim());
                }
                return self.clients.claim();
            })
        ])
    );
});

// Update asset list to include new module files
const ASSETS = [
    // Root files with BASE_PATH
    `${BASE_PATH}`,
    `${BASE_PATH}index.html`,
    `${BASE_PATH}favicon.ico`,
    
    // CSS Files
    `${BASE_PATH}arithmetic.css`,
    `${BASE_PATH}game.css`,
    `${BASE_PATH}positions.css`,
    `${BASE_PATH}styles.css`,
    `${BASE_PATH}tutorial.css`,
    `${BASE_PATH}js/modules/styles/modules.css`,
    `${BASE_PATH}js/modules/styles/introduction.css`,
    `${BASE_PATH}js/modules/styles/placeValue.css`,
    
    // JavaScript Files
    `${BASE_PATH}addition.js`,
    `${BASE_PATH}arithmetic.js`,
    `${BASE_PATH}game.js`,
    `${BASE_PATH}language-selector.js`,
    `${BASE_PATH}movements.js`,
    `${BASE_PATH}script.js`,
    `${BASE_PATH}subtraction.js`,
    `${BASE_PATH}tutorial.js`,
    `${BASE_PATH}translations.js`,
    
    // Module Files
    `${BASE_PATH}js/modules/core/moduleManager.js`,
    `${BASE_PATH}js/modules/core/soundManager.js`,
    `${BASE_PATH}js/modules/lessons/age-5-7/introductionModule.js`,
    `${BASE_PATH}js/modules/lessons/age-5-7/games/countingGame.js`,
    `${BASE_PATH}js/modules/lessons/age-8-10/placeValueModule.js`,
    
    // Assets and Icons
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    `${BASE_PATH}screenshots/desktop.png`,
    `${BASE_PATH}screenshots/mobile.png`,
    
    // Configuration Files
    `${BASE_PATH}manifest.json`,
    `${BASE_PATH}version.json`,
    
    // Documentation
    `${BASE_PATH}ADDITION.md`,
    `${BASE_PATH}SUBTRACTION.md`,
    `${BASE_PATH}README.md`,
    `${BASE_PATH}translation.csv`
];

self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache assets
            caches.open(CACHE_NAME)
                .then(cache => {
                    console.log('Started caching assets...');
                    return cache.addAll(ASSETS).then(() => {
                        console.log('All assets cached successfully');
                    }).catch(error => {
                        console.error('Failed to cache assets:', error);
                        // In development, continue despite cache errors
                        if (isDev) {
                            console.log('Development mode: continuing despite cache error');
                            return Promise.resolve();
                        }
                        throw error;
                    });
                })
        ])
    );
});

self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip chrome-extension and non-HTTP requests
    if (!event.request.url.startsWith('http')) return;

    // Handle fetch event
    event.respondWith(
        (async () => {
            try {
                // In development, bypass cache for .js and .css files
                if (isDev && (
                    event.request.url.endsWith('.js') ||
                    event.request.url.endsWith('.css')
                )) {
                    const response = await fetch(event.request);
                    return response;
                }

                // Check cache first
                const cachedResponse = await caches.match(event.request);
                if (cachedResponse) return cachedResponse;

                // If not in cache, fetch and cache
                const response = await fetch(event.request);
                if (!response || response.status !== 200) return response;

                // Cache successful responses
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, response.clone());
                return response;
            } catch (error) {
                console.error('Fetch error:', error);
                throw error;
            }
        })()
    );
});

// Handle messages from the client
self.addEventListener('message', event => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data.type === 'VERSION_CHECK_RESULT') {
        console.log('Version check result:', event.data.result);
    }
});
