// Service Worker for Madrasa Sikariya PWA

const CACHE_NAME = 'madrasa-sikariya-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './donation.html',
  './question-and-answer.html',
  './css/style.css',
  './js/main.js',
  './js/script.js',
  './manifest.json',
  './image/icon1.png',
  './image/icon madrsa.jpg',
  './image slide/inside front.jpg',
  './image slide/inside intro.jpg',
  './image slide/inside view.jpg',
  './image slide/inside2.jpg',
  './image slide/inside4.jpg'
];

// Skip waiting and immediately take control
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Skip the waiting phase
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim any clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  // Skip Firebase-related requests to avoid conflicts with firebase-messaging-sw.js
  if (event.request.url.includes('gstatic.com/firebasejs') || 
      event.request.url.includes('googleapis.com/fcm') || 
      event.request.url.includes('firebase-messaging-sw.js')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request and cache the response
        return fetch(fetchRequest).then(
          (response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // If fetch fails, return a fallback response for HTML files
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
