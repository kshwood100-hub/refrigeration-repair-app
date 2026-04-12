// Passthrough service worker — no caching, just keeps PWA installable
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(async () => {
        // 캐시 삭제 후 모든 열린 페이지 강제 새로고침
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach(client => client.navigate(client.url))
      })
  )
})
// No fetch handler → all requests go straight to network
