/*
 * Service worker de l'atelier : une coquille hors ligne, rien de plus.
 * - Les pages de l'atelier : réseau d'abord, copie de secours si hors ligne
 *   (les pages ne contiennent aucune donnée : tout arrive par /api/).
 * - /_astro/ (fichiers à empreinte) : cache, puis réseau.
 * - /api/ : JAMAIS intercepté ni mis en cache.
 */
const CACHE = 'atelier-coquille-v1';
const PAGES = ['/atelier-mqu3gf/', '/atelier-mqu3gf/photo-accueil/', '/atelier-mqu3gf/creations/', '/atelier-mqu3gf/informations/',
  '/atelier-mqu3gf/horaires/', '/atelier-mqu3gf/avis/', '/atelier-mqu3gf/questionnaire/', '/atelier-mqu3gf/aide/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PAGES)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((cles) => Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate' && url.pathname.startsWith('/atelier-mqu3gf/')) {
    e.respondWith(
      fetch(req).then((rep) => {
        if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copie)); }
        return rep;
      }).catch(() => caches.match(url.pathname).then((r) => r || caches.match('/atelier-mqu3gf/'))),
    );
    return;
  }
  if (url.pathname.startsWith('/_astro/')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((rep) => {
      if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
      return rep;
    })));
  }
});
