import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Pencil, Phone, Calendar, MapPin,
  Trash2, Sparkles, ClipboardList, Camera, X, Bell,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { db } from '../db'
import { softDelete, softDeleteJobCascade } from '../utils/cloudSync'
import { extractKnowhow } from '../utils/aiKnowhow'
import { requestNotificationPermission } from '../utils/alarmManager'
import { showToast } from '../utils/toast'
import { compressImage } from '../utils/image'
import { todayLocal, toLocalISO } from '../utils/date'
import KnowhowFormBody, { EMPTY_KNOWHOW } from '../components/KnowhowFormBody'
import DateInput from '../components/DateInput'
import MediaImage from '../components/MediaImage'

const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, '0'))
const MINS  = ['00', '10', '20', '30', '40', '50']

export default function JobDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { t } = useTranslation()
  const [showDelete, setShowDelete] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [alarmOpen, setAlarmOpen] = useState(false)
  const [alarmTime, setAlarmTime] = useState('')
  const [alarmDate, setAlarmDate] = useState('')
  const [editingAlarmId, setEditingAlarmId] = useState(null)
  const [knowhow, setKnowhowState] = useState(EMPTY_KNOWHOW)
  const [knowhowReady, setKnowhowReady] = useState(false)
  const [savingAlarm, setSavingAlarm] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [equipLightboxIdx, setEquipLightboxIdx] = useState(null)
  const fileRef = useRef()

  const job      = useLiveQuery(async () => {
    const j = await db.service_jobs.get(Number(id))
    return j?.deletedAt ? null : j
  }, [id])
  const customer = useLiveQuery(
    () => job?.customerId ? db.customers.get(job.customerId) : undefined,
    [job?.customerId]
  )
  const photos = useLiveQuery(
    () => db.job_photos.where('jobId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(), [id]
  )
  // 삭제 모달용 — 영향 데이터 개수 미리보기
  const jobExpenses = useLiveQuery(
    () => db.expenses.where('jobId').equals(Number(id)).filter((r) => !r.deletedAt).toArray(), [id]
  )
  // knowhow는 cascade 대상 X (별도 자산으로 보존). 단 사용자에게 안내 위해 개수 미리보기.
  const linkedKnowhow = useLiveQuery(
    () => db.knowhow.filter((k) => k.sourceJobId === Number(id) && !k.deletedAt).toArray(), [id]
  )
  const jobAlarms = useLiveQuery(
    () => db.user_alarms.filter(a => a.jobId === Number(id) && !a.deletedAt).toArray(), [id]
  )

  // 렌더링 중 setState 안티패턴 방지 — useEffect로 분리
  // (job이 useLiveQuery 비동기로 채워진 직후 1회 knowhow 초기화)
  useEffect(() => {
    if (!job || knowhowReady) return
    setKnowhowState({
      title:          job.title          ?? '',
      category:       job.category       ?? '기타',
      location:       job.location       ?? '기타',
      compressorType: job.compressorType ?? '',
      compressorStr:  job.compressorStr  ?? '',
      coolingMethod:  job.coolingMethod  ?? '',
      tempRange:      job.tempRange      ?? '',
      refrigerant:    job.refrigerant    ?? '',
      systemType:     job.systemType     ?? '',
      symptoms:       job.symptoms       ?? job.symptom   ?? '',
      cause:          job.cause          ?? job.diagnosis ?? '',
      checkSteps:     job.checkSteps     ?? '',
      solution:       job.solution       ?? job.workDone  ?? '',
      parts:          job.parts          ?? job.materials ?? '',
      notes:          job.notes          ?? '',
      equipPhotos:    Array.isArray(job.equipPhotos) ? job.equipPhotos : [],
      equipments:     Array.isArray(job.equipments)  ? job.equipments  : [],
    })
    setKnowhowReady(true)
  }, [job?.id, knowhowReady])

  if (!job) return <div className="p-4 text-gray-400 text-sm">{t('logs.loading')}</div>

  function setKnowhow(updater) {
    setKnowhowState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      db.service_jobs.update(Number(id), { ...next, updatedAt: new Date().toISOString() })
      return next
    })
  }

  const totalCost  = (job.partsCost || 0) + (job.laborCost || 0) + (job.travelCost || 0) + (job.taxAmount || 0) + (job.otherCost || 0)
  const isProgress = job.status === 'inprogress'
  const isDone     = job.status === 'completed'
  const visitH     = job.visitTime ? job.visitTime.split(':')[0] : ''
  const visitM     = job.visitTime ? job.visitTime.split(':')[1] : ''

  async function patch(data) {
    await db.service_jobs.update(Number(id), { ...data, updatedAt: new Date().toISOString() })
  }

  async function handleComplete() {
    try {
      await patch({ status: 'completed', completedAt: new Date().toISOString() })

      const jid = Number(id)
      const all = await db.knowhow.toArray()
      const existing = all.find((k) => k.sourceJobId === jid)
      const now = new Date().toISOString()
      const baseTitle = (knowhow.title || knowhow.symptoms || customer?.name || '').trim()
      const knowhowData = {
        ...knowhow,
        customerId:  job.customerId,
        title:       baseTitle || t('job.sectionReceipt'),
        sourceJobId: jid,
        updatedAt:   now,
      }
      if (existing) {
        await db.knowhow.update(existing.id, knowhowData)
      } else {
        await db.knowhow.add({ ...knowhowData, createdAt: now })
      }
      showToast(t('job.knowhowExtracted') + ': ' + knowhowData.title)
    } catch (e) {
      showToast(t('job.aiError', { message: e.message }))
    }
  }

  async function handlePhoto(e) {
    const files = Array.from(e.target.files)
    for (const file of files) {
      const dataUrl = await compressImage(file)
      await db.job_photos.add({ jobId: Number(id), dataUrl, caption: '', takenAt: new Date().toISOString() })
    }
    e.target.value = ''
  }

  async function deletePhoto(photoId) {
    await softDelete('job_photos', photoId)
  }

  async function handleExtract() {
    if (!(job.symptoms ?? job.symptom) && !(job.cause ?? job.diagnosis) && !(job.solution ?? job.workDone)) {
      showToast(t('job.needContentForKnowhow'))
      return
    }
    setAiLoading(true)
    try {
      const result = await extractKnowhow(job, customer)
      const now = new Date().toISOString()
      const newId = await db.knowhow.add({
        title: result.title, category: result.category,
        content: result.content, tags: result.tags,
        sourceJobId: job.id, createdAt: now, updatedAt: now,
      })
      showToast(`${t('job.knowhowExtracted')}: "${result.title}"`)
      navigate(`/knowhow/${newId}`)
    } catch (e) {
      showToast(t('job.aiError', { message: e.message }))
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSaveAlarm() {
    if (savingAlarm) return
    if (!alarmDate || !alarmTime) return showToast(t('userAlarm.dateTimeRequired'))
    setSavingAlarm(true)
    try {
      const granted = await requestNotificationPermission()
      if (!granted) {
        showToast(t('userAlarm.permissionDenied'))
        setSavingAlarm(false)
        return
      }
      if (editingAlarmId) {
        await db.user_alarms.update(editingAlarmId, { date: alarmDate, time: alarmTime, fired: 0 })
      } else {
        await db.user_alarms.add({
          title: `${customer?.name ?? t('home.noCustomer')} - ${(job.symptoms ?? job.symptom) || t('job.sectionReceipt')}`,
          date: alarmDate,
          time: alarmTime,
          note: job.visitDate ? `${t('job.visitPrefix')} ${job.visitDate}` : '',
          jobId: Number(id),
          customerId: job.customerId ?? null,
          fired: 0,
          createdAt: new Date().toISOString(),
        })
      }
      setAlarmOpen(false)
      setAlarmTime('')
      setAlarmDate('')
      setEditingAlarmId(null)
      showToast(t('userAlarm.saved'))
    } catch (e) {
      console.error('Alarm save failed:', e)
    } finally {
      setSavingAlarm(false)
    }
  }

  async function handleDelete() {
    await softDeleteJobCascade(Number(id))
    navigate('/service', { replace: true })
  }

  return (
    <div className="p-4 pb-10">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="flex items-center justify-center gap-2 w-full py-3 mb-2 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200">
        <ChevronLeft size={18} strokeWidth={2} />
        {t('job.backToList')}
      </button>
      {/* 헤더 */}
      <div className="flex items-center justify-end gap-2 mb-5">
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400">
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => navigate(`/service/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-700"
        >
          <Pencil size={12} strokeWidth={1.5} />
          {t('job.edit')}
        </button>
      </div>

      <div className="space-y-3">

        {/* 고객 카드 */}
        <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{customer?.name ?? t('home.noCustomer')}</p>
              {customer && (
                <button onClick={() => navigate(`/customers/${customer.id}`)} className="text-xs text-blue-500 font-medium mt-0.5">
                  {t('job.viewHistory')}
                </button>
              )}
              {customer?.address && (
                <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={11} strokeWidth={1.5} />
                  {customer.address}
                </p>
              )}
            </div>
            {customer?.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg shrink-0">
                <Phone size={12} strokeWidth={1.5} />
                {customer.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} strokeWidth={1.5} />
              {t('job.receiptPrefix')} {job.receiptDate}
            </span>
            {job.visitDate && (
              <span className="flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.5} />
                {t('job.visitPrefix')} {job.visitDate}{job.visitTime ? ` ${job.visitTime}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* 단계 버튼 */}
        {!isDone ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => patch({ status: 'received' })}
              className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                !isProgress
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md ring-2 ring-blue-300'
                  : 'bg-white text-gray-500 border-gray-300 font-medium'
              }`}
            >
              {t('job.statusReceived')}
            </button>
            <button
              onClick={() => patch({ status: 'inprogress' })}
              className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${
                isProgress
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-md ring-2 ring-blue-300'
                  : 'bg-white text-gray-500 border-gray-300 font-medium'
              }`}
            >
              {t('job.statusInProgress')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <span className="text-xs font-semibold text-emerald-600">{t('job.statusDone')}</span>
              {job.completedAt && (
                <span className="text-xs text-emerald-700">
                  {toLocalISO(new Date(job.completedAt))}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate(`/service/${id}/billing`)}
              className="w-full flex items-center justify-between px-4 py-3 bg-blue-900 border border-blue-950 rounded-xl shadow-sm active:opacity-80"
            >
              <span className="text-sm font-medium text-white">{t('job.sectionCost')}</span>
              <span className="text-sm font-bold text-white">
                {totalCost > 0 ? `${totalCost.toLocaleString()} ${t('common.currencyUnit')}` : t('job.notEntered')}
              </span>
            </button>
          </>
        )}

        {/* 결제 받음 토글 — cost > 0 일 때만 */}
        {(job.cost || 0) > 0 && (
          <button
            onClick={() => patch({ paid: !job.paid })}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl shadow-md text-white font-bold transition-colors ${
              job.paid
                ? 'bg-emerald-600 active:bg-emerald-700'
                : 'bg-amber-500 active:bg-amber-600'
            }`}
          >
            <span className="text-sm">
              {job.paid ? t('job.paidYes') : t('job.paidNo')}
            </span>
            <span className="text-sm">
              {(job.cost || 0).toLocaleString()}
            </span>
          </button>
        )}

        {/* 접수 정보 */}
        <Section title={t('job.sectionReceipt')}>
          {(job.symptoms ?? job.symptom)
            ? <InfoRow label={t('job.labelSymptom')} value={job.symptoms ?? job.symptom} />
            : <p className="text-sm text-gray-400">{t('home.noSymptom')}</p>
          }
          {job.notes && !isProgress && !isDone && <InfoRow label={t('job.labelNotes')} value={job.notes} />}
        </Section>

        {/* 방문 예약 — 접수 단계에서만 (진행/완료 시엔 이미 방문 다녀온 상태) */}
        {!isProgress && !isDone && (
        <Section title={t('job.sectionReservation')}>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('job.labelVisitDate')}</label>
            <DateInput value={job.visitDate ?? ''} onChange={(v) => patch({ visitDate: v })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">{t('job.labelVisitTime')} <span className="text-gray-300">{t('job.labelOptional')}</span></label>
            <div className="flex gap-2">
              <select
                defaultValue={visitH}
                onChange={(e) => {
                  const newH = e.target.value
                  patch({ visitTime: newH ? `${newH}:${visitM || '00'}` : '' })
                }}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400"
              >
                <option value="">{t('job.hourLabel')}</option>
                {HOURS.map((hh) => <option key={hh} value={hh}>{hh}{t('job.hourUnit')}</option>)}
              </select>
              <select
                defaultValue={visitM}
                onChange={(e) => {
                  const newM = e.target.value
                  patch({ visitTime: visitH ? `${visitH}:${newM || '00'}` : '' })
                }}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:border-blue-400"
              >
                <option value="">{t('job.minLabel')}</option>
                {MINS.map((mm) => <option key={mm} value={mm}>{mm}{t('job.minUnit')}</option>)}
              </select>
            </div>
          </div>
        </Section>
        )}

        {/* 알람 설정 (접수 단계에서만) */}
        {!isProgress && !isDone && (
          <>
            <button
              onClick={() => { setEditingAlarmId(null); setAlarmDate(job.visitDate || todayLocal()); setAlarmTime(''); setAlarmOpen(true) }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700 active:bg-amber-100"
            >
              <Bell size={15} strokeWidth={1.5} />
              {t('userAlarm.setForJob')}
            </button>

            {/* 이 건 알람 리스트 */}
            {jobAlarms && jobAlarms.length > 0 && (
              <div className="space-y-2 mt-2">
                {jobAlarms.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                    <button
                      onClick={() => { setEditingAlarmId(a.id); setAlarmDate(a.date); setAlarmTime(a.time); setAlarmOpen(true) }}
                      className="flex items-center gap-2 min-w-0 flex-1 text-left"
                    >
                      <Bell size={16} strokeWidth={1.5} className="text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">{a.date} {a.time}</span>
                      {a.fired ? <span className="text-xs font-medium text-yellow-500">({t('userAlarm.fired')})</span> : null}
                    </button>
                    <button
                      onClick={async () => { await softDelete('user_alarms', a.id); }}
                      className="text-gray-400 active:text-red-400 p-1"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 진행 단계 내용 */}
        {(isProgress || isDone) && (
          <>
            {/* 입력 모드: 통합 폼 (KnowhowFormBody) — knowhow 초기화 완료 후만 렌더 */}
            {!isDone && knowhowReady && (
              <KnowhowFormBody form={knowhow} setForm={setKnowhow} hideCustomer />
            )}

            {/* 완료 모드: 읽기 전용 */}
            {isDone && (
              <>
                <Section title={t('job.sectionDiagnosis')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.cause ?? job.diagnosis) || t('job.notEntered')}</p>
                </Section>
                <Section title={t('job.sectionMaterials')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.parts ?? job.materials) || t('job.notEntered')}</p>
                </Section>
                <Section title={t('job.sectionWorkDone')}>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{(job.solution ?? job.workDone) || t('job.notEntered')}</p>
                </Section>
                {/* 장비 정보 — equipments 우선, 없으면 옛 equipPhotos만 표시 */}
                {((job.equipments ?? []).length > 0 || (job.equipPhotos ?? []).length > 0) && (
                  <Section title={t('knowhow.equipPhotos')}>
                    {(job.equipments ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {job.equipments.map((eq, i) => (
                          <div key={i} className="relative w-full bg-white border-2 border-gray-300 rounded-xl p-2 shadow-sm">
                            <div className="grid grid-cols-[96px_1fr] gap-2">
                              <button
                                onClick={() => setEquipLightboxIdx(i)}
                                className="w-24 h-24 bg-gray-100 border border-gray-300 rounded-md overflow-hidden block"
                              >
                                {eq.photo && <img src={eq.photo} alt="" className="w-full h-full object-cover" />}
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
                      <div className="flex gap-2 flex-wrap">
                        {job.equipPhotos.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                        ))}
                      </div>
                    )}
                  </Section>
                )}
              </>
            )}

            {/* 현장 사진 */}
            <Section title={t('job.sectionPhotos')}>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhoto} />
              <div className="flex gap-2 flex-wrap">
                {(photos ?? []).map((p, idx) => (
                  <div key={p.id} className="relative w-24 h-24">
                    <button onClick={() => setLightboxIndex(idx)} className="block w-full h-full">
                      <MediaImage dataUrl={p.dataUrl} storagePath={p.storagePath} alt="" className="w-full h-full object-cover rounded-xl" />
                    </button>
                    {!isDone && (
                      <button onClick={() => deletePhoto(p.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
                {!isDone && (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-24 h-24 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 text-gray-400 active:bg-gray-50">
                    <Camera size={20} strokeWidth={1.5} />
                    <span className="text-xs">{t('job.photoCapture')}</span>
                  </button>
                )}
              </div>
            </Section>

            {/* 완료 모드: 메모 (입력 모드는 KnowhowFormBody 안) */}
            {isDone && (
              <Section title={t('job.sectionNotes')}>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{job.notes || t('job.notEntered')}</p>
              </Section>
            )}

            {/* 완료 처리 버튼 */}
            {!isDone && (
              <button onClick={handleComplete} className="w-full py-3.5 text-sm font-semibold bg-emerald-500 text-white rounded-xl active:opacity-80">
                {t('job.complete')}
              </button>
            )}

            {/* AI 노하우 추출 */}
            {isDone && (
              <button onClick={handleExtract} disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl disabled:opacity-50">
                <Sparkles size={15} strokeWidth={1.5} />
                {aiLoading ? t('job.aiKnowhowLoading') : t('job.aiKnowhow')}
              </button>
            )}
          </>
        )}

        {/* 계약 점검 리스트 */}
        <button onClick={() => navigate('/checklist')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl active:bg-gray-50 shadow-sm">
          <ClipboardList size={15} strokeWidth={1.5} />
          {t('job.contractChecklist')}
        </button>

      </div>

      {/* 사진 라이트박스 모달 — 큰 화면 보기 + 좌우 네비게이션 */}
      {lightboxIndex != null && photos?.[lightboxIndex] && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null) }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
          >
            <X size={20} strokeWidth={2} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              className="absolute left-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={24} strokeWidth={2} />
            </button>
          )}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={24} strokeWidth={2} className="rotate-180" />
            </button>
          )}
          <MediaImage
            dataUrl={photos[lightboxIndex].dataUrl}
            storagePath={photos[lightboxIndex].storagePath}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* 장비 사진 라이트박스 (완료 모드) */}
      {equipLightboxIdx != null && (job.equipments ?? [])[equipLightboxIdx]?.photo && (
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
          {equipLightboxIdx < (job.equipments ?? []).length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setEquipLightboxIdx(equipLightboxIdx + 1) }}
              className="absolute right-2 w-10 h-10 bg-white/20 text-white rounded-full flex items-center justify-center text-2xl"
            >
              ›
            </button>
          )}
          <img
            src={(job.equipments ?? [])[equipLightboxIdx]?.photo}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white/70 text-xs">
            {equipLightboxIdx + 1} / {(job.equipments ?? []).length}
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 — cascade 영향 데이터 개수 표시 */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-2">{t('job.deleteTitle')}</p>
            <p className="text-sm text-gray-600 mb-3">{t('customer.deleteCascadeWarning')}</p>
            <ul className="text-xs text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 space-y-0.5">
              <li>• {t('job.cascadePhotos')}: <span className="font-bold">{(photos ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('job.cascadeExpenses')}: <span className="font-bold">{(jobExpenses ?? []).length}{t('customer.cascadeUnit')}</span></li>
              <li>• {t('job.cascadeAlarms')}: <span className="font-bold">{(jobAlarms ?? []).length}{t('customer.cascadeUnit')}</span></li>
            </ul>
            {(linkedKnowhow ?? []).length > 0 && (
              <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
                ℹ️ {t('job.knowhowPreserved', { count: linkedKnowhow.length })}
              </p>
            )}
            <p className="text-xs text-red-600 font-semibold mb-4 leading-relaxed">⚠️ {t('job.deleteIrreversibleDetail')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600">{t('job.cancel')}</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl active:bg-red-700">{t('job.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 알람 설정 모달 */}
      {alarmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
          <div className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editingAlarmId ? t('userAlarm.editAlarm') : t('userAlarm.setForJob')}</h3>
              <button onClick={() => { setAlarmOpen(false); setEditingAlarmId(null) }} className="text-gray-400 text-sm">{t('settings.close')}</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {customer?.name ?? t('home.noCustomer')} · {job.visitDate || '-'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.date')}</label>
                <DateInput value={alarmDate} onChange={setAlarmDate} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('userAlarm.alarmTime')}</label>
                <input
                  type="time"
                  value={alarmTime}
                  onChange={e => setAlarmTime(e.target.value)}
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-blue-400"
                />
              </div>
            </div>
            <button
              onClick={handleSaveAlarm}
              className="w-full py-3 bg-blue-600 text-white text-sm font-medium rounded-xl mt-4 active:bg-blue-700"
            >
              {t('userAlarm.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-gray-300 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">{title}</p>
      <div className="space-y-2.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  )
}
