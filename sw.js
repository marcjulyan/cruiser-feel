// Offline shell for the shift-feel buttons: the page opens with no signal.
// Same-origin GETs only (ntfy traffic is never touched). Cache first, refreshed in the
// background, so an update arrives on the next open.
const CACHE = "shift-feel-v4";
const SHELL = ["./", "index.html", "manifest.json", "icon-180.png", "icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = u.pathname.endsWith("/") ? "./" : e.request;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || new Response("offline", { status: 503 });
  }));
});
