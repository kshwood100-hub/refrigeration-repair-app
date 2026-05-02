import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { Plus, Search, X, ChevronRight, MapPin, Tag, Trash2, Clock, Mic } from 'lucide-react'
import { db } from '../db'
import { softDelete } from '../utils/cloudSync'

const CATEGORIES = ['전체', '압축기', '냉매계통', '전기/제어', '팬/모터', '착상/제상', '결로/배수', '소음/진동', '냉각불량', '오일계통', '기타']
const CAT_KEYS = {
  '전체': 'knowhow.catAll', '압축기': 'knowhow.catCompressor', '냉매계통': 'knowhow.catRefrigerant',
  '전기/제어': 'knowhow.catElectrical', '팬/모터': 'knowhow.catFan', '착상/제상': 'knowhow.catDefrost',
  '결로/배수': 'knowhow.catDrain', '소음/진동': 'knowhow.catNoise', '냉각불량': 'knowhow.catCooling',
  '오일계통': 'knowhow.catOil', '기타': 'knowhow.catOther',
}

export default function KnowhowPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [cat, setCat]       = useState('전체')
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  async function handleDelete(id) {
    await softDelete('knowhow', id)
    setDeleteTarget(null)
  }

  const items = useLiveQuery(
    () => db.knowhow.orderBy('updatedAt').reverse().filter((r) => !r.deletedAt).toArray(), []
  )

  if (!items) return <div className="p-4 text-gray-400 text-sm">{t('knowhow.loading')}</div>

  const filtered = items.filter((k) => {
    const matchCat = cat === '전체' || k.category === cat
    const q = search.trim().toLowerCase()
    const matchSearch = !q || [k.title, k.symptoms, k.cause, k.solution, k.parts, k.notes, k.systemType]
      .filter(Boolean)
      .some((f) => f.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  // 노하우가 없을 때 — 안내 화면
  if (items.length === 0) {
    return (
      <div className="p-4 pb-6 flex flex-col min-h-[80vh]">
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900">{t('knowhow.title')}</h2>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-5xl mb-6">🔧</div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug whitespace-pre-line">
            {t('knowhow.emptyTitle')}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-2 whitespace-pre-line">
            {t('knowhow.emptyDesc')}
          </p>
          <p className="text-xs text-gray-400 mb-10">
            {t('knowhow.emptyAiDesc')}
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/knowhow/new')}
              className="w-full py-3.5 bg-slate-500 text-white text-sm font-semibold rounded-xl shadow-md active:bg-slate-600"
            >
              {t('knowhow.firstRecord')}
            </button>
            <button
              onClick={() => navigate('/voice-memo')}
              className="w-full py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <Mic size={16} strokeWidth={1.8} />
              {t('customer.voiceQuickRecord')}
            </button>
            <button
              onClick={() => navigate('/service', { state: { tab: 'completed', aiExtractMode: true } })}
              className="w-full py-3.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-xl border border-gray-300"
            >
              {t('knowhow.extractFromService')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{t('knowhow.title')}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('knowhow.countDesc', { count: items.length })}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => navigate('/voice-memo')}
            className="flex items-center gap-1 px-2.5 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg border-2 border-blue-300 shadow-sm active:bg-blue-700"
            aria-label={t('customer.offlineVoiceTitle')}
          >
            <Mic size={14} strokeWidth={2} />
            <span>{t('customer.offlineVoiceTitle')}</span>
          </button>
          <button
            onClick={() => navigate('/knowhow/new')}
            className="flex items-center gap-1 px-2.5 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg border-2 border-gray-400 shadow-sm active:bg-gray-700"
            aria-label={t('knowhow.directEntry')}
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>{t('knowhow.directEntry')}</span>
          </button>
        </div>
      </div>

      {/* 검색창 */}
      <div className="relative mb-1">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('knowhow.searchPlaceholder')}
          className="w-full pl-8 pr-8 py-2.5 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:border-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3 px-1">{t('knowhow.searchScopeHint')}</p>

      {/* 카테고리 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              cat === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t(CAT_KEYS[c] ?? c)}
          </button>
        ))}
      </div>

      {/* 검색 결과 없음 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 mb-1">{t('knowhow.noResult', { query: search || t(CAT_KEYS[cat] ?? cat) })}</p>
          <p className="text-xs text-gray-400">{t('knowhow.noResultHint')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((k) => (
            <div
              key={k.id}
              className="relative bg-white border border-gray-300 rounded-lg shadow-sm"
            >
            <button
              onClick={() => navigate(`/knowhow/${k.id}`)}
              className="w-full px-3 py-2.5 text-left active:bg-gray-50 rounded-lg"
            >
              {/* 제목 */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 pr-7">
                  {k.sourceJobId && (
                    <span className="inline-block text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded mr-1 align-middle">
                      {t('knowhow.fromService')}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-gray-900 leading-snug align-middle">{k.title}</span>
                </div>
                <ChevronRight size={12} strokeWidth={1.5} className="text-gray-300 shrink-0 mt-0.5" />
              </div>

              {/* 원인 미리보기 */}
              {k.cause && (
                <p className="text-[11px] text-gray-500 line-clamp-1 mb-1">{k.cause}</p>
              )}

              {/* 태그 영역 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                  {t(CAT_KEYS[k.category] ?? k.category)}
                </span>
                {k.equipType && k.equipType.split(',').slice(0, 1).map((e) => e.trim()).filter(Boolean).map((e) => (
                  <span key={e} className="text-[11px] text-gray-500 bg-gray-50 border border-gray-300 px-1.5 py-0.5 rounded">
                    {e}
                  </span>
                ))}
                {k.location && k.location !== '기타' && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400">
                    <MapPin size={9} strokeWidth={1.5} />
                    {k.location}
                  </span>
                )}
                {k.symptoms && k.symptoms.split(',').slice(0, 2).map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="flex items-center gap-0.5 text-[11px] text-gray-400">
                    <Tag size={9} strokeWidth={1.5} />
                    {s}
                  </span>
                ))}
                {k.createdAt && (
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-400 ml-auto">
                    <Clock size={9} strokeWidth={1.5} />
                    {new Date(k.createdAt).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setDeleteTarget(k)}
              className="absolute top-1.5 right-6 p-1 text-gray-300 active:text-red-500"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">{t('knowhow.deleteConfirm')}</p>
            <p className="text-sm text-gray-400 mb-5">{t('knowhow.deleteDesc')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                {t('knowhow.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
              >
                {t('knowhow.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
