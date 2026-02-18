/* Helio Time Tools - Service Worker (offline-first) */
const CACHE_NAME = "helio-time-tools-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./sw.js"
  // Optional icons you can add later:
  // "./icon-192.png",
  // "./icon-512.png",
  // "./icon-512-maskable.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Same-origin only (avoid caching analytics etc.)
  if (url.origin !== self.location.origin) return;

  // HTML navigation: network-first, fallback to cache
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put("./", fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match("./");
          return cached || caches.match("./index.html");
        }
      })()
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    })()
  );
});
