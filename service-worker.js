const CACHE_NAME = 'h5retroos-cache-v1.0.0'; // Synchronizováno s CURRENT_VERSION v index.html
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/lucide@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
];

// Instalace - uložení základních souborů do cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('H5RetroOS: Cache opened');
        // Používáme atomické přidání do cache
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Vynutí aktivaci nové verze ihned
  );
});

// Aktivace - vyčištění starých verzí cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Pokud je cache jméno jiné než aktuální verze, smažeme ji
          if (cacheName !== CACHE_NAME) {
            console.log('H5RetroOS: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Okamžitě převezme kontrolu nad otevřenými okny
  );
});

// Fetching - strategie: nejdřív cache, pak síť
self.addEventListener('fetch', (event) => {
  // Ignorujeme blob: a data: URL (které vytváříš pro aplikace v index.html)
  if (event.request.url.startsWith('blob:') || event.request.url.startsWith('data:')) {
    return;
  }

  // Ignorujeme externí skripty s parametry, které chceme mít vždy čerstvé
  if (event.request.url.includes('?v=')) {
    // Tady by se dalo implementovat Network-First, ale pro jednoduchost jdeme standardně
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Pokud je v cache, vrátíme ho, jinak jdeme na síť
        return response || fetch(event.request).catch(() => {
          console.log('H5RetroOS: Fetch failed, and not in cache.');
        });
      })
  );
});