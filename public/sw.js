// Passthrough service worker — no caching, just keeps PWA installable
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
    // client.navigate() 제거 — main.jsx의 controllerchange가 reload 담당
  )
})
// No fetch handler → all requests go straight to network
