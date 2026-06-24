import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Search, Sparkles, Trash2, X } from 'lucide-react'
import { db } from '../db'
import { showToast } from '../utils/toast'
import ConfirmModal from '../components/ConfirmModal'

// AI 진단 리스트 — 사용자가 [도움됨] 박은 AI 진단 결과만 저장
// 격리: 일반 설비기록·거래처·AS와 데이터 흐름 없음
export default function AiDiagnosisListPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const memoRef = useRef(null)

  const items = useLiveQuery(
    () => db.ai_diagnosis_list
      .orderBy('createdAt').reverse()
      .filter((r) => !r.deletedAt)
      .toArray(),
    []
  )

  const filtered = (items ?? []).filter((it) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (it.userText || '').toLowerCase().includes(q)
        || (it.rawResponse || '').toLowerCase().includes(q)
        || (it.userMemo || '').toLowerCase().includes(q)
  })

  async function confirmDelete() {
    const id = pendingDeleteId
    if (id == null) return
    setPendingDeleteId(null)
    const now = new Date().toISOString()
    await db.ai_diagnosis_list.update(id, { deletedAt: now, updatedAt: now })
    showToast(t('aiList.deleted'))
    if (selected?.id === id) setSelected(null)
  }

  async function handleMemoSave() {
    if (!selected) return
    const memo = memoRef.current?.value ?? ''
    await db.ai_diagnosis_list.update(selected.id, {
      userMemo: memo,
      updatedAt: new Date().toISOString(),
    })
    showToast(t('aiList.memoSaved'))
    setSelected({ ...selected, userMemo: memo })
  }

  return (
    <div className="p-4 pb-10">
      <button
        onClick={() => navigate('/knowhow')}
        className="flex items-center justify-center gap-2 w-full py-3 mb-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
      >
        <ChevronLeft size={18} strokeWidth={2} />
        {t('common.back')}
      </button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={20} strokeWidth={2} className="text-amber-600" />
        <h1 className="text-lg font-bold text-gray-900">{t('aiList.title')}</h1>
        <span className="ml-auto text-xs text-gray-500">{filtered.length}{t('aiList.unit')}</span>
      </div>

      {/* 검색 */}
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" strokeWidth={1.5} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('aiList.searchPlaceholder')}
          className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-300 rounded-xl outline-none focus:border-amber-500"
        />
      </div>

      {/* 신규 진단 진입 */}
      <button
        onClick={() => navigate('/diagnosis/ai')}
        className="w-full flex items-center justify-center gap-2 py-3 mb-3 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-emerald-700"
      >
        <Sparkles size={16} strokeWidth={2} />
        {t('aiList.newDiagnosis')}
      </button>

      {/* 리스트 */}
      {(!items || items.length === 0) ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mt-4">
          <Sparkles size={32} strokeWidth={1.5} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t('aiList.empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((it) => (
            <div
              key={it.id}
              className="bg-white border-2 border-gray-300 rounded-xl p-3 shadow-sm"
            >
              <div
                onClick={() => setSelected(it)}
                className="cursor-pointer active:bg-gray-50 -m-3 p-3 rounded-xl"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
                    {it.userText}
                  </p>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {new Date(it.createdAt).toLocaleDateString(i18n.language)}
                  {it.photoData && <span className="ml-2">📷</span>}
                  {it.userMemo && <span className="ml-2">📝</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Sparkles size={18} strokeWidth={2} className="text-amber-600" />
                <p className="font-semibold text-gray-900">{t('aiList.detailTitle')}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 active:text-gray-600"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {selected.photoData && (
                <img
                  src={selected.photoData}
                  alt=""
                  className="w-full max-h-60 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
                />
              )}

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{t('aiList.userTextLabel')}</p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 whitespace-pre-wrap">
                  {selected.userText}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{t('aiList.resultLabel')}</p>
                <pre className="bg-white border-2 border-gray-300 rounded-lg p-3 text-sm text-gray-900 whitespace-pre-wrap break-words font-sans leading-relaxed">
                  {selected.rawResponse}
                </pre>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">{t('aiList.memoLabel')}</p>
                <textarea
                  ref={memoRef}
                  key={selected.id}
                  defaultValue={selected.userMemo || ''}
                  placeholder={t('aiList.memoPlaceholder')}
                  rows={3}
                  className="w-full text-sm text-gray-900 outline-none resize-y min-h-[5rem] border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-amber-500 [field-sizing:content]"
                />
                <button
                  onClick={handleMemoSave}
                  className="w-full py-2.5 mt-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-blue-700"
                >
                  {t('aiList.memoSave')}
                </button>
              </div>

              <button
                onClick={() => setPendingDeleteId(selected.id)}
                className="w-full py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl shadow-md active:bg-red-700 flex items-center justify-center gap-2"
              >
                <Trash2 size={14} strokeWidth={2} />
                {t('aiList.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteId != null && (
        <ConfirmModal
          message={t('aiList.deleteConfirm')}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  )
}
