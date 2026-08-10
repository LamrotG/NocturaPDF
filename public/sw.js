/* NocturaPDF Service Worker — offline-first PWA.
 *
 * Strategy:
 *  - App shell (same-origin static assets) → cache-first with runtime caching.
 *  - Cross-origin (Supabase API, Google auth) → network-first, never cached
 *    (auth responses must stay fresh; PDFs fetched from Supabase storage are
 *    streamed and not stored in the cache to avoid quota issues).
 *  - Navigation requests (/, /app, /about, …) → network-first with cache
 *    fallback to /index.html so the SPA shell loads offline.
 *  - Caches are versioned so a new deploy discards stale entries.
 *
 * Responsibilities are separated:
 *   Service Worker → application assets / app shell
 *   IndexedDB      → user documents / metadata / reading state / annotations
 *   OPFS           → local PDF binaries
 */

const CACHE_VERSION = "nocturapdf-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;

const APP_SHELL_PATHS = [
  "/",
  "/app",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

// Same-origin GET requests that are part of the app shell or emitted by the
// Vite build (JS/CSS chunks, fonts, images).
function isAppShellRequest(request) {
  const url = new URL(request.url);
  if (url.origin !== location.origin) return false;
  if (request.method !== "GET") return false;

  const path = url.pathname;
  if (APP_SHELL_PATHS.includes(path)) return true;
  return (
    path.startsWith("/assets/") ||
    path.endsWith(".js") ||
    path.endsWith(".css") ||
    path.endsWith(".svg") ||
    path.endsWith(".png") ||
    path.endsWith(".woff2") ||
    path.endsWith(".woff")
  );
}

// Any same-origin navigation (SPA route) falls back to cached index.html.
function isNavigationRequest(request) {
  return request.mode === "navigate";
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_PATHS))
      .catch(() => {
        // If pre-cache fails (e.g. offline first install), the runtime
        // caching paths below will still populate the cache on next visit.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("nocturapdf-") && key !== APP_SHELL_CACHE)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and browser-extension requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache Supabase storage PDF blobs (streamed by the browser as-is).
  // Never cache auth endpoints — responses contain session tokens.
  if (
    url.hostname.includes("supabase") ||
    url.hostname.includes("google") ||
    url.hostname.includes("github") ||
    url.hostname.includes("oauth")
  ) {
    return;
  }

  // Navigation requests (SPA routes) — network-first, fall back to cached
  // index.html so the app shell is always available offline.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put("/index.html", clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/index.html"))
        )
    );
    return;
  }

  if (!isAppShellRequest(request)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          // Only cache valid responses of the same origin.
          if (response && response.ok && url.origin === location.origin) {
            const clone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});