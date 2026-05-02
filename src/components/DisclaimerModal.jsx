import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'

const KEY_PREFIX = 'rfg_disclaimer_acknowledged_v1:'

export default function DisclaimerModal() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const key = user?.email ? KEY_PREFIX + user.email : null

  useEffect(() => {
    if (!key) return
    if (localStorage.getItem(key) !== '1') setOpen(true)
  }, [key])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={20} strokeWidth={2} className="text-amber-500 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900">{t('disclaimer.title')}</h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-3 whitespace-pre-line">
          {t('disclaimer.body1')}
        </p>
        <p className="text-xs text-gray-700 leading-relaxed mb-3 whitespace-pre-line">
          {t('disclaimer.body2')}
        </p>
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 leading-relaxed">
          {t('disclaimer.warn')}
        </p>

        <button
          onClick={() => { if (key) localStorage.setItem(key, '1'); setOpen(false) }}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl active:bg-blue-700"
        >
          {t('disclaimer.acknowledge')}
        </button>
      </div>
    </div>
  )
}
