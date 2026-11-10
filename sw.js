const CACHE_NAME = "dongdong-ledger-v10.0.0";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./styles.css?v=10.0.0",
  "./app.js",
  "./app.js?v=10.0.0",
  "./manifest.webmanifest",
  "./vendor/xlsx.full.min.js",
  "./vendor/zip/zip.min.js",
  "./vendor/tesseract/tesseract.min.js",
  "./assets/avatar.svg",
  "./assets/avatar-192.png",
  "./assets/avatar-512.png",
  "./assets/avatar-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => (key.startsWith("dongdong-ledger-") || key.startsWith("xiaoman-ledger-")) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request, request.mode === "navigate" ? { cache: "no-cache" } : undefined)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("离线状态下暂时无法打开这个资源", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      })
  );
});