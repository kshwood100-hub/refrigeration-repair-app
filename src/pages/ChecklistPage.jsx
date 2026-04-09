import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { db } from '../db'

export default function ChecklistPage() {
  const { t } = useTranslation()
  const templates = useLiveQuery(() => db.checklist_templates.toArray(), [])
  const [selected, setSelected] = useState(null)
  const [checked, setChecked] = useState({})

  if (!templates) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  const toggle = (i) => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  const doneCount = Object.values(checked).filter(Boolean).length
  const total = selected?.items.length ?? 0

  // 목록 화면
  if (!selected) {
    return (
      <div className="p-4 pb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-5">{t('checklist.title')}</h2>
        <div className="space-y-2">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => { setSelected(tmpl); setChecked({}) }}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white border border-gray-300 rounded-xl shadow-sm text-left active:bg-gray-50"
            >
              <div className="flex-1">
                <span className="text-xs font-medium text-gray-400 block mb-0.5">{tmpl.category}</span>
                <span className="text-sm font-medium text-gray-800">{tmpl.title}</span>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{tmpl.items.length}개</span>
              <ChevronRight size={15} strokeWidth={1.5} className="text-gray-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 체크리스트 화면
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  return (
    <div className="p-4 pb-6">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-gray-500"
        >
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">목록</span>
        </button>
        <h2 className="text-base font-semibold text-gray-900 flex-1 truncate">{selected.title}</h2>
      </div>

      {/* 진행률 */}
      <div className="bg-white border border-gray-300 rounded-xl px-4 py-3 shadow-sm mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>진행률</span>
          <span className="font-semibold text-gray-800">{doneCount} / {total}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: pct === 100 ? '#10b981' : '#374151',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs text-emerald-600 font-medium text-center mt-2">
            {t('checklist.allDone')}
          </p>
        )}
      </div>

      {/* 항목 */}
      <div className="space-y-2">
        {selected.items.map((item, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors ${
              checked[i]
                ? 'bg-gray-900 border-gray-900'
                : 'bg-white border-gray-300 shadow-sm'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              checked[i] ? 'border-white bg-white' : 'border-gray-300'
            }`}>
              {checked[i] && <Check size={11} strokeWidth={2.5} className="text-gray-900" />}
            </div>
            <span className={`text-sm flex-1 ${
              checked[i] ? 'text-white line-through opacity-70' : 'text-gray-800'
            }`}>
              {item}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
