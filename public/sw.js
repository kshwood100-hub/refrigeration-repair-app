// R-Pro Service Worker — __SW_VERSION__ (빌드 시 자동 교체)
// 사용자 승인 후 활성화 — 폼 작성 중 데이터 유실 방지
self.addEventListener('install', () => {
  // skipWaiting은 자동으로 하지 않음 — 클라이언트에서 postMessage로 요청 시에만
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// 페이지 이동(navigation) 요청은 항상 서버에서 가져옴 — 브라우저 캐시 우회
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => fetch('/index.html', { cache: 'no-store' }))
    )
  }
})

// 알림 클릭 → 앱 열기 + 해당 페이지로 이동
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const rel = (event.notification.data && event.notification.data.url) || '/alarms'
  const absUrl = new URL(rel, self.location.origin).href
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    // 이미 열린 앱 창이 있으면 포커스 + 해당 URL로 이동
    for (const client of clients) {
      try { await client.focus() } catch (e) {}
      if ('navigate' in client) {
        try { await client.navigate(absUrl) } catch (e) {}
      }
      return
    }
    // 열린 창 없으면 새로 엶
    if (self.clients.openWindow) {
      await self.clients.openWindow(absUrl)
    }
  })())
})
