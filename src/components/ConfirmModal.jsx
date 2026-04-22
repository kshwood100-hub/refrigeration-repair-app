import { useTranslation } from 'react-i18next'

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm text-center shadow-xl">
        <p className="text-sm text-gray-700 mb-5 whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl active:bg-gray-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl active:bg-blue-700"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
