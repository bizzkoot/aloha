const CACHE_NAME = 'abacus-v1';
const BASE_PATH = '/aloha/';  // Add this line for GitHub Pages path

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
      caches.open(CACHE_NAME)
          .then(cache => {
              console.log('Caching app assets');
              return cache.addAll(ASSETS);
          })
  );
});

self.addEventListener('fetch', event => {
  // Skip non-HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
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
                      if (response.ok && event.request.url.startsWith(self.location.origin)) {
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