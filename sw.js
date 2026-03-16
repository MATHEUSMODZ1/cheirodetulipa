const CACHE_NAME = 'cheiro-v3';

const urlsToCache = [
  '/',
  '/index.html',

  '/css/style.css',
  '/js/script.js',

  '/manifest.json',
  '/sw.js',

  '/admin.html',
  '/admin.js',

  '/configuracoes.json',
  '/produtos.json',
  '/logs.json',

  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',

  // Google Fonts
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap',

  // Chart.js
  'https://cdn.jsdelivr.net/npm/chart.js',

  // Google reCAPTCHA
  'https://www.google.com/recaptcha/api.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});