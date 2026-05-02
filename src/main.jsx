import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import i18n from './i18n'
import './index.css'

const applyLang = (lng) => {
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng || 'ko'
}
applyLang(i18n.language)
i18n.on('languageChanged', applyLang)

// Sentry 에러 추적 (프로덕션에서만 활성화)
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'https://c78052ab20bdbb645970648a571da261@o4511249301372928.ingest.us.sentry.io/4511249308581888',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  })
}

// 테마를 React 렌더링 전에 적용 (깜빡임 방지)
;(function() {
  try {
    const s = JSON.parse(localStorage.getItem('rfg_settings') || '{}')
    let theme = s.theme || 'dark'
    if (theme === 'lavender') theme = 'dark'  // 폐기된 테마 자동 폴백
    const fontSize = s.fontSize || 'medium'
    const cls = [`theme-${theme}`]
    if (fontSize !== 'medium') cls.push(`font-${fontSize === 'large' ? 'large' : 'xlarge'}`)
    document.documentElement.className = cls.join(' ')
  } catch (e) {
    document.documentElement.className = 'theme-dark'
  }
})()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
    // 1) 등록 직후 즉시 업데이트 체크 — 앱 처음 켤 때 최신 버전 확보
    reg.update().catch(() => {})

    // 2) 앱이 포그라운드로 돌아올 때 업데이트 체크
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update().catch(() => {})
    })

    // 3) 앱을 오래 켜둔 사용자(현장)도 놓치지 않도록 30분마다 체크
    setInterval(() => { reg.update().catch(() => {}) }, 30 * 60 * 1000)

    // 이미 대기 중인 SW가 있으면 즉시 활성화 (사용자 조작 없이 자동)
    if (reg.waiting && navigator.serviceWorker.controller) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    // 새 SW 설치 완료 → 즉시 자동 활성화 (배너·버튼 없음)
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    })
  }).catch(() => {})

  // 새 SW가 활성화되면 자동 새로고침 (구매자는 아무것도 안 해도 최신 버전)
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
