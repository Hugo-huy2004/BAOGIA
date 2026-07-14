// RETIRED legacy Joy-PWA service worker.
//
// The old version cache-first-served "/" and "/index.html" forever, so any
// browser that ever registered it kept serving a stale index.html (and thus a
// stale JS bundle) after every deploy — the installed app "opened broken".
// The live PWA worker is now vite-plugin-pwa's "/sw.js"; nothing registers this
// file anymore.
//
// This self-destroying version makes any *lingering* old registration clean
// itself up: on its next update check the browser fetches this script, which
// deletes the old caches, unregisters itself, and reloads open clients so the
// current "/sw.js" takes control. Safe no-op for browsers that never had it.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('joy-pwa')).map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }
    try { await self.registration.unregister(); } catch (e) { /* ignore */ }
    try {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    } catch (e) { /* ignore */ }
  })());
});

// No fetch handler on purpose — must NOT intercept/serve anything anymore.
