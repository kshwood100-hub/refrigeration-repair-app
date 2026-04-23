import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import i18n from './i18n'
import './index.css'
import { initAlarms } from './utils/alarmManager'

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
    const theme = s.theme || 'dark'
    const fontSize = s.fontSize || 'medium'
    const cls = [`theme-${theme}`]
    if (fontSize !== 'medium') cls.push(`font-${fontSize === 'large' ? 'large' : 'xlarge'}`)
    document.documentElement.className = cls.join(' ')
  } catch (e) {
    document.documentElement.className = 'theme-dark'
  }
})()

// 앱 시작 시 알람 초기화 (권한 요청 + 오늘 일정 알람 예약)
initAlarms()

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
    // 앱이 포그라운드로 돌아올 때 업데이트 체크
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') reg.update()
    })
    // 이미 대기 중인 SW가 있다면 즉시 알림
    if (reg.waiting && navigator.serviceWorker.controller) {
      window.__swWaiting = reg.waiting
      window.dispatchEvent(new CustomEvent('sw-update-available'))
    }
    // 새 SW 설치 감지 → 사용자에게 알림 이벤트 발행 (App 쪽에서 배너 표시)
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing
      if (!newWorker) return
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          window.__swWaiting = newWorker
          window.dispatchEvent(new CustomEvent('sw-update-available'))
        }
      })
    })
  }).catch(() => {})

  // 사용자가 업데이트 수락 → 새 SW 활성화 → 자동 새로고침
  navigator.serviceWorker.addEventListener('controllerchange', () => {
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
