import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Pencil, MapPin, Tag, X } from 'lucide-react'
import { db } from '../db'
import MediaImage from '../components/MediaImage'

export default function KnowhowDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()

  const item = useLiveQuery(async () => {
    const r = await db.knowhow.get(Number(id))
    return r?.deletedAt ? null : r
  }, [id])
  const [equipLightboxIdx, setEquipLightboxIdx] = useState(null)

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

        {/* 장비 정보 (사진 + 분석 결과) */}
        {((item.equipments ?? []).length > 0 || (item.equipPhotos ?? []).length > 0) && (
          <Card title={t('knowhow.equipPhotos')}>
            {(item.equipments ?? []).length > 0 ? (
              <div className="space-y-2">
                {item.equipments.map((eq, i) => (
                  <div key={i} className="relative w-full bg-white border-2 border-gray-300 rounded-xl p-2 shadow-sm">
                    <div className="grid grid-cols-[96px_1fr] gap-2">
                      <button
                        onClick={() => setEquipLightboxIdx(i)}
                        className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-md overflow-hidden block"
                      >
                        {(eq.photo || eq.storagePath) && (
                          <MediaImage
                            dataUrl={eq.photo}
                            storagePath={eq.storagePath}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-[11px] leading-tight grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 content-start overflow-hidden">
                        {eq.kind && (<><span className="text-gray-400 shrink-0">{t('scan.kind')}</span><span className="text-gray-900 font-medium truncate">{eq.kind}</span></>)}
                        {eq.brand && (<><span className="text-gray-400 shrink-0">{t('scan.brand')}</span><span className="text-gray-900 font-medium truncate">{eq.brand}</span></>)}
                        {eq.model && (<><span className="text-gray-400 shrink-0">{t('scan.model')}</span><span className="text-gray-900 font-medium truncate">{eq.model}</span></>)}
                        {eq.serial && (<><span className="text-gray-400 shrink-0">{t('scan.serial')}</span><span className="text-gray-900 font-medium truncate">{eq.serial}</span></>)}
                        {eq.capacity && (<><span className="text-gray-400 shrink-0">{t('scan.capacity')}</span><span className="text-gray-900 font-medium truncate">{eq.capacity}</span></>)}
                        {eq.refrigerant && (<><span className="text-gray-400 shrink-0">{t('scan.refrigerant')}</span><span className="text-gray-900 font-medium truncate">{eq.refrigerant}</span></>)}
                        {!eq.kind && !eq.brand && !eq.model && (
                          <span className="col-span-2 text-gray-400">{t('knowhow.equipNoData')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 옛 데이터 호환: equipPhotos만 있는 경우 사진만 표시
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const photos = item.equipPhotos ?? []
                  const paths = item.equipPhotoPaths ?? []
                  const len = Math.max(photos.length, paths.length)
                  return Array.from({ length: len }).map((_, i) => (
                    <MediaImage
                      key={i}
                      dataUrl={photos[i]}
                      storagePath={paths[i]}
                      alt=""
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  ))
                })()}
              </div>
            )}
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

      {/* 장비 사진 라이트박스 */}
      {equipLightboxIdx != null && (item.equipments ?? [])[equipLightboxIdx]?.photo && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setEquipLightboxIdx(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(null) }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {equipLightboxIdx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(equipLightboxIdx - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ‹
            </button>
          )}
          {equipLightboxIdx < (item.equipments ?? []).length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(equipLightboxIdx + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ›
            </button>
          )}
          <img
            src={(item.equipments ?? [])[equipLightboxIdx]?.photo}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {equipLightboxIdx + 1} / {(item.equipments ?? []).length}
          </div>
        </div>
      )}
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
