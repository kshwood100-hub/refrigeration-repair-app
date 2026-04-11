import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { FAILURE_CASES, ERROR_CODES, PM_CHECKLIST } from '../data/failureCases'

const TAB_EXTRA = [
  { id: 'error', label: '에러코드' },
  { id: 'pm', label: 'PM 체크리스트' },
]

const PM_LABELS = {
  daily: '일상 점검',
  monthly: '월간 점검',
  quarterly: '분기 점검',
  annual: '연간 점검',
}

export default function FailureCasesPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(FAILURE_CASES[0].id)
  const [openSections, setOpenSections] = useState({})
  const [openCases, setOpenCases] = useState({})
  const [pmSub, setPmSub] = useState('daily')

  function toggleSection(id) {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleCase(id) {
    setOpenCases(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const allTabs = [
    ...FAILURE_CASES.map(c => ({ id: c.id, label: c.icon + ' ' + c.title })),
    ...TAB_EXTRA,
  ]

  const currentCat = FAILURE_CASES.find(c => c.id === tab)

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-200 shrink-0">
        <button onClick={() => navigate('/knowhow')} className="text-gray-500 active:text-gray-700">
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">고장사례 가이드</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-1.5 overflow-x-auto px-3 py-2 bg-white border-b border-gray-200 shrink-0 scrollbar-hide">
        {allTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* 에러코드 탭 */}
        {tab === 'error' && (
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-400 mb-2">범용 에러코드 — 제조사별 상이할 수 있음</p>
            {ERROR_CODES.map(ec => (
              <div key={ec.code} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCase(ec.code)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded shrink-0">
                      {ec.code}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">{ec.meaning}</span>
                  </div>
                  {openCases[ec.code]
                    ? <ChevronDown size={15} className="text-gray-400 shrink-0" />
                    : <ChevronRight size={15} className="text-gray-400 shrink-0" />
                  }
                </button>
                {openCases[ec.code] && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">원인</p>
                      <p className="text-sm text-gray-700">{ec.cause}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">조치</p>
                      <p className="text-sm text-gray-700">{ec.solution}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PM 체크리스트 탭 */}
        {tab === 'pm' && (
          <div className="p-4">
            <div className="flex gap-1.5 mb-4">
              {Object.keys(PM_LABELS).map(k => (
                <button
                  key={k}
                  onClick={() => setPmSub(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    pmSub === k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {PM_LABELS[k]}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {PM_CHECKLIST[pmSub].map((entry, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className="w-5 h-5 rounded border border-gray-300 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{entry.item}</p>
                    <p className="text-xs text-gray-500 mt-0.5">확인: {entry.check}</p>
                    <p className="text-xs text-blue-600 mt-0.5">조치: {entry.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장비 카테고리 탭 */}
        {currentCat && (
          <div className="p-4 space-y-3">
            {currentCat.sections.map(section => (
              <div key={section.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* 섹션 헤더 */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50"
                >
                  <span className="text-sm font-semibold text-gray-800">{section.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{section.cases.length}건</span>
                    {openSections[section.id]
                      ? <ChevronDown size={15} className="text-gray-400" />
                      : <ChevronRight size={15} className="text-gray-400" />
                    }
                  </div>
                </button>

                {/* 케이스 목록 */}
                {openSections[section.id] && (
                  <div className="divide-y divide-gray-100">
                    {section.cases.map(c => (
                      <div key={c.id}>
                        <button
                          onClick={() => toggleCase(c.id)}
                          className="w-full flex items-start justify-between gap-2 px-4 py-3 text-left active:bg-gray-50"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-blue-600 font-medium">{c.code}</span>
                            <p className="text-sm font-medium text-gray-800 mt-0.5 leading-snug">{c.title}</p>
                          </div>
                          {openCases[c.id]
                            ? <ChevronDown size={14} className="text-gray-400 shrink-0 mt-1" />
                            : <ChevronRight size={14} className="text-gray-400 shrink-0 mt-1" />
                          }
                        </button>

                        {openCases[c.id] && (
                          <div className="px-4 pb-4 space-y-3 border-t border-gray-100 bg-gray-50">
                            {/* 원인 */}
                            <div className="mt-3">
                              <p className="text-xs font-bold text-red-600 mb-2">▶ 원인</p>
                              <ul className="space-y-1">
                                {c.causes.map((cause, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                                    <span className="text-red-400 shrink-0">•</span>
                                    <span>{cause}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* 조치 */}
                            <div>
                              <p className="text-xs font-bold text-blue-600 mb-2">▶ 조치 방법</p>
                              <ul className="space-y-1">
                                {c.solutions.map((sol, i) => (
                                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                                    <span className="text-blue-400 shrink-0 font-semibold">{i + 1}.</span>
                                    <span>{sol}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* 팁 */}
                            {c.tip && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                <p className="text-xs text-amber-800 leading-relaxed">
                                  <span className="font-bold">💡 현장 팁: </span>{c.tip}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
