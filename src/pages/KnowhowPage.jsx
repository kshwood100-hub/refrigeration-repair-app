import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, X, ChevronRight, MapPin, Tag } from 'lucide-react'
import { db } from '../db'

const CATEGORIES = ['전체', '압축기', '냉매계통', '전기/제어', '팬/모터', '착상/제상', '결로/배수', '소음/진동', '냉각불량', '오일계통', '기타']

export default function KnowhowPage() {
  const navigate = useNavigate()
  const [cat, setCat]       = useState('전체')
  const [search, setSearch] = useState('')

  const items = useLiveQuery(
    () => db.knowhow.orderBy('updatedAt').reverse().toArray(), []
  )

  if (!items) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-semibold text-gray-900">노하우 라이브러리</h2>
          <button
            onClick={() => navigate('/knowhow/new')}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg"
          >
            <Plus size={13} strokeWidth={2} />
            추가
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="text-5xl mb-6">🔧</div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">
            당신의 현장 노하우를<br />저장해 두세요
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            수십 년의 경험은 절대 사라지지 않습니다.<br />
            지금 이 순간의 경험이 훗날<br />
            당신의 진정한 자산으로 돌아옵니다.
          </p>
          <p className="text-xs text-gray-400 mb-10">
            음성으로 말하면 AI가 자동으로 정리해 드립니다.
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => navigate('/knowhow/new')}
              className="w-full py-3.5 bg-gray-900 text-white text-sm font-semibold rounded-xl"
            >
              첫 번째 노하우 기록하기
            </button>
            <button
              onClick={() => navigate('/service')}
              className="w-full py-3.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-xl border border-gray-300"
            >
              수리 의뢰에서 AI로 자동 추출
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
          <h2 className="text-base font-semibold text-gray-900">노하우 라이브러리</h2>
          <p className="text-xs text-gray-400 mt-0.5">{items.length}건의 수리 경험</p>
        </div>
        <button
          onClick={() => navigate('/knowhow/new')}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg"
        >
          <Plus size={13} strokeWidth={2} />
          추가
        </button>
      </div>

      {/* 검색창 */}
      <div className="relative mb-3">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="증상으로 검색 — 예) 딱딱 소리, 냉각 안됨, 트립"
          className="w-full pl-8 pr-8 py-2.5 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:border-gray-400"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* 카테고리 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              cat === c ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 검색 결과 없음 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-gray-500 mb-1">"{search || cat}" 검색 결과 없음</p>
          <p className="text-xs text-gray-400">다른 키워드로 검색해 보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((k) => (
            <button
              key={k.id}
              onClick={() => navigate(`/knowhow/${k.id}`)}
              className="w-full bg-white border border-gray-300 rounded-xl p-4 text-left shadow-sm active:bg-gray-50"
            >
              {/* 제목 */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-900 flex-1 leading-snug">{k.title}</span>
                <ChevronRight size={14} strokeWidth={1.5} className="text-gray-300 shrink-0 mt-0.5" />
              </div>

              {/* 원인 미리보기 */}
              {k.cause && (
                <p className="text-xs text-gray-500 line-clamp-1 mb-2">{k.cause}</p>
              )}

              {/* 태그 영역 */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                  {k.category}
                </span>
                {k.equipType && k.equipType.split(',').slice(0, 1).map((e) => e.trim()).filter(Boolean).map((e) => (
                  <span key={e} className="text-xs text-gray-500 bg-gray-50 border border-gray-300 px-2 py-0.5 rounded-md">
                    {e}
                  </span>
                ))}
                {k.location && k.location !== '기타' && (
                  <span className="flex items-center gap-0.5 text-xs text-gray-400">
                    <MapPin size={9} strokeWidth={1.5} />
                    {k.location}
                  </span>
                )}
                {k.symptoms && k.symptoms.split(',').slice(0, 2).map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="flex items-center gap-0.5 text-xs text-gray-400">
                    <Tag size={9} strokeWidth={1.5} />
                    {s}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
