// Update the service worker with version-aware cache naming
importScripts('config.js');

const CACHE_NAME = `abacus-v${APP_CONFIG.VERSION}`;
const BASE_PATH = '/aloha/';
const PRESERVED_KEYS = ['selectedLanguage'];

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
            // Check version
            fetch(`${BASE_PATH}version.json?t=${Date.now()}`)
                .then(response => response.json())
                .then(data => {
                    if (data.version !== APP_CONFIG.VERSION) {
                        return caches.delete(CACHE_NAME)
                            .then(() => self.clients.claim());
                    }
                    return self.clients.claim();
                })
        ])
    );
});

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
    
    // Assets and Icons
    `${BASE_PATH}icons/icon-192x192.png`,
    `${BASE_PATH}icons/icon-512x512.png`,
    `${BASE_PATH}screenshots/desktop.png`,
    `${BASE_PATH}screenshots/mobile.png`,
    
    // Configuration Files
    `${BASE_PATH}manifest.json`,
    
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
                        console.log('Failed to cache assets:', error);
                    });
                }),
        ])
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'VERSION_CHECK_RESULT') {
        console.log('Version check result:', event.data.result);
    }
});

self.addEventListener('fetch', event => {
    console.log('Fetching:', event.request.url);
  // Skip chrome-extension and non-HTTP requests
  if (!event.request.url.startsWith('http')) {
      return;
  }

  // Only handle requests from our origin
  if (!event.request.url.startsWith(self.location.origin)) {
      return;
  }

  event.respondWith(
      caches.match(event.request)
          .then(cachedResponse => {
              if (cachedResponse) {
                  return cachedResponse;
              }
              return fetch(event.request)
                  .then(response => {
                      if (response.ok) {
                          return caches.open(CACHE_NAME)
                              .then(cache => {
                                  cache.put(event.request, response.clone());
                                  return response;
                              });
                      }
                      return response;
                  });
          })
  );
});