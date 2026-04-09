import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Pencil, MapPin, Tag } from 'lucide-react'
import { db } from '../db'

export default function KnowhowDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const item = useLiveQuery(() => db.knowhow.get(Number(id)), [id])

  if (!item) return <div className="p-4 text-gray-400 text-sm">불러오는 중...</div>

  return (
    <div className="p-4 pb-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/knowhow')} className="flex items-center gap-1 text-gray-500">
          <ChevronLeft size={18} strokeWidth={1.5} />
          <span className="text-sm">목록</span>
        </button>
        <button
          onClick={() => navigate(`/knowhow/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-700"
        >
          <Pencil size={12} strokeWidth={1.5} />
          수정
        </button>
      </div>

      <div className="space-y-3">

        {/* 제목 + 분류 */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3 leading-snug">{item.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              {item.category}
            </span>
            {item.location && item.location !== '기타' && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                <MapPin size={10} strokeWidth={1.5} />
                {item.location}
              </span>
            )}
          </div>
        </div>

        {/* 설비 종류 */}
        {item.equipType && (
          <Card title="설비 종류">
            <div className="flex flex-wrap gap-1.5">
              {item.equipType.split(',').map((e) => e.trim()).filter(Boolean).map((e) => (
                <span key={e} className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {e}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 증상 키워드 */}
        {item.symptoms && (
          <Card title="증상 키워드">
            <div className="flex flex-wrap gap-1.5">
              {item.symptoms.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
                  <Tag size={10} strokeWidth={1.5} />
                  {s}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 원인 */}
        {item.cause && (
          <Card title="원인">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.cause}</p>
          </Card>
        )}

        {/* 점검 순서 */}
        {item.checkSteps && (
          <Card title="점검 순서">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.checkSteps}</p>
          </Card>
        )}

        {/* 해결 방법 */}
        {item.solution && (
          <Card title="해결 방법">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.solution}</p>
          </Card>
        )}

        {/* 교체 부품 */}
        {item.parts && (
          <Card title="교체 부품">
            <p className="text-sm text-gray-800">{item.parts}</p>
          </Card>
        )}

        {/* 추가 메모 */}
        {item.notes && (
          <Card title="추가 메모">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes}</p>
          </Card>
        )}

        {/* 날짜 */}
        <p className="text-xs text-gray-300 text-center pt-2">
          {item.updatedAt?.slice(0, 10)} 기록
        </p>

      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}
