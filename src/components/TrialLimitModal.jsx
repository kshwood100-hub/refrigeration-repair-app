import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { getCheckoutUrl } from '../utils/checkout'

export default function TrialLimitModal({ category, onClose }) {
  const { t } = useTranslation()
  if (!category) return null
  const checkoutUrl = getCheckoutUrl()

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={20} strokeWidth={2} className="text-amber-500 shrink-0" />
          <h3 className="text-sm font-bold text-gray-900">{t('trial.limitTitle')}</h3>
        </div>

        <p className="text-xs text-gray-700 leading-relaxed mb-3">
          {t('trial.limitBody', { category: t(`trial.cat.${category}`) })}
        </p>
        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4 leading-relaxed">
          {t('trial.subscribeHint')}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl active:bg-gray-200"
          >
            {t('common.close')}
          </button>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl active:bg-blue-700 text-center"
          >
            {t('trial.subscribeCta')}
          </a>
        </div>
      </div>
    </div>
  )
}
