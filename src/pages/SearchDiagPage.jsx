import { useState } from 'react'
import { Search, X, ChevronDown, ChevronUp, Zap, AlertTriangle, Info } from 'lucide-react'
import searchDb from '../data/searchDatabase.json'

const PART_TAGS = ['전체', '압축기', '증발기', '응축기', '팽창밸브', '전기계통', '냉매계통', '팬모터', '제어계통']

const POPULAR = ['고압트립', '착상', '냉각불량', '압축기소음', '차단기트립', '냉매부족', '팬불량', '액백', '결로', '헌팅']

const SEVERITY_STYLE = {
  긴급: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', icon: Zap },
  주의: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  일반: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', icon: Info },
}

function ResultCard({ entry }) {
  const [open, setOpen] = useState(false)
  const style = SEVERITY_STYLE[entry.severity] ?? SEVERITY_STYLE['일반']
  const Icon = style.icon

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden`}>
      <button
        className="w-full px-4 py-3 text-left flex items-start justify-between gap-2"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${style.badge}`}>
              <Icon size={10} className="inline mr-0.5" />{entry.severity}
            </span>
            <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">{entry.part}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug">{entry.symptom}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
          {/* 원인 */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">원인</p>
            <ul className="space-y-1">
              {entry.causes.map((c, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400 shrink-0">•</span>{c}
                </li>
              ))}
            </ul>
          </div>
          {/* 점검 */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">점검 방법</p>
            <ol className="space-y-1">
              {entry.checks.map((c, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-gray-400 shrink-0 font-medium">{i+1}.</span>{c}
                </li>
              ))}
            </ol>
          </div>
          {/* 조치 */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">조치</p>
            <ul className="space-y-1">
              {entry.actions.map((a, i) => (
                <li key={i} className="text-sm text-blue-700 flex gap-2">
                  <span className="text-blue-400 shrink-0">→</span>{a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchDiagPage() {
  const [query, setQuery] = useState('')
  const [part, setPart] = useState('전체')

  const q = query.trim().toLowerCase()

  const results = q.length < 1 ? [] : searchDb.entries.filter(e => {
    const matchPart = part === '전체' || e.part === part
    const matchQuery = e.keywords.some(k => k.toLowerCase().includes(q)) ||
      e.symptom.toLowerCase().includes(q) ||
      e.causes.some(c => c.toLowerCase().includes(q))
    return matchPart && matchQuery
  })

  return (
    <div className="p-4 pb-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">증상 검색</h2>
      <p className="text-xs text-gray-400 mb-4">증상·키워드를 입력하면 원인과 조치를 바로 보여줘</p>

      {/* 검색창 */}
      <div className="relative mb-3">
        <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="예) 고압트립, 착상, 딱딱소리, 냉각불량..."
          className="w-full pl-9 pr-9 py-3 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-400 shadow-sm"
          autoFocus
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={14} />
          </button>
        )}
      </div>

      {/* 부품 필터 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {PART_TAGS.map(p => (
          <button
            key={p}
            onClick={() => setPart(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              part === p ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 검색 전 — 자주 찾는 키워드 */}
      {!q && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">자주 찾는 증상</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR.map(k => (
              <button
                key={k}
                onClick={() => setQuery(k)}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600 shadow-sm active:bg-gray-50"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      {q && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">"{query}" 검색 결과 없음</p>
          <p className="text-xs text-gray-400 mt-1">다른 키워드로 검색해봐</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 mb-2">{results.length}개 결과</p>
          {results.map(e => <ResultCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  )
}
