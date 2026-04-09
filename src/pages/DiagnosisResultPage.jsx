import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { db } from '../db'

export default function DiagnosisResultPage() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState({})

  const category = useLiveQuery(() => db.flow_categories.get(categoryId), [categoryId])
  const nodes = useLiveQuery(
    () => db.flow_nodes.where('categoryId').equals(categoryId).toArray(),
    [categoryId]
  )

  if (!category || !nodes) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  const results = nodes.filter((n) => n.type === 'result')

  const levelColor = {
    easy:   { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  label: '초급' },
    medium: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: '중급' },
    hard:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    label: '고급' },
  }

  function toggle(id) {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="p-4 pb-8">
      {/* 헤더 */}
      <div className="mb-5">
        <button onClick={() => navigate('/diagnosis')} className="text-blue-600 text-sm mb-2 block">
          ← 진단 목록
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <h2 className="text-base font-bold text-gray-900">{category.title}</h2>
        </div>
        <p className="text-xs text-gray-400 mt-1">전체 결과 {results.length}개</p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          아직 결과 노드가 없습니다
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((node) => {
            const lv = levelColor[node.level]
            const isOpen = open[node.nodeId]
            return (
              <div
                key={node.nodeId}
                className="bg-white border border-gray-300 rounded-2xl overflow-hidden"
              >
                {/* 요약 행 */}
                <button
                  onClick={() => toggle(node.nodeId)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 leading-snug">
                      {node.title ?? '(제목 없음)'}
                    </div>
                    {node.conclusion && !isOpen && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{node.conclusion}</div>
                    )}
                  </div>
                  {lv && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${lv.bg} ${lv.text} ${lv.border}`}>
                      {lv.label}
                    </span>
                  )}
                  {isOpen
                    ? <ChevronDown size={16} strokeWidth={1.5} className="text-gray-400 shrink-0" />
                    : <ChevronRight size={16} strokeWidth={1.5} className="text-gray-300 shrink-0" />}
                </button>

                {/* 펼쳐진 상세 */}
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-300 pt-3 space-y-3">

                    {/* 결론 */}
                    {node.conclusion && (
                      <div className="bg-gray-900 rounded-xl p-3">
                        <div className="text-xs font-semibold text-gray-400 mb-1">결론</div>
                        <p className="text-white text-sm leading-relaxed whitespace-pre-line">{node.conclusion}</p>
                      </div>
                    )}

                    {/* 경고 */}
                    {node.warning && (
                      <div className={`rounded-xl p-3 ${
                        node.warningLevel === 'danger'
                          ? 'bg-red-600 border border-red-700'
                          : 'bg-orange-50 border border-orange-300'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            node.warningLevel === 'danger'
                              ? 'bg-white text-red-600'
                              : 'bg-orange-500 text-white'
                          }`}>
                            {node.warningLevel === 'danger' ? '위험' : '주의'}
                          </span>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${
                          node.warningLevel === 'danger' ? 'text-white' : 'text-orange-900'
                        }`}>{node.warning}</p>
                      </div>
                    )}

                    {/* 원인 */}
                    {(node.causes ?? []).length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1.5">원인</div>
                        <ul className="space-y-1">
                          {node.causes.map((c, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-700 bg-red-50 rounded-lg px-3 py-2">
                              <span className="text-red-400 font-bold shrink-0">{i + 1}</span>
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 수리 절차 */}
                    {(node.steps ?? []).length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-500 mb-1.5">수리 절차</div>
                        <ol className="space-y-1">
                          {node.steps.map((s, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2">
                              <span className="text-blue-400 font-bold shrink-0">{i + 1}</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
