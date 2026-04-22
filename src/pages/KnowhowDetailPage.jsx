import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Pencil, MapPin, Tag } from 'lucide-react'
import { db } from '../db'

export default function KnowhowDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()

  const item = useLiveQuery(() => db.knowhow.get(Number(id)), [id])

  if (!item) return <div className="p-4 text-gray-400 text-sm">{t('knowhow.loading')}</div>

  return (
    <div className="p-4 pb-10">
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-4 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('knowhow.backToList')}
      </button>
      {/* 헤더 */}
      <div className="flex items-center justify-end mb-5">
        <button
          onClick={() => navigate(`/knowhow/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700"
        >
          <Pencil size={12} strokeWidth={1.5} />
          {t('knowhow.edit')}
        </button>
      </div>

      <div className="space-y-3">

        {/* 제목 + 분류 */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-3 leading-snug">{item.title}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg">
              {item.category}
            </span>
            {item.location && item.location !== '기타' && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-300">
                <MapPin size={10} strokeWidth={1.5} />
                {item.location}
              </span>
            )}
          </div>
        </div>

        {/* 장비 사진 */}
        {(item.equipPhotos ?? []).length > 0 && (
          <Card title={t('knowhow.equipPhotos')}>
            <div className="flex gap-2 flex-wrap">
              {item.equipPhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                />
              ))}
            </div>
          </Card>
        )}

        {/* 설비 종류 */}
        {item.equipType && (
          <Card title={t('knowhow.equipType')}>
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
          <Card title={t('knowhow.symptomKeywords')}>
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
          <Card title={t('knowhow.sectionCause')}>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.cause}</p>
          </Card>
        )}

        {/* 점검 순서 */}
        {item.checkSteps && (
          <Card title={t('knowhow.checkStepsLabel')}>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.checkSteps}</p>
          </Card>
        )}

        {/* 해결 방법 */}
        {item.solution && (
          <Card title={t('knowhow.solutionLabel')}>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{item.solution}</p>
          </Card>
        )}

        {/* 교체 부품 */}
        {item.parts && (
          <Card title={t('knowhow.partsLabel')}>
            <p className="text-sm text-gray-800">{item.parts}</p>
          </Card>
        )}

        {/* 추가 메모 */}
        {item.notes && (
          <Card title={t('knowhow.sectionNotes')}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes}</p>
          </Card>
        )}

        {/* 날짜 */}
        <p className="text-xs text-gray-300 text-center pt-2">
          {t('knowhow.dateLabel', { date: item.updatedAt?.slice(0, 10) })}
        </p>

      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}
