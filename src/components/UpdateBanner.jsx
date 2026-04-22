import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'

export default function UpdateBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onUpdate = () => setVisible(true)
    window.addEventListener('sw-update-available', onUpdate)
    return () => window.removeEventListener('sw-update-available', onUpdate)
  }, [])

  if (!visible) return null

  const handleRefresh = () => {
    const waiting = window.__swWaiting
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' })
      setTimeout(() => window.location.reload(), 600)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="fixed top-2 left-0 right-0 max-w-lg mx-auto px-3 z-50">
      <div className="bg-blue-600 text-white rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2">
        <RefreshCw size={14} strokeWidth={2} className="shrink-0" />
        <span className="flex-1 text-xs font-medium">{t('common.updateAvailable')}</span>
        <button
          onClick={handleRefresh}
          className="shrink-0 bg-white text-blue-700 font-semibold text-xs px-3 py-1 rounded-lg active:bg-blue-50"
        >
          {t('common.refreshNow')}
        </button>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-white/80 text-xs px-1 active:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
