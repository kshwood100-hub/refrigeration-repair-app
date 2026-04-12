import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './i18n'
import './index.css'

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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
  // 새 서비스워커가 활성화되면 자동 새로고침
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
