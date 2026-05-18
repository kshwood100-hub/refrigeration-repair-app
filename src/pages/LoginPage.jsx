import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, ExternalLink, Copy } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /KAKAOTALK|NAVER|Line|Instagram|FBAN|FBAV|FB_IAB|Snapchat|Twitter|Band|DaumApps|wv\)/i.test(ua)
}

export default function LoginPage() {
  const { t } = useTranslation()
  const { loginWithGoogle, loginError, clearLoginError } = useAuth()
  const [copied, setCopied] = useState(false)
  const inApp = isInAppBrowser()

  const handleLogin = async () => {
    if (clearLoginError) clearLoginError()
    try {
      await loginWithGoogle()
      // signInWithRedirect 사용 시 즉시 페이지 전환됨. 아래 코드 도달 X (정상)
    } catch (e) {
      // signInWithRedirect 자체 실패 (네트워크·차단 등)는 매우 드물지만 처리
      console.warn('Login start failed:', e?.message)
    }
  }

  const openExternal = () => {
    const url = window.location.href
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      const host = url.replace(/^https?:\/\//, '')
      window.location.href = `intent://${host}#Intent;scheme=https;package=com.android.chrome;end`
    } else {
      window.location.href = url
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen px-6"
      style={{ backgroundColor: 'var(--app-bg)' }}>
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          R-Pro
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('login.subtitle')}
        </p>
      </div>

      {inApp && (
        <div className="w-full max-w-xs mb-5 p-4 rounded-xl bg-amber-50 border border-amber-300">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={18} strokeWidth={2} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-900">{t('login.inAppBrowserTitle')}</p>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">{t('login.inAppBrowserDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openExternal}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg active:bg-blue-700"
            >
              <ExternalLink size={13} strokeWidth={2} />
              {t('login.openInChrome')}
            </button>
            <button
              onClick={copyUrl}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white border border-gray-300 text-gray-700 rounded-lg active:bg-gray-50"
            >
              <Copy size={13} strokeWidth={2} />
              {copied ? t('login.copied') : t('login.copyUrl')}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleLogin}
        className="flex items-center gap-3 px-6 py-3 rounded-xl border bg-white text-gray-700 font-medium shadow-sm hover:shadow-md transition-shadow w-full max-w-xs justify-center"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          className="w-5 h-5"
        />
        {t('login.google')}
      </button>

      {loginError && (
        <p className="mt-4 text-sm text-red-500 text-center">{loginError}</p>
      )}
    </div>
  )
}
