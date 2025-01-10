const CACHE_NAME = 'abacus-v1';
const ASSETS = [
    './',
    './index.html',
    './favicon.ico',
  
  // CSS Files
  '/arithmetic.css',
  '/game.css',
  '/positions.css',
  '/styles.css',
  '/tutorial.css',
  
  // JavaScript Files
  '/addition.js',
  '/arithmetic.js',
  '/game.js',
  '/language-selector.js',
  '/movements.js',
  '/script.js',
  '/subtraction.js',
  '/tutorial.js',
  '/translations.js',
  
  // Assets and Icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/desktop.png',
  '/screenshots/mobile.png',
  
  // Configuration Files
  '/manifest.json',
  
  // Documentation (if needed for offline access)
  '/ADDITION.md',
  '/SUBTRACTION.md',
  '/README.md',
  '/translation.csv'
];

// Install event - cache all required assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS);
    })
  );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Cache the network response for future
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, response.clone());
                return response;
              });
          });
      })
  );
});
