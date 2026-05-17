import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Mic, Wrench, ClipboardList, Sparkles } from 'lucide-react'

export default function KnowhowPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="p-4 pb-6 flex flex-col min-h-[80vh]">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-900">{t('knowhow.title')}</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <div className="w-20 h-20 mb-6 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
          <Wrench size={38} strokeWidth={2} className="text-white" />
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug whitespace-pre-line">
          {t('knowhow.emptyTitle')}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-1.5 whitespace-pre-line">
          {t('knowhow.emptyDesc')}
        </p>
        <p className="text-xs text-gray-400 mb-8">
          {t('knowhow.emptyAiDesc')}
        </p>

        <div className="w-full space-y-4">
          <div>
            <button
              onClick={() => navigate('/knowhow/new')}
              className="w-full py-3.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md active:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Plus size={16} strokeWidth={2.2} />
              {t('knowhow.firstRecord')}
            </button>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {t('knowhow.firstRecordSubtitle')}
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate('/voice-memo')}
              className="w-full py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md active:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Mic size={16} strokeWidth={1.8} />
              {t('customer.voiceQuickRecord')}
            </button>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {t('knowhow.voiceQuickSubtitle')}
            </p>
          </div>

          <div>
            <button
              onClick={() => navigate('/knowhow/list')}
              className="w-full py-3.5 bg-violet-600 text-white text-sm font-semibold rounded-xl shadow-md active:bg-violet-700 flex items-center justify-center gap-2"
            >
              <ClipboardList size={16} strokeWidth={1.8} />
              {t('knowhow.openServiceList')}
            </button>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {t('knowhow.openServiceListSubtitle')}
            </p>
          </div>

          {/* AI 진단 리스트 (격리 = 별도 라우트) */}
          <div>
            <button
              onClick={() => navigate('/knowhow/ai-list')}
              className="w-full py-3.5 bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-md active:bg-amber-700 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} strokeWidth={1.8} />
              {t('knowhow.openAiList')}
            </button>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {t('knowhow.openAiListSubtitle')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
