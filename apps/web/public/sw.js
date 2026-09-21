/*
 * Royal King service worker.
 *
 * What it does:
 *   - Caches public, content-hashed static files (/_next/static/*) and the app
 *     icons so repeat opens are fast on weak mobile data.
 *   - Shows /offline.html when a page can't load because there is no network.
 *
 * What it never does (on purpose):
 *   - Touch /api/* (including /api/auth/*), so ledger data is always live.
 *   - Touch POST/PATCH/DELETE or any other non-GET request, so saves and the
 *     fuel-bill upload go straight to the server.
 *   - Store page HTML, so nothing from one signed-in user can be shown to
 *     another user on a shared phone.
 *   - Touch other origins (Cloudinary images, Google, etc.).
 *
 * Updating: bump VERSION whenever this file's caching behaviour, the offline
 * page or the icons change. The app shows an "Update available" banner and
 * only switches to the new worker when the user taps Reload.
 */

const VERSION = "v1";
const STATIC_CACHE = `rk-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_STATIC_ENTRIES = 200;

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];
const PRECACHE_PATHS = new Set(PRECACHE_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("rk-") && key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      );
      // Lets the browser start the page request while the worker boots.
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkWithOfflineFallback(event));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(event));
  }
  // Anything else (RSC payloads, /manifest.webmanifest, etc.) uses the
  // browser's normal network handling.
});

// Pages: always from the network, never cached. Offline page on network failure.
async function networkWithOfflineFallback(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const offline = await cache.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

// Hashed static files: serve from cache, otherwise fetch once and keep.
async function cacheFirst(event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;

  const response = await fetch(event.request);
  if (response.ok && response.type === "basic") {
    const copy = response.clone();
    event.waitUntil(cache.put(event.request, copy).then(() => trimCache(cache)));
  }
  return response;
}

// Keeps the cache from growing forever as new deploys add new hashed chunks.
// Oldest runtime entries go first; precached files are never removed.
async function trimCache(cache) {
  const keys = await cache.keys();
  const runtimeKeys = keys.filter((request) => !PRECACHE_PATHS.has(new URL(request.url).pathname));
  const excess = runtimeKeys.length - (MAX_STATIC_ENTRIES - PRECACHE_URLS.length);
  for (let i = 0; i < excess; i++) {
    await cache.delete(runtimeKeys[i]);
  }
}
