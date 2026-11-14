const scope = new URL(self.registration.scope);
const cachePrefix = `glutnest:${scope.pathname}:`;
const cacheName = `${cachePrefix}v2`;
const appHome = new URL('./index.html', scope);
const shellFiles = [
  './index.html',
  './style.css',
  './app.mjs',
  './game.mjs',
  './stories.mjs',
  './assets/nestbuch.webp',
  './manifest.webmanifest',
  './assets/nest.webp',
  './assets/dragon-awake.webp',
  './assets/dragon-blink.webp',
  './assets/dragon-sleep.webp',
  './assets/icon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
];
const shellPaths = new Set(shellFiles.map((path) => new URL(path, scope).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(
      shellFiles.map((path) => new Request(new URL(path, scope), { cache: 'reload' })),
    )),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(cachePrefix) && key !== cacheName) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;

  const isHome = url.pathname === scope.pathname || url.pathname === appHome.pathname;
  if (request.mode === 'navigate' && isHome) {
    event.respondWith(load(request, appHome.href));
  } else if (shellPaths.has(url.pathname) || url.pathname.startsWith(`${scope.pathname}assets/`)) {
    event.respondWith(load(request, request));
  }
});

async function load(request, cacheKey) {
  let response;
  try {
    response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      try {
        const cache = await caches.open(cacheName);
        await cache.put(cacheKey, copy);
      } catch {
        // Cache storage may be unavailable even when the server responds.
      }
      return response;
    }
    if (response.status < 500) return response;
  } catch {
    // A network failure is expected while playing offline.
  }

  const cached = await (await caches.open(cacheName)).match(cacheKey);
  return cached ?? response ?? Response.error();
}
