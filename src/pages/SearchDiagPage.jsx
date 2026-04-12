import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ChevronDown, ChevronUp, Zap, AlertTriangle, Info, ArrowLeft } from 'lucide-react'
import searchDb from '../data/searchDatabase.json'

const POPULAR = [
  '고압트립', '착상', '냉각불량', '압축기소음', '차단기트립', '냉매부족',
  '팬불량', '액백', '결로', '헌팅', '오일부족', '과열', '저압',
  '진동', '냉매누설', '기동불량', '제상불량', '드레인막힘', '인버터오류',
  '브레이징', '과열도', '과냉도', '절연불량', '결상', '역회전',
  '스크롤', '스크류', '터보', '액압축', '불응축', '진공작업',
  '플레어', '보온', '에어쇼트', '냉각탑', '세관', '암모니아',
  '감전', '산소결핍', 'HACCP', '언로더', 'EEV', 'TXV소음',
]

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

const SYNONYMS = {
  '소리': ['소음', '소리', '잡음', '노이즈'],
  '소음': ['소음', '소리', '잡음', '노이즈'],
  '잡음': ['소음', '소리', '잡음'],
  '새다': ['누설', '누기', '누출', '새'],
  '새는': ['누설', '누기', '누출'],
  '누기': ['누설', '누기', '누출', '새'],
  '누출': ['누설', '누기', '누출'],
  '얼다': ['착상', '결빙', '동결', '얼'],
  '얼음': ['착상', '결빙', '동결'],
  '결빙': ['착상', '결빙', '동결', '얼'],
  '과열': ['과열', '뜨겁', '고온', '열'],
  '뜨겁': ['과열', '고온'],
  '떨림': ['진동', '떨림', '흔들'],
  '흔들': ['진동', '떨림', '흔들'],
  '진동': ['진동', '떨림', '흔들'],
  '안켜': ['기동불량', '기동', '정지', '안켜'],
  '기동': ['기동불량', '기동', '기동안됨'],
  '이상': ['이상', '불량', '고장', '오류'],
  '고장': ['고장', '불량', '오류', '이상'],
  '불량': ['불량', '고장', '오류', '이상'],
  '오류': ['오류', '에러', '고장', '불량'],
  '에러': ['에러', '오류', '고장', '불량'],
  '트립': ['트립', '차단', '보호'],
  '차단': ['트립', '차단', '열림'],
  '냉각': ['냉각', '냉방', '시원'],
  '결로': ['결로', '습기', '물맺힘'],
  '막힘': ['막힘', '막힌', '폐쇄', '드레인'],
  '연기': ['연기', '냄새', '타는'],
  '냄새': ['냄새', '연기', '가스'],
}

function expandWord(word) {
  for (const [key, syns] of Object.entries(SYNONYMS)) {
    if (word.includes(key) || key.includes(word)) return syns
  }
  return [word]
}

const ALL_KEYWORDS = [...new Set(searchDb.entries.flatMap(e => e.keywords ?? []))]

export default function SearchDiagPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const q = query.trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)

  // 입력 중 키워드 추천 (결과 없을 때만)
  const suggestions = q.length >= 1
    ? ALL_KEYWORDS.filter(k => k.toLowerCase().includes(q)).slice(0, 12)
    : []

  const results = words.length === 0 ? [] : searchDb.entries.filter(e => {
    const haystack = [
      e.symptom ?? '',
      ...(e.keywords ?? []),
      ...(e.causes ?? []),
      e.part ?? '',
      ...(e.checks ?? []),
      ...(e.actions ?? []),
    ].join(' ').toLowerCase()

    return words.every(word => {
      const variants = expandWord(word)
      return variants.some(v => haystack.includes(v))
    })
  })

  return (
    <div className="p-4 pb-6">
      <button
        onClick={() => navigate('/diagnosis')}
        className="flex items-center gap-2 w-full py-3 mb-4 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-200 justify-center"
      >
        <ArrowLeft size={18} strokeWidth={2} />
        진단 목록으로 돌아가기
      </button>
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

      {/* 타이핑 중 — 키워드 추천 */}
      {q && suggestions.length > 0 && results.length === 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-400 mb-2">이런 키워드로 검색해봐</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(k => (
              <button
                key={k}
                onClick={() => setQuery(k)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 active:bg-blue-100"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 전 — 자주 찾는 키워드 */}
      {!q && (
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">자주 찾는 증상</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR.map(k => (
              <button
                key={k}
                onClick={() => setQuery(k)}
                className="w-20 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600 shadow-sm active:bg-gray-50 text-center"
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
